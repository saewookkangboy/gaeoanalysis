/**
 * 보안 유틸리티 함수
 * 환경 변수 검증, 에러 메시지 보안 처리 등
 */

/**
 * 필수 환경 변수 검증
 * 런타임에 필수 환경 변수가 설정되어 있는지 확인
 */
export function validateRequiredEnvVars(requiredVars: string[]): {
  valid: boolean;
  missing: string[];
  errors: string[];
} {
  const missing: string[] = [];
  const errors: string[] = [];

  for (const varName of requiredVars) {
    const value = process.env[varName];
    
    if (!value || value.trim() === '') {
      missing.push(varName);
      errors.push(`필수 환경 변수 ${varName}가 설정되지 않았습니다.`);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    errors,
  };
}

/**
 * 프로덕션 환경에서 안전한 에러 메시지 생성
 * 상세한 에러 정보는 숨기고 일반적인 메시지만 반환
 */
export function getSafeErrorMessage(error: unknown, defaultMessage: string = '요청 처리 중 오류가 발생했습니다.'): string {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // 프로덕션에서는 상세한 에러 정보를 숨김
    return defaultMessage;
  }
  
  // 개발 환경에서는 상세한 에러 정보 표시
  if (error instanceof Error) {
    return error.message || defaultMessage;
  }
  
  return defaultMessage;
}

/**
 * 프로덕션 환경에서 안전한 에러 객체 생성
 */
export function getSafeErrorDetails(error: unknown): {
  message: string;
  code?: string;
  details?: any;
} {
  const isProduction = process.env.NODE_ENV === 'production';
  const defaultMessage = '요청 처리 중 오류가 발생했습니다.';
  
  if (isProduction) {
    return {
      message: defaultMessage,
    };
  }
  
  // 개발 환경에서는 상세 정보 포함
  if (error instanceof Error) {
    return {
      message: error.message || defaultMessage,
      code: error.name,
      details: {
        stack: error.stack,
      },
    };
  }
  
  return {
    message: defaultMessage,
  };
}

/**
 * 민감한 정보가 포함된 문자열 마스킹
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (!data || data.length <= visibleChars) {
    return '***';
  }
  
  const visible = data.substring(0, visibleChars);
  const masked = '*'.repeat(Math.min(data.length - visibleChars, 20));
  
  return `${visible}${masked}`;
}

/**
 * URL에서 민감한 쿼리 파라미터 제거
 */
export function sanitizeUrlForLogging(url: string): string {
  try {
    const urlObj = new URL(url);
    const sensitiveParams = ['password', 'token', 'key', 'secret', 'apiKey', 'accessToken', 'refreshToken'];
    
    sensitiveParams.forEach(param => {
      if (urlObj.searchParams.has(param)) {
        urlObj.searchParams.set(param, '[REDACTED]');
      }
    });
    
    return urlObj.toString();
  } catch {
    // URL 파싱 실패 시 원본 반환 (로그에 문제가 생기지 않도록)
    return url;
  }
}

/**
 * 헤더에서 민감한 정보 제거
 */
export function sanitizeHeadersForLogging(headers: Headers): Record<string, string> {
  const sensitiveHeaders = [
    'authorization',
    'cookie',
    'x-api-key',
    'x-auth-token',
    'x-access-token',
  ];
  
  const sanitized: Record<string, string> = {};
  
  headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveHeaders.some(sensitive => lowerKey.includes(sensitive));
    
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  });
  
  return sanitized;
}

/**
 * IP 주소 검증 및 정규화
 */
export function normalizeIpAddress(ip: string | null | undefined): string {
  if (!ip) {
    return 'unknown';
  }
  
  // IPv4 주소 정규화
  if (ip.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
    return ip;
  }
  
  // IPv6 주소 정규화
  if (ip.includes(':')) {
    return ip;
  }
  
  // x-forwarded-for 헤더에서 첫 번째 IP 추출
  if (ip.includes(',')) {
    return ip.split(',')[0].trim();
  }
  
  return ip.trim();
}

/**
 * 세션 타임아웃 확인 (30일)
 */
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30일 (초)

/**
 * 세션 갱신 주기 (24시간)
 */
export const SESSION_UPDATE_AGE = 24 * 60 * 60; // 24시간 (초)

/**
 * 레이트 리미트 설정
 */
export const RATE_LIMIT_CONFIG = {
  // 분석 API: IP당 1분에 10회, 사용자당 1시간에 50회
  analyze: {
    ip: { maxRequests: 10, windowMs: 60 * 1000 }, // 1분
    user: { maxRequests: 50, windowMs: 60 * 60 * 1000 }, // 1시간
  },
  // 채팅 API: IP당 1분에 20회, 사용자당 1시간에 100회
  chat: {
    ip: { maxRequests: 20, windowMs: 60 * 1000 }, // 1분
    user: { maxRequests: 100, windowMs: 60 * 60 * 1000 }, // 1시간
  },
  // 일반 API: IP당 1분에 30회
  general: {
    ip: { maxRequests: 30, windowMs: 60 * 1000 }, // 1분
  },
};
