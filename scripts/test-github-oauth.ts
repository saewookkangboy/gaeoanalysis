/**
 * GitHub OAuth 설정 및 연결 테스트 스크립트
 * 
 * 사용법:
 * npx tsx scripts/test-github-oauth.ts
 * 
 * 이 스크립트는 다음을 확인합니다:
 * 1. 환경 변수 설정 확인
 * 2. GitHub OAuth App 설정 확인 (Callback URL)
 * 3. NextAuth.js 설정 확인
 * 4. OAuth 인증 URL 생성 테스트
 */

// Next.js는 자동으로 .env.local을 로드하므로 별도 로드 불필요
// 환경 변수는 이미 process.env에 로드되어 있음

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function addResult(name: string, passed: boolean, message: string, details?: any) {
  results.push({ name, passed, message, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
  if (details) {
    console.log(`   상세:`, details);
  }
}

async function testGitHubOAuth() {
  console.log('🔍 GitHub OAuth 설정 테스트 시작...\n');

  // 1. 환경 변수 확인
  console.log('📋 1. 환경 변수 확인');
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isDevelopment = nodeEnv === 'development';
  
  const authUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL;
  const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  
  const githubClientId = isDevelopment
    ? (process.env.GITHUB_CLIENT_ID_DEV || process.env.GITHUB_CLIENT_ID)
    : process.env.GITHUB_CLIENT_ID;
  
  const githubClientSecret = isDevelopment
    ? (process.env.GITHUB_CLIENT_SECRET_DEV || process.env.GITHUB_CLIENT_SECRET)
    : process.env.GITHUB_CLIENT_SECRET;

  addResult(
    'NODE_ENV 설정',
    !!nodeEnv,
    nodeEnv || '설정 안됨',
    { value: nodeEnv, isDevelopment }
  );

  addResult(
    'AUTH_URL / NEXTAUTH_URL 설정',
    !!authUrl,
    authUrl || '설정 안됨',
    { 
      authUrl: authUrl || 'N/A',
      expectedDev: 'http://localhost:3000',
      expectedProd: 'https://your-domain.vercel.app'
    }
  );

  addResult(
    'AUTH_SECRET / NEXTAUTH_SECRET 설정',
    !!authSecret,
    authSecret ? '설정됨' : '설정 안됨',
    { 
      hasSecret: !!authSecret,
      length: authSecret?.length || 0,
      minRecommended: 32
    }
  );

  addResult(
    'GitHub Client ID 설정',
    !!githubClientId,
    githubClientId ? '설정됨' : '설정 안됨',
    {
      hasClientId: !!githubClientId,
      envVar: isDevelopment ? 'GITHUB_CLIENT_ID_DEV 또는 GITHUB_CLIENT_ID' : 'GITHUB_CLIENT_ID',
      value: githubClientId ? `${githubClientId.substring(0, 10)}...` : 'N/A'
    }
  );

  addResult(
    'GitHub Client Secret 설정',
    !!githubClientSecret,
    githubClientSecret ? '설정됨' : '설정 안됨',
    {
      hasClientSecret: !!githubClientSecret,
      envVar: isDevelopment ? 'GITHUB_CLIENT_SECRET_DEV 또는 GITHUB_CLIENT_SECRET' : 'GITHUB_CLIENT_SECRET'
    }
  );

  console.log('\n📋 2. Callback URL 확인');
  
  const expectedCallbackUrl = authUrl 
    ? `${authUrl}/api/auth/callback/github`
    : (isDevelopment 
        ? 'http://localhost:3000/api/auth/callback/github'
        : 'https://your-domain.vercel.app/api/auth/callback/github');

  addResult(
    '예상 Callback URL',
    true,
    expectedCallbackUrl,
    {
      callbackUrl: expectedCallbackUrl,
      note: '이 URL이 GitHub OAuth App 설정과 정확히 일치해야 합니다'
    }
  );

  console.log('\n📋 3. NextAuth.js 설정 확인');
  
  // NextAuth.js 설정 파일 확인
  try {
    const authModule = await import('../auth');
    addResult(
      'NextAuth.js 모듈 로드',
      true,
      '성공',
      { hasHandlers: !!authModule.handlers }
    );
  } catch (error: any) {
    addResult(
      'NextAuth.js 모듈 로드',
      false,
      '실패',
      { error: error.message }
    );
  }

  console.log('\n📋 4. OAuth 인증 URL 생성 테스트');
  
  if (githubClientId && authUrl) {
    const authUrlTest = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${encodeURIComponent(expectedCallbackUrl)}&scope=user:email`;
    
    addResult(
      'OAuth 인증 URL 생성',
      true,
      '성공',
      {
        authUrl: authUrlTest.substring(0, 100) + '...',
        note: '이 URL로 브라우저에서 접속하여 로그인을 테스트할 수 있습니다'
      }
    );
  } else {
    addResult(
      'OAuth 인증 URL 생성',
      false,
      'Client ID 또는 AUTH_URL이 없어 생성 불가',
      {}
    );
  }

  console.log('\n📋 5. GitHub OAuth App 설정 체크리스트');
  console.log('다음 항목을 GitHub에서 확인하세요:');
  console.log('1. GitHub Settings → Developer settings → OAuth Apps');
  console.log('2. 사용 중인 OAuth App 선택');
  console.log(`3. Authorization callback URL이 "${expectedCallbackUrl}"과 정확히 일치하는지 확인`);
  console.log('4. Client ID가 환경 변수와 일치하는지 확인');
  console.log('5. Client Secret이 환경 변수와 일치하는지 확인');

  // 결과 요약
  console.log('\n📊 테스트 결과 요약');
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const failed = results.filter(r => !r.passed);
  
  console.log(`✅ 통과: ${passed}/${total}`);
  console.log(`❌ 실패: ${failed.length}/${total}`);
  
  if (failed.length > 0) {
    console.log('\n❌ 실패한 항목:');
    failed.forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
  }

  // 최종 권장 사항
  console.log('\n💡 권장 사항:');
  
  if (!authUrl) {
    console.log('   - AUTH_URL 또는 NEXTAUTH_URL 환경 변수를 설정하세요');
  }
  
  if (!authSecret) {
    console.log('   - AUTH_SECRET 또는 NEXTAUTH_SECRET 환경 변수를 설정하세요');
    console.log('   - 생성 방법: openssl rand -base64 32');
  }
  
  if (!githubClientId) {
    console.log('   - GitHub Client ID를 설정하세요');
    console.log('   - GitHub Settings → Developer settings → OAuth Apps에서 확인');
  }
  
  if (!githubClientSecret) {
    console.log('   - GitHub Client Secret을 설정하세요');
    console.log('   - GitHub Settings → Developer settings → OAuth Apps에서 확인');
  }

  if (authUrl && !authUrl.includes('localhost') && !authUrl.includes('https://')) {
    console.log('   - 프로덕션 환경에서는 AUTH_URL이 https://로 시작해야 합니다');
  }

  if (authSecret && authSecret.length < 32) {
    console.log('   - AUTH_SECRET은 최소 32자 이상 권장됩니다');
  }

  console.log('\n🔗 테스트 방법:');
  console.log('1. 개발 서버 실행: npm run dev');
  console.log(`2. 브라우저에서 ${authUrl || 'http://localhost:3000'}/login 접속`);
  console.log('3. GitHub 로그인 버튼 클릭');
  console.log('4. GitHub 인증 완료 후 리다이렉트 확인');
  console.log('5. 서버 로그에서 다음 메시지 확인:');
  console.log('   - 🔐 [signIn] OAuth 로그인 시도');
  console.log('   - ✅ [signIn] 새 사용자 생성 또는 기존 사용자 로그인');

  return {
    passed: failed.length === 0,
    total,
    passedCount: passed,
    failedCount: failed.length,
    results
  };
}

// 스크립트 실행
testGitHubOAuth()
  .then((summary) => {
    console.log('\n✨ 테스트 완료');
    process.exit(summary.passed ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ 테스트 실행 중 오류 발생:', error);
    process.exit(1);
  });

