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
 * 연결 풀 설정 (재연결 시 사용)
 */
export function setPool(newPool: Pool | null) {
  pool = newPool;
}

/**
 * 연결 풀 초기화 (재연결 시 사용)
 */
export function resetPool() {
  pool = null;
}

/**
 * PostgreSQL 연결 문자열에서 hostname 추출
 * @param connectionString PostgreSQL 연결 문자열
 * @returns hostname 또는 null
 */
function extractHostname(connectionString: string): string | null {
  if (!connectionString || typeof connectionString !== 'string') {
    return null;
  }
  
  try {
    // PostgreSQL 연결 문자열 형식: postgresql://user:pass@hostname:port/database
    // 또는 postgres://user:pass@hostname:port/database
    const url = new URL(connectionString);
    const hostname = url.hostname;
    
    // hostname이 비어있거나 유효하지 않은 경우
    if (!hostname || hostname === '') {
      return null;
    }
    
    return hostname;
  } catch (error) {
    // URL 파싱 실패 시 정규식으로 추출 시도
    // postgresql://user:pass@hostname:port/db 형식
    // 또는 postgres://user:pass@hostname:port/db 형식
    const patterns = [
      /@([^:/\s@]+):/,  // @hostname: 형식
      /@([^:/\s@]+)\//, // @hostname/ 형식
      /@([^:/\s@]+)$/,  // @hostname (끝)
    ];
    
    for (const pattern of patterns) {
      const match = connectionString.match(pattern);
      if (match && match[1] && match[1] !== '') {
        return match[1];
      }
    }
    
    return null;
  }
}

/**
 * PostgreSQL 연결 풀 초기화
 * Private URL 실패 시 Public URL로 자동 fallback
 */
function initializePostgresPool(): Pool {
  if (pool) {
    return pool;
  }

  // Railway PostgreSQL 연결 정보
  // Railway 환경에서는 Private URL 우선 사용 (egress fees 방지)
  // Vercel 환경에서는 Private URL에 접근할 수 없으므로 Public URL만 사용
  const isRailway = !!process.env.RAILWAY_ENVIRONMENT || !!process.env.RAILWAY;
  const isVercel = !!process.env.VERCEL;
  
  const privateUrl = process.env.DATABASE_URL; // Private URL (Railway 내부)
  const publicUrl = process.env.DATABASE_PUBLIC_URL; // Public URL
  
  if (!privateUrl && !publicUrl) {
    throw new Error('DATABASE_URL 또는 DATABASE_PUBLIC_URL 환경 변수가 설정되지 않았습니다.');
  }
  
  // Vercel 환경에서는 Private URL을 무시하고 Public URL만 사용
  // Railway 환경에서는 Private URL 우선 시도
  let connectionString: string;
  let usePrivateUrl = false;
  
  // 환경 감지 로깅
  console.log('🔍 [PostgreSQL] 환경 감지:', {
    isVercel,
    isRailway,
    hasPrivateUrl: !!privateUrl,
    hasPublicUrl: !!publicUrl,
    privateUrlPreview: privateUrl ? privateUrl.replace(/:[^:@]+@/, ':****@').substring(0, 50) + '...' : 'N/A',
    publicUrlPreview: publicUrl ? publicUrl.replace(/:[^:@]+@/, ':****@').substring(0, 50) + '...' : 'N/A'
  });
  
  if (isVercel) {
    // Vercel 환경에서는 Public URL만 사용 (Private URL에 접근 불가)
    if (!publicUrl) {
      console.error('❌ [PostgreSQL] Vercel 환경에서 DATABASE_PUBLIC_URL이 설정되지 않았습니다.');
      throw new Error('Vercel 환경에서는 DATABASE_PUBLIC_URL이 필요합니다.');
    }
    
    // Public URL의 hostname 확인
    const publicHostname = extractHostname(publicUrl);
    
    if (!publicHostname) {
      // 연결 문자열의 일부를 안전하게 로깅
      const safeUrl = publicUrl.replace(/:[^:@]+@/, ':****@');
      console.error('❌ [PostgreSQL] Vercel 환경에서 Public URL의 hostname을 추출할 수 없습니다:', {
        urlPreview: safeUrl.substring(0, 100),
        urlLength: publicUrl.length,
        urlHasAt: publicUrl.includes('@'),
        message: '연결 문자열 형식이 올바르지 않습니다. 형식: postgresql://user:pass@hostname:port/database'
      });
      throw new Error('DATABASE_PUBLIC_URL의 형식이 올바르지 않습니다. PostgreSQL 연결 문자열 형식을 확인하세요.');
    }
    
    if (publicHostname.includes('railway.internal')) {
      console.error('❌ [PostgreSQL] DATABASE_PUBLIC_URL이 Private URL을 가리키고 있습니다!', {
        hostname: publicHostname,
        message: 'Vercel에서는 Railway의 Private URL(postgres.railway.internal)에 접근할 수 없습니다. Railway 대시보드에서 Public URL을 확인하고 DATABASE_PUBLIC_URL 환경 변수를 업데이트하세요.'
      });
      throw new Error('DATABASE_PUBLIC_URL이 Private URL을 가리키고 있습니다. Railway Public URL을 사용해야 합니다.');
    }
    
    connectionString = publicUrl;
    console.log('✅ [PostgreSQL] Vercel 환경: Public URL 사용', {
      hostname: publicHostname,
      urlPreview: publicUrl.replace(/:[^:@]+@/, ':****@').substring(0, 80)
    });
  } else if (privateUrl && isRailway) {
    // Railway 환경이고 Private URL이 있으면 Private URL 사용 시도
    usePrivateUrl = true;
    connectionString = privateUrl;
    console.log('✅ [PostgreSQL] Railway 환경: Private URL 사용 시도');
  } else if (publicUrl) {
    // 그 외 환경에서는 Public URL 사용
    connectionString = publicUrl;
    console.log('✅ [PostgreSQL] Public URL 사용');
  } else {
    console.error('❌ [PostgreSQL] 사용 가능한 데이터베이스 연결 URL이 없습니다.');
    throw new Error('사용 가능한 데이터베이스 연결 URL이 없습니다.');
  }

  pool = new Pool({
    connectionString,
    // 연결 풀 설정
    max: 20, // 최대 연결 수
    idleTimeoutMillis: 30000, // 30초
    connectionTimeoutMillis: 5000, // 5초 (연결 타임아웃 증가)
    // SSL 연결 (Railway는 SSL 필수)
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  // 연결 오류 처리 - Private URL 실패 시 Public URL로 재시도
  pool.on('error', async (err: any) => {
    console.error('❌ [PostgreSQL] 예상치 못한 클라이언트 오류:', {
      error: err.message,
      code: err.code,
      hostname: err.hostname
    });
    
    // Private URL 연결 실패 시 Public URL로 재시도
    if (usePrivateUrl && publicUrl && (err.code === 'ENOTFOUND' || err.hostname?.includes('railway.internal'))) {
      console.warn('⚠️ [PostgreSQL] Private URL 연결 실패, Public URL로 재시도...');
      try {
        if (pool) {
          await pool.end();
        }
        pool = null;
        
        // Public URL로 재연결
        pool = new Pool({
          connectionString: publicUrl,
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        });
        
        console.log('✅ [PostgreSQL] Public URL로 재연결 완료');
      } catch (retryError) {
        console.error('❌ [PostgreSQL] Public URL 재연결 실패:', retryError);
      }
    }
  });

  // 초기 연결 테스트 (비동기로 실행, 실패해도 풀은 생성됨)
  // Vercel 환경에서는 연결 테스트를 건너뛰고 쿼리 실행 시 재시도 로직에 의존
  if (!isVercel) {
    (async () => {
      if (!pool) return;
      
      try {
        const testResult = await pool.query('SELECT NOW() as now');
        if (testResult.rows.length > 0) {
          if (usePrivateUrl && connectionString && connectionString.includes('railway.internal')) {
            console.log('✅ [PostgreSQL] Private URL 연결 성공 (egress fees 없음)');
          } else if (isRailway && connectionString && connectionString.includes('containers-')) {
            console.warn('⚠️ [PostgreSQL] Public URL 사용 중 (egress fees 발생 가능)');
            console.warn('💡 Railway 환경에서는 Private URL(DATABASE_URL) 사용을 권장합니다.');
          } else {
            console.log('✅ [PostgreSQL] 연결 풀 초기화 완료');
          }
        }
      } catch (testError: any) {
        // Private URL 연결 실패 시 Public URL로 재시도
        if (usePrivateUrl && publicUrl && (testError.code === 'ENOTFOUND' || testError.hostname?.includes('railway.internal'))) {
          console.warn('⚠️ [PostgreSQL] Private URL 연결 테스트 실패, Public URL로 재시도...');
          try {
            if (pool) {
              await pool.end();
            }
            pool = null;
            
            // Public URL로 재연결
            pool = new Pool({
              connectionString: publicUrl,
              max: 20,
              idleTimeoutMillis: 30000,
              connectionTimeoutMillis: 5000,
              ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
            });
            
            // Public URL 연결 테스트
            if (pool) {
              const retryResult = await pool.query('SELECT NOW() as now');
              if (retryResult.rows.length > 0) {
                console.log('✅ [PostgreSQL] Public URL로 재연결 성공');
                console.warn('⚠️ [PostgreSQL] Public URL 사용 중 (egress fees 발생 가능)');
              }
            }
          } catch (retryError) {
            console.error('❌ [PostgreSQL] Public URL 재연결 실패:', retryError);
            // 재연결 실패해도 풀은 유지 (다음 쿼리에서 재시도)
          }
        } else {
          console.error('❌ [PostgreSQL] 연결 테스트 실패:', testError.message);
          // 연결 실패해도 풀은 유지 (다음 쿼리에서 재시도)
        }
      }
    })();
  } else {
    // Vercel 환경에서는 Public URL 사용 확인만 로깅
    console.log('✅ [PostgreSQL] Vercel 환경: Public URL 연결 풀 생성 완료 (쿼리 실행 시 연결 확인)');
  }

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
 * Private URL 연결 실패 시 Public URL로 자동 재시도
 */
export async function query<T extends Record<string, any> = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  let currentPool = getPostgresPool();
  const start = Date.now();
  
  try {
    const result = await currentPool.query<T>(text, params);
    const duration = Date.now() - start;
    
    if (duration > 1000) {
      console.warn(`⚠️ [PostgreSQL] 느린 쿼리 (${duration}ms):`, text.substring(0, 100));
    }
    
    return result;
  } catch (error: any) {
    // 오류 발생 시 즉시 로깅 (재시도 전)
    console.error('❌ [PostgreSQL] 쿼리 오류 발생 (재시도 전):', {
      errorCode: error.code,
      errorMessage: error.message,
      hostname: error.hostname,
      syscall: error.syscall
    });
    // Private URL 연결 실패 시 Public URL로 재시도
    // Vercel 환경에서는 Private URL에 접근할 수 없으므로 항상 Public URL로 재시도
    const isVercel = !!process.env.VERCEL;
    const isRailway = !!process.env.RAILWAY_ENVIRONMENT || !!process.env.RAILWAY;
    const privateUrl = process.env.DATABASE_URL;
    const publicUrl = process.env.DATABASE_PUBLIC_URL;
    
    // ENOTFOUND 오류이고 Public URL이 있으면 재시도
    const isENOTFOUND = error.code === 'ENOTFOUND' || error.hostname?.includes('railway.internal');
    const hasPublicUrl = !!publicUrl;
    const shouldRetry = hasPublicUrl && isENOTFOUND;
    
    // 상세 디버깅 로그
    console.log('🔍 [PostgreSQL] 쿼리 오류 분석:', {
      errorCode: error.code,
      hostname: error.hostname,
      isENOTFOUND,
      hasPublicUrl,
      shouldRetry,
      isVercel,
      isRailway,
      hasPrivateUrl: !!privateUrl,
      currentConnectionString: pool ? 'pool exists' : 'no pool'
    });
    
    if (isENOTFOUND && !shouldRetry) {
      console.error('❌ [PostgreSQL] ENOTFOUND 오류 발생, 재시도 불가:', {
        hasPublicUrl,
        errorCode: error.code,
        hostname: error.hostname,
        isVercel,
        isRailway,
        hasPrivateUrl: !!privateUrl,
        message: 'DATABASE_PUBLIC_URL 환경 변수가 설정되지 않았을 수 있습니다.'
      });
    }
    
    if (shouldRetry) {
      // Public URL의 hostname 확인
      const publicHostname = publicUrl ? extractHostname(publicUrl) : null;
      
      // hostname 추출 실패 시 상세 로깅
      if (!publicHostname && publicUrl) {
        // 연결 문자열의 일부를 안전하게 로깅 (비밀번호 마스킹)
        const safeUrl = publicUrl.replace(/:[^:@]+@/, ':****@');
        const urlLength = publicUrl.length;
        const urlStart = safeUrl.substring(0, 50);
        const urlEnd = safeUrl.length > 50 ? safeUrl.substring(safeUrl.length - 20) : '';
        
        console.error('❌ [PostgreSQL] Public URL에서 hostname을 추출할 수 없습니다:', {
          urlLength,
          urlStart,
          urlEnd,
          urlHasAt: publicUrl.includes('@'),
          urlHasPostgres: publicUrl.includes('postgres'),
          urlHasPostgresql: publicUrl.includes('postgresql'),
          message: '연결 문자열 형식이 올바르지 않을 수 있습니다. 전체 연결 문자열 형식: postgresql://user:pass@hostname:port/database'
        });
        
        // 재시도 불가능하므로 원래 오류를 throw
        throw new Error(`Public URL에서 hostname을 추출할 수 없습니다. 연결 문자열 형식을 확인하세요. (길이: ${urlLength})`);
      }
      
      if (publicHostname?.includes('railway.internal')) {
        console.error('❌ [PostgreSQL] DATABASE_PUBLIC_URL이 Private URL을 가리키고 있습니다!', {
          hostname: publicHostname,
          environment: isVercel ? 'Vercel' : 'Railway',
          message: 'DATABASE_PUBLIC_URL이 Private URL(postgres.railway.internal)을 가리키고 있어 재시도할 수 없습니다. Railway 대시보드에서 Public URL을 확인하고 DATABASE_PUBLIC_URL 환경 변수를 업데이트하세요.'
        });
        // 재시도 불가능하므로 원래 오류를 throw
        throw new Error(`DATABASE_PUBLIC_URL이 Private URL을 가리키고 있습니다. Public URL을 사용해야 합니다. (hostname: ${publicHostname})`);
      }
      
      console.warn('⚠️ [PostgreSQL] Private URL 쿼리 실패, Public URL로 재시도...', {
        environment: isVercel ? 'Vercel' : 'Railway',
        errorCode: error.code,
        hostname: error.hostname,
        publicUrlExists: !!publicUrl,
        publicUrlHostname: publicHostname,
        publicUrlPreview: publicUrl ? publicUrl.replace(/:[^:@]+@/, ':****@').substring(0, 50) + '...' : 'N/A'
      });
      
      try {
        // 기존 풀 종료 및 전역 풀 초기화
        if (currentPool) {
          console.log('🔄 [PostgreSQL] 기존 연결 풀 종료 중...');
          await currentPool.end().catch((endError) => {
            console.warn('⚠️ [PostgreSQL] 기존 풀 종료 중 오류 (무시):', endError.message);
          });
        }
        
        // 전역 풀 변수 초기화 (강제 재초기화)
        resetPool();
        
        // Public URL로 새 풀 생성
        console.log('🔄 [PostgreSQL] Public URL로 새 연결 풀 생성 중...', {
          hostname: publicHostname
        });
        const newPool = new Pool({
          connectionString: publicUrl!,
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        });
        
        // 전역 풀 업데이트 (다음 호출을 위해)
        setPool(newPool);
        
        console.log('✅ [PostgreSQL] Public URL로 재연결 완료, 쿼리 재시도...');
        
        // 재시도
        const retryResult = await newPool.query<T>(text, params);
        const duration = Date.now() - start;
        
        if (duration > 1000) {
          console.warn(`⚠️ [PostgreSQL] 느린 쿼리 (재시도, ${duration}ms):`, text.substring(0, 100));
        }
        
        console.log('✅ [PostgreSQL] 재시도 성공');
        return retryResult;
      } catch (retryError: any) {
        console.error('❌ [PostgreSQL] Public URL 재시도 실패:', {
          query: text.substring(0, 100),
          error: retryError.message,
          errorCode: retryError.code,
          hostname: retryError.hostname
        });
        throw retryError;
      }
    }
    
    console.error('❌ [PostgreSQL] 쿼리 오류:', {
      query: text.substring(0, 100),
      error: error.message,
      code: error.code,
      hostname: error.hostname,
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

