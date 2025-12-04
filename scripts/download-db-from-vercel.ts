/**
 * Vercel Blob Storage에서 DB 파일을 다운로드하는 스크립트
 * Railway나 다른 서버로 마이그레이션할 때 사용
 */

import { downloadDbFromBlob } from '../lib/db-blob';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

async function main() {
  console.log('📥 Vercel Blob Storage에서 DB 파일 다운로드 시작...');
  
  // 다운로드 경로 설정
  const downloadDir = join(process.cwd(), 'backup');
  if (!existsSync(downloadDir)) {
    mkdirSync(downloadDir, { recursive: true });
  }
  
  const dbPath = join(downloadDir, 'gaeo.db');
  
  // Vercel 환경 변수 확인
  if (!process.env.VERCEL_BLOB_READ_WRITE_TOKEN) {
    console.error('❌ VERCEL_BLOB_READ_WRITE_TOKEN 환경 변수가 설정되지 않았습니다.');
    console.log('\n💡 Vercel Blob Storage 토큰을 얻는 방법:');
    console.log('\n방법 1: Vercel 대시보드에서 확인');
    console.log('  1. https://vercel.com/dashboard 접속');
    console.log('  2. 프로젝트 선택 → Settings → Environment Variables');
    console.log('  3. "BLOB_READ_WRITE_TOKEN" 또는 "VERCEL_BLOB_READ_WRITE_TOKEN" 찾기');
    console.log('  4. 값을 복사하여 다음 명령어 실행:');
    console.log('     export VERCEL_BLOB_READ_WRITE_TOKEN="<토큰 값>"');
    console.log('     npm run db:download-from-vercel');
    console.log('\n방법 2: Vercel CLI 사용 (권장)');
    console.log('  1. Vercel CLI 설치: npm i -g vercel');
    console.log('  2. 로그인: vercel login');
    console.log('  3. 프로젝트 링크: vercel link');
    console.log('  4. 환경 변수 자동 로드: vercel env pull .env.local');
    console.log('  5. 스크립트 재실행: npm run db:download-from-vercel');
    console.log('\n방법 3: .env.local 파일에 직접 추가');
    console.log('  .env.local 파일에 다음 추가:');
    console.log('  VERCEL_BLOB_READ_WRITE_TOKEN=<토큰 값>');
    console.log('\n⚠️  참고: Railway로 마이그레이션하는 경우, 기존 DB가 없어도 새로 생성됩니다.');
    console.log('   기존 데이터가 반드시 필요한 경우에만 이 스크립트를 사용하세요.\n');
    process.exit(1);
  }
  
  // 다운로드 실행
  const success = await downloadDbFromBlob(dbPath);
  
  if (success) {
    console.log('✅ DB 파일 다운로드 완료:', dbPath);
    console.log('💡 이 파일을 Railway나 다른 서버의 data 디렉토리에 복사하세요.');
  } else {
    console.error('❌ DB 파일 다운로드 실패');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ 오류 발생:', error);
  process.exit(1);
});

