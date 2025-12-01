import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { handleCorsPreflight } from '@/lib/headers';

const handler = NextAuth(authOptions);

// 에러 핸들링 래퍼
async function handleWithErrorHandling(
  request: NextRequest,
  method: 'GET' | 'POST' | 'OPTIONS'
) {
  try {
    // OPTIONS 요청은 CORS 처리
    if (method === 'OPTIONS') {
      const corsResponse = handleCorsPreflight(request);
      if (corsResponse) {
        return corsResponse;
      }
    }

    // NextAuth 핸들러 실행
    const response = await handler(request);
    return response;
  } catch (error: any) {
    console.error(`[NextAuth ${method}] 에러:`, error);
    console.error('에러 스택:', error.stack);
    
    // JSON 응답 반환
    return NextResponse.json(
      {
        error: 'Authentication error',
        message: error.message || '인증 처리 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleWithErrorHandling(request, 'GET');
}

export async function POST(request: NextRequest) {
  return handleWithErrorHandling(request, 'POST');
}

export async function OPTIONS(request: NextRequest) {
  return handleWithErrorHandling(request, 'OPTIONS');
}

