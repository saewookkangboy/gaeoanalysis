/**
 * 알고리즘 학습 API
 * 
 * 알고리즘 버전 관리, 리서치 결과 반영, 가중치 학습 등을 위한 API
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-utils';
import {
  getActiveAlgorithmVersion,
  createAlgorithmVersion,
  updateAlgorithmPerformance,
  saveResearchFinding,
  getUnappliedResearchFindings,
  applyResearchFinding,
  learnWeights,
  adjustWeightsFromResearch,
  createABTest,
  getABTestResults,
} from '@/lib/algorithm-learning';
import { z } from 'zod';

// ============================================
// GET: 알고리즘 버전 조회
// ============================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('UNAUTHORIZED', '인증이 필요합니다.', 401);
    }

    const { searchParams } = new URL(request.url);
    const algorithmType = searchParams.get('algorithmType') as 'aeo' | 'geo' | 'seo' | 'aio' | null;
    const action = searchParams.get('action');

    if (action === 'research') {
      // 미적용 리서치 결과 조회
      const findings = getUnappliedResearchFindings(algorithmType || undefined);
      return createSuccessResponse({ findings });
    }

    if (action === 'ab-test') {
      // A/B 테스트 결과 조회
      const versionA = searchParams.get('versionA');
      const versionB = searchParams.get('versionB');
      
      if (!versionA || !versionB || !algorithmType) {
        return createErrorResponse(
          'VALIDATION_ERROR',
          'algorithmType, versionA, versionB가 필요합니다.',
          400
        );
      }

      const results = getABTestResults(algorithmType, versionA, versionB);
      return createSuccessResponse({ results });
    }

    // 알고리즘 버전 조회
    if (algorithmType) {
      const version = getActiveAlgorithmVersion(algorithmType);
      return createSuccessResponse({ version });
    }

    // 모든 알고리즘 타입의 버전 조회
    const versions = {
      aeo: getActiveAlgorithmVersion('aeo'),
      geo: getActiveAlgorithmVersion('geo'),
      seo: getActiveAlgorithmVersion('seo'),
      aio: getActiveAlgorithmVersion('aio'),
    };

    return createSuccessResponse({ versions });
  } catch (error) {
    console.error('❌ [Algorithm Learning API] GET 오류:', error);
    return createErrorResponse(
      'INTERNAL_ERROR',
      '알고리즘 정보 조회 중 오류가 발생했습니다.',
      500
    );
  }
}

// ============================================
// POST: 알고리즘 버전 생성, 리서치 결과 저장 등
// ============================================

const createVersionSchema = z.object({
  action: z.literal('create-version'),
  algorithmType: z.enum(['aeo', 'geo', 'seo', 'aio']),
  weights: z.record(z.string(), z.number()),
  config: z.record(z.string(), z.unknown()).optional(),
  researchFindings: z.array(z.string()).optional(),
});

const saveResearchSchema = z.object({
  action: z.literal('save-research'),
  title: z.string(),
  source: z.string(),
  url: z.string().optional(),
  publishedDate: z.string().optional(),
  findings: z.array(z.object({
    algorithmType: z.enum(['aeo', 'geo', 'seo', 'aio']),
    factor: z.string(),
    impact: z.number(),
    confidence: z.number().min(0).max(1),
    description: z.string(),
  })),
});

const applyResearchSchema = z.object({
  action: z.literal('apply-research'),
  findingId: z.string(),
  algorithmType: z.enum(['aeo', 'geo', 'seo', 'aio']),
});

const learnWeightsSchema = z.object({
  action: z.literal('learn-weights'),
  algorithmType: z.enum(['aeo', 'geo', 'seo', 'aio']),
  features: z.record(z.string(), z.number()),
  actualScore: z.number().min(0).max(100),
  predictedScore: z.number().min(0).max(100),
});

const abTestSchema = z.object({
  action: z.literal('ab-test'),
  analysisId: z.string(),
  algorithmType: z.enum(['aeo', 'geo', 'seo', 'aio']),
  versionA: z.string(),
  versionB: z.string(),
  scoreA: z.number().min(0).max(100),
  scoreB: z.number().min(0).max(100),
  actualScore: z.number().min(0).max(100).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('UNAUTHORIZED', '인증이 필요합니다.', 401);
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create-version': {
        const data = createVersionSchema.parse(body);
        const version = createAlgorithmVersion(
          data.algorithmType,
          data.weights,
          data.config || {},
          data.researchFindings || []
        );
        return createSuccessResponse({ version });
      }

      case 'save-research': {
        const data = saveResearchSchema.parse(body);
        const findingId = saveResearchFinding({
          title: data.title,
          source: data.source,
          url: data.url,
          publishedDate: data.publishedDate,
          findings: data.findings,
        });
        return createSuccessResponse({ findingId });
      }

      case 'apply-research': {
        const data = applyResearchSchema.parse(body);
        
        // 리서치 결과 기반 가중치 조정
        const { adjustWeightsFromResearch } = await import('@/lib/algorithm-learning');
        const findings = getUnappliedResearchFindings(data.algorithmType);
        const finding = findings.find(f => f.id === data.findingId);
        
        if (!finding) {
          return createErrorResponse(
            'NOT_FOUND',
            '리서치 결과를 찾을 수 없습니다.',
            404
          );
        }

        const adjustedWeights = adjustWeightsFromResearch(data.algorithmType, [finding]);
        
        // 새 알고리즘 버전 생성
        const version = createAlgorithmVersion(
          data.algorithmType,
          adjustedWeights,
          {},
          [data.findingId]
        );

        // 리서치 결과 적용 표시
        applyResearchFinding(data.findingId, version.id);

        return createSuccessResponse({ version });
      }

      case 'learn-weights': {
        const data = learnWeightsSchema.parse(body);
        const adjustedWeights = learnWeights(
          data.algorithmType,
          data.features,
          data.actualScore,
          data.predictedScore
        );

        // 성능 업데이트
        const currentVersion = getActiveAlgorithmVersion(data.algorithmType);
        if (currentVersion) {
          updateAlgorithmPerformance(
            currentVersion.id,
            data.actualScore,
            data.predictedScore
          );
        }

        return createSuccessResponse({ adjustedWeights });
      }

      case 'ab-test': {
        const data = abTestSchema.parse(body);
        const test = createABTest(
          data.analysisId,
          data.algorithmType,
          data.versionA,
          data.versionB,
          data.scoreA,
          data.scoreB,
          data.actualScore
        );
        return createSuccessResponse({ test });
      }

      default:
        return createErrorResponse(
          'VALIDATION_ERROR',
          '지원하지 않는 action입니다.',
          400
        );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        `요청 데이터 검증 실패: ${error.issues.map(e => e.message).join(', ')}`,
        400
      );
    }

    console.error('❌ [Algorithm Learning API] POST 오류:', error);
    return createErrorResponse(
      'INTERNAL_ERROR',
      '알고리즘 학습 중 오류가 발생했습니다.',
      500
    );
  }
}

