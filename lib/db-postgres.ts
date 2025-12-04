/**
 * PostgreSQL 데이터베이스 연결 및 쿼리 헬퍼
 * Railway PostgreSQL 데이터베이스 연결 관리
 */

import { Pool, PoolClient, QueryResult } from 'pg';

// 빌드 타임 감지
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                    process.env.NEXT_PHASE === 'phase-development-build';

let pool: Pool | null = null;
let poolEnding = false; // 연결 풀 종료 중 플래그

/**
 * 연결 풀 설정 (재연결 시 사용)
 */
export function setPool(newPool: Pool | null) {
  pool = newPool;
  poolEnding = false; // 새 풀 설정 시 플래그 리셋
}

/**
 * 연결 풀 초기화 (재연결 시 사용)
 */
export function resetPool() {
  pool = null;
  poolEnding = false; // 풀 리셋 시 플래그 리셋
}

/**
 * 연결 풀 안전하게 종료
 */
async function safeEndPool(poolToEnd: Pool): Promise<void> {
  if (poolEnding) {
    // 이미 종료 중이면 무시
    return;
  }
  
  poolEnding = true;
  try {
    await poolToEnd.end();
  } catch (error: any) {
    // "Called end on pool more than once" 오류는 무시
    if (!error.message?.includes('more than once')) {
      console.warn('⚠️ [PostgreSQL] 연결 풀 종료 중 오류:', error.message);
    }
  } finally {
    poolEnding = false;
  }
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
  
  // 연결 문자열이 hostname만 있는 경우 (프로토콜이 없는 경우)
  // 예: 'postgres-gaeoanalysis.up.railway.app'
  if (!connectionString.includes('://') && !connectionString.includes('@')) {
    // hostname만 있는 경우 그대로 반환
    const trimmed = connectionString.trim();
    if (trimmed && !trimmed.includes(' ') && !trimmed.includes('\n')) {
      return trimmed;
    }
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
 * 연결 문자열을 완전한 PostgreSQL 연결 문자열로 변환
 * hostname만 있는 경우 Railway 개별 환경 변수로부터 연결 문자열 구성 시도
 */
function normalizeConnectionString(connectionString: string, isPublic: boolean = false): string | null {
  if (!connectionString || typeof connectionString !== 'string') {
    return null;
  }
  
  // 이미 완전한 연결 문자열인 경우
  if (connectionString.includes('://') && connectionString.includes('@')) {
    return connectionString;
  }
  
  // hostname:port 형식인 경우 파싱
  let hostname: string | null = null;
  let port: number | null = null;
  
  if (connectionString.includes(':')) {
    // hostname:port 형식
    const parts = connectionString.split(':');
    hostname = parts[0].trim();
    const portStr = parts[1].trim();
    port = parseInt(portStr, 10);
    if (isNaN(port)) {
      port = null;
    }
  } else {
    // hostname만 있는 경우
    hostname = connectionString.trim();
  }
  
  if (!hostname) {
    return null;
  }
  
  // Railway 개별 환경 변수 확인 (PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE)
  const pgHost = process.env.PGHOST || hostname;
  const pgPort = port || parseInt(process.env.PGPORT || '5432', 10);
  const pgUser = process.env.PGUSER || process.env.POSTGRES_USER || 'postgres';
  const pgPassword = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD;
  const pgDatabase = process.env.PGDATABASE || process.env.POSTGRES_DB || 'railway';
  
  // 비밀번호가 없으면 연결할 수 없음
  if (!pgPassword) {
    console.error('❌ [PostgreSQL] 연결 문자열 구성 실패:', {
      hostname,
      port,
      hasPassword: !!pgPassword,
      hasUser: !!pgUser,
      hasDatabase: !!pgDatabase,
      message: 'PGPASSWORD 또는 POSTGRES_PASSWORD 환경 변수가 필요합니다. Railway 대시보드에서 PostgreSQL 서비스의 Variables 탭을 확인하세요.'
    });
    return null;
  }
  
  // 연결 문자열 구성
  const normalizedUrl = `postgresql://${encodeURIComponent(pgUser)}:${encodeURIComponent(pgPassword)}@${pgHost}:${pgPort}/${pgDatabase}`;
  
  console.log('✅ [PostgreSQL] 연결 문자열 구성 완료:', {
    hostname: pgHost,
    port: pgPort,
    user: pgUser,
    database: pgDatabase,
    hasPassword: !!pgPassword,
    urlPreview: normalizedUrl.replace(/:[^:@]+@/, ':****@').substring(0, 80) + '...'
  });
  
  return normalizedUrl;
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
    const errorMsg = 'DATABASE_URL 또는 DATABASE_PUBLIC_URL 환경 변수가 설정되지 않았습니다.';
    console.error('❌ [PostgreSQL] 연결 설정 오류:', {
      message: errorMsg,
      hasPrivateUrl: !!privateUrl,
      hasPublicUrl: !!publicUrl,
      isRailway: isRailway,
      isVercel: isVercel,
      troubleshooting: {
        step1: 'Railway 대시보드에서 PostgreSQL 서비스 확인',
        step2: '서비스 Variables 탭에서 DATABASE_URL 확인',
        step3: '서비스가 "Running" 상태인지 확인',
        step4: '서비스가 다운된 경우 재시작 또는 재생성',
        guide: 'RAILWAY_POSTGRESQL_TROUBLESHOOTING.md 파일 참조'
      }
    });
    throw new Error(errorMsg);
  }
  
  // Vercel 환경에서는 Private URL을 무시하고 Public URL만 사용
  // Railway 환경에서는 Private URL 우선 시도
  let connectionString: string;
  let usePrivateUrl = false;
  
  // 환경 감지 로깅
  const privateUrlPreview = privateUrl ? (privateUrl.includes('://') ? privateUrl.replace(/:[^:@]+@/, ':****@').substring(0, 50) + '...' : privateUrl.substring(0, 50)) : 'N/A';
  const publicUrlPreview = publicUrl ? (publicUrl.includes('://') ? publicUrl.replace(/:[^:@]+@/, ':****@').substring(0, 50) + '...' : publicUrl.substring(0, 50)) : 'N/A';
  
  console.log('🔍 [PostgreSQL] 환경 감지:', {
    isVercel,
    isRailway,
    hasPrivateUrl: !!privateUrl,
    hasPublicUrl: !!publicUrl,
    privateUrlPreview,
    publicUrlPreview,
    privateUrlHasProtocol: privateUrl ? privateUrl.includes('://') : false,
    publicUrlHasProtocol: publicUrl ? publicUrl.includes('://') : false
  });
  
  if (isVercel) {
    // Vercel 환경에서는 Public URL만 사용 (Private URL에 접근 불가)
    if (!publicUrl) {
      console.error('❌ [PostgreSQL] Vercel 환경에서 DATABASE_PUBLIC_URL이 설정되지 않았습니다.');
      throw new Error('Vercel 환경에서는 DATABASE_PUBLIC_URL이 필요합니다.');
    }
    
    // 연결 문자열이 hostname:port 형식인 경우 정규화 시도
    if (!publicUrl.includes('://')) {
      console.log('⚠️ [PostgreSQL] DATABASE_PUBLIC_URL이 hostname:port 형식입니다. 연결 문자열 구성 시도...');
      const normalizedUrl = normalizeConnectionString(publicUrl, true);
      if (normalizedUrl) {
        connectionString = normalizedUrl;
        console.log('✅ [PostgreSQL] Vercel 환경: 정규화된 Public URL 사용');
      } else {
        console.error('❌ [PostgreSQL] DATABASE_PUBLIC_URL 정규화 실패:', {
          publicUrl,
          message: 'Railway 대시보드에서 PostgreSQL 서비스의 Variables 탭을 확인하고, PGPASSWORD 또는 POSTGRES_PASSWORD 환경 변수를 설정하세요. 또는 Connect 탭에서 완전한 Public URL을 복사하여 DATABASE_PUBLIC_URL에 설정하세요.'
        });
        throw new Error('DATABASE_PUBLIC_URL을 정규화할 수 없습니다. Railway 대시보드에서 완전한 연결 문자열을 확인하세요.');
      }
    } else {
      // Public URL의 hostname 확인
      const publicHostname = extractHostname(publicUrl);
      
      if (!publicHostname) {
        // 연결 문자열의 일부를 안전하게 로깅
        const safeUrl = publicUrl.replace(/:[^:@]+@/, ':****@');
        console.error('❌ [PostgreSQL] Vercel 환경에서 Public URL의 hostname을 추출할 수 없습니다:', {
          urlPreview: safeUrl.substring(0, 100),
          urlLength: publicUrl.length,
          urlHasAt: publicUrl.includes('@'),
          urlHasProtocol: publicUrl.includes('://'),
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
    }
  } else if (privateUrl && isRailway) {
    // Railway 환경이고 Private URL이 있으면 Private URL 사용 시도
    // 연결 문자열이 hostname만 있는 경우 정규화 시도
    if (!privateUrl.includes('://')) {
      console.log('⚠️ [PostgreSQL] DATABASE_URL이 hostname만 포함하고 있습니다. 연결 문자열 구성 시도...');
      const normalizedUrl = normalizeConnectionString(privateUrl, false);
      if (normalizedUrl) {
        connectionString = normalizedUrl;
        usePrivateUrl = true;
        console.log('✅ [PostgreSQL] Railway 환경: 정규화된 Private URL 사용');
      } else {
        // 정규화 실패 시 Public URL로 fallback
        console.warn('⚠️ [PostgreSQL] Private URL 정규화 실패, Public URL로 fallback 시도...');
        if (publicUrl) {
          if (!publicUrl.includes('://')) {
            const normalizedPublicUrl = normalizeConnectionString(publicUrl, true);
            if (normalizedPublicUrl) {
              connectionString = normalizedPublicUrl;
              console.log('✅ [PostgreSQL] Railway 환경: 정규화된 Public URL 사용 (Private URL 실패)');
            } else {
              throw new Error('DATABASE_URL과 DATABASE_PUBLIC_URL 모두 정규화할 수 없습니다. Railway 대시보드에서 환경 변수를 확인하세요.');
            }
          } else {
            connectionString = publicUrl;
            console.log('✅ [PostgreSQL] Railway 환경: Public URL 사용 (Private URL 실패)');
          }
        } else {
          throw new Error('DATABASE_URL을 정규화할 수 없고 DATABASE_PUBLIC_URL도 없습니다. Railway 대시보드에서 환경 변수를 확인하세요.');
        }
      }
    } else {
      usePrivateUrl = true;
      connectionString = privateUrl;
      console.log('✅ [PostgreSQL] Railway 환경: Private URL 사용 시도');
    }
  } else if (publicUrl) {
    // 그 외 환경에서는 Public URL 사용
    // 연결 문자열이 hostname:port 형식인 경우 정규화 시도
    if (!publicUrl.includes('://')) {
      console.log('⚠️ [PostgreSQL] DATABASE_PUBLIC_URL이 hostname:port 형식입니다. 연결 문자열 구성 시도...');
      const normalizedUrl = normalizeConnectionString(publicUrl, true);
      if (normalizedUrl) {
        connectionString = normalizedUrl;
        console.log('✅ [PostgreSQL] 정규화된 Public URL 사용');
      } else {
        throw new Error('DATABASE_PUBLIC_URL을 정규화할 수 없습니다. Railway 대시보드에서 완전한 연결 문자열을 확인하세요.');
      }
    } else {
      connectionString = publicUrl;
      console.log('✅ [PostgreSQL] Public URL 사용');
    }
  } else {
    console.error('❌ [PostgreSQL] 사용 가능한 데이터베이스 연결 URL이 없습니다.');
    throw new Error('사용 가능한 데이터베이스 연결 URL이 없습니다.');
  }

  pool = new Pool({
    connectionString,
    // 연결 풀 설정
    max: isVercel ? 5 : 20, // Vercel 서버리스 환경에서는 최대 연결 수 감소 (5개)
    idleTimeoutMillis: 10000, // Vercel 환경에서는 짧은 idle timeout (10초)
    connectionTimeoutMillis: 30000, // 30초 (연결 타임아웃 증가 - ETIMEDOUT 방지)
    // SSL 연결 (Railway는 SSL 필수)
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    // 서버리스 환경 최적화
    allowExitOnIdle: isVercel, // Vercel 환경에서는 idle 시 연결 종료 허용
    // 쿼리 타임아웃 설정 (Vercel 환경)
    statement_timeout: isVercel ? 30000 : undefined, // 30초
    // 연결 유지 설정 (타임아웃 방지)
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  });

  // 연결 오류 처리 - Private URL 실패 시 Public URL로 재시도
  pool.on('error', async (err: any) => {
    const isConnectionError = err.code === 'ETIMEDOUT' || 
                              err.code === 'ENOTFOUND' || 
                              err.message?.includes('timeout') ||
                              err.message?.includes('Connection terminated');
    
    console.error('❌ [PostgreSQL] 예상치 못한 클라이언트 오류:', {
      error: err.message,
      code: err.code,
      hostname: err.hostname,
      syscall: err.syscall,
      isConnectionError,
      troubleshooting: isConnectionError ? {
        step1: 'Railway 대시보드에서 PostgreSQL 서비스 로그 확인',
        step2: '"ERROR (catatonit:2): failed to exec pid1" 오류가 있는지 확인',
        step3: '오류가 있으면 서비스를 재시작하거나 재생성',
        step4: '서비스 상태가 "Running"인지 확인',
        step5: '리소스 사용량 확인 (CPU, Memory)',
        guide: 'RAILWAY_POSTGRESQL_TROUBLESHOOTING.md 파일 참조',
        railwayDashboard: 'https://railway.app'
      } : {
        note: 'Railway PostgreSQL 서비스가 실행 중인지 확인하세요.'
      }
    });
    
    // Private URL 연결 실패 시 Public URL로 재시도
    if (usePrivateUrl && publicUrl && (err.code === 'ENOTFOUND' || err.hostname?.includes('railway.internal'))) {
      console.warn('⚠️ [PostgreSQL] Private URL 연결 실패, Public URL로 재시도...');
      try {
        if (pool) {
          await safeEndPool(pool);
        }
        resetPool();
        
        // Public URL로 재연결
        const isVercelEnv = !!process.env.VERCEL;
        pool = new Pool({
          connectionString: publicUrl,
          max: isVercelEnv ? 5 : 20,
          idleTimeoutMillis: isVercelEnv ? 10000 : 30000,
          connectionTimeoutMillis: 20000,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
          allowExitOnIdle: isVercelEnv,
          statement_timeout: isVercelEnv ? 20000 : undefined,
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
    const newPool = initializePostgresPool();
    // 스키마 초기화 (비동기, 실패해도 계속 진행)
    (async () => {
      try {
        const { ensurePostgresSchema } = await import('./db-postgres-schema');
        await ensurePostgresSchema();
      } catch (error) {
        // 스키마 초기화 실패는 조용히 무시 (테이블이 이미 존재할 수 있음)
        console.warn('⚠️ [PostgreSQL] 스키마 초기화 스킵:', error);
      }
    })();
    return newPool;
  }

  return pool;
}

/**
 * 쿼리 실행 (Promise 기반)
 * Private URL 연결 실패 시 Public URL로 자동 재시도
 * 테이블이 없으면 자동으로 스키마 초기화
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
    // 테이블이 없는 경우 (42P01) 스키마 초기화 시도
    if (error.code === '42P01') {
      console.warn('⚠️ [PostgreSQL] 테이블이 없습니다. 스키마 초기화 시도...', {
        error: error.message,
        table: error.table,
      });
      
      try {
        const { ensurePostgresSchema } = await import('./db-postgres-schema');
        await ensurePostgresSchema();
        
        // 스키마 초기화 후 쿼리 재시도
        console.log('✅ [PostgreSQL] 스키마 초기화 완료, 쿼리 재시도...');
        const retryResult = await currentPool.query<T>(text, params);
        const duration = Date.now() - start;
        
        if (duration > 1000) {
          console.warn(`⚠️ [PostgreSQL] 느린 쿼리 (재시도, ${duration}ms):`, text.substring(0, 100));
        }
        
        return retryResult;
      } catch (schemaError: any) {
        console.error('❌ [PostgreSQL] 스키마 초기화 실패:', {
          error: schemaError.message,
          code: schemaError.code,
        });
        // 스키마 초기화 실패해도 원래 오류를 throw
      }
    }
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
    
    // ENOTFOUND 또는 타임아웃 오류이고 Public URL이 있으면 재시도
    // Vercel 환경에서는 이미 Public URL을 사용 중이므로, 연결 풀 재생성만 시도
    const isENOTFOUND = error.code === 'ENOTFOUND' || error.hostname?.includes('railway.internal');
    const isETIMEDOUT = error.code === 'ETIMEDOUT';
    const isTimeout = isETIMEDOUT || 
                      error.message?.includes('timeout') || 
                      error.message?.includes('Connection terminated') ||
                      error.message?.includes('ETIMEDOUT');
    const hasPublicUrl = !!publicUrl;
    // 모든 타임아웃 오류에 대해 재시도 (Vercel 환경에서는 연결 풀 재생성, 다른 환경에서는 Public URL로 재시도)
    const shouldRetry = hasPublicUrl && (isENOTFOUND || isTimeout);
    
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
      // 재시도 로그는 한 번만 출력 (중복 방지)
      const retryLogKey = `retry_${text.substring(0, 50)}_${Math.floor(Date.now() / 1000)}`; // 초 단위로 그룹화
      const lastRetryLog = (global as any).__lastRetryLog;
      
      // Vercel 환경에서 타임아웃 발생 시 연결 풀 재생성만 시도 (이미 Public URL 사용 중)
      if (isVercel && isTimeout) {
        if (lastRetryLog !== retryLogKey) {
          console.warn('⚠️ [PostgreSQL] Vercel 환경에서 연결 타임아웃 발생, 연결 풀 재생성 시도...', {
            errorCode: error.code,
            errorMessage: error.message,
            isETIMEDOUT,
            publicUrlHostname: publicUrl ? extractHostname(publicUrl) : null
          });
          (global as any).__lastRetryLog = retryLogKey;
        }
      } else {
        if (lastRetryLog !== retryLogKey) {
          console.warn('⚠️ [PostgreSQL] 연결 실패, 재시도 시도...', {
            environment: isVercel ? 'Vercel' : isRailway ? 'Railway' : 'Other',
            errorCode: error.code,
            errorMessage: error.message,
            isETIMEDOUT,
            isENOTFOUND,
            hostname: error.hostname,
            publicUrlExists: hasPublicUrl,
            publicUrlHostname: publicUrl ? extractHostname(publicUrl) : null,
            publicUrlPreview: publicUrl ? publicUrl.replace(/:[^:@]+@/, ':****@').substring(0, 80) + '...' : 'N/A'
          });
          (global as any).__lastRetryLog = retryLogKey;
        }
      }
      
      // Public URL의 hostname 확인
      const publicHostname = publicUrl ? extractHostname(publicUrl) : null;
      
      // hostname 추출 실패 시 상세 로깅 및 재시도 중단
      if (!publicHostname && publicUrl) {
        // 연결 문자열이 hostname만 있는 경우 (프로토콜이 없는 경우)
        if (!publicUrl.includes('://')) {
          console.error('❌ [PostgreSQL] DATABASE_PUBLIC_URL이 hostname만 포함하고 있습니다:', {
            publicUrl,
            message: 'DATABASE_PUBLIC_URL은 완전한 PostgreSQL 연결 문자열이어야 합니다. 형식: postgresql://user:password@hostname:port/database'
          });
          throw new Error('DATABASE_PUBLIC_URL이 완전한 연결 문자열 형식이 아닙니다. Railway 대시보드에서 Public URL을 복사하여 전체 연결 문자열을 설정하세요.');
        }
        
        // 연결 문자열의 일부를 안전하게 로깅 (비밀번호 마스킹)
        const safeUrl = publicUrl.replace(/:[^:@]+@/, ':****@');
        const urlLength = publicUrl.length;
        const urlStart = safeUrl.substring(0, 80);
        const urlEnd = safeUrl.length > 80 ? '...' + safeUrl.substring(safeUrl.length - 30) : '';
        
        // 연결 문자열 구조 분석
        const urlAnalysis = {
          urlLength,
          urlStart,
          urlEnd,
          hasProtocol: publicUrl.startsWith('postgresql://') || publicUrl.startsWith('postgres://'),
          hasAt: publicUrl.includes('@'),
          hasColon: publicUrl.includes(':'),
          hasSlash: publicUrl.includes('/'),
          urlParts: publicUrl.split('@').length,
          firstPart: publicUrl.split('@')[0]?.substring(0, 30),
          afterAt: publicUrl.split('@')[1]?.substring(0, 50)
        };
        
        console.error('❌ [PostgreSQL] Public URL에서 hostname을 추출할 수 없습니다:', {
          ...urlAnalysis,
          message: '연결 문자열 형식이 올바르지 않을 수 있습니다. 전체 연결 문자열 형식: postgresql://user:pass@hostname:port/database'
        });
        
        // 재시도 불가능하므로 원래 오류를 throw
        throw new Error(`Public URL에서 hostname을 추출할 수 없습니다. 연결 문자열 형식을 확인하세요. (길이: ${urlLength}, 프로토콜: ${urlAnalysis.hasProtocol}, @ 포함: ${urlAnalysis.hasAt})`);
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
      
      try {
        // 기존 풀 종료 및 전역 풀 초기화
        if (currentPool && currentPool !== pool) {
          // 현재 사용 중인 풀과 다른 경우에만 종료
          console.log('🔄 [PostgreSQL] 기존 연결 풀 종료 중...');
          await safeEndPool(currentPool);
        }
        
        // 전역 풀 변수 초기화 (강제 재초기화)
        resetPool();
        
        // Public URL로 새 풀 생성
        console.log('🔄 [PostgreSQL] Public URL로 새 연결 풀 생성 중...', {
          hostname: publicHostname
        });
        const isVercelRetry = !!process.env.VERCEL;
        const newPool = new Pool({
          connectionString: publicUrl!,
          max: isVercelRetry ? 5 : 20, // Vercel 환경에서는 더 적은 연결 수 사용
          idleTimeoutMillis: 10000, // Vercel 서버리스 환경에서는 짧은 idle timeout
          connectionTimeoutMillis: 30000, // 연결 타임아웃 증가 (30초) - ETIMEDOUT 방지
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
          allowExitOnIdle: isVercelRetry,
          // 서버리스 환경 최적화
          statement_timeout: isVercelRetry ? 30000 : undefined, // 쿼리 타임아웃 설정 (30초)
          // 연결 재시도 설정
          keepAlive: true,
          keepAliveInitialDelayMillis: 10000,
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
          hostname: retryError.hostname,
          syscall: retryError.syscall,
          troubleshooting: {
            step1: 'Railway 대시보드에서 PostgreSQL 서비스 상태 확인',
            step2: '서비스가 "Running" 상태인지 확인',
            step3: '서비스가 다운된 경우 Railway 대시보드에서 재시작',
            step4: '여전히 문제가 있으면 Railway 지원팀에 문의',
            guide: 'RAILWAY_POSTGRESQL_TROUBLESHOOTING.md 파일 참조'
          }
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

