/**
 * 보안 로거 유틸리티
 * 프로덕션 환경에서 민감한 정보를 숨기고 로그를 제한합니다
 */

const isProduction = process.env.NODE_ENV === 'production';

interface LogOptions {
  level?: 'log' | 'error' | 'warn' | 'debug' | 'info';
  sanitize?: boolean; // 민감한 정보 제거 여부
}

/**
 * 안전한 로깅 함수
 * 프로덕션에서는 민감한 정보를 제거하고 최소한의 정보만 로깅
 */
export function secureLog(message: string, data?: any, options: LogOptions = {}) {
  const { level = 'log', sanitize = true } = options;

  if (isProduction) {
    // 프로덕션에서는 에러와 경고만 로깅
    if (level === 'error' || level === 'warn') {
      const sanitizedData = sanitize ? sanitizeData(data) : data;
      console[level](message, sanitizedData);
    }
    // 다른 로그는 무시
    return;
  }

  // 개발 환경에서는 모든 로그 표시
  const sanitizedData = sanitize ? sanitizeData(data) : data;
  console[level](message, sanitizedData);
}

/**
 * 민감한 정보 제거
 */
function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveKeys = [
    'password',
    'secret',
    'token',
    'key',
    'apiKey',
    'clientSecret',
    'authSecret',
    'accessToken',
    'refreshToken',
    'sessionToken',
    'cookie',
    'authorization',
  ];

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some(sensitive => lowerKey.includes(sensitive));

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * 에러 로깅 (스택 트레이스 제한)
 */
export function secureError(message: string, error?: Error | unknown) {
  if (isProduction) {
    // 프로덕션에서는 최소한의 정보만 표시
    console.error(message);
    if (error instanceof Error) {
      console.error('Error type:', error.name);
      // 스택 트레이스는 표시하지 않음
    }
  } else {
    // 개발 환경에서는 전체 에러 정보 표시
    console.error(message, error);
  }
}

