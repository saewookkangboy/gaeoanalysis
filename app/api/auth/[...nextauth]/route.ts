import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { handleCorsPreflight } from '@/lib/headers';

const handler = NextAuth(authOptions);

// NextAuth v4는 App Router를 지원하지만, 요청을 올바른 형식으로 전달해야 합니다
// NextAuth 핸들러는 직접 NextRequest를 받을 수 있습니다

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  try {
    // NextAuth 핸들러에 직접 요청 전달
    const response = await handler(request);
    return response;
  } catch (error: any) {
    console.error('[NextAuth GET] 에러:', error);
    console.error('에러 스택:', error.stack);
    console.error('요청 URL:', request.url);
    console.error('요청 메서드:', request.method);
    
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
    // NextAuth 핸들러에 직접 요청 전달
    const response = await handler(request);
    return response;
  } catch (error: any) {
    console.error('[NextAuth POST] 에러:', error);
    console.error('에러 스택:', error.stack);
    console.error('요청 URL:', request.url);
    console.error('요청 메서드:', request.method);
    
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

