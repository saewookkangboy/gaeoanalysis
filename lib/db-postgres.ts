/**
 * PostgreSQL 데이터베이스 연결 및 쿼리 헬퍼
 * Railway PostgreSQL 데이터베이스 연결 관리
 */

import { Pool, PoolClient, QueryResult } from 'pg';

// 빌드 타임 감지
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                    process.env.NEXT_PHASE === 'phase-development-build';

let pool: Pool | null = null;

/**
 * PostgreSQL 연결 풀 초기화
 */
function initializePostgresPool(): Pool {
  if (pool) {
    return pool;
  }

  // Railway PostgreSQL 연결 정보
  // Railway 환경에서는 Private URL 우선 사용 (egress fees 방지)
  // 로컬 환경에서는 Public URL 사용 가능
  const isRailway = !!process.env.RAILWAY_ENVIRONMENT || !!process.env.RAILWAY;
  
  let connectionString = process.env.DATABASE_URL; // Private URL (Railway 내부)
  
  // Railway 환경에서 Private URL이 없으면 Public URL 사용 (fallback)
  if (!connectionString && isRailway) {
    connectionString = process.env.DATABASE_PUBLIC_URL;
  }
  
  // 로컬 환경에서는 Public URL도 허용
  if (!connectionString) {
    connectionString = process.env.DATABASE_PUBLIC_URL;
  }
  
  if (!connectionString) {
    throw new Error('DATABASE_URL 또는 DATABASE_PUBLIC_URL 환경 변수가 설정되지 않았습니다.');
  }
  
  // 사용 중인 URL 타입 로깅 (비용 최적화 안내)
  if (isRailway && connectionString.includes('railway.internal')) {
    console.log('✅ [PostgreSQL] Private URL 사용 중 (egress fees 없음)');
  } else if (isRailway && connectionString.includes('containers-')) {
    console.warn('⚠️ [PostgreSQL] Public URL 사용 중 (egress fees 발생 가능)');
    console.warn('💡 Railway 환경에서는 Private URL(DATABASE_URL) 사용을 권장합니다.');
  }

  pool = new Pool({
    connectionString,
    // 연결 풀 설정
    max: 20, // 최대 연결 수
    idleTimeoutMillis: 30000, // 30초
    connectionTimeoutMillis: 2000, // 2초
    // SSL 연결 (Railway는 SSL 필수)
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  // 연결 오류 처리
  pool.on('error', (err) => {
    console.error('❌ [PostgreSQL] 예상치 못한 클라이언트 오류:', err);
  });

  console.log('✅ [PostgreSQL] 연결 풀 초기화 완료');
  return pool;
}

/**
 * PostgreSQL 데이터베이스 연결 가져오기
 */
export function getPostgresPool(): Pool {
  if (isBuildTime) {
    // 빌드 타임에는 더미 객체 반환
    return {} as Pool;
  }

  if (!pool) {
    return initializePostgresPool();
  }

  return pool;
}

/**
 * 쿼리 실행 (Promise 기반)
 */
export async function query<T extends Record<string, any> = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const pool = getPostgresPool();
  const start = Date.now();
  
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    
    if (duration > 1000) {
      console.warn(`⚠️ [PostgreSQL] 느린 쿼리 (${duration}ms):`, text.substring(0, 100));
    }
    
    return result;
  } catch (error: any) {
    console.error('❌ [PostgreSQL] 쿼리 오류:', {
      query: text.substring(0, 100),
      error: error.message,
    });
    throw error;
  }
}

/**
 * 트랜잭션 실행
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPostgresPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 연결 종료
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('✅ [PostgreSQL] 연결 풀 종료 완료');
  }
}

/**
 * 데이터베이스 연결 테스트
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW() as now');
    return result.rows.length > 0;
  } catch (error) {
    console.error('❌ [PostgreSQL] 연결 테스트 실패:', error);
    return false;
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
  try {
    const [usersResult, analysesResult, conversationsResult] = await Promise.all([
      query('SELECT COUNT(*) as count FROM users'),
      query('SELECT COUNT(*) as count FROM analyses'),
      query('SELECT COUNT(*) as count FROM chat_conversations'),
    ]);

    return {
      users: parseInt(usersResult.rows[0].count as string, 10),
      analyses: parseInt(analysesResult.rows[0].count as string, 10),
      conversations: parseInt(conversationsResult.rows[0].count as string, 10),
    };
  } catch (error) {
    console.error('❌ [PostgreSQL] 통계 조회 오류:', error);
    throw error;
  }
}

// 프로세스 종료 시 연결 풀 정리
if (!isBuildTime) {
  process.on('SIGINT', async () => {
    await closePool();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await closePool();
    process.exit(0);
  });
}

