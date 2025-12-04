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
    console.log('💡 Vercel 대시보드에서 Blob Storage 토큰을 확인하세요.');
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

