/**
 * LLM 호출 결과용 경량 TTL 캐시.
 *
 * 임베딩/그라운딩처럼 동일 입력이 반복되는 호출의 비용·지연을 줄입니다.
 * (프로세스 메모리 기반 — 서버리스 인스턴스별로 독립적입니다.)
 */
export class TTLCache<V> {
  private store = new Map<string, { value: V; expires: number }>();

  constructor(
    private ttlMs: number = 60 * 60 * 1000,
    private maxEntries: number = 500,
  ) {}

  get(key: string): V | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (Date.now() > hit.expires) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key: string, value: V): void {
    if (this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
    this.store.set(key, { value, expires: Date.now() + this.ttlMs });
  }

  /** 캐시에 있으면 반환, 없으면 factory 실행 후 저장. */
  async wrap(key: string, factory: () => Promise<V>): Promise<V> {
    const cached = this.get(key);
    if (cached !== undefined) return cached;
    const value = await factory();
    this.set(key, value);
    return value;
  }
}

/** 캐시 키용 안정적 해시(간단한 djb2). */
export function hashKey(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}
