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

  // GitHub OAuth App 설정 확인 가이드
  const githubGuide = {
    step1: 'GitHub Settings → Developer settings → OAuth Apps로 이동',
    step2: `Authorization callback URL에 다음을 정확히 입력: ${callbackUrls.github}`,
    step3: '주의사항: 프로토콜(http/https), 포트, 경로가 정확히 일치해야 합니다',
    step4: 'Update application 클릭하여 저장',
    step5: '개발 서버 재시작 후 테스트',
    commonMistakes: [
      '마지막에 슬래시(/)를 추가하지 마세요',
      '포트 번호를 포함해야 합니다 (로컬의 경우 :3000)',
      '대소문자를 정확히 맞춰야 합니다',
      'http와 https를 혼동하지 마세요',
    ],
  };

  return NextResponse.json({
    message: 'NextAuth 콜백 URL 정보',
    currentBaseUrl: baseUrl,
    callbackUrls,
    environment: envInfo,
    instructions: {
      github: githubGuide,
      google: {
        step1: 'Google Cloud Console → APIs & Services → Credentials로 이동',
        step2: `승인된 리디렉션 URI에 다음을 추가: ${callbackUrls.google}`,
      },
    },
    troubleshooting: {
      title: '여전히 오류가 발생한다면',
      checks: [
        'GitHub OAuth App의 Authorization callback URL이 위의 callbackUrls.github와 정확히 일치하는지 확인',
        'GitHub OAuth App의 Client ID와 Client Secret이 환경 변수와 일치하는지 확인',
        '개발 서버를 재시작했는지 확인',
        '브라우저 캐시를 지우고 다시 시도',
        'OAuth App 설정을 저장한 후 몇 분 기다렸다가 다시 시도',
      ],
    },
  }, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

