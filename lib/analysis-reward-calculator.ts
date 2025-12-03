/**
 * 분석 결과 기반 보상 계산 시스템
 * 
 * Agent Lightning의 강화 학습을 위해 분석 결과(AEO, GEO, SEO 점수)를
 * 기반으로 보상(reward)을 계산하고 학습 데이터를 생성합니다.
 * 
 * 참고: https://github.com/microsoft/agent-lightning
 */

import { AnalysisResult } from './analyzer';
import { AIOCitationAnalysis } from './ai-citation-analyzer';
import db, { dbHelpers } from './db';
import { v4 as uuidv4 } from 'uuid';

/**
 * 분석 결과 기반 보상 계산
 */
export interface AnalysisReward {
  analysisId: string;
  agentType: 'aeo' | 'geo' | 'seo' | 'aio';
  score: number; // 0-100
  reward: number; // -1 to 1 (강화 학습용)
  metrics: {
    currentScore: number;
    previousScore?: number;
    improvement: number; // 개선율 (%)
    benchmark: number; // 벤치마크 대비 성능
    benchmarkComparison: number; // 벤치마크 대비 비교 (%)
  };
  factors: {
    scoreLevel: 'excellent' | 'good' | 'fair' | 'poor';
    improvementRate: number;
    benchmarkComparison: number;
  };
}

/**
 * 분석 결과를 기반으로 보상 계산
 */
export function calculateAnalysisReward(
  analysisId: string,
  analysisResult: AnalysisResult,
  previousAnalysis?: {
    aeoScore: number;
    geoScore: number;
    seoScore: number;
    overallScore: number;
  }
): {
  aeo: AnalysisReward;
  geo: AnalysisReward;
  seo: AnalysisReward;
  aio?: AnalysisReward;
} {
  const rewards = {
    aeo: calculateScoreReward(
      analysisId,
      'aeo',
      analysisResult.aeoScore,
      previousAnalysis?.aeoScore,
      analysisResult.aioAnalysis
    ),
    geo: calculateScoreReward(
      analysisId,
      'geo',
      analysisResult.geoScore,
      previousAnalysis?.geoScore,
      analysisResult.aioAnalysis
    ),
    seo: calculateScoreReward(
      analysisId,
      'seo',
      analysisResult.seoScore,
      previousAnalysis?.seoScore,
      analysisResult.aioAnalysis
    ),
  };

    // AIO 보상 계산 (AI 모델별 인용 확률 평균)
    if (analysisResult.aioAnalysis) {
      const avgAIO = (
        analysisResult.aioAnalysis.scores.chatgpt +
        analysisResult.aioAnalysis.scores.perplexity +
        analysisResult.aioAnalysis.scores.gemini +
        analysisResult.aioAnalysis.scores.claude
      ) / 4;

      (rewards as any).aio = calculateScoreReward(
        analysisId,
        'aio',
        avgAIO,
        undefined,
        analysisResult.aioAnalysis
      );
    }

  return rewards;
}

/**
 * 개별 점수에 대한 보상 계산
 */
function calculateScoreReward(
  analysisId: string,
  agentType: 'aeo' | 'geo' | 'seo' | 'aio',
  currentScore: number,
  previousScore?: number,
  aioAnalysis?: AIOCitationAnalysis
): AnalysisReward {
  // 점수 레벨 분류
  const scoreLevel = getScoreLevel(currentScore);
  
  // 개선율 계산
  let improvement = 0;
  if (previousScore !== undefined) {
    improvement = ((currentScore - previousScore) / previousScore) * 100;
  }

  // 벤치마크 대비 성능 (전체 평균 대비)
  const benchmark = getBenchmarkScore(agentType);
  const benchmarkComparison = ((currentScore - benchmark) / benchmark) * 100;

  // 보상 계산 (강화 학습용: -1 to 1)
  // 점수 레벨, 개선율, 벤치마크 비교를 종합하여 계산
  let reward = 0;
  
  // 점수 레벨 기반 보상
  if (scoreLevel === 'excellent') reward += 0.4;
  else if (scoreLevel === 'good') reward += 0.2;
  else if (scoreLevel === 'fair') reward += 0.0;
  else reward -= 0.2;

  // 개선율 기반 보상
  if (improvement > 10) reward += 0.3;
  else if (improvement > 5) reward += 0.15;
  else if (improvement > 0) reward += 0.05;
  else if (improvement < -10) reward -= 0.3;
  else if (improvement < -5) reward -= 0.15;
  else if (improvement < 0) reward -= 0.05;

  // 벤치마크 대비 보상
  if (benchmarkComparison > 20) reward += 0.3;
  else if (benchmarkComparison > 10) reward += 0.15;
  else if (benchmarkComparison > 0) reward += 0.05;
  else if (benchmarkComparison < -20) reward -= 0.3;
  else if (benchmarkComparison < -10) reward -= 0.15;
  else if (benchmarkComparison < 0) reward -= 0.05;

  // 보상 범위 제한 (-1 to 1)
  reward = Math.max(-1, Math.min(1, reward));

  return {
    analysisId,
    agentType,
    score: currentScore,
    reward,
    metrics: {
      currentScore,
      previousScore,
      improvement,
      benchmark,
      benchmarkComparison,
    },
    factors: {
      scoreLevel,
      improvementRate: improvement,
      benchmarkComparison,
    },
  };
}

/**
 * 점수 레벨 분류
 */
function getScoreLevel(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

/**
 * 벤치마크 점수 조회 (전체 평균)
 */
function getBenchmarkScore(agentType: 'aeo' | 'geo' | 'seo' | 'aio'): number {
  try {
    // 최근 100개 분석의 평균 점수 조회
    const stmt = db.prepare(`
      SELECT 
        AVG(CASE WHEN ? = 'aeo' THEN aeo_score 
                 WHEN ? = 'geo' THEN geo_score 
                 WHEN ? = 'seo' THEN seo_score 
                 ELSE overall_score END) as avg_score
      FROM analyses
      WHERE created_at > datetime('now', '-30 days')
      LIMIT 100
    `);
    
    const result = stmt.get(agentType, agentType, agentType) as { avg_score: number } | undefined;
    return result?.avg_score || 50; // 기본값 50
  } catch (error) {
    console.warn('⚠️ [getBenchmarkScore] 벤치마크 조회 실패, 기본값 사용:', error);
    return 50;
  }
}

/**
 * 분석 결과를 Agent Lightning Span으로 저장
 */
export function saveAnalysisSpan(
  analysisId: string,
  userId: string,
  analysisResult: AnalysisResult,
  url: string
): string {
  return dbHelpers.transaction(() => {
    // agent_spans 테이블 존재 여부 확인 및 생성
    try {
      const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='agent_spans'").get();
      if (!tableInfo) {
        console.warn('⚠️ [saveAnalysisSpan] agent_spans 테이블이 존재하지 않습니다. 자동 생성 시도...');
        // 테이블 자동 생성
        try {
          db.exec(`
            CREATE TABLE IF NOT EXISTS agent_spans (
              id TEXT PRIMARY KEY,
              type TEXT NOT NULL,
              agent_type TEXT NOT NULL,
              user_id TEXT,
              analysis_id TEXT,
              conversation_id TEXT,
              data TEXT NOT NULL,
              metadata TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
              FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE SET NULL,
              FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE SET NULL
            );

            CREATE INDEX IF NOT EXISTS idx_agent_spans_type ON agent_spans(type);
            CREATE INDEX IF NOT EXISTS idx_agent_spans_agent_type ON agent_spans(agent_type);
            CREATE INDEX IF NOT EXISTS idx_agent_spans_user_id ON agent_spans(user_id);
            CREATE INDEX IF NOT EXISTS idx_agent_spans_created_at ON agent_spans(created_at);
            CREATE INDEX IF NOT EXISTS idx_agent_spans_agent_created ON agent_spans(agent_type, created_at DESC);
          `);
          console.log('✅ [saveAnalysisSpan] agent_spans 테이블 자동 생성 완료');
        } catch (createError: any) {
          console.error('❌ [saveAnalysisSpan] agent_spans 테이블 생성 실패:', createError);
          // 테이블 생성 실패해도 계속 진행 (에러는 나중에 발생)
        }
      }
    } catch (checkError) {
      console.warn('⚠️ [saveAnalysisSpan] 테이블 확인 실패:', checkError);
    }
    
    const spanId = uuidv4();
    
    const spanData = {
      analysisId,
      url,
      scores: {
        aeo: analysisResult.aeoScore,
        geo: analysisResult.geoScore,
        seo: analysisResult.seoScore,
        overall: analysisResult.overallScore,
      },
      insights: analysisResult.insights,
      aioScores: analysisResult.aioAnalysis?.scores,
    };

    try {
      db.prepare(`
        INSERT INTO agent_spans (
          id, type, agent_type, user_id, analysis_id, data, metadata
        )
        VALUES (?, 'analysis', 'seo', ?, ?, ?, ?)
      `).run(
        spanId,
        userId,
        analysisId,
        JSON.stringify(spanData),
        JSON.stringify({
          url,
          timestamp: new Date().toISOString(),
          scoreLevel: {
            aeo: getScoreLevel(analysisResult.aeoScore),
            geo: getScoreLevel(analysisResult.geoScore),
            seo: getScoreLevel(analysisResult.seoScore),
          },
        })
      );
    } catch (insertError: any) {
      if (insertError?.code === 'SQLITE_ERROR' && insertError?.message.includes('no such table')) {
        console.error('❌ [saveAnalysisSpan] agent_spans 테이블이 여전히 없습니다. Span 저장을 건너뜁니다.');
        // 테이블이 없으면 빈 ID 반환 (에러는 발생시키지 않음)
        return '';
      }
      throw insertError;
    }

    return spanId;
  });
}

/**
 * 분석 결과를 기반으로 Reward 저장
 */
export function saveAnalysisRewards(
  spanId: string,
  analysisId: string,
  userId: string,
  rewards: {
    aeo: AnalysisReward;
    geo: AnalysisReward;
    seo: AnalysisReward;
    aio?: AnalysisReward;
  }
): void {
  dbHelpers.transaction(() => {
    // AEO, GEO, SEO, AIO 각각에 대해 Reward 저장
    const rewardTypes = [
      { type: 'aeo', reward: rewards.aeo },
      { type: 'geo', reward: rewards.geo },
      { type: 'seo', reward: rewards.seo },
      ...(rewards.aio ? [{ type: 'aio', reward: rewards.aio }] : []),
    ];

    for (const { type, reward } of rewardTypes) {
      const rewardId = uuidv4();
      
      // 보상을 0-100 점수로 변환 (Agent Lightning 호환)
      const score = Math.round((reward.reward + 1) * 50); // -1~1 -> 0~100

      db.prepare(`
        INSERT INTO agent_rewards (
          id, span_id, agent_type, score, relevance, accuracy, usefulness,
          user_id, analysis_id, feedback
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        rewardId,
        spanId,
        type,
        score,
        reward.metrics.currentScore / 100, // relevance (0-1)
        reward.metrics.improvement > 0 ? 1 : 0.5, // accuracy (개선 여부)
        reward.factors.scoreLevel === 'excellent' || reward.factors.scoreLevel === 'good' ? 1 : 0.5, // usefulness
        userId,
        analysisId,
        JSON.stringify({
          metrics: reward.metrics,
          factors: reward.factors,
          reward: reward.reward,
        })
      );
    }
  });
}

/**
 * 학습 메트릭 업데이트
 */
export function updateLearningMetrics(
  agentType: 'aeo' | 'geo' | 'seo' | 'aio',
  reward: AnalysisReward
): void {
  dbHelpers.transaction(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // 기존 메트릭 확인
    const existing = db.prepare(`
      SELECT id, total_spans, avg_reward, improvement_rate
      FROM learning_metrics
      WHERE agent_type = ? AND date = ?
    `).get(agentType, today) as {
      id: number;
      total_spans: number;
      avg_reward: number;
      improvement_rate: number;
    } | undefined;

    if (existing) {
      // 업데이트
      const newTotalSpans = existing.total_spans + 1;
      const newAvgReward = (existing.avg_reward * existing.total_spans + reward.reward) / newTotalSpans;
      const newImprovementRate = reward.metrics.improvement;

      db.prepare(`
        UPDATE learning_metrics
        SET 
          total_spans = ?,
          avg_reward = ?,
          improvement_rate = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newTotalSpans, newAvgReward, newImprovementRate, existing.id);
    } else {
      // 새로 생성
      db.prepare(`
        INSERT INTO learning_metrics (
          agent_type, date, total_spans, avg_reward, improvement_rate
        )
        VALUES (?, ?, 1, ?, ?)
      `).run(agentType, today, reward.reward, reward.metrics.improvement);
    }
  });
}

/**
 * 최적 프롬프트 버전 조회
 */
export function getBestPromptVersion(agentType: 'aeo' | 'geo' | 'seo' | 'aio'): number {
  try {
    const stmt = db.prepare(`
      SELECT best_prompt_version
      FROM learning_metrics
      WHERE agent_type = ?
      ORDER BY date DESC
      LIMIT 1
    `);
    
    const result = stmt.get(agentType) as { best_prompt_version: number } | undefined;
    return result?.best_prompt_version || 1;
  } catch (error) {
    console.warn('⚠️ [getBestPromptVersion] 조회 실패, 기본값 사용:', error);
    return 1;
  }
}

