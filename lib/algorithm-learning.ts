/**
 * 알고리즘 학습 시스템
 * 
 * AEO, GEO, SEO, AIO 점수 계산 알고리즘을 지속적으로 학습하고 개선하는 시스템
 * - 리서치 결과 반영
 * - 가중치 자동 조정
 * - 알고리즘 버전 관리
 * - A/B 테스트
 */

import db, { dbHelpers } from './db';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// 타입 정의
// ============================================

export interface AlgorithmVersion {
  id: string;
  algorithmType: 'aeo' | 'geo' | 'seo' | 'aio';
  version: number;
  weights: Record<string, number>; // 가중치 맵
  config: Record<string, any>; // 추가 설정
  performance: {
    avgAccuracy: number; // 평균 정확도
    avgError: number; // 평균 오차
    totalTests: number; // 총 테스트 수
    improvementRate: number; // 개선율
  };
  researchBased: boolean; // 리서치 기반 여부
  researchFindings: string[]; // 참조한 리서치 ID 목록
  createdAt: Date;
  isActive: boolean;
}

export interface ResearchFinding {
  id: string;
  title: string;
  source: string; // 출처 (논문, 블로그, 연구 기관 등)
  url?: string;
  publishedDate?: string;
  findings: {
    algorithmType: 'aeo' | 'geo' | 'seo' | 'aio';
    factor: string; // 영향 요소 (예: 'faq_schema', 'content_length')
    impact: number; // 영향도 (예: 0.4 = 40% 증가)
    confidence: number; // 신뢰도 (0-1)
    description: string;
  }[];
  applied: boolean; // 적용 여부
  appliedAt?: Date;
  appliedVersion?: string; // 적용된 알고리즘 버전
}

export interface AlgorithmTest {
  id: string;
  analysisId: string;
  algorithmType: 'aeo' | 'geo' | 'seo' | 'aio';
  versionA: string; // 버전 A ID
  versionB: string; // 버전 B ID
  scoreA: number; // 버전 A 점수
  scoreB: number; // 버전 B 점수
  actualScore?: number; // 실제 점수 (검증용)
  winner?: 'A' | 'B' | 'tie';
  createdAt: Date;
}

// ============================================
// 알고리즘 버전 관리
// ============================================

/**
 * 현재 활성 알고리즘 버전 조회
 */
export function getActiveAlgorithmVersion(
  algorithmType: 'aeo' | 'geo' | 'seo' | 'aio'
): AlgorithmVersion | null {
  try {
    const stmt = db.prepare(`
      SELECT 
        id, algorithm_type, version, weights, config, 
        avg_accuracy, avg_error, total_tests, improvement_rate,
        research_based, research_findings, created_at, is_active
      FROM algorithm_versions
      WHERE algorithm_type = ? AND is_active = 1
      ORDER BY version DESC
      LIMIT 1
    `);
    
    const result = stmt.get(algorithmType) as {
      id: string;
      algorithm_type: string;
      version: number;
      weights: string;
      config: string;
      avg_accuracy: number;
      avg_error: number;
      total_tests: number;
      improvement_rate: number;
      research_based: number;
      research_findings: string;
      created_at: string;
      is_active: number;
    } | undefined;

    if (!result) return null;

    return {
      id: result.id,
      algorithmType: result.algorithm_type as any,
      version: result.version,
      weights: JSON.parse(result.weights),
      config: JSON.parse(result.config || '{}'),
      performance: {
        avgAccuracy: result.avg_accuracy,
        avgError: result.avg_error,
        totalTests: result.total_tests,
        improvementRate: result.improvement_rate,
      },
      researchBased: result.research_based === 1,
      researchFindings: JSON.parse(result.research_findings || '[]'),
      createdAt: new Date(result.created_at),
      isActive: result.is_active === 1,
    };
  } catch (error) {
    console.error('❌ [getActiveAlgorithmVersion] 오류:', error);
    return null;
  }
}

/**
 * 알고리즘 버전 생성
 */
export function createAlgorithmVersion(
  algorithmType: 'aeo' | 'geo' | 'seo' | 'aio',
  weights: Record<string, number>,
  config: Record<string, any> = {},
  researchFindings: string[] = []
): AlgorithmVersion {
  return dbHelpers.transaction(() => {
    // 이전 버전 조회
    const previousVersion = getActiveAlgorithmVersion(algorithmType);
    const newVersion = (previousVersion?.version || 0) + 1;

    // 이전 활성 버전 비활성화
    if (previousVersion) {
      db.prepare(`
        UPDATE algorithm_versions
        SET is_active = 0
        WHERE id = ?
      `).run(previousVersion.id);
    }

    // 새 버전 생성
    const versionId = uuidv4();
    db.prepare(`
      INSERT INTO algorithm_versions (
        id, algorithm_type, version, weights, config,
        avg_accuracy, avg_error, total_tests, improvement_rate,
        research_based, research_findings, is_active
      )
      VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0, ?, ?, 1)
    `).run(
      versionId,
      algorithmType,
      newVersion,
      JSON.stringify(weights),
      JSON.stringify(config),
      researchFindings.length > 0 ? 1 : 0,
      JSON.stringify(researchFindings)
    );

    return {
      id: versionId,
      algorithmType,
      version: newVersion,
      weights,
      config,
      performance: {
        avgAccuracy: 0,
        avgError: 0,
        totalTests: 0,
        improvementRate: 0,
      },
      researchBased: researchFindings.length > 0,
      researchFindings,
      createdAt: new Date(),
      isActive: true,
    };
  });
}

/**
 * 알고리즘 성능 업데이트
 */
export function updateAlgorithmPerformance(
  versionId: string,
  actualScore: number,
  predictedScore: number
): void {
  dbHelpers.transaction(() => {
    const error = Math.abs(actualScore - predictedScore);
    
    // 현재 성능 조회
    const current = db.prepare(`
      SELECT avg_accuracy, avg_error, total_tests
      FROM algorithm_versions
      WHERE id = ?
    `).get(versionId) as {
      avg_accuracy: number;
      avg_error: number;
      total_tests: number;
    } | undefined;

    if (!current) return;

    const newTotalTests = current.total_tests + 1;
    const newAvgError = (current.avg_error * current.total_tests + error) / newTotalTests;
    const newAvgAccuracy = 100 - newAvgError; // 정확도 = 100 - 평균 오차

    // 개선율 계산 (이전 버전과 비교)
    const previousVersion = db.prepare(`
      SELECT avg_error
      FROM algorithm_versions
      WHERE algorithm_type = (
        SELECT algorithm_type FROM algorithm_versions WHERE id = ?
      )
      AND version < (
        SELECT version FROM algorithm_versions WHERE id = ?
      )
      ORDER BY version DESC
      LIMIT 1
    `).get(versionId, versionId) as { avg_error: number } | undefined;

    const improvementRate = previousVersion
      ? ((previousVersion.avg_error - newAvgError) / previousVersion.avg_error) * 100
      : 0;

    // 성능 업데이트
    db.prepare(`
      UPDATE algorithm_versions
      SET 
        avg_accuracy = ?,
        avg_error = ?,
        total_tests = ?,
        improvement_rate = ?
      WHERE id = ?
    `).run(newAvgAccuracy, newAvgError, newTotalTests, improvementRate, versionId);
  });
}

// ============================================
// 리서치 결과 관리
// ============================================

/**
 * 리서치 결과 저장
 */
export function saveResearchFinding(finding: Omit<ResearchFinding, 'id' | 'applied' | 'appliedAt' | 'appliedVersion'>): string {
  return dbHelpers.transaction(() => {
    const findingId = uuidv4();
    
    db.prepare(`
      INSERT INTO research_findings (
        id, title, source, url, published_date, findings, applied
      )
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).run(
      findingId,
      finding.title,
      finding.source,
      finding.url || null,
      finding.publishedDate || null,
      JSON.stringify(finding.findings)
    );

    return findingId;
  });
}

/**
 * 미적용 리서치 결과 조회
 */
export function getUnappliedResearchFindings(
  algorithmType?: 'aeo' | 'geo' | 'seo' | 'aio'
): ResearchFinding[] {
  try {
    let query = `
      SELECT 
        id, title, source, url, published_date, findings, applied, applied_at, applied_version
      FROM research_findings
      WHERE applied = 0
    `;
    
    const params: any[] = [];
    if (algorithmType) {
      query += ` AND JSON_EXTRACT(findings, '$[*].algorithmType') LIKE ?`;
      params.push(`%"${algorithmType}"%`);
    }
    
    query += ` ORDER BY published_date DESC, created_at DESC`;

    const results = db.prepare(query).all(...params) as Array<{
      id: string;
      title: string;
      source: string;
      url: string | null;
      published_date: string | null;
      findings: string;
      applied: number;
      applied_at: string | null;
      applied_version: string | null;
    }>;

    return results.map(r => ({
      id: r.id,
      title: r.title,
      source: r.source,
      url: r.url || undefined,
      publishedDate: r.published_date || undefined,
      findings: JSON.parse(r.findings),
      applied: r.applied === 1,
      appliedAt: r.applied_at ? new Date(r.applied_at) : undefined,
      appliedVersion: r.applied_version || undefined,
    }));
  } catch (error) {
    console.error('❌ [getUnappliedResearchFindings] 오류:', error);
    return [];
  }
}

/**
 * 리서치 결과 적용
 */
export function applyResearchFinding(
  findingId: string,
  versionId: string
): void {
  dbHelpers.transaction(() => {
    db.prepare(`
      UPDATE research_findings
      SET applied = 1, applied_at = CURRENT_TIMESTAMP, applied_version = ?
      WHERE id = ?
    `).run(versionId, findingId);
  });
}

// ============================================
// 가중치 학습
// ============================================

/**
 * 가중치 학습 (실제 점수와 예상 점수 비교)
 */
export function learnWeights(
  algorithmType: 'aeo' | 'geo' | 'seo' | 'aio',
  features: Record<string, number>, // 특징값 (예: { h1_count: 1, title_length: 50 })
  actualScore: number,
  predictedScore: number
): Record<string, number> {
  // 간단한 그라디언트 디센트 방식으로 가중치 조정
  const learningRate = 0.01; // 학습률
  const error = actualScore - predictedScore;
  
  const currentVersion = getActiveAlgorithmVersion(algorithmType);
  if (!currentVersion) {
    return {};
  }

  const adjustedWeights: Record<string, number> = { ...currentVersion.weights };

  // 각 특징에 대해 가중치 조정
  for (const [feature, value] of Object.entries(features)) {
    if (adjustedWeights[feature] !== undefined) {
      // 그라디언트 = error * feature_value
      const gradient = error * value;
      adjustedWeights[feature] += learningRate * gradient;
      
      // 가중치 범위 제한 (0-100)
      adjustedWeights[feature] = Math.max(0, Math.min(100, adjustedWeights[feature]));
    }
  }

  return adjustedWeights;
}

/**
 * 리서치 결과 기반 가중치 조정
 */
export function adjustWeightsFromResearch(
  algorithmType: 'aeo' | 'geo' | 'seo' | 'aio',
  researchFindings: ResearchFinding[]
): Record<string, number> {
  const currentVersion = getActiveAlgorithmVersion(algorithmType);
  if (!currentVersion) {
    return {};
  }

  const adjustedWeights: Record<string, number> = { ...currentVersion.weights };

  // 리서치 결과를 기반으로 가중치 조정
  for (const finding of researchFindings) {
    for (const item of finding.findings) {
      if (item.algorithmType === algorithmType) {
        const factor = item.factor;
        const impact = item.impact;
        const confidence = item.confidence;

        // 가중치 조정 = 현재 가중치 * (1 + 영향도 * 신뢰도)
        if (adjustedWeights[factor] !== undefined) {
          adjustedWeights[factor] *= (1 + impact * confidence);
          
          // 가중치 범위 제한
          adjustedWeights[factor] = Math.max(0, Math.min(100, adjustedWeights[factor]));
        } else {
          // 새로운 요소 추가
          adjustedWeights[factor] = impact * confidence * 50; // 기본 가중치
        }
      }
    }
  }

  return adjustedWeights;
}

// ============================================
// A/B 테스트
// ============================================

/**
 * A/B 테스트 생성
 */
export function createABTest(
  analysisId: string,
  algorithmType: 'aeo' | 'geo' | 'seo' | 'aio',
  versionA: string,
  versionB: string,
  scoreA: number,
  scoreB: number,
  actualScore?: number
): AlgorithmTest {
  return dbHelpers.transaction(() => {
    const testId = uuidv4();
    
    // 승자 결정
    let winner: 'A' | 'B' | 'tie' = 'tie';
    if (actualScore !== undefined) {
      const errorA = Math.abs(actualScore - scoreA);
      const errorB = Math.abs(actualScore - scoreB);
      if (errorA < errorB) winner = 'A';
      else if (errorB < errorA) winner = 'B';
    } else {
      // 실제 점수가 없으면 점수 차이로 결정
      if (Math.abs(scoreA - scoreB) > 5) {
        winner = scoreA > scoreB ? 'A' : 'B';
      }
    }

    db.prepare(`
      INSERT INTO algorithm_tests (
        id, analysis_id, algorithm_type, version_a, version_b,
        score_a, score_b, actual_score, winner
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      testId,
      analysisId,
      algorithmType,
      versionA,
      versionB,
      scoreA,
      scoreB,
      actualScore || null,
      winner
    );

    return {
      id: testId,
      analysisId,
      algorithmType,
      versionA,
      versionB,
      scoreA,
      scoreB,
      actualScore,
      winner,
      createdAt: new Date(),
    };
  });
}

/**
 * A/B 테스트 결과 조회
 */
export function getABTestResults(
  algorithmType: 'aeo' | 'geo' | 'seo' | 'aio',
  versionA: string,
  versionB: string,
  limit = 100
): AlgorithmTest[] {
  try {
    const results = db.prepare(`
      SELECT 
        id, analysis_id, algorithm_type, version_a, version_b,
        score_a, score_b, actual_score, winner, created_at
      FROM algorithm_tests
      WHERE algorithm_type = ? AND version_a = ? AND version_b = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(algorithmType, versionA, versionB, limit) as Array<{
      id: string;
      analysis_id: string;
      algorithm_type: string;
      version_a: string;
      version_b: string;
      score_a: number;
      score_b: number;
      actual_score: number | null;
      winner: string | null;
      created_at: string;
    }>;

    return results.map(r => ({
      id: r.id,
      analysisId: r.analysis_id,
      algorithmType: r.algorithm_type as any,
      versionA: r.version_a,
      versionB: r.version_b,
      scoreA: r.score_a,
      scoreB: r.score_b,
      actualScore: r.actual_score || undefined,
      winner: (r.winner as 'A' | 'B' | 'tie') || undefined,
      createdAt: new Date(r.created_at),
    }));
  } catch (error) {
    console.error('❌ [getABTestResults] 오류:', error);
    return [];
  }
}

