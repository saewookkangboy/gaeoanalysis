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

  try {
    // DB 파일 읽기
    if (!existsSync(dbPath)) {
      console.warn('⚠️ [DB Blob] DB 파일이 존재하지 않음:', dbPath);
      return;
    }

    const dbFile = readFileSync(dbPath);
    
    // Blob Storage에 업로드
    await put(BLOB_DB_KEY, dbFile, {
      access: 'public',
      addRandomSuffix: false,
    });

    console.log('✅ [DB Blob] DB 파일 업로드 완료:', {
      size: dbFile.length,
      path: dbPath
    });

    // WAL 파일도 확인 (있는 경우)
    const walPath = `${dbPath}-wal`;
    if (existsSync(walPath)) {
      const walFile = readFileSync(walPath);
      await put(BLOB_DB_WAL_KEY, walFile, {
        access: 'public',
        addRandomSuffix: false,
      });
      console.log('✅ [DB Blob] WAL 파일 업로드 완료');
    }
  } catch (error: any) {
    console.error('❌ [DB Blob] DB 파일 업로드 실패:', error);
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

  try {
    // Blob Storage에서 파일 목록 조회
    const blobs = await list({ prefix: BLOB_DB_KEY });
    
    if (!blobs.blobs || blobs.blobs.length === 0) {
      console.log('ℹ️ [DB Blob] Blob Storage에 DB 파일이 없음 (새 DB 생성)');
      return false;
    }

    // 첫 번째 파일 다운로드
    const blob = blobs.blobs[0];
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
      const walBlobs = await list({ prefix: BLOB_DB_WAL_KEY });
      if (walBlobs.blobs && walBlobs.blobs.length > 0) {
        const walBlob = walBlobs.blobs[0];
        const walResponse = await fetch(walBlob.url);
        if (walResponse.ok) {
          const walFile = await walResponse.arrayBuffer();
          const walPath = `${dbPath}-wal`;
          writeFileSync(walPath, Buffer.from(walFile));
          console.log('✅ [DB Blob] WAL 파일 다운로드 완료');
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
    console.error('❌ [DB Blob] DB 파일 다운로드 실패:', error);
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

  try {
    const blobs = await list({ prefix: BLOB_DB_KEY });
    return blobs.blobs && blobs.blobs.length > 0;
  } catch (error: any) {
    console.error('❌ [DB Blob] Blob Storage 확인 실패:', error);
    return false;
  }
}

