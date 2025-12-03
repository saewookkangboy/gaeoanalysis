/**
 * 알고리즘 성능 모니터링 API
 * 
 * 4. 알고리즘 성능을 대시보드로 시각화하기 위한 데이터 제공
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-utils';
import { getActiveAlgorithmVersion } from '@/lib/algorithm-learning';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('UNAUTHORIZED', '인증이 필요합니다.', 401);
    }

    const { searchParams } = new URL(request.url);
    const algorithmType = searchParams.get('algorithmType') as 'aeo' | 'geo' | 'seo' | 'aio' | null;
    const days = parseInt(searchParams.get('days') || '30');

    // 날짜 범위 계산
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    if (algorithmType) {
      // 특정 알고리즘 타입의 성능 조회
      const version = getActiveAlgorithmVersion(algorithmType);
      if (!version) {
        return createErrorResponse('NOT_FOUND', '활성 알고리즘 버전을 찾을 수 없습니다.', 404);
      }

      // 최근 테스트 결과 조회
      const recentTests = db.prepare(`
        SELECT 
          COUNT(*) as total_tests,
          AVG(ABS(score_a - COALESCE(actual_score, (score_a + score_b) / 2))) as avg_error_a,
          AVG(ABS(score_b - COALESCE(actual_score, (score_a + score_b) / 2))) as avg_error_b,
          SUM(CASE WHEN winner = 'A' THEN 1 ELSE 0 END) as wins_a,
          SUM(CASE WHEN winner = 'B' THEN 1 ELSE 0 END) as wins_b
        FROM algorithm_tests
        WHERE algorithm_type = ? AND created_at >= ?
      `).get(algorithmType, startDate.toISOString()) as {
        total_tests: number;
        avg_error_a: number;
        avg_error_b: number;
        wins_a: number;
        wins_b: number;
      } | undefined;

      // 일별 성능 추이
      const dailyPerformance = db.prepare(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as test_count,
          AVG(ABS(score_a - COALESCE(actual_score, (score_a + score_b) / 2))) as avg_error
        FROM algorithm_tests
        WHERE algorithm_type = ? AND created_at >= ?
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `).all(algorithmType, startDate.toISOString()) as Array<{
        date: string;
        test_count: number;
        avg_error: number;
      }>;

      // 리서치 기반 개선 추적
      const researchImprovements = db.prepare(`
        SELECT 
          rf.title,
          rf.source,
          rf.applied_at,
          av.version as applied_version,
          av.improvement_rate
        FROM research_findings rf
        JOIN algorithm_versions av ON rf.applied_version = av.id
        WHERE rf.applied = 1 AND av.algorithm_type = ?
        ORDER BY rf.applied_at DESC
        LIMIT 10
      `).all(algorithmType) as Array<{
        title: string;
        source: string;
        applied_at: string;
        applied_version: number;
        improvement_rate: number;
      }>;

      return createSuccessResponse({
        algorithmType,
        version: {
          id: version.id,
          version: version.version,
          performance: version.performance,
          researchBased: version.researchBased,
        },
        statistics: {
          totalTests: recentTests?.total_tests || 0,
          avgErrorA: recentTests?.avg_error_a || 0,
          avgErrorB: recentTests?.avg_error_b || 0,
          winsA: recentTests?.wins_a || 0,
          winsB: recentTests?.wins_b || 0,
        },
        dailyPerformance: dailyPerformance.map(d => ({
          date: d.date,
          testCount: d.test_count,
          avgError: d.avg_error,
        })),
        researchImprovements: researchImprovements.map(r => ({
          title: r.title,
          source: r.source,
          appliedAt: r.applied_at,
          appliedVersion: r.applied_version,
          improvementRate: r.improvement_rate,
        })),
      });
    } else {
      // 모든 알고리즘 타입의 성능 조회
      const allVersions = {
        aeo: getActiveAlgorithmVersion('aeo'),
        geo: getActiveAlgorithmVersion('geo'),
        seo: getActiveAlgorithmVersion('seo'),
        aio: getActiveAlgorithmVersion('aio'),
      };

      // 전체 통계
      const overallStats = db.prepare(`
        SELECT 
          algorithm_type,
          COUNT(*) as total_tests,
          AVG(avg_accuracy) as avg_accuracy,
          AVG(avg_error) as avg_error,
          AVG(improvement_rate) as avg_improvement_rate
        FROM algorithm_versions
        WHERE is_active = 1
        GROUP BY algorithm_type
      `).all() as Array<{
        algorithm_type: string;
        total_tests: number;
        avg_accuracy: number;
        avg_error: number;
        avg_improvement_rate: number;
      }>;

      const statsMap = new Map(
        overallStats.map(s => [s.algorithm_type, s])
      );

      return createSuccessResponse({
        versions: {
          aeo: allVersions.aeo ? {
            version: allVersions.aeo.version,
            performance: allVersions.aeo.performance,
            stats: statsMap.get('aeo'),
          } : null,
          geo: allVersions.geo ? {
            version: allVersions.geo.version,
            performance: allVersions.geo.performance,
            stats: statsMap.get('geo'),
          } : null,
          seo: allVersions.seo ? {
            version: allVersions.seo.version,
            performance: allVersions.seo.performance,
            stats: statsMap.get('seo'),
          } : null,
          aio: allVersions.aio ? {
            version: allVersions.aio.version,
            performance: allVersions.aio.performance,
            stats: statsMap.get('aio'),
          } : null,
        },
        period: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          days,
        },
      });
    }
  } catch (error) {
    console.error('❌ [Algorithm Performance API] 오류:', error);
    return createErrorResponse(
      'INTERNAL_ERROR',
      '알고리즘 성능 조회 중 오류가 발생했습니다.',
      500
    );
  }
}

