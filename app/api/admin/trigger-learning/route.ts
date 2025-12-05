import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import {
  triggerAlgorithmLearning,
  extractRequestInfo,
  logAdminAction,
} from '@/lib/admin-helpers';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

/**
 * 학습 트리거 요청 스키마
 */
const triggerLearningSchema = z.object({
  analysisId: z.string().optional(),
  algorithmType: z.enum(['aeo', 'geo', 'seo', 'aio']).optional(),
});

/**
 * 알고리즘 학습 트리거 API
 * POST /api/admin/trigger-learning
 * 
 * 요청 본문:
 * - analysisId?: string (특정 분석에 대해 학습)
 * - algorithmType?: 'aeo' | 'geo' | 'seo' | 'aio' (특정 알고리즘 타입)
 */
export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const { userId: adminUserId } = await requireAdmin(request);

    // 요청 정보 추출 (로그용)
    const { ipAddress, userAgent } = extractRequestInfo(request);

    // 요청 본문 파싱
    const body = await request.json();
    const { analysisId, algorithmType } = triggerLearningSchema.parse(body);

    console.log('🔄 [POST /api/admin/trigger-learning] 학습 트리거 시작...', {
      adminUserId,
      analysisId,
      algorithmType,
    });

    // 학습 트리거
    const result = await triggerAlgorithmLearning(analysisId, algorithmType);

    // 관리자 활동 로그 저장 (비동기)
    logAdminAction({
      id: uuidv4(),
      adminUserId,
      action: 'algorithm_learning_triggered',
      targetType: 'algorithm_learning',
      targetId: analysisId || undefined,
      details: {
        analysisId,
        algorithmType,
        success: result.success,
        results: result.results,
      },
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
    }).catch(() => {
      // 로그 저장 실패는 조용히 무시
    });

    console.log('✅ [POST /api/admin/trigger-learning] 학습 트리거 완료:', {
      success: result.success,
      resultsCount: result.results.length,
    });

    return NextResponse.json({
      success: result.success,
      message: result.message,
      results: result.results,
    });
  } catch (error: any) {
    // requireAdmin에서 403 에러를 throw하므로 그대로 전달
    if (error instanceof NextResponse) {
      throw error;
    }

    // Zod 검증 오류
    if (error.name === 'ZodError') {
      console.error('❌ [POST /api/admin/trigger-learning] 요청 검증 오류:', error.errors);
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: '요청 데이터가 올바르지 않습니다.',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('❌ [POST /api/admin/trigger-learning] 학습 트리거 오류:', error);
    return NextResponse.json(
      {
        error: 'LEARNING_ERROR',
        message: error.message || '학습 트리거 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

