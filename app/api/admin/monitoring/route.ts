import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { query } from '@/lib/db-adapter';
import { dbHelpers } from '@/lib/db';
import { cache } from '@/lib/cache';

/**
 * 실시간 모니터링 데이터 조회 API
 * GET /api/admin/monitoring
 */
export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    await requireAdmin(request);

    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // 1. 수집 상태 (최근 분석 통계)
    let recentAnalyses = 0;
    let todayAnalyses = 0;
    let activeAnalyses = 0;
    try {
      // 최근 1시간 분석 수
      const recentResult = await query(
        `SELECT COUNT(*) as count FROM analyses 
         WHERE created_at >= $1`,
        [oneHourAgo.toISOString()]
      );
      recentAnalyses = parseInt(recentResult.rows[0]?.count as string, 10) || 0;

      // 오늘 분석 수
      const todayResult = await query(
        `SELECT COUNT(*) as count FROM analyses 
         WHERE created_at >= $1`,
        [todayStart.toISOString()]
      );
      todayAnalyses = parseInt(todayResult.rows[0]?.count as string, 10) || 0;

      // 현재 분석 중 (최근 1분 이내 생성된 분석)
      const activeResult = await query(
        `SELECT COUNT(*) as count FROM analyses 
         WHERE created_at >= $1`,
        [oneMinuteAgo.toISOString()]
      );
      activeAnalyses = parseInt(activeResult.rows[0]?.count as string, 10) || 0;
    } catch (error: any) {
      console.error('❌ [Monitoring] 분석 통계 조회 오류:', error);
    }

    // 2. 서버 상태
    let serverStatus: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      database: boolean;
      memory: {
        used: number;
        total: number;
        percentage: number;
      };
      uptime: number;
    } = {
      status: 'healthy',
      database: false,
      memory: { used: 0, total: 0, percentage: 0 },
      uptime: 0,
    };

    try {
      // 데이터베이스 연결 확인
      const dbStats = dbHelpers.getStats();
      serverStatus.database = !!dbStats;

      // 메모리 사용량
      const memUsage = process.memoryUsage();
      serverStatus.memory = {
        used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
      };

      // 서버 업타임
      serverStatus.uptime = Math.floor(process.uptime());

      // 상태 판정
      if (!serverStatus.database) {
        serverStatus.status = 'unhealthy';
      } else if (serverStatus.memory.percentage > 90) {
        serverStatus.status = 'degraded';
      }
    } catch (error: any) {
      console.error('❌ [Monitoring] 서버 상태 조회 오류:', error);
      serverStatus.status = 'unhealthy';
    }

    // 3. 현재 분석하는 상황 (최근 5분 이내 생성된 분석 목록)
    let currentAnalyses: Array<{
      id: string;
      url: string;
      userEmail: string | null;
      createdAt: string;
    }> = [];
    try {
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const currentResult = await query(
        `SELECT a.id, a.url, a.created_at, u.email as user_email
         FROM analyses a
         LEFT JOIN users u ON a.user_id = u.id
         WHERE a.created_at >= $1
         ORDER BY a.created_at DESC
         LIMIT 10`,
        [fiveMinutesAgo.toISOString()]
      );

      currentAnalyses = currentResult.rows.map((row: any) => ({
        id: row.id,
        url: row.url,
        userEmail: row.user_email,
        createdAt: row.created_at,
      }));
    } catch (error: any) {
      console.error('❌ [Monitoring] 현재 분석 조회 오류:', error);
    }

    return NextResponse.json({
      timestamp: now.toISOString(),
      collection: {
        recentHour: recentAnalyses,
        today: todayAnalyses,
        active: activeAnalyses,
      },
      server: serverStatus,
      currentAnalyses,
    });
  } catch (error: any) {
    // requireAdmin에서 403 에러를 throw하므로 그대로 전달
    if (error instanceof NextResponse) {
      throw error;
    }

    console.error('❌ [GET /api/admin/monitoring] 오류:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: '모니터링 데이터를 조회할 수 없습니다.',
      },
      { status: 500 }
    );
  }
}

