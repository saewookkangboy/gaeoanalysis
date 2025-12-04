import { NextRequest, NextResponse } from 'next/server';

/**
 * /admin.html 경로를 /admin으로 리다이렉트
 */
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/admin', request.url));
}

