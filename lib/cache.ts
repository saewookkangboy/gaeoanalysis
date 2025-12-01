/**
 * 간단한 메모리 기반 캐시
 * 프로덕션 환경에서는 Redis 등을 사용하는 것을 권장합니다.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class Cache {
  private store: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // 1분마다 만료된 엔트리 정리
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  /**
   * 캐시에 데이터 저장
   */
  set<T>(key: string, data: T, ttlMs: number = 24 * 60 * 60 * 1000): void {
    const entry: CacheEntry<T> = {
      data,
      expiresAt: Date.now() + ttlMs,
    };
    this.store.set(key, entry);
  }

  /**
   * 캐시에서 데이터 조회
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * 캐시에 데이터가 있는지 확인
   */
  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) {
      return false;
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  /**
   * 캐시에서 데이터 삭제
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * 특정 패턴의 키 삭제
   */
  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * 만료된 엔트리 정리
   */
  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * 모든 캐시 삭제
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * 캐시 통계
   */
  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;

    for (const entry of this.store.values()) {
      if (now > entry.expiresAt) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: this.store.size,
      active,
      expired,
    };
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
export const cache = new Cache();

/**
 * 캐시 키 생성 헬퍼
 */
export function createCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}:${parts.join(':')}`;
}

