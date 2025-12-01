import { NextResponse } from 'next/server';
import { dbHelpers } from '@/lib/db';
import { cache, rateLimiter } from '@/lib/cache';

/**
 * 헬스 체크 엔드포인트
 * 데이터베이스 연결 상태, 외부 API 상태, 메모리 사용량 확인
 */
export async function GET() {
  const health = {
    status: 'healthy' as 'healthy' | 'unhealthy' | 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      database: {
        connected: false,
        stats: null as any,
        error: null as string | null,
      },
      gemini: {
        available: false,
        error: null as string | null,
      },
      cache: {
        stats: null as any,
      },
    },
    system: {
      memory: {
        used: 0,
        total: 0,
        percentage: 0,
      },
      uptime: process.uptime(),
    },
  };

  // 데이터베이스 연결 테스트
  try {
    const dbStats = dbHelpers.safeQuery(() => {
      return dbHelpers.getStats();
    }, '데이터베이스 연결 실패');
    
    health.services.database = {
      connected: true,
      stats: dbStats,
      error: null,
    };
  } catch (error) {
    health.status = 'unhealthy';
    health.services.database = {
      connected: false,
      stats: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Gemini API 상태 확인
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      health.services.gemini = {
        available: false,
        error: 'API 키가 설정되지 않았습니다.',
      };
      health.status = health.status === 'healthy' ? 'degraded' : health.status;
    } else {
      health.services.gemini = {
        available: true,
        error: null,
      };
    }
  } catch (error) {
    health.services.gemini = {
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    health.status = health.status === 'healthy' ? 'degraded' : health.status;
  }

  // 캐시 통계
  try {
    health.services.cache.stats = cache.getStats();
  } catch (error) {
    health.services.cache.stats = null;
  }

  // 메모리 사용량
  try {
    const memUsage = process.memoryUsage();
    health.system.memory = {
      used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
    };
  } catch (error) {
    // 메모리 정보를 가져올 수 없어도 계속 진행
  }

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}

