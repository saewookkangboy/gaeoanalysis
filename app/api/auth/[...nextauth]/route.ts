import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { handleCorsPreflight } from '@/lib/headers';

const handler = NextAuth(authOptions);

// NextAuth v4 App Router 지원
// NextAuth는 NextRequest를 직접 받을 수 있지만, 내부적으로 query 파라미터를 기대할 수 있음
// 따라서 요청을 올바르게 래핑하여 전달

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  try {
    // NextAuth 핸들러는 NextRequest를 직접 받을 수 있음
    return handler(request);
  } catch (error: any) {
    console.error('[NextAuth GET] 에러:', error);
    console.error('에러 메시지:', error.message);
    console.error('에러 스택:', error.stack);
    console.error('요청 URL:', request.url);
    
    return Response.json(
      {
        error: 'Authentication error',
        message: error.message || '인증 처리 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  try {
    // NextAuth 핸들러는 NextRequest를 직접 받을 수 있음
    return handler(request);
  } catch (error: any) {
    console.error('[NextAuth POST] 에러:', error);
    console.error('에러 메시지:', error.message);
    console.error('에러 스택:', error.stack);
    console.error('요청 URL:', request.url);
    
    return Response.json(
      {
        error: 'Authentication error',
        message: error.message || '인증 처리 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  try {
    const corsResponse = handleCorsPreflight(request);
    if (corsResponse) {
      return corsResponse;
    }
    // NextAuth가 자체적으로 처리하도록 전달
    return handler(request);
  } catch (error: any) {
    console.error('[NextAuth OPTIONS] 에러:', error);
    return new Response(null, { status: 200 });
  }
}

