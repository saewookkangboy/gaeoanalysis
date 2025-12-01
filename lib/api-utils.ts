import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

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
        
        return createErrorResponse(
          'INTERNAL_ERROR',
          error.message || errorMessage,
          500
        );
      }
      
      return createErrorResponse(
        'INTERNAL_ERROR',
        errorMessage,
        500
      );
    }
  };
}

/**
 * URL sanitization
 */
export function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // 허용된 프로토콜만
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('허용되지 않은 프로토콜입니다.');
    }
    return urlObj.toString();
  } catch (error) {
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

