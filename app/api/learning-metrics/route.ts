/**
 * 학습 메트릭 API
 * 
 * Agent Lightning 기반 학습 메트릭 조회
 * AEO, GEO, SEO, AIO 각 Agent Type별 성능 모니터링
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-utils';
import db, { dbHelpers } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse(
        'UNAUTHORIZED',
        '인증이 필요합니다.',
        401
      );
    }

    const { searchParams } = new URL(request.url);
    const agentType = searchParams.get('agentType') as 'aeo' | 'geo' | 'seo' | 'aio' | null;
    const days = parseInt(searchParams.get('days') || '30');

    // 날짜 범위 계산
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    if (agentType) {
      // 특정 Agent Type의 메트릭 조회
      const metrics = db.prepare(`
        SELECT 
          id,
          agent_type,
          date,
          total_spans,
          avg_reward,
          improvement_rate,
          best_prompt_version,
          created_at,
          updated_at
        FROM learning_metrics
        WHERE agent_type = ? AND date >= ?
        ORDER BY date DESC
      `).all(agentType, startDate.toISOString().split('T')[0]) as Array<{
        id: number;
        agent_type: string;
        date: string;
        total_spans: number;
        avg_reward: number;
        improvement_rate: number;
        best_prompt_version: number;
        created_at: string;
        updated_at: string;
      }>;

      // 최근 보상 데이터 조회
      const recentRewards = db.prepare(`
        SELECT 
          score,
          relevance,
          accuracy,
          usefulness,
          created_at
        FROM agent_rewards
        WHERE agent_type = ? AND created_at >= ?
        ORDER BY created_at DESC
        LIMIT 100
      `).all(agentType, startDate.toISOString()) as Array<{
        score: number;
        relevance: number;
        accuracy: number;
        usefulness: number;
        created_at: string;
      }>;

      // 통계 계산
      const avgReward = recentRewards.length > 0
        ? recentRewards.reduce((sum, r) => sum + r.score, 0) / recentRewards.length
        : 0;
      
      const avgRelevance = recentRewards.length > 0
        ? recentRewards.reduce((sum, r) => sum + r.relevance, 0) / recentRewards.length
        : 0;
      
      const avgAccuracy = recentRewards.length > 0
        ? recentRewards.reduce((sum, r) => sum + r.accuracy, 0) / recentRewards.length
        : 0;
      
      const avgUsefulness = recentRewards.length > 0
        ? recentRewards.reduce((sum, r) => sum + r.usefulness, 0) / recentRewards.length
        : 0;

      // 최고 성능 프롬프트 버전 조회
      const bestPrompt = db.prepare(`
        SELECT 
          id,
          template,
          version,
          avg_score,
          total_uses,
          success_rate
        FROM prompt_templates
        WHERE agent_type = ?
        ORDER BY avg_score DESC, version DESC
        LIMIT 1
      `).get(agentType) as {
        id: string;
        template: string;
        version: number;
        avg_score: number;
        total_uses: number;
        success_rate: number;
      } | undefined;

      return createSuccessResponse({
        agentType,
        period: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          days,
        },
        metrics: metrics.map(m => ({
          date: m.date,
          totalSpans: m.total_spans,
          avgReward: m.avg_reward,
          improvementRate: m.improvement_rate,
          bestPromptVersion: m.best_prompt_version,
        })),
        statistics: {
          avgReward,
          avgRelevance,
          avgAccuracy,
          avgUsefulness,
          totalRewards: recentRewards.length,
        },
        bestPrompt: bestPrompt ? {
          version: bestPrompt.version,
          avgScore: bestPrompt.avg_score,
          totalUses: bestPrompt.total_uses,
          successRate: bestPrompt.success_rate,
        } : null,
      });
    } else {
      // 모든 Agent Type의 메트릭 조회
      const allMetrics = db.prepare(`
        SELECT 
          agent_type,
          date,
          total_spans,
          avg_reward,
          improvement_rate,
          best_prompt_version
        FROM learning_metrics
        WHERE date >= ?
        ORDER BY agent_type, date DESC
      `).all(startDate.toISOString().split('T')[0]) as Array<{
        agent_type: string;
        date: string;
        total_spans: number;
        avg_reward: number;
        improvement_rate: number;
        best_prompt_version: number;
      }>;

      // Agent Type별로 그룹화
      const groupedMetrics: Record<string, any> = {};
      const agentTypes = ['aeo', 'geo', 'seo', 'aio'];

      for (const type of agentTypes) {
        const typeMetrics = allMetrics.filter(m => m.agent_type === type);
        
        if (typeMetrics.length > 0) {
          const totalSpans = typeMetrics.reduce((sum, m) => sum + m.total_spans, 0);
          const avgReward = typeMetrics.reduce((sum, m) => sum + m.avg_reward, 0) / typeMetrics.length;
          const avgImprovement = typeMetrics.reduce((sum, m) => sum + m.improvement_rate, 0) / typeMetrics.length;
          const latestBestVersion = typeMetrics[0]?.best_prompt_version || 1;

          groupedMetrics[type] = {
            totalSpans,
            avgReward,
            avgImprovementRate: avgImprovement,
            bestPromptVersion: latestBestVersion,
            dailyMetrics: typeMetrics.map(m => ({
              date: m.date,
              totalSpans: m.total_spans,
              avgReward: m.avg_reward,
              improvementRate: m.improvement_rate,
            })),
          };
        }
      }

      return createSuccessResponse({
        period: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          days,
        },
        metrics: groupedMetrics,
      });
    }
  } catch (error) {
    console.error('❌ [Learning Metrics API] 오류:', error);
    return createErrorResponse(
      'INTERNAL_ERROR',
      '학습 메트릭 조회 중 오류가 발생했습니다.',
      500
    );
  }
}

