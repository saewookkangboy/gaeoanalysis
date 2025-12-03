import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 프로덕션 환경에서만 보안 헤더 추가
  if (process.env.NODE_ENV === 'production') {
    // 소스맵 접근 차단
    if (request.nextUrl.pathname.endsWith('.map')) {
      return new NextResponse('Not Found', { status: 404 });
    }

    // 개발자 도구 접근 방지 헤더
    response.headers.set('X-Debug-Allowed', 'false');
    response.headers.set('X-Source-Map', 'disabled');
    
    // 추가 보안 헤더
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // 표준 Permissions-Policy만 사용 (debugging, devtools는 표준 기능이 아님)
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

