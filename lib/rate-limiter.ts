import { NextRequest, NextResponse } from 'next/server';

/**
 * 간단한 메모리 기반 레이트 리미터
 * 프로덕션 환경에서는 Redis 등을 사용하는 것을 권장합니다.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // 1시간마다 만료된 엔트리 정리
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000);
  }

  /**
   * 레이트 리미트 확인
   * @param key - 사용자 식별자 (IP 또는 사용자 ID)
   * @param maxRequests - 최대 요청 수
   * @param windowMs - 시간 윈도우 (밀리초)
   * @returns 허용 여부와 남은 요청 수
   */
  check(
    key: string,
    maxRequests: number,
    windowMs: number
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // 새 윈도우 시작
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + windowMs,
      };
      this.store.set(key, newEntry);
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: newEntry.resetTime,
      };
    }

    if (entry.count >= maxRequests) {
      // 제한 초과
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    // 요청 수 증가
    entry.count++;
    this.store.set(key, entry);
    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * 만료된 엔트리 정리
   */
  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  /**
   * 특정 키의 레이트 리미트 리셋
   */
  reset(key: string) {
    this.store.delete(key);
  }

  /**
   * 모든 엔트리 정리
   */
  clear() {
    this.store.clear();
  }

  /**
   * 정리 인터벌 종료
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// 싱글톤 인스턴스
export const rateLimiter = new RateLimiter();

/**
 * 레이트 리미트 미들웨어
 */
export function withRateLimit(
  maxRequests: number,
  windowMs: number,
  getKey: (request: NextRequest) => string | Promise<string>
) {
  return (handler: (request: NextRequest) => Promise<NextResponse>) => {
    return async (request: NextRequest): Promise<NextResponse> => {
      const key = await Promise.resolve(getKey(request));
      const result = rateLimiter.check(key, maxRequests, windowMs);

      if (!result.allowed) {
        return NextResponse.json(
          {
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
              resetTime: result.resetTime,
            },
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': maxRequests.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.resetTime.toString(),
              'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
            },
          }
        );
      }

      const response = await handler(request);
      
      // 레이트 리미트 헤더 추가
      response.headers.set('X-RateLimit-Limit', maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      response.headers.set('X-RateLimit-Reset', result.resetTime.toString());

      return response;
    };
  };
}

