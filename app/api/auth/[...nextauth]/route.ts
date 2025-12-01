import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { handleCorsPreflight } from '@/lib/headers';

const handler = NextAuth(authOptions);

// NextAuth는 App Router에서 직접 요청을 처리할 수 있도록 설계되었습니다
// 하지만 내부적으로 query 파라미터를 기대하므로, 요청을 올바르게 전달해야 합니다

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  try {
    return handler(request);
  } catch (error: any) {
    console.error('[NextAuth GET] 에러:', error);
    console.error('에러 스택:', error.stack);
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
    return handler(request);
  } catch (error: any) {
    console.error('[NextAuth POST] 에러:', error);
    console.error('에러 스택:', error.stack);
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
  const corsResponse = handleCorsPreflight(request);
  if (corsResponse) {
    return corsResponse;
  }
  // NextAuth가 자체적으로 처리하도록 전달
  return handler(request);
}

