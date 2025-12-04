/**
 * 데이터베이스 어댑터
 * SQLite와 PostgreSQL을 자동으로 전환하여 사용
 * 환경 변수 DATABASE_URL이 있으면 PostgreSQL, 없으면 SQLite 사용
 */

import db from './db';
import { getPostgresPool, query as postgresQuery, transaction as postgresTransaction } from './db-postgres';

export type DatabaseType = 'sqlite' | 'postgresql';

/**
 * 현재 사용 중인 데이터베이스 타입 확인
 */
export function getDatabaseType(): DatabaseType {
  // Railway PostgreSQL 연결 정보가 있으면 PostgreSQL 사용
  // Private URL 우선, 없으면 Public URL 사용
  if (process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL) {
    return 'postgresql';
  }
  return 'sqlite';
}

/**
 * 데이터베이스 타입이 PostgreSQL인지 확인
 */
export function isPostgreSQL(): boolean {
  return getDatabaseType() === 'postgresql';
}

/**
 * 데이터베이스 타입이 SQLite인지 확인
 */
export function isSQLite(): boolean {
  return getDatabaseType() === 'sqlite';
}

/**
 * 통합 쿼리 인터페이스
 * SQLite와 PostgreSQL 모두 지원
 */
export interface QueryResult<T = any> {
  rows: T[];
  rowCount?: number;
}

/**
 * SQLite와 PostgreSQL을 자동으로 전환하여 쿼리 실행
 */
export async function query<T extends Record<string, any> = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  if (isPostgreSQL()) {
    // PostgreSQL 쿼리 실행
    const result = await postgresQuery<T>(text, params);
    return {
      rows: result.rows,
      rowCount: result.rowCount ?? undefined,
    };
  } else {
    // SQLite 쿼리 실행
    // 파라미터 변환 (PostgreSQL 스타일 $1, $2 -> SQLite ?)
    let sqliteText = text;
    if (params && params.length > 0) {
      // PostgreSQL 스타일 파라미터를 SQLite 스타일로 변환
      sqliteText = text.replace(/\$(\d+)/g, '?');
    }
    
    const stmt = db.prepare(sqliteText);
    const rows = params ? stmt.all(...params) : stmt.all();
    
    return {
      rows: rows as T[],
      rowCount: Array.isArray(rows) ? (rows.length > 0 ? rows.length : undefined) : undefined,
    };
  }
}

/**
 * 통합 트랜잭션 실행
 */
export async function transaction<T>(
  callback: (client: any) => T | Promise<T>
): Promise<T> {
  if (isPostgreSQL()) {
    return postgresTransaction(async (client) => {
      const result = callback(client);
      return result instanceof Promise ? result : Promise.resolve(result);
    });
  } else {
    // SQLite 트랜잭션 (동기 함수)
    // SQLite는 동기 함수이므로, callback이 Promise를 반환하는 경우 처리
    return new Promise<T>((resolve, reject) => {
      try {
        const result = db.transaction(() => {
          const syncResult = callback(db);
          // Promise인 경우 처리 불가 (SQLite 트랜잭션은 동기만 지원)
          if (syncResult instanceof Promise) {
            throw new Error('SQLite transaction does not support async callbacks. Use synchronous operations only.');
          }
          return syncResult;
        })();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }
}

/**
 * Prepared Statement 생성 (SQLite 전용, PostgreSQL은 query 사용)
 */
export function prepare(text: string) {
  if (isPostgreSQL()) {
    // PostgreSQL은 prepared statement를 직접 반환하지 않음
    // 대신 query 함수를 래핑한 함수 반환
    return {
      get: async (params?: any[]) => {
        const result = await query(text, params);
        return result.rows[0] || null;
      },
      all: async (params?: any[]) => {
        const result = await query(text, params);
        return result.rows;
      },
      run: async (params?: any[]) => {
        const result = await query(text, params);
        return { changes: result.rowCount || 0 };
      },
    };
  } else {
    // SQLite prepared statement
    return db.prepare(text);
  }
}

/**
 * 데이터베이스 통계 정보 가져오기
 */
export async function getStats(): Promise<{
  users: number;
  analyses: number;
  conversations: number;
  size?: string;
}> {
  if (isPostgreSQL()) {
    const { getStats: getPostgresStats } = await import('./db-postgres');
    return getPostgresStats();
  } else {
    const { dbHelpers } = await import('./db');
    const stats = dbHelpers.getStats();
    return {
      users: stats.users.count || 0,
      analyses: stats.analyses.count || 0,
      conversations: stats.conversations.count || 0,
      size: stats.dbSize ? `${(stats.dbSize / 1024 / 1024).toFixed(2)} MB` : undefined,
    };
  }
}

/**
 * 데이터베이스 연결 테스트
 */
export async function testConnection(): Promise<boolean> {
  if (isPostgreSQL()) {
    const { testConnection: testPostgresConnection } = await import('./db-postgres');
    return testPostgresConnection();
  } else {
    try {
      db.prepare('SELECT 1').get();
      return true;
    } catch (error) {
      return false;
    }
  }
}

/**
 * 데이터베이스 타입 정보 출력
 */
export function logDatabaseInfo(): void {
  const dbType = getDatabaseType();
  console.log(`📊 [DB Adapter] 데이터베이스 타입: ${dbType.toUpperCase()}`);
  
  if (isPostgreSQL()) {
    console.log('✅ [DB Adapter] PostgreSQL 사용 중 (Railway)');
  } else {
    console.log('✅ [DB Adapter] SQLite 사용 중 (로컬/Vercel)');
  }
}

