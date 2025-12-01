/**
 * 재시도 로직이 포함된 fetch 함수
 */

export interface FetchWithRetryOptions extends RequestInit {
  maxRetries?: number;
  retryDelay?: number;
  retryOn?: (response: Response) => boolean;
}

/**
 * Exponential backoff 계산
 */
function calculateDelay(attempt: number, baseDelay: number): number {
  return baseDelay * Math.pow(2, attempt - 1);
}

/**
 * 재시도 로직이 포함된 fetch
 */
export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    retryOn = (response) => !response.ok && response.status >= 500,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, fetchOptions);

      // 성공 응답이거나 재시도 불필요한 에러면 반환
      if (response.ok || !retryOn(response)) {
        return response;
      }

      // 마지막 시도면 에러 반환
      if (attempt >= maxRetries) {
        return response;
      }

      // 재시도 전 대기
      const delay = calculateDelay(attempt, retryDelay);
      await new Promise((resolve) => setTimeout(resolve, delay));

      console.log(`재시도 ${attempt}/${maxRetries} (${delay}ms 후)`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // 마지막 시도면 에러 던지기
      if (attempt >= maxRetries) {
        throw lastError;
      }

      // 재시도 전 대기
      const delay = calculateDelay(attempt, retryDelay);
      await new Promise((resolve) => setTimeout(resolve, delay));

      console.log(`재시도 ${attempt}/${maxRetries} (${delay}ms 후)`);
    }
  }

  throw lastError || new Error('재시도 실패');
}

