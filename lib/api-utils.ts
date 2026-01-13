import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logServerError } from './error-logger';
import { getSafeErrorMessage, sanitizeUrlForLogging, sanitizeHeadersForLogging } from './security-utils';

/**
 * 표준화된 에러 응답 타입
 */
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

/**
 * 표준화된 에러 응답 생성
 */
export function createErrorResponse(
  code: string,
  message: string,
  status: number = 400,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(details && { details }),
      },
    },
    { status }
  );
}

/**
 * 성공 응답 생성
 */
export function createSuccessResponse(data: any, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * 입력 검증 및 에러 처리 래퍼
 */
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (validatedData: T, request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const body = await request.json();
      const validatedData = schema.parse(body);
      return await handler(validatedData, request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return createErrorResponse(
          'VALIDATION_ERROR',
          '입력 검증 실패',
          400,
          error.issues
        );
      }
      throw error;
    }
  };
}

/**
 * 에러 핸들링 래퍼
 */
export function withErrorHandling(
  handler: (request: NextRequest) => Promise<NextResponse>,
  errorMessage: string = '요청 처리 중 오류가 발생했습니다.'
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(request);
    } catch (error) {
      console.error(errorMessage, error);
      
      // 서버 에러를 중앙 에러 로그(error_logs)에 비동기로 기록 (실패해도 무시)
      if (error instanceof Error) {
        const url = request.url;
        const method = request.method;
        const pathname = (() => {
          try {
            return new URL(url).pathname;
          } catch {
            return url;
          }
        })();

        // 에러 타입/심각도 분류
        let errorType = 'internal_error';
        let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';

        if (error.name === 'AbortError' || error.message.includes('timeout')) {
          errorType = 'timeout_error';
          severity = 'low';
        } else if (
          error.message.includes('fetch failed') ||
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('ENOTFOUND')
        ) {
          errorType = 'network_error';
          severity = 'low';
        } else if (
          error.message.includes('Unauthorized') ||
          error.message.includes('인증') ||
          error.message.includes('UNAUTHORIZED')
        ) {
          errorType = 'auth_error';
          severity = 'low';
        } else if (
          pathname.startsWith('/api/analyze') ||
          pathname.startsWith('/api/chat')
        ) {
          // 핵심 분석/채팅 API 에러는 한 단계 높게
          errorType = 'analysis_error';
          severity = 'high';
        }

        // Fire-and-forget 로깅 (민감한 정보 제거)
        Promise.resolve().then(() =>
          logServerError({
            errorType,
            error,
            url: sanitizeUrlForLogging(url),
            method,
            severity,
            headers: sanitizeHeadersForLogging(request.headers),
            metadata: {
              pathname,
            },
          })
        );
      }
      
      if (error instanceof Error) {
        // 타임아웃 에러
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
          return createErrorResponse(
            'TIMEOUT_ERROR',
            '요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.',
            408
          );
        }
        
        // 네트워크 에러
        if (error.message.includes('fetch failed') || 
            error.message.includes('ECONNREFUSED') || 
            error.message.includes('ENOTFOUND')) {
          return createErrorResponse(
            'NETWORK_ERROR',
            '네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.',
            503
          );
        }
        
        // 인증 에러
        if (error.message.includes('Unauthorized') || error.message.includes('인증')) {
          return createErrorResponse(
            'UNAUTHORIZED',
            '인증이 필요합니다.',
            401
          );
        }
        
        // 프로덕션에서는 상세한 에러 메시지 숨김
        const safeMessage = getSafeErrorMessage(error, errorMessage);
        return createErrorResponse(
          'INTERNAL_ERROR',
          safeMessage,
          500
        );
      }
      
      // 프로덕션에서는 상세한 에러 메시지 숨김
      const safeMessage = getSafeErrorMessage(error, errorMessage);
      return createErrorResponse(
        'INTERNAL_ERROR',
        safeMessage,
        500
      );
    }
  };
}

/**
 * URL sanitization 및 정규화
 * - 프로토콜이 없으면 https:// 자동 추가
 * - http://는 그대로 유지 (일부 사이트는 http만 지원)
 * - www.는 유지 (사용자 입력 그대로)
 * - 공백 제거 및 트림
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    throw new Error('유효하지 않은 URL입니다.');
  }

  // 공백 제거 및 트림
  let normalizedUrl = url.trim();

  // 빈 문자열 체크
  if (!normalizedUrl) {
    throw new Error('URL을 입력해주세요.');
  }

  // 프로토콜이 없는 경우 자동 추가
  if (!normalizedUrl.match(/^https?:\/\//i)) {
    // www.로 시작하는 경우
    if (normalizedUrl.match(/^www\./i)) {
      normalizedUrl = 'https://' + normalizedUrl;
    } else {
      // 일반 도메인인 경우
      normalizedUrl = 'https://' + normalizedUrl;
    }
  }

  try {
    const urlObj = new URL(normalizedUrl);
    
    // 허용된 프로토콜만
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('허용되지 않은 프로토콜입니다.');
    }

    // http://는 그대로 유지 (일부 사이트는 http만 지원할 수 있음)
    // https 우선 시도는 analyzer.ts에서 처리

    // 호스트명 검증
    if (!urlObj.hostname || urlObj.hostname.length === 0) {
      throw new Error('유효하지 않은 도메인입니다.');
    }

    // 기본 포트 제거 (https://example.com:443 -> https://example.com)
    if ((urlObj.protocol === 'https:' && urlObj.port === '443') ||
        (urlObj.protocol === 'http:' && urlObj.port === '80')) {
      urlObj.port = '';
    }

    return urlObj.toString();
  } catch (error) {
    // URL 생성 실패 시 더 자세한 에러 메시지
    if (error instanceof TypeError) {
      throw new Error('유효하지 않은 URL 형식입니다. 올바른 URL을 입력해주세요.');
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('유효하지 않은 URL입니다.');
  }
}

/**
 * 텍스트 sanitization (XSS 방지)
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

