import { handlers } from "@/auth";
import { NextRequest, NextResponse } from 'next/server';
import { handleCorsPreflight } from '@/lib/headers';

// NextAuth v5 App Router 지원
// handlers에서 직접 GET, POST를 export

// PKCE 에러 핸들링을 위한 래퍼 함수
async function handleAuthRequest(
  handler: (req: NextRequest) => Promise<Response>,
  req: NextRequest
): Promise<Response> {
  try {
    return await handler(req);
  } catch (error: any) {
    // GitHub OAuth 오류 상세 로깅
    if (error?.cause?.body?.error === 'bad_verification_code') {
      console.error('❌ [GitHub OAuth] bad_verification_code 오류 발생:', {
        error: error.cause.body.error,
        errorDescription: error.cause.body.error_description,
        errorUri: error.cause.body.error_uri,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString(),
        diagnostics: {
          hasClientId: !!process.env.GITHUB_CLIENT_ID || !!process.env.GITHUB_CLIENT_ID_DEV,
          hasClientSecret: !!process.env.GITHUB_CLIENT_SECRET || !!process.env.GITHUB_CLIENT_SECRET_DEV,
          authUrl: process.env.AUTH_URL || process.env.NEXTAUTH_URL || 'N/A',
          nodeEnv: process.env.NODE_ENV,
          expectedCallbackUrl: `${process.env.AUTH_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback/github`,
        }
      });
    }
    
    // PKCE 관련 에러인지 확인
    if (error?.message?.includes('pkceCodeVerifier') || 
        error?.message?.includes('InvalidCheck') ||
        error?.cause?.message?.includes('pkceCodeVerifier')) {
      console.error('❌ [NextAuth] PKCE 에러 발생:', {
        message: error.message,
        cause: error.cause?.message,
        path: req.nextUrl.pathname,
        method: req.method,
        hasAuthSecret: !!process.env.AUTH_SECRET || !!process.env.NEXTAUTH_SECRET,
        nodeEnv: process.env.NODE_ENV,
      });
      
      // AUTH_SECRET 확인
      if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
        console.error('❌ [NextAuth] AUTH_SECRET이 설정되지 않았습니다!');
        return NextResponse.json(
          { 
            error: 'Server configuration error',
            message: 'AUTH_SECRET이 설정되지 않았습니다. Vercel 환경 변수를 확인하세요.',
          },
          { status: 500 }
        );
      }
    }
    
    // 다른 에러는 그대로 전달
    throw error;
  }
}

export async function GET(req: NextRequest) {
  return handleAuthRequest(handlers.GET, req);
}

export async function POST(req: NextRequest) {
  return handleAuthRequest(handlers.POST, req);
}

export async function OPTIONS(request: NextRequest) {
  try {
    const corsResponse = handleCorsPreflight(request);
    if (corsResponse) {
      return corsResponse;
    }
    // OPTIONS는 handlers에 포함되지 않을 수 있으므로 직접 처리
    return new NextResponse(null, { status: 200 });
  } catch (error: any) {
    console.error('[NextAuth OPTIONS] 에러:', error);
    return new NextResponse(null, { status: 200 });
  }
}

