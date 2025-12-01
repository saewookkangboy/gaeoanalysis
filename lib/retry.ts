/**
 * 재시도 로직 유틸리티
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryable?: (error: Error) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryable: (error: Error) => {
    // 네트워크 에러나 타임아웃 에러만 재시도
    return (
      error.message.includes('fetch failed') ||
      error.message.includes('timeout') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ENOTFOUND') ||
      error.name === 'AbortError'
    );
  },
};

/**
 * Exponential backoff 계산
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const delay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt - 1);
  return Math.min(delay, options.maxDelay);
}

/**
 * 재시도 로직이 포함된 함수 실행
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // 재시도 가능한 에러인지 확인
      if (!opts.retryable(lastError)) {
        throw lastError;
      }

      // 마지막 시도면 에러 던지기
      if (attempt >= opts.maxAttempts) {
        throw lastError;
      }

      // Exponential backoff로 대기
      const delay = calculateDelay(attempt, opts);
      await new Promise((resolve) => setTimeout(resolve, delay));

      console.log(`재시도 ${attempt}/${opts.maxAttempts} (${delay}ms 후)`);
    }
  }

  throw lastError || new Error('재시도 실패');
}

