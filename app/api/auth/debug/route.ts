import { NextRequest, NextResponse } from 'next/server';

/**
 * NextAuth 콜백 URL 디버깅 엔드포인트
 * GitHub OAuth App 설정 시 필요한 정확한 콜백 URL을 확인할 수 있습니다
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  
  const callbackUrls = {
    google: `${baseUrl}/api/auth/callback/google`,
    github: `${baseUrl}/api/auth/callback/github`,
  };

  const envInfo = {
    AUTH_URL: process.env.AUTH_URL || '설정되지 않음',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || '설정되지 않음',
    NODE_ENV: process.env.NODE_ENV,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ? '설정됨' : '설정되지 않음',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? '설정됨' : '설정되지 않음',
  };

  return NextResponse.json({
    message: 'NextAuth 콜백 URL 정보',
    currentBaseUrl: baseUrl,
    callbackUrls,
    environment: envInfo,
    instructions: {
      github: {
        step1: 'GitHub Settings → Developer settings → OAuth Apps로 이동',
        step2: `Authorization callback URL에 다음을 정확히 입력: ${callbackUrls.github}`,
        step3: '주의사항: 프로토콜(http/https), 포트, 경로가 정확히 일치해야 합니다',
      },
      google: {
        step1: 'Google Cloud Console → APIs & Services → Credentials로 이동',
        step2: `승인된 리디렉션 URI에 다음을 추가: ${callbackUrls.google}`,
      },
    },
  }, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

