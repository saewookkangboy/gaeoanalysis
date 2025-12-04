/**
 * Vercel Blob Storage를 사용한 DB 파일 동기화
 * Vercel 서버리스 환경에서 DB 파일을 영구 저장소에 저장하고 로드
 */

import { put, list, del } from '@vercel/blob';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const BLOB_DB_KEY = 'gaeo-db-file';
const BLOB_DB_WAL_KEY = 'gaeo-db-wal-file';

/**
 * DB 파일을 Blob Storage에 업로드
 */
export async function uploadDbToBlob(dbPath: string): Promise<void> {
  if (!process.env.VERCEL) {
    // 로컬 환경에서는 업로드하지 않음
    return;
  }

  // Railway 환경에서는 Blob Storage 사용하지 않음
  const isRailway = !!process.env.RAILWAY_ENVIRONMENT || !!process.env.RAILWAY;
  if (isRailway) {
    return;
  }

  // Blob Storage 토큰 확인
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.VERCEL_BLOB_READ_WRITE_TOKEN) {
    console.warn('⚠️ [DB Blob] Blob Storage 토큰이 없습니다. Railway로 마이그레이션 중이거나 토큰이 설정되지 않았습니다.');
    return;
  }

  try {
    // DB 파일 읽기
    if (!existsSync(dbPath)) {
      console.warn('⚠️ [DB Blob] DB 파일이 존재하지 않음:', dbPath);
      return;
    }

    const dbFile = readFileSync(dbPath);
    
    // Blob Storage에 업로드 (덮어쓰기 허용)
    // 토큰이 없으면 @vercel/blob이 오류를 던지므로 try-catch로 처리
    const { url } = await put(BLOB_DB_KEY, dbFile, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      token: process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN,
    });

    console.log('✅ [DB Blob] DB 파일 업로드 완료:', {
      size: dbFile.length,
      path: dbPath,
      url: url
    });

    // WAL 파일도 확인 (있는 경우)
    const walPath = `${dbPath}-wal`;
    if (existsSync(walPath)) {
      const walFile = readFileSync(walPath);
      const { url: walUrl } = await put(BLOB_DB_WAL_KEY, walFile, {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        token: process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN,
      });
      console.log('✅ [DB Blob] WAL 파일 업로드 완료:', {
        size: walFile.length,
        url: walUrl
      });
    }
  } catch (error: any) {
    // Blob Storage 토큰 오류는 조용히 무시 (Railway 마이그레이션 중이거나 토큰이 없을 수 있음)
    if (error.message && (
      error.message.includes('No token found') ||
      error.message.includes('BLOB_READ_WRITE_TOKEN') ||
      error.message.includes('token')
    )) {
      // 토큰 오류는 조용히 무시 (경고 메시지도 출력하지 않음)
      return;
    }
    // 다른 오류는 경고로만 출력 (오류로 처리하지 않음)
    console.warn('⚠️ [DB Blob] DB 파일 업로드 실패 (무시됨):', error.message || error);
    // 업로드 실패해도 계속 진행 (로컬 DB 사용)
  }
}

/**
 * Blob Storage에서 DB 파일 다운로드
 */
export async function downloadDbFromBlob(dbPath: string): Promise<boolean> {
  if (!process.env.VERCEL) {
    // 로컬 환경에서는 다운로드하지 않음
    return false;
  }

  // Railway 환경에서는 Blob Storage 사용하지 않음
  const isRailway = !!process.env.RAILWAY_ENVIRONMENT || !!process.env.RAILWAY;
  if (isRailway) {
    return false;
  }

  // Blob Storage 토큰 확인
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.VERCEL_BLOB_READ_WRITE_TOKEN) {
    console.warn('⚠️ [DB Blob] Blob Storage 토큰이 없습니다. Railway로 마이그레이션 중이거나 토큰이 설정되지 않았습니다.');
    return false;
  }

  try {
    // Blob Storage에서 파일 목록 조회 (정확한 파일명 찾기)
    // 토큰이 없으면 @vercel/blob이 오류를 던지므로 try-catch로 처리
    const blobs = await list({ 
      prefix: BLOB_DB_KEY,
      token: process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN,
    });
    
    if (!blobs.blobs || blobs.blobs.length === 0) {
      console.log('ℹ️ [DB Blob] Blob Storage에 DB 파일이 없음 (새 DB 생성)');
      return false;
    }

    // 정확한 파일명과 일치하는 파일 찾기 (또는 가장 최근 파일)
    const exactMatch = blobs.blobs.find(b => b.pathname === BLOB_DB_KEY);
    const blob = exactMatch || blobs.blobs[0]; // 정확한 매치가 없으면 첫 번째 파일 사용
    
    console.log('📥 [DB Blob] DB 파일 다운로드 시도:', {
      pathname: blob.pathname,
      url: blob.url,
      size: blob.size
    });

    const response = await fetch(blob.url);
    if (!response.ok) {
      throw new Error(`Failed to download blob: ${response.statusText}`);
    }

    // DB 파일로 저장
    const dbFile = await response.arrayBuffer();
    writeFileSync(dbPath, Buffer.from(dbFile));

    console.log('✅ [DB Blob] DB 파일 다운로드 완료:', {
      size: dbFile.byteLength,
      path: dbPath
    });

    // WAL 파일도 확인 (있는 경우)
    try {
      const walBlobs = await list({ 
        prefix: BLOB_DB_WAL_KEY,
        token: process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN,
      });
      if (walBlobs.blobs && walBlobs.blobs.length > 0) {
        const exactWalMatch = walBlobs.blobs.find(b => b.pathname === BLOB_DB_WAL_KEY);
        const walBlob = exactWalMatch || walBlobs.blobs[0];
        const walResponse = await fetch(walBlob.url);
        if (walResponse.ok) {
          const walFile = await walResponse.arrayBuffer();
          const walPath = `${dbPath}-wal`;
          writeFileSync(walPath, Buffer.from(walFile));
          console.log('✅ [DB Blob] WAL 파일 다운로드 완료:', {
            size: walFile.byteLength,
            pathname: walBlob.pathname
          });
        }
      }
    } catch (walError) {
      // WAL 파일이 없어도 계속 진행
      console.log('ℹ️ [DB Blob] WAL 파일이 없음 (정상)');
    }

    return true;
  } catch (error: any) {
    if (error.status === 404) {
      console.log('ℹ️ [DB Blob] Blob Storage에 DB 파일이 없음 (새 DB 생성)');
      return false;
    }
    // Blob Storage 토큰 오류는 조용히 무시 (Railway 마이그레이션 중이거나 토큰이 없을 수 있음)
    if (error.message && (
      error.message.includes('No token found') ||
      error.message.includes('BLOB_READ_WRITE_TOKEN') ||
      error.message.includes('token')
    )) {
      // 토큰 오류는 조용히 무시 (경고 메시지도 출력하지 않음)
      return false;
    }
    // 다른 오류는 경고로만 출력
    console.warn('⚠️ [DB Blob] DB 파일 다운로드 실패 (무시됨):', error.message || error);
    return false;
  }
}

/**
 * Blob Storage에 DB 파일이 있는지 확인
 */
export async function checkDbExistsInBlob(): Promise<boolean> {
  if (!process.env.VERCEL) {
    return false;
  }

  // Railway 환경에서는 Blob Storage 사용하지 않음
  const isRailway = !!process.env.RAILWAY_ENVIRONMENT || !!process.env.RAILWAY;
  if (isRailway) {
    return false;
  }

  // Blob Storage 토큰 확인
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.VERCEL_BLOB_READ_WRITE_TOKEN) {
    return false;
  }

  try {
    const blobs = await list({ 
      prefix: BLOB_DB_KEY,
      token: process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN,
    });
    return blobs.blobs && blobs.blobs.length > 0;
  } catch (error: any) {
    // Blob Storage 토큰 오류는 조용히 무시
    if (error.message && (
      error.message.includes('No token found') ||
      error.message.includes('BLOB_READ_WRITE_TOKEN') ||
      error.message.includes('token')
    )) {
      // 토큰 오류는 조용히 무시
      return false;
    }
    // 다른 오류는 경고로만 출력
    console.warn('⚠️ [DB Blob] Blob Storage 확인 실패 (무시됨):', error.message || error);
    return false;
  }
}

