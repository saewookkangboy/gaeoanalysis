import { NextResponse } from 'next/server';
import { dbHelpers } from '@/lib/db';

/**
 * 헬스 체크 엔드포인트
 * 데이터베이스 연결 상태 및 통계 정보 제공
 */
export async function GET() {
  try {
    // 데이터베이스 연결 테스트
    const dbTest = dbHelpers.safeQuery(() => {
      return dbHelpers.getStats();
    }, '데이터베이스 연결 실패');

    return NextResponse.json({
      status: 'healthy',
      database: {
        connected: true,
        stats: dbTest,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        database: {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

