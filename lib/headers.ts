import { NextRequest, NextResponse } from 'next/server';

/**
 * CORS 및 보안 헤더 설정 유틸리티
 * Next.js 16에서 middleware가 deprecated 되었으므로
 * 각 route handler에서 이 함수를 사용하여 헤더를 설정합니다.
 */

// 허용된 오리진 목록
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.AUTH_URL,
  process.env.NEXTAUTH_URL,
  process.env.NEXT_PUBLIC_APP_URL,
  'https://gaeo.allrounder.im',
  'https://gaeoanalysis.vercel.app',
].filter(Boolean) as string[];

/**
 * 응답에 CORS 및 보안 헤더 추가
 */
export function addSecurityHeaders(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  // CORS 설정
  const origin = request.headers.get('origin');
  const requestUrl = request.nextUrl;
  const requestOrigin = requestUrl.origin;
  
  // 같은 origin인 경우 항상 허용
  if (origin === requestOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  } else if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  } else if (!origin) {
    // origin이 없는 경우 (같은 사이트 요청) 허용
    response.headers.set('Access-Control-Allow-Origin', requestOrigin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // 보안 헤더
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // HTTPS 강제 (프로덕션 환경에서만)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Trusted Types 오류 해결을 위한 CSP 헤더 (OAuth 콜백 경로에만)
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    response.headers.set(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://*.googleapis.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: https:",
        "font-src 'self' data: https://fonts.gstatic.com",
        "connect-src 'self' https://accounts.google.com https://*.googleapis.com https://*.google.com https://fonts.googleapis.com",
        "frame-src 'self' https://accounts.google.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests",
      ].join('; ')
    );
    response.headers.set('Permissions-Policy', 'trusted-types=*');
  }

  // API 라우트에 대한 추가 헤더
  if (request.nextUrl.pathname.startsWith('/api')) {
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  return response;
}

/**
 * CORS preflight (OPTIONS) 요청 처리
 */
export function handleCorsPreflight(request: NextRequest): NextResponse | null {
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    return addSecurityHeaders(request, response);
  }
  return null;
}


