#!/usr/bin/env node
/**
 * 환경 변수 검증 스크립트
 * 
 * 사용 방법:
 *   npx tsx scripts/check-env.ts
 * 
 * 프로덕션 배포 전에 필수 환경 변수가 모두 설정되어 있는지 확인합니다.
 */

const requiredEnvVars = {
  // NextAuth 필수
  auth: [
    { name: 'AUTH_SECRET', alt: 'NEXTAUTH_SECRET', required: true },
    { name: 'AUTH_URL', alt: 'NEXTAUTH_URL', required: false }, // Vercel에서는 자동 설정
  ],
  
  // Firebase 필수
  firebase: [
    { name: 'NEXT_PUBLIC_FIREBASE_API_KEY', required: true },
    { name: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', required: true },
    { name: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', required: true },
    { name: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', required: true },
    { name: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', required: true },
    { name: 'NEXT_PUBLIC_FIREBASE_APP_ID', required: true },
  ],
  
  // Gemini API 필수
  gemini: [
    { name: 'GEMINI_API_KEY', required: true },
  ],
  
  // OAuth 선택 사항
  oauth: [
    { name: 'GOOGLE_CLIENT_ID', required: false },
    { name: 'GOOGLE_CLIENT_SECRET', required: false },
    { name: 'GITHUB_CLIENT_ID', required: false },
    { name: 'GITHUB_CLIENT_SECRET', required: false },
  ],
};

interface EnvVar {
  name: string;
  alt?: string;
  required: boolean;
}

function checkEnvVar(envVar: EnvVar): { found: boolean; value: string | undefined; source: string } {
  const value = process.env[envVar.name];
  if (value) {
    return { found: true, value, source: envVar.name };
  }
  
  if (envVar.alt) {
    const altValue = process.env[envVar.alt];
    if (altValue) {
      return { found: true, value: altValue, source: envVar.alt };
    }
  }
  
  return { found: false, value: undefined, source: '' };
}

function validateEnvVar(envVar: EnvVar, category: string): boolean {
  const result = checkEnvVar(envVar);
  const status = result.found ? '✅' : (envVar.required ? '❌' : '⚠️');
  const required = envVar.required ? '(필수)' : '(선택)';
  const source = result.found ? ` [${result.source}]` : '';
  
  console.log(`  ${status} ${envVar.name}${envVar.alt ? ` / ${envVar.alt}` : ''} ${required}${source}`);
  
  if (!result.found && envVar.required) {
    return false;
  }
  
  return true;
}

function main() {
  console.log('🔍 환경 변수 검증 시작...\n');
  console.log(`환경: ${process.env.NODE_ENV || 'development'}`);
  console.log(`플랫폼: ${process.env.VERCEL ? 'Vercel' : '로컬'}\n`);
  
  let allValid = true;
  
  // NextAuth 검증
  console.log('📋 NextAuth 설정:');
  requiredEnvVars.auth.forEach(envVar => {
    if (!validateEnvVar(envVar, 'auth')) {
      allValid = false;
    }
  });
  console.log('');
  
  // Firebase 검증
  console.log('🔥 Firebase 설정:');
  requiredEnvVars.firebase.forEach(envVar => {
    if (!validateEnvVar(envVar, 'firebase')) {
      allValid = false;
    }
  });
  console.log('');
  
  // Gemini API 검증
  console.log('🤖 Gemini API 설정:');
  requiredEnvVars.gemini.forEach(envVar => {
    if (!validateEnvVar(envVar, 'gemini')) {
      allValid = false;
    }
  });
  console.log('');
  
  // OAuth 검증 (선택 사항)
  console.log('🔐 OAuth 설정 (선택 사항):');
  const oauthVars = requiredEnvVars.oauth;
  const hasGoogle = checkEnvVar(oauthVars[0]).found && checkEnvVar(oauthVars[1]).found;
  const hasGitHub = checkEnvVar(oauthVars[2]).found && checkEnvVar(oauthVars[3]).found;
  
  oauthVars.forEach(envVar => {
    validateEnvVar(envVar, 'oauth');
  });
  
  if (!hasGoogle && !hasGitHub) {
    console.log('  ⚠️  OAuth 설정이 없습니다. 소셜 로그인 기능이 비활성화됩니다.');
  } else {
    if (hasGoogle) console.log('  ✅ Google OAuth 설정 완료');
    if (hasGitHub) console.log('  ✅ GitHub OAuth 설정 완료');
  }
  console.log('');
  
  // 결과 출력
  console.log('='.repeat(50));
  if (allValid) {
    console.log('✅ 모든 필수 환경 변수가 설정되어 있습니다!');
    console.log('\n💡 다음 단계:');
    console.log('   1. npm run build 로 빌드 테스트');
    console.log('   2. Vercel에 환경 변수 설정 (프로덕션 배포 시)');
    console.log('   3. OAuth 콜백 URL 설정 확인');
    process.exit(0);
  } else {
    console.log('❌ 일부 필수 환경 변수가 누락되었습니다.');
    console.log('\n💡 해결 방법:');
    console.log('   1. .env.local 파일에 누락된 환경 변수 추가');
    console.log('   2. .env.example 파일 참조');
    console.log('   3. 프로덕션 배포 시 Vercel 환경 변수 설정 확인');
    process.exit(1);
  }
}

main();

