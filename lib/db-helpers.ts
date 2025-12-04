import db, { dbHelpers } from './db';
import { uploadDbToBlob } from './db-blob';
import { query, transaction, prepare, isPostgreSQL, isSQLite } from './db-adapter';

// 통계 헬퍼 함수 (순환 참조 방지를 위해 동적 import)
let statisticsHelpers: any = null;
function getStatisticsHelpers() {
  if (!statisticsHelpers) {
    statisticsHelpers = require('./statistics-helpers');
  }
  return statisticsHelpers;
}

/**
 * 데이터베이스 쿼리 헬퍼 함수들
 */

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

/**
 * 이메일로 분석 이력 조회 (여러 사용자 ID에 걸쳐 조회)
 * PostgreSQL 및 SQLite 모두 지원
 */
export async function getAnalysesByEmail(email: string, options: QueryOptions = {}) {
  const { limit = 10, offset = 0, orderBy = 'created_at', orderDirection = 'DESC' } = options;
  const normalizedEmail = email.toLowerCase().trim();
  
  try {
    // 이메일로 사용자 찾기
    const userStmt = prepare('SELECT id FROM users WHERE LOWER(TRIM(email)) = $1');
    const users = await userStmt.all([normalizedEmail]) as Array<{ id: string }>;
    
    let userIds = users.map(u => u.id);
    
    // 이메일로 사용자를 찾지 못한 경우, 유사한 이메일(같은 사용자명) 찾기
    if (userIds.length === 0) {
      try {
        const emailPrefix = normalizedEmail.split('@')[0]; // @ 앞부분 (사용자명)
        if (emailPrefix) {
          const similarEmailStmt = prepare(`
            SELECT id, email FROM users 
            WHERE LOWER(TRIM(email)) LIKE $1 
            LIMIT 10
          `);
          const similarUsers = await similarEmailStmt.all([`%${emailPrefix}%`]) as Array<{ id: string; email: string }>;
          
          if (similarUsers.length > 0) {
            console.log('🔍 [getAnalysesByEmail] 유사한 이메일 사용자 발견:', {
              searchEmail: normalizedEmail,
              similarUsers: similarUsers.map(u => ({ id: u.id, email: u.email }))
            });
            
            // 유사한 이메일의 사용자 ID도 포함
            userIds = similarUsers.map(u => u.id);
          }
        }
      } catch (error) {
        console.warn('⚠️ [getAnalysesByEmail] 유사한 이메일 검색 오류:', error);
      }
    }
    
    if (userIds.length === 0) {
      console.warn('⚠️ [getAnalysesByEmail] 이메일로 등록된 사용자가 없음:', {
        email: normalizedEmail
      });
      return [];
    }
    
    // PostgreSQL과 SQLite 모두 지원하는 IN 절 생성
    const placeholders = userIds.map((_, i) => `$${i + 1}`).join(',');
    
    // 모든 사용자 ID로 분석 이력 조회
    const queryText = `
      SELECT 
        id, url, aeo_score, geo_score, seo_score, overall_score, 
        insights, chatgpt_score, perplexity_score, gemini_score, claude_score, 
        created_at, user_id
      FROM analyses
      WHERE user_id IN (${placeholders})
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT $${userIds.length + 1} OFFSET $${userIds.length + 2}
    `;
    
    const results = await query(queryText, [...userIds, limit, offset]);
    
    console.log('🔍 [getAnalysesByEmail] 조회 결과:', {
      email: normalizedEmail,
      userIds: userIds,
      resultCount: results.rows.length,
      limit: limit,
      offset: offset
    });
    
    return results.rows.map((row: any) => ({
      id: row.id,
      url: row.url,
      aeoScore: row.aeo_score,
      geoScore: row.geo_score,
      seoScore: row.seo_score,
      overallScore: row.overall_score,
      insights: typeof row.insights === 'string' ? JSON.parse(row.insights) : row.insights,
      aioScores: {
        chatgpt: row.chatgpt_score,
        perplexity: row.perplexity_score,
        gemini: row.gemini_score,
        claude: row.claude_score,
      },
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.error('❌ [getAnalysesByEmail] 쿼리 실행 오류:', {
      email: normalizedEmail,
      error: error
    });
    return [];
  }
}

/**
 * 사용자별 분석 이력 조회 (최적화된 쿼리)
 * PostgreSQL 및 SQLite 모두 지원
 */
export async function getUserAnalyses(userId: string, options: QueryOptions = {}) {
  const { limit = 10, offset = 0, orderBy = 'created_at', orderDirection = 'DESC' } = options;
  
  // SQLite 전용 코드 (PostgreSQL에서는 무시)
  if (isSQLite()) {
    try {
      if (process.env.VERCEL) {
        db.pragma('synchronous = FULL');
      } else {
        const journalMode = db.prepare('PRAGMA journal_mode').get() as { journal_mode: string };
        if (journalMode.journal_mode === 'wal') {
          db.pragma('wal_checkpoint(PASSIVE)');
        }
      }
    } catch (error) {
      console.warn('⚠️ [getUserAnalyses] 동기화 경고:', error);
    }
  }

  try {
    // 디버깅: 사용자 ID 확인
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_DB) {
      const userExists = await getUser(userId);
      if (!userExists) {
        console.warn('⚠️ [getUserAnalyses] 사용자가 존재하지 않음:', { userId });
      }
      
      // 전체 분석 이력 개수 확인 (디버깅용)
      const totalResult = await query('SELECT COUNT(*) as count FROM analyses WHERE user_id = $1', [userId]);
      const totalCount = parseInt(totalResult.rows[0]?.count as string, 10) || 0;
      if (totalCount === 0) {
        // 다른 사용자 ID로 저장되었는지 확인 (디버깅용)
        const allResult = await query('SELECT user_id, COUNT(*) as count FROM analyses GROUP BY user_id LIMIT 10');
        if (allResult.rows.length > 0) {
          console.warn('🔍 [getUserAnalyses] 다른 사용자 ID로 저장된 분석 이력:', {
            requestedUserId: userId,
            otherUserCounts: allResult.rows
          });
        }
      }
    }

    const queryText = `
      SELECT 
        id, url, aeo_score, geo_score, seo_score, overall_score, 
        insights, chatgpt_score, perplexity_score, gemini_score, claude_score, 
        created_at, user_id
      FROM analyses
      WHERE user_id = $1
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT $2 OFFSET $3
    `;

    const results = await query(queryText, [userId, limit, offset]);
    
    // 디버깅: 조회 결과 확인
    if ((process.env.NODE_ENV === 'development' || process.env.DEBUG_DB) && results.rows.length === 0) {
      // user_id가 NULL인 분석 이력 확인
      const nullResult = await query('SELECT COUNT(*) as count FROM analyses WHERE user_id IS NULL');
      const nullCount = parseInt(nullResult.rows[0]?.count as string, 10) || 0;
      if (nullCount > 0) {
        console.warn('⚠️ [getUserAnalyses] user_id가 NULL인 분석 이력 발견:', { count: nullCount });
      }
    }

    return results.rows.map((row: any) => ({
      id: row.id,
      url: row.url,
      aeoScore: row.aeo_score,
      geoScore: row.geo_score,
      seoScore: row.seo_score,
      overallScore: row.overall_score,
      insights: typeof row.insights === 'string' ? JSON.parse(row.insights) : row.insights,
      aioScores: {
        chatgpt: row.chatgpt_score,
        perplexity: row.perplexity_score,
        gemini: row.gemini_score,
        claude: row.claude_score,
      },
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.error('❌ [getUserAnalyses] 쿼리 실행 오류:', {
      userId,
      error: error
    });
    return [];
  }
}

/**
 * 분석 결과 저장 (트랜잭션 사용, 다중 검증 포함)
 * 
 * 저장 프로세스:
 * 1. 트랜잭션 내부에서 저장 및 즉시 확인
 * 2. 트랜잭션 완료 후 재확인
 * 3. Blob Storage 업로드 (Vercel 환경)
 * 4. 최종 재확인
 */
export async function saveAnalysis(data: {
  id: string;
  userId: string;
  url: string;
  aeoScore: number;
  geoScore: number;
  seoScore: number;
  overallScore: number;
  insights: any[];
  aioScores?: {
    chatgpt?: number;
    perplexity?: number;
    gemini?: number;
    claude?: number;
  };
}) {
  // 저장 전 DB 상태 확인 (디버깅용)
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_DB || process.env.VERCEL) {
    try {
      if (isPostgreSQL()) {
        const totalResult = await query('SELECT COUNT(*) as count FROM analyses');
        const userResult = await query('SELECT COUNT(*) as count FROM analyses WHERE user_id = $1', [data.userId]);
        console.log('📊 [saveAnalysis] 저장 전 DB 상태:', {
          totalAnalyses: parseInt(totalResult.rows[0]?.count as string, 10) || 0,
          userAnalyses: parseInt(userResult.rows[0]?.count as string, 10) || 0,
          userId: data.userId,
          analysisId: data.id
        });
      } else {
        const totalAnalysesBefore = db.prepare('SELECT COUNT(*) as count FROM analyses').get() as { count: number };
        const userAnalysesBefore = db.prepare('SELECT COUNT(*) as count FROM analyses WHERE user_id = ?').get(data.userId) as { count: number };
        console.log('📊 [saveAnalysis] 저장 전 DB 상태:', {
          totalAnalyses: totalAnalysesBefore.count,
          userAnalyses: userAnalysesBefore.count,
          userId: data.userId,
          analysisId: data.id
        });
      }
    } catch (error) {
      console.warn('⚠️ [saveAnalysis] 저장 전 상태 확인 실패:', error);
    }
  }

  let result: string;
  let transactionVerified = false;
  let savedUserIdInTransaction = '';
  
  try {
    result = await transaction(async (client) => {
      // 사용자 존재 확인
      let userExistsRow: { id: string; email: string } | null = null;
      
      if (isPostgreSQL()) {
        // PostgreSQL 트랜잭션 내부에서는 클라이언트를 직접 사용
        const userResult = await client.query('SELECT id, email FROM users WHERE id = $1', [data.userId]);
        userExistsRow = userResult.rows[0] as { id: string; email: string } | null;
      } else {
        const userExistsStmt = db.prepare('SELECT id, email FROM users WHERE id = ?');
        userExistsRow = userExistsStmt.get(data.userId) as { id: string; email: string } | undefined || null;
      }
      
      if (!userExistsRow) {
        console.error('❌ [saveAnalysis] 사용자가 존재하지 않음:', {
          userId: data.userId,
          analysisId: data.id,
          url: data.url
        });
        
        // 디버깅: 모든 사용자 확인
        try {
          if (isPostgreSQL()) {
            // 트랜잭션 외부이므로 query 함수 사용 (트랜잭션 클라이언트가 아님)
            const allUsersResult = await query('SELECT id, email FROM users LIMIT 10');
            console.warn('🔍 [saveAnalysis] DB에 존재하는 사용자 목록:', allUsersResult.rows);
          } else {
            const allUsersStmt = db.prepare('SELECT id, email FROM users LIMIT 10');
            const allUsers = allUsersStmt.all() as Array<{ id: string; email: string }>;
            console.warn('🔍 [saveAnalysis] DB에 존재하는 사용자 목록:', allUsers);
          }
        } catch (debugError) {
          console.error('❌ [saveAnalysis] 디버깅 쿼리 오류:', debugError);
        }
        
        throw new Error(`사용자가 존재하지 않습니다: ${data.userId}. 분석을 저장하려면 먼저 로그인하거나 사용자를 생성해야 합니다.`);
      }
      
      console.log('✅ [saveAnalysis] 사용자 확인 완료:', {
        userId: data.userId,
        userEmail: userExistsRow.email,
        analysisId: data.id
      });

      // INSERT 실행
      let insertResult: { changes: number; lastInsertRowid?: number } | null = null;
      
      if (isPostgreSQL()) {
        // PostgreSQL 트랜잭션 내부에서는 클라이언트를 직접 사용
        const insertQuery = `
          INSERT INTO analyses (
            id, user_id, url, aeo_score, geo_score, seo_score, 
            overall_score, insights, chatgpt_score, perplexity_score, 
            gemini_score, claude_score
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `;
        const insertQueryResult = await client.query(insertQuery, [
          data.id,
          data.userId,
          data.url,
          data.aeoScore,
          data.geoScore,
          data.seoScore,
          data.overallScore,
          JSON.stringify(data.insights),
          data.aioScores?.chatgpt || null,
          data.aioScores?.perplexity || null,
          data.aioScores?.gemini || null,
          data.aioScores?.claude || null
        ]);
        insertResult = { changes: insertQueryResult.rowCount || 0 };
      } else {
        const stmt = db.prepare(`
          INSERT INTO analyses (
            id, user_id, url, aeo_score, geo_score, seo_score, 
            overall_score, insights, chatgpt_score, perplexity_score, 
            gemini_score, claude_score
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        insertResult = stmt.run(
          data.id,
          data.userId,
          data.url,
          data.aeoScore,
          data.geoScore,
          data.seoScore,
          data.overallScore,
          JSON.stringify(data.insights),
          data.aioScores?.chatgpt || null,
          data.aioScores?.perplexity || null,
          data.aioScores?.gemini || null,
          data.aioScores?.claude || null
        ) as { changes: number; lastInsertRowid?: number };
      }

      // INSERT 결과 확인
      if (!insertResult || insertResult.changes === 0) {
        console.error('❌ [saveAnalysis] INSERT 실행 실패 (changes = 0):', {
          analysisId: data.id,
          userId: data.userId,
          insertResult: insertResult
        });
        throw new Error('분석 저장 실패: INSERT가 실행되지 않았습니다.');
      }

      console.log('✅ [saveAnalysis] INSERT 실행 성공:', {
        analysisId: data.id,
        changes: insertResult.changes,
        lastInsertRowid: insertResult.lastInsertRowid
      });

      // 저장 후 즉시 확인 (트랜잭션 내부에서)
      let saved: { id: string; user_id: string; url: string } | null = null;
      
      if (isPostgreSQL()) {
        // PostgreSQL 트랜잭션 내부에서는 클라이언트를 직접 사용
        const verifyResult = await client.query('SELECT id, user_id, url FROM analyses WHERE id = $1', [data.id]);
        saved = verifyResult.rows[0] as { id: string; user_id: string; url: string } | null;
      } else {
        const verifyStmt = db.prepare('SELECT id, user_id, url FROM analyses WHERE id = ?');
        saved = verifyStmt.get(data.id) as { id: string; user_id: string; url: string } | undefined || null;
      }
      
      if (!saved) {
        console.error('❌ [saveAnalysis] 저장 후 확인 실패 (트랜잭션 내부):', {
          analysisId: data.id,
          userId: data.userId,
          insertChanges: insertResult.changes
        });
        throw new Error('분석 저장 후 확인 실패: 트랜잭션 내부에서 레코드를 찾을 수 없습니다.');
      }
      
      if (saved.user_id !== data.userId) {
        console.error('❌ [saveAnalysis] 저장된 user_id가 다름:', {
          requestedUserId: data.userId,
          savedUserId: saved.user_id,
          analysisId: data.id
        });
        throw new Error(`저장된 user_id가 다릅니다: ${saved.user_id} !== ${data.userId}`);
      }

      // 저장 후 즉시 DB 상태 확인 (디버깅용)
      if (process.env.NODE_ENV === 'development' || process.env.DEBUG_DB || process.env.VERCEL) {
        try {
          if (isPostgreSQL()) {
            // PostgreSQL 트랜잭션 내부에서는 클라이언트를 직접 사용
            const totalResult = await client.query('SELECT COUNT(*) as count FROM analyses');
            const userResult = await client.query('SELECT COUNT(*) as count FROM analyses WHERE user_id = $1', [data.userId]);
            console.log('📊 [saveAnalysis] 저장 후 DB 상태 (트랜잭션 내부):', {
              totalAnalyses: parseInt(totalResult.rows[0]?.count as string, 10) || 0,
              userAnalyses: parseInt(userResult.rows[0]?.count as string, 10) || 0,
              userId: data.userId,
              analysisId: data.id,
              savedUserId: saved.user_id
            });
          } else {
            const totalAnalysesAfter = db.prepare('SELECT COUNT(*) as count FROM analyses').get() as { count: number };
            const userAnalysesAfter = db.prepare('SELECT COUNT(*) as count FROM analyses WHERE user_id = ?').get(data.userId) as { count: number };
            console.log('📊 [saveAnalysis] 저장 후 DB 상태 (트랜잭션 내부):', {
              totalAnalyses: totalAnalysesAfter.count,
              userAnalyses: userAnalysesAfter.count,
              userId: data.userId,
              analysisId: data.id,
              savedUserId: saved.user_id
            });
          }
        } catch (error) {
          console.warn('⚠️ [saveAnalysis] 저장 후 상태 확인 실패:', error);
        }
      }

      console.log('✅ [saveAnalysis] 분석 저장 성공 (트랜잭션 내부):', {
        analysisId: data.id,
        userId: data.userId,
        url: data.url,
        savedUserId: saved.user_id
      });

      // 트랜잭션 내부에서 저장 확인이 성공했으므로, 저장된 ID와 함께 성공 플래그 반환
      transactionVerified = true;
      savedUserIdInTransaction = saved.user_id;
      return data.id;
    });
  } catch (error: any) {
    console.error('❌ [saveAnalysis] 트랜잭션 오류:', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      userId: data.userId,
      analysisId: data.id,
      url: data.url
    });
    
    // FOREIGN KEY 제약 조건 오류인 경우 사용자 확인
    if (error?.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || error?.code === '23503') {
      const userCheck = await getUser(data.userId);
      console.error('❌ [saveAnalysis] FOREIGN KEY 제약 조건 오류 - 사용자 확인:', {
        userId: data.userId,
        userExists: !!userCheck,
        userEmail: userCheck?.email || 'N/A',
        error: error.message
      });
      
      // 사용자가 없으면 에러 메시지 개선
      if (!userCheck) {
        throw new Error(`사용자가 존재하지 않습니다: ${data.userId}. 분석을 저장하려면 먼저 로그인하거나 사용자를 생성해야 합니다.`);
      }
    }
    
    // 테이블이 없는 경우
    if ((error?.code === 'SQLITE_ERROR' && error.message.includes('no such table')) || 
        (error?.code === '42P01')) {
      console.error('❌ [saveAnalysis] 테이블이 존재하지 않음:', {
        error: error.message,
        userId: data.userId,
        analysisId: data.id
      });
      throw new Error(`데이터베이스 테이블이 초기화되지 않았습니다: ${error.message}`);
    }
    
    throw error;
  }
  
  // 저장 후 최종 확인 (트랜잭션 외부에서)
  // PostgreSQL에서는 트랜잭션 커밋 후 즉시 조회 가능해야 함
  if (transactionVerified) {
    console.log('✅ [saveAnalysis] 트랜잭션 내부 확인 성공, 외부 확인 수행:', {
      analysisId: result,
      userId: data.userId,
      savedUserId: savedUserIdInTransaction
    });
    
    // PostgreSQL에서는 트랜잭션 커밋 후 즉시 조회 가능하도록 보장
    if (isPostgreSQL()) {
      try {
        // 트랜잭션 커밋 후 즉시 조회 (최대 3회 재시도, 각 500ms 대기)
        let finalCheck: { id: string; user_id: string; url: string } | null = null;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (!finalCheck && retryCount < maxRetries) {
          if (retryCount > 0) {
            await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
          }
          
          const finalCheckResult = await query('SELECT id, user_id, url FROM analyses WHERE id = $1', [result]);
          finalCheck = finalCheckResult.rows[0] as { id: string; user_id: string; url: string } | undefined || null;
          
          if (finalCheck) {
            console.log('✅ [saveAnalysis] PostgreSQL 트랜잭션 커밋 후 즉시 조회 성공:', {
              analysisId: result,
              userId: data.userId,
              savedUserId: finalCheck.user_id,
              url: finalCheck.url,
              retryCount: retryCount + 1
            });
            break;
          } else {
            retryCount++;
            if (retryCount < maxRetries) {
              console.warn(`⚠️ [saveAnalysis] PostgreSQL 조회 실패, 재시도 중 (${retryCount}/${maxRetries}):`, {
                analysisId: result,
                userId: data.userId
              });
            }
          }
        }
        
        if (!finalCheck) {
          console.error('❌ [saveAnalysis] PostgreSQL 트랜잭션 커밋 후 조회 실패 (최대 재시도 횟수 초과):', {
            analysisId: result,
            userId: data.userId,
            retryCount
          });
        }
      } catch (error) {
        console.warn('⚠️ [saveAnalysis] PostgreSQL 외부 확인 오류 (트랜잭션 내부 확인 성공으로 저장은 완료됨):', error);
      }
    }
  } else {
    try {
      if (isPostgreSQL()) {
        const finalCheckResult = await query('SELECT id, user_id, url FROM analyses WHERE id = $1', [result]);
        const finalCheck = finalCheckResult.rows[0] as { id: string; user_id: string; url: string } | undefined;
        if (!finalCheck) {
          console.error('❌ [saveAnalysis] 트랜잭션 후 최종 확인 실패:', {
            analysisId: result,
            userId: data.userId
          });
        } else {
          console.log('✅ [saveAnalysis] 트랜잭션 후 최종 확인 성공:', {
            analysisId: result,
            userId: data.userId,
            savedUserId: finalCheck.user_id,
            url: finalCheck.url
          });
        }
      } else {
        const finalCheck = db.prepare('SELECT id, user_id, url FROM analyses WHERE id = ?').get(result) as { id: string; user_id: string; url: string } | undefined;
        if (!finalCheck) {
          console.error('❌ [saveAnalysis] 트랜잭션 후 최종 확인 실패:', {
            analysisId: result,
            userId: data.userId
          });
        } else {
          console.log('✅ [saveAnalysis] 트랜잭션 후 최종 확인 성공:', {
            analysisId: result,
            userId: data.userId,
            savedUserId: finalCheck.user_id,
            url: finalCheck.url
          });
        }
      }
    } catch (error) {
      console.warn('⚠️ [saveAnalysis] 최종 확인 오류:', error);
    }
  }

  // SQLite 전용: 동기화 (PostgreSQL은 불필요)
  if (isSQLite()) {
    try {
      if (process.env.VERCEL) {
        db.pragma('synchronous = FULL');
      } else {
        const journalMode = db.prepare('PRAGMA journal_mode').get() as { journal_mode: string };
        if (journalMode.journal_mode === 'wal') {
          db.pragma('wal_checkpoint(TRUNCATE)');
        }
      }
    } catch (error) {
      console.warn('⚠️ [saveAnalysis] 동기화 경고:', error);
    }
  }

  // Vercel 환경에서만 Blob Storage에 업로드 (동기화하여 저장 보장)
  // Railway나 다른 영구 파일 시스템 환경에서는 불필요
  const isVercel = !!process.env.VERCEL;
  const isRailway = !!process.env.RAILWAY_ENVIRONMENT || !!process.env.RAILWAY;
  if (isVercel && !isRailway) {
    try {
      const { join } = require('path');
      const dbPath = process.env.VERCEL 
        ? '/tmp/gaeo.db' 
        : require('path').join(process.cwd(), 'data', 'gaeo.db');
      
      // 동기적으로 업로드하여 저장 보장 (타임아웃 15초로 증가)
      const uploadPromise = uploadDbToBlob(dbPath);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Blob Storage 업로드 타임아웃')), 15000)
      );
      
      await Promise.race([uploadPromise, timeoutPromise]);
      console.log('✅ [saveAnalysis] Blob Storage 업로드 완료 (동기화됨):', {
        analysisId: result,
        userId: data.userId
      });
      
      // 업로드 후 동기화를 위해 추가 대기 (Vercel 환경)
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error: any) {
      // 업로드 실패해도 로컬 저장은 완료되었으므로 경고만 출력
      console.warn('⚠️ [saveAnalysis] Blob Storage 업로드 실패 (로컬 저장은 완료됨):', {
        error: error.message,
        analysisId: result,
        userId: data.userId
      });
    }
  }
  
  // 저장 후 최종 재확인 (트랜잭션 외부에서, 최대 3회 재시도)
  // 트랜잭션 내부에서 확인이 성공했으면, 외부 확인 실패해도 저장은 완료된 것으로 간주
  let finalVerification = null;
  let verificationAttempts = 0;
  const maxVerificationAttempts = 3;
  
  // 트랜잭션 내부에서 확인이 성공했으면, 외부 확인은 선택적으로만 수행
  if (transactionVerified) {
    console.log('✅ [saveAnalysis] 트랜잭션 내부 확인 성공, 외부 확인은 선택적으로 수행:', {
      analysisId: result,
      userId: data.userId,
      savedUserId: savedUserIdInTransaction
    });
    
    // 트랜잭션 내부 확인이 성공했으면, 외부 확인은 1회만 시도 (성공 여부와 관계없이 저장은 완료된 것으로 간주)
    try {
      finalVerification = db.prepare('SELECT id, user_id, url, created_at FROM analyses WHERE id = ?').get(result) as { 
        id: string; 
        user_id: string; 
        url: string;
        created_at: string;
      } | undefined;
      
      if (finalVerification) {
        console.log('✅ [saveAnalysis] 외부 확인도 성공:', {
          analysisId: result,
          userId: data.userId,
          savedUserId: finalVerification.user_id
        });
      } else {
        console.log('ℹ️ [saveAnalysis] 외부 확인 실패 (트랜잭션 내부 확인 성공으로 저장은 완료됨):', {
          analysisId: result,
          userId: data.userId,
          note: 'Vercel 서버리스 환경에서는 트랜잭션 외부 확인이 실패할 수 있지만, 내부 확인이 성공했으므로 저장은 완료된 것으로 간주합니다.'
        });
      }
    } catch (error) {
      console.warn('⚠️ [saveAnalysis] 외부 확인 오류 (트랜잭션 내부 확인 성공으로 저장은 완료됨):', error);
    }
  } else {
    // 트랜잭션 내부 확인이 실패한 경우에만 재시도
    while (!finalVerification && verificationAttempts < maxVerificationAttempts) {
      verificationAttempts++;
      
      // Vercel 환경에서는 Blob Storage 동기화를 위해 짧은 대기
      if (process.env.VERCEL && verificationAttempts > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * verificationAttempts));
      }
      
      try {
        finalVerification = db.prepare('SELECT id, user_id, url, created_at FROM analyses WHERE id = ?').get(result) as { 
          id: string; 
          user_id: string; 
          url: string;
          created_at: string;
        } | undefined;
        
        if (finalVerification) {
          console.log(`✅ [saveAnalysis] 최종 저장 확인 완료 (시도 ${verificationAttempts}/${maxVerificationAttempts}):`, {
            analysisId: result,
            userId: data.userId,
            savedUserId: finalVerification.user_id,
            url: finalVerification.url,
            createdAt: finalVerification.created_at,
            verified: finalVerification.user_id === data.userId
          });
          break;
        } else if (verificationAttempts < maxVerificationAttempts) {
          console.warn(`⚠️ [saveAnalysis] 최종 저장 확인 실패, 재시도 중 (${verificationAttempts}/${maxVerificationAttempts}):`, {
            analysisId: result,
            userId: data.userId
          });
        }
      } catch (error) {
        console.warn(`⚠️ [saveAnalysis] 최종 확인 오류 (시도 ${verificationAttempts}/${maxVerificationAttempts}):`, error);
      }
    }
    
    if (!finalVerification) {
      console.error('❌ [saveAnalysis] 최종 저장 확인 실패 (최대 재시도 횟수 초과):', {
        analysisId: result,
        userId: data.userId,
        attempts: verificationAttempts
      });
      
      // 디버깅: 전체 분석 목록 확인
      try {
        const allAnalyses = db.prepare('SELECT id, user_id, url, created_at FROM analyses ORDER BY created_at DESC LIMIT 10').all() as Array<{
          id: string;
          user_id: string;
          url: string;
          created_at: string;
        }>;
        console.error('🔍 [saveAnalysis] DB에 존재하는 최근 분석 목록:', allAnalyses);
        
        const userAnalyses = db.prepare('SELECT id, user_id, url, created_at FROM analyses WHERE user_id = ? ORDER BY created_at DESC LIMIT 10').all(data.userId) as Array<{
          id: string;
          user_id: string;
          url: string;
          created_at: string;
        }>;
        console.error('🔍 [saveAnalysis] 사용자별 분석 목록:', {
          userId: data.userId,
          count: userAnalyses.length,
          analyses: userAnalyses
        });
      } catch (debugError) {
        console.error('❌ [saveAnalysis] 디버깅 쿼리 오류:', debugError);
      }
    }
  }
  
  // 통계 및 강화 학습 업데이트 (비동기로 처리하여 응답 속도에 영향 없도록)
  setImmediate(async () => {
    try {
      const { updateAnalysisItemStatistics, updateUserActivityStatistics, updateAnalysisDetailStatistics } = getStatisticsHelpers();
      
      // Agent Lightning: 분석 결과 기반 보상 계산 및 저장
      const { 
        calculateAnalysisReward, 
        saveAnalysisSpan, 
        saveAnalysisRewards, 
        updateLearningMetrics 
      } = require('./analysis-reward-calculator');
      
      // 이전 분석 결과 조회 (개선율 계산용)
      let previousAnalysis = null;
      try {
        const previousStmt = db.prepare(`
          SELECT aeo_score, geo_score, seo_score, overall_score
          FROM analyses
          WHERE user_id = ? AND url = ? AND id != ?
          ORDER BY created_at DESC
          LIMIT 1
        `);
        previousAnalysis = previousStmt.get(data.userId, data.url, data.id) as {
          aeo_score: number;
          geo_score: number;
          seo_score: number;
          overall_score: number;
        } | undefined;
      } catch (error) {
        // 이전 분석이 없어도 계속 진행
      }
      
      // 분석 결과 재구성
      const analysisResult = {
        aeoScore: data.aeoScore,
        geoScore: data.geoScore,
        seoScore: data.seoScore,
        overallScore: data.overallScore,
        insights: data.insights,
        aioAnalysis: data.aioScores ? {
          scores: {
            chatgpt: data.aioScores.chatgpt || 0,
            perplexity: data.aioScores.perplexity || 0,
            gemini: data.aioScores.gemini || 0,
            claude: data.aioScores.claude || 0,
          },
          insights: [],
        } : undefined,
      };
      
      // 보상 계산
      const rewards = calculateAnalysisReward(
        data.id,
        analysisResult,
        previousAnalysis ? {
          aeoScore: previousAnalysis.aeo_score,
          geoScore: previousAnalysis.geo_score,
          seoScore: previousAnalysis.seo_score,
          overallScore: previousAnalysis.overall_score,
        } : undefined
      );
      
      // Span 저장
      const spanId = saveAnalysisSpan(data.id, data.userId, analysisResult, data.url);
      
      // Rewards 저장
      saveAnalysisRewards(spanId, data.id, data.userId, rewards);
      
      // 학습 메트릭 업데이트
      updateLearningMetrics('aeo', rewards.aeo);
      updateLearningMetrics('geo', rewards.geo);
      updateLearningMetrics('seo', rewards.seo);
      if (rewards.aio) {
        updateLearningMetrics('aio', rewards.aio);
      }
      
      console.log('✅ [saveAnalysis] Agent Lightning 보상 계산 및 저장 완료:', {
        analysisId: data.id,
        rewards: {
          aeo: rewards.aeo.reward,
          geo: rewards.geo.reward,
          seo: rewards.seo.reward,
          aio: rewards.aio?.reward,
        },
      });
      
      // 알고리즘 자동 학습 (3단계)
      try {
        const { autoLearnFromAnalysis, learnFromImprovement } = require('./algorithm-auto-learning');
        
        // HTML 재조회 (특징 추출용)
        // 실제로는 분석 시점의 HTML이 필요하지만, 여기서는 URL로 재조회하거나
        // 분석 결과에서 특징을 추출할 수 있는 정보를 활용
        // 간단한 버전: 점수만으로 학습 (향후 HTML 저장 또는 캐시 활용)
        
        // 이전 분석과 비교하여 개선 여부 확인 및 학습
        if (previousAnalysis) {
          learnFromImprovement(
            data.id,
            {
              aeo: data.aeoScore,
              geo: data.geoScore,
              seo: data.seoScore,
            },
            {
              aeo: previousAnalysis.aeo_score,
              geo: previousAnalysis.geo_score,
              seo: previousAnalysis.seo_score,
            }
          );
        }
        
        console.log('✅ [saveAnalysis] 알고리즘 자동 학습 완료');
      } catch (learnError) {
        console.warn('⚠️ [saveAnalysis] 알고리즘 자동 학습 오류 (무시):', learnError);
        // 학습 실패해도 분석 저장은 성공한 것으로 처리
      }
      
      // 통계 업데이트 전 사용자 및 분석 존재 확인
      const userCheck = await getUser(data.userId);
      if (!userCheck) {
        console.warn('⚠️ [saveAnalysis] 통계 업데이트 전 사용자 확인 실패:', {
          userId: data.userId,
          analysisId: data.id
        });
        return; // 사용자가 없으면 통계 업데이트 스킵
      }
      
      const analysisCheck = db.prepare('SELECT id FROM analyses WHERE id = ?').get(data.id) as { id: string } | undefined;
      if (!analysisCheck) {
        console.warn('⚠️ [saveAnalysis] 통계 업데이트 전 분석 확인 실패:', {
          analysisId: data.id,
          userId: data.userId
        });
        return; // 분석이 없으면 통계 업데이트 스킵
      }
        
        // 분석 항목별 통계 업데이트
        updateAnalysisItemStatistics('aeo', data.aeoScore);
        updateAnalysisItemStatistics('geo', data.geoScore);
        updateAnalysisItemStatistics('seo', data.seoScore);
        
        if (data.aioScores) {
          if (data.aioScores.chatgpt !== undefined) {
            updateAnalysisItemStatistics('chatgpt', data.aioScores.chatgpt);
          }
          if (data.aioScores.perplexity !== undefined) {
            updateAnalysisItemStatistics('perplexity', data.aioScores.perplexity);
          }
          if (data.aioScores.gemini !== undefined) {
            updateAnalysisItemStatistics('gemini', data.aioScores.gemini);
          }
          if (data.aioScores.claude !== undefined) {
            updateAnalysisItemStatistics('claude', data.aioScores.claude);
          }
        }
        
        // 사용자 활동 통계 업데이트 (FOREIGN KEY 제약 조건 오류 방지)
        try {
          updateUserActivityStatistics(data.userId, 'analysis', data.overallScore);
        } catch (userStatError: any) {
          if (userStatError?.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
            console.warn('⚠️ [saveAnalysis] 사용자 활동 통계 업데이트 FOREIGN KEY 오류 (사용자 확인 후 재시도):', {
              userId: data.userId,
              error: userStatError.message
            });
            // 사용자 재확인 후 재시도
            const retryUserCheck = await getUser(data.userId);
            if (retryUserCheck) {
              try {
                updateUserActivityStatistics(data.userId, 'analysis', data.overallScore);
              } catch (retryError) {
                console.warn('⚠️ [saveAnalysis] 사용자 활동 통계 업데이트 재시도 실패 (무시):', retryError);
              }
            }
          } else {
            throw userStatError;
          }
        }
        
        // 분석 상세 통계 업데이트 (FOREIGN KEY 제약 조건 오류 방지)
        try {
          updateAnalysisDetailStatistics(data.url, {
            aeoScore: data.aeoScore,
            geoScore: data.geoScore,
            seoScore: data.seoScore,
            overallScore: data.overallScore,
          });
        } catch (detailStatError: any) {
          if (detailStatError?.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
            console.warn('⚠️ [saveAnalysis] 분석 상세 통계 업데이트 FOREIGN KEY 오류 (분석 확인 후 재시도):', {
              analysisId: data.id,
              userId: data.userId,
              error: detailStatError.message
            });
            // 분석 재확인 후 재시도
            const retryAnalysisCheck = db.prepare('SELECT id FROM analyses WHERE id = ?').get(data.id) as { id: string } | undefined;
            if (retryAnalysisCheck) {
              try {
                updateAnalysisDetailStatistics(data.url, {
                  aeoScore: data.aeoScore,
                  geoScore: data.geoScore,
                  seoScore: data.seoScore,
                  overallScore: data.overallScore,
                });
              } catch (retryError) {
                console.warn('⚠️ [saveAnalysis] 분석 상세 통계 업데이트 재시도 실패 (무시):', retryError);
              }
            }
          } else {
            throw detailStatError;
          }
        }
        
        console.log('✅ [saveAnalysis] 통계 업데이트 완료');
      } catch (statError: any) {
        // FOREIGN KEY 제약 조건 오류는 경고만 출력 (분석 저장은 성공)
        if (statError?.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
          console.warn('⚠️ [saveAnalysis] 통계 업데이트 FOREIGN KEY 제약 조건 오류 (무시):', {
            error: statError.message,
            userId: data.userId,
            analysisId: data.id
          });
        } else {
          console.error('❌ [saveAnalysis] 통계 업데이트 오류:', statError);
        }
        // 통계 업데이트 실패해도 분석 저장은 성공한 것으로 처리
      }
  });
  
  return result;
}

/**
 * 채팅 대화 저장 또는 업데이트 (트랜잭션 사용)
 */
export async function saveOrUpdateChatConversation(data: {
  conversationId?: string;
  userId: string;
  analysisId: string | null;
  messages: any[];
}) {
  // chat_conversations 테이블 존재 여부 확인 및 자동 생성
  try {
    if (isSQLite()) {
      const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='chat_conversations'").get() as { name: string } | undefined;
      if (!tableInfo) {
        console.error('❌ [saveOrUpdateChatConversation] chat_conversations 테이블이 존재하지 않음');
        // 테이블이 없으면 자동으로 생성 시도
        try {
          db.exec(`
            CREATE TABLE IF NOT EXISTS chat_conversations (
              id TEXT PRIMARY KEY,
              user_id TEXT,
              analysis_id TEXT,
              messages TEXT NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
              FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_chat_user_id ON chat_conversations(user_id);
            CREATE INDEX IF NOT EXISTS idx_chat_analysis_id ON chat_conversations(analysis_id);
            CREATE INDEX IF NOT EXISTS idx_chat_user_updated ON chat_conversations(user_id, updated_at DESC);
          `);
          console.log('✅ [saveOrUpdateChatConversation] chat_conversations 테이블 자동 생성 완료');
        } catch (createError: any) {
          console.error('❌ [saveOrUpdateChatConversation] 테이블 생성 실패:', createError);
          throw new Error(`데이터베이스 테이블이 초기화되지 않았습니다: ${createError.message}`);
        }
      }
    } else if (isPostgreSQL()) {
      // PostgreSQL 테이블 존재 확인 및 자동 생성
      const tableCheck = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'chat_conversations'
        ) as exists
      `);
      
      if (!tableCheck.rows[0]?.exists) {
        console.warn('⚠️ [saveOrUpdateChatConversation] chat_conversations 테이블이 존재하지 않음, 자동 생성 시도');
        try {
          await query(`
            CREATE TABLE IF NOT EXISTS chat_conversations (
              id TEXT PRIMARY KEY,
              user_id TEXT,
              analysis_id TEXT,
              messages TEXT NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              CONSTRAINT fk_chat_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
              CONSTRAINT fk_chat_analysis FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
            )
          `);
          
          await query(`CREATE INDEX IF NOT EXISTS idx_chat_user_id ON chat_conversations(user_id)`);
          await query(`CREATE INDEX IF NOT EXISTS idx_chat_analysis_id ON chat_conversations(analysis_id)`);
          await query(`CREATE INDEX IF NOT EXISTS idx_chat_user_updated ON chat_conversations(user_id, updated_at DESC)`);
          
          console.log('✅ [saveOrUpdateChatConversation] chat_conversations 테이블 자동 생성 완료');
        } catch (createError: any) {
          console.error('❌ [saveOrUpdateChatConversation] 테이블 생성 실패:', createError);
          throw new Error(`데이터베이스 테이블이 초기화되지 않았습니다: ${createError.message}`);
        }
      }
    }
  } catch (tableCheckError: any) {
    console.error('❌ [saveOrUpdateChatConversation] 테이블 확인 오류:', tableCheckError);
    throw new Error(`데이터베이스 연결 오류: ${tableCheckError.message}`);
  }

  // 저장 전 사용자 존재 확인
  const userCheck = await getUser(data.userId);
  if (!userCheck) {
    console.error('❌ [saveOrUpdateChatConversation] 사용자가 존재하지 않음:', {
      userId: data.userId,
      conversationId: data.conversationId,
      analysisId: data.analysisId
    });
    throw new Error(`사용자가 존재하지 않습니다: ${data.userId}. 대화를 저장하려면 먼저 로그인하거나 사용자를 생성해야 합니다.`);
  }
  
  // analysisId가 제공된 경우 분석 존재 확인
  if (data.analysisId) {
    let analysisCheck: { id: string } | null = null;
    if (isPostgreSQL()) {
      const analysisResult = await query('SELECT id FROM analyses WHERE id = $1', [data.analysisId]);
      analysisCheck = analysisResult.rows[0] as { id: string } | null;
    } else {
      analysisCheck = db.prepare('SELECT id FROM analyses WHERE id = ?').get(data.analysisId) as { id: string } | undefined || null;
    }
    
    if (!analysisCheck) {
      console.warn('⚠️ [saveOrUpdateChatConversation] 분석이 존재하지 않음 (analysisId를 null로 설정):', {
        analysisId: data.analysisId,
        userId: data.userId
      });
      // 분석이 없으면 analysisId를 null로 설정
      data.analysisId = null;
    }
  }
  
  try {
    return await transaction(async (client) => {
      // 기존 대화 확인
      if (data.conversationId) {
        let existing: any = null;
        
        if (isPostgreSQL()) {
          const existingResult = await client.query(
            'SELECT id FROM chat_conversations WHERE id = $1 AND user_id = $2',
            [data.conversationId, data.userId]
          );
          existing = existingResult.rows[0] || null;
        } else {
          existing = db
            .prepare('SELECT id FROM chat_conversations WHERE id = ? AND user_id = ?')
            .get(data.conversationId, data.userId);
        }

        if (existing) {
          // 업데이트
          if (isPostgreSQL()) {
            await client.query(
              `UPDATE chat_conversations
               SET messages = $1, updated_at = CURRENT_TIMESTAMP
               WHERE id = $2 AND user_id = $3`,
              [JSON.stringify(data.messages), data.conversationId, data.userId]
            );
          } else {
            const updateStmt = db.prepare(`
              UPDATE chat_conversations
              SET messages = ?, updated_at = CURRENT_TIMESTAMP
              WHERE id = ? AND user_id = ?
            `);
            updateStmt.run(JSON.stringify(data.messages), data.conversationId, data.userId);
          }
          
          console.log('✅ [saveOrUpdateChatConversation] 기존 대화 업데이트 완료:', {
            conversationId: data.conversationId,
            userId: data.userId
          });
          return data.conversationId;
        }
      }

      // 새 대화 생성
      const { v4: uuidv4 } = require('uuid');
      const conversationId = data.conversationId || uuidv4();

      try {
        if (isPostgreSQL()) {
          await client.query(
            `INSERT INTO chat_conversations (id, user_id, analysis_id, messages)
             VALUES ($1, $2, $3, $4)`,
            [conversationId, data.userId, data.analysisId || null, JSON.stringify(data.messages)]
          );
        } else {
          const insertStmt = db.prepare(`
            INSERT INTO chat_conversations (id, user_id, analysis_id, messages)
            VALUES (?, ?, ?, ?)
          `);
          insertStmt.run(
            conversationId,
            data.userId,
            data.analysisId || null,
            JSON.stringify(data.messages)
          );
        }
        
        console.log('✅ [saveOrUpdateChatConversation] 새 대화 생성 완료:', {
          conversationId: conversationId,
          userId: data.userId,
          analysisId: data.analysisId || null
        });
      } catch (insertError: any) {
        const isForeignKeyError = 
          insertError?.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' ||
          insertError?.code === '23503' || // PostgreSQL foreign key violation
          insertError?.constraint?.includes('foreign');
        
        if (isForeignKeyError) {
          console.error('❌ [saveOrUpdateChatConversation] FOREIGN KEY 제약 조건 오류:', {
            error: insertError.message,
            userId: data.userId,
            analysisId: data.analysisId,
            conversationId: conversationId,
            code: insertError.code
          });
          
          // 사용자 재확인
          const retryUserCheck = await getUser(data.userId);
          if (!retryUserCheck) {
            throw new Error(`사용자가 존재하지 않습니다: ${data.userId}`);
          }
          
          // analysisId가 있으면 재확인
          if (data.analysisId) {
            let retryAnalysisCheck: { id: string } | null = null;
            if (isPostgreSQL()) {
              const analysisResult = await query('SELECT id FROM analyses WHERE id = $1', [data.analysisId]);
              retryAnalysisCheck = analysisResult.rows[0] as { id: string } | null;
            } else {
              retryAnalysisCheck = db.prepare('SELECT id FROM analyses WHERE id = ?').get(data.analysisId) as { id: string } | undefined || null;
            }
            
            if (!retryAnalysisCheck) {
              // analysisId를 null로 설정하고 재시도
              console.warn('⚠️ [saveOrUpdateChatConversation] 분석이 존재하지 않아 analysisId를 null로 설정하고 재시도');
              data.analysisId = null;
              
              if (isPostgreSQL()) {
                await client.query(
                  `INSERT INTO chat_conversations (id, user_id, analysis_id, messages)
                   VALUES ($1, $2, $3, $4)`,
                  [conversationId, data.userId, null, JSON.stringify(data.messages)]
                );
              } else {
                const insertStmt = db.prepare(`
                  INSERT INTO chat_conversations (id, user_id, analysis_id, messages)
                  VALUES (?, ?, ?, ?)
                `);
                insertStmt.run(
                  conversationId,
                  data.userId,
                  null,
                  JSON.stringify(data.messages)
                );
              }
              
              console.log('✅ [saveOrUpdateChatConversation] 재시도 성공 (analysisId 제거):', {
                conversationId: conversationId,
                userId: data.userId
              });
            } else {
              throw insertError; // 분석은 존재하는데 오류가 발생하면 재시도 불가
            }
          } else {
            throw insertError; // analysisId가 null인데 오류가 발생하면 재시도 불가
          }
        } else {
          console.error('❌ [saveOrUpdateChatConversation] INSERT 오류:', {
            error: insertError.message,
            code: insertError.code,
            conversationId: conversationId
          });
          throw insertError;
        }
      }

      // 통계 업데이트 (비동기로 처리)
      setImmediate(async () => {
        try {
          // 통계 업데이트 전 사용자 존재 확인
          const userCheck = await getUser(data.userId);
          if (!userCheck) {
            console.warn('⚠️ [saveOrUpdateChatConversation] 통계 업데이트 전 사용자 확인 실패:', {
              userId: data.userId,
              conversationId: conversationId
            });
            return; // 사용자가 없으면 통계 업데이트 스킵
          }
          
          const { updateUserActivityStatistics } = getStatisticsHelpers();
          
          // FOREIGN KEY 제약 조건 오류 방지
          try {
            updateUserActivityStatistics(data.userId, 'chat');
          } catch (userStatError: any) {
            if (userStatError?.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
              console.warn('⚠️ [saveOrUpdateChatConversation] 사용자 활동 통계 업데이트 FOREIGN KEY 오류 (사용자 확인 후 재시도):', {
                userId: data.userId,
                error: userStatError.message
              });
              // 사용자 재확인 후 재시도
              const retryUserCheck = await getUser(data.userId);
              if (retryUserCheck) {
                try {
                  updateUserActivityStatistics(data.userId, 'chat');
                } catch (retryError) {
                  console.warn('⚠️ [saveOrUpdateChatConversation] 사용자 활동 통계 업데이트 재시도 실패 (무시):', retryError);
                }
              }
            } else {
              throw userStatError;
            }
          }
        } catch (statError: any) {
          // FOREIGN KEY 제약 조건 오류는 경고만 출력 (대화 저장은 성공)
          if (statError?.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
            console.warn('⚠️ [saveOrUpdateChatConversation] 통계 업데이트 FOREIGN KEY 제약 조건 오류 (무시):', {
              error: statError.message,
              userId: data.userId
            });
          } else {
            console.error('❌ [saveOrUpdateChatConversation] 통계 업데이트 오류:', statError);
          }
          // 통계 업데이트 실패해도 대화 저장은 성공한 것으로 처리
        }
      });
      
      return conversationId;
    });
  } catch (transactionError: any) {
    console.error('❌ [saveOrUpdateChatConversation] 트랜잭션 오류:', {
      error: transactionError.message,
      code: transactionError.code,
      stack: transactionError.stack,
      userId: data.userId
    });
    throw new Error(`대화 저장 중 오류가 발생했습니다: ${transactionError.message}`);
  }
}

/**
 * 사용자 정보 조회
 * PostgreSQL 및 SQLite 모두 지원
 */
export async function getUser(userId: string) {
  try {
    // PostgreSQL과 SQLite 모두 updated_at 컬럼이 있으므로 항상 포함
    const queryText = 'SELECT id, email, blog_url, name, image, provider, role, is_active, last_login_at, created_at, updated_at FROM users WHERE id = $1';
    const result = await query(queryText, [userId]);
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    
    return {
      id: row.id,
      email: row.email,
      blogUrl: row.blog_url,
      name: row.name,
      image: row.image,
      provider: row.provider,
      role: row.role,
      isActive: row.is_active,
      lastLoginAt: row.last_login_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
    };
  } catch (error) {
    console.error('❌ [getUser] 쿼리 실행 오류:', { userId, error });
    return null;
  }
}

/**
 * 이메일로 사용자 정보 조회
 * 이메일은 정규화(소문자, 트림)하여 검색
 * PostgreSQL 및 SQLite 모두 지원
 */
export async function getUserByEmail(email: string) {
  // 이메일 정규화 (소문자, 트림) - 일관된 사용자 식별을 위해 중요
  const normalizedEmail = email.toLowerCase().trim();
  
  try {
    // 방법 1: LOWER(TRIM(email))로 검색 (가장 안정적)
    let result = await query(
      'SELECT id, email, blog_url, name, image, provider, role, is_active, last_login_at, created_at, updated_at FROM users WHERE LOWER(TRIM(email)) = $1',
      [normalizedEmail]
    );
    
    // 방법 2: 정규화된 이메일로 직접 검색 (대소문자 차이 대비)
    if (result.rows.length === 0) {
      result = await query(
        'SELECT id, email, blog_url, name, image, provider, role, is_active, last_login_at, created_at, updated_at FROM users WHERE email = $1',
        [normalizedEmail]
      );
    }
    
    // 방법 3: 원본 이메일로도 검색 (정규화되지 않은 경우 대비)
    if (result.rows.length === 0 && email !== normalizedEmail) {
      result = await query(
        'SELECT id, email, blog_url, name, image, provider, role, is_active, last_login_at, created_at, updated_at FROM users WHERE email = $1',
        [email]
      );
    }
    
    // 방법 4: LIKE로 검색 (공백 차이 대비)
    if (result.rows.length === 0) {
      result = await query(
        'SELECT id, email, blog_url, name, image, provider, role, is_active, last_login_at, created_at, updated_at FROM users WHERE LOWER(TRIM(email)) LIKE $1',
        [`%${normalizedEmail}%`]
      );
    }
    
    if (result.rows.length === 0) {
      // 디버깅: 해당 이메일과 유사한 사용자 찾기
      if (process.env.DEBUG_EMAIL_MATCHING) {
        try {
          const debugResult = await query(
            'SELECT id, email FROM users WHERE email LIKE $1 LIMIT 5',
            [`%${normalizedEmail.split('@')[0]}%`]
          );
          if (debugResult.rows.length > 0) {
            console.log('🔍 [getUserByEmail] 유사한 이메일 발견 (디버그 모드):', {
              searchEmail: normalizedEmail,
              similarEmails: debugResult.rows
            });
          }
        } catch (error) {
          // 디버깅 실패는 무시
        }
      }
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      blogUrl: row.blog_url,
      name: row.name,
      image: row.image,
      provider: row.provider,
      role: row.role,
      isActive: row.is_active,
      lastLoginAt: row.last_login_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
    };
  } catch (error) {
    console.error('❌ [getUserByEmail] 쿼리 실행 오류:', { email: normalizedEmail, error });
    return null;
  }
}

/**
 * 사용자 생성 (트랜잭션 사용)
 * 이미 존재하는 경우 무시하고 기존 사용자 ID 반환
 * PostgreSQL 및 SQLite 모두 지원
 */
export async function createUser(data: { 
  id: string; 
  email: string; 
  blogUrl?: string | null;
  name?: string;
  image?: string;
  provider?: string;
}) {
  // SQLite는 트랜잭션 내부에서 비동기 함수를 사용할 수 없으므로 분기 처리
  if (isPostgreSQL()) {
    return await transaction(async (client) => {
    // 이메일 정규화 (소문자, 트림) - 일관된 사용자 식별을 위해 중요
    const normalizedEmail = data.email.toLowerCase().trim();
    
    // 필수 컬럼 존재 여부 확인 및 추가 (SQLite 전용, PostgreSQL은 스키마가 이미 있음)
    if (isSQLite()) {
      try {
        const tableInfo = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
        const columnNames = tableInfo.map(col => col.name);
      
      // provider 컬럼 확인 및 추가
      if (!columnNames.includes('provider')) {
        try {
          db.exec('ALTER TABLE users ADD COLUMN provider TEXT');
          console.log('✅ [createUser] provider 컬럼 추가 완료');
        } catch (alterError: any) {
          if (alterError?.code !== 'SQLITE_ERROR' || !alterError?.message.includes('duplicate column')) {
            console.warn('⚠️ [createUser] provider 컬럼 추가 실패:', alterError);
          }
        }
      }
      
      // name 컬럼 확인 및 추가
      if (!columnNames.includes('name')) {
        try {
          db.exec('ALTER TABLE users ADD COLUMN name TEXT');
          console.log('✅ [createUser] name 컬럼 추가 완료');
        } catch (alterError: any) {
          if (alterError?.code !== 'SQLITE_ERROR' || !alterError?.message.includes('duplicate column')) {
            console.warn('⚠️ [createUser] name 컬럼 추가 실패:', alterError);
          }
        }
      }
      
      // image 컬럼 확인 및 추가
      if (!columnNames.includes('image')) {
        try {
          db.exec('ALTER TABLE users ADD COLUMN image TEXT');
          console.log('✅ [createUser] image 컬럼 추가 완료');
        } catch (alterError: any) {
          if (alterError?.code !== 'SQLITE_ERROR' || !alterError?.message.includes('duplicate column')) {
            console.warn('⚠️ [createUser] image 컬럼 추가 실패:', alterError);
          }
        }
      }
      
      // role 컬럼 확인 및 추가
      if (!columnNames.includes('role')) {
        try {
          db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
          console.log('✅ [createUser] role 컬럼 추가 완료');
        } catch (alterError: any) {
          if (alterError?.code !== 'SQLITE_ERROR' || !alterError?.message.includes('duplicate column')) {
            console.warn('⚠️ [createUser] role 컬럼 추가 실패:', alterError);
          }
        }
      }
      
      // is_active 컬럼 확인 및 추가
      if (!columnNames.includes('is_active')) {
        try {
          db.exec('ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1');
          console.log('✅ [createUser] is_active 컬럼 추가 완료');
        } catch (alterError: any) {
          if (alterError?.code !== 'SQLITE_ERROR' || !alterError?.message.includes('duplicate column')) {
            console.warn('⚠️ [createUser] is_active 컬럼 추가 실패:', alterError);
          }
        }
      }
      
      // last_login_at 컬럼 확인 및 추가
      if (!columnNames.includes('last_login_at')) {
        try {
          db.exec('ALTER TABLE users ADD COLUMN last_login_at DATETIME');
          console.log('✅ [createUser] last_login_at 컬럼 추가 완료');
        } catch (alterError: any) {
          if (alterError?.code !== 'SQLITE_ERROR' || !alterError?.message.includes('duplicate column')) {
            console.warn('⚠️ [createUser] last_login_at 컬럼 추가 실패:', alterError);
          }
        }
      }
      
      // updated_at 컬럼 확인 및 추가
      if (!columnNames.includes('updated_at')) {
        try {
          db.exec('ALTER TABLE users ADD COLUMN updated_at DATETIME');
          // 기존 레코드의 updated_at을 created_at으로 설정
          db.exec('UPDATE users SET updated_at = created_at WHERE updated_at IS NULL');
          console.log('✅ [createUser] updated_at 컬럼 추가 완료');
        } catch (alterError: any) {
          if (alterError?.code !== 'SQLITE_ERROR' || !alterError?.message.includes('duplicate column')) {
            console.warn('⚠️ [createUser] updated_at 컬럼 추가 실패:', alterError);
          }
        }
      }
      } catch (error) {
        console.warn('⚠️ [createUser] 테이블 정보 확인 실패:', error);
      }
    }
    
    // Provider별 사용자 ID로 존재 여부 확인 (provider별 계정 독립성)
    let existingUser: { id: string; email: string; blogUrl?: string; name?: string; image?: string; provider?: string; role?: string; isActive?: boolean; lastLoginAt?: string; createdAt: string; updatedAt: string } | null = null;
    
    if (isPostgreSQL()) {
      // PostgreSQL 트랜잭션 내부에서는 클라이언트를 직접 사용
      const existingResult = await client.query('SELECT id, email, blog_url, name, image, provider, role, is_active, last_login_at, created_at, updated_at FROM users WHERE id = $1', [data.id]);
      if (existingResult.rows.length > 0) {
        const row = existingResult.rows[0];
        existingUser = {
          id: row.id,
          email: row.email,
          blogUrl: row.blog_url,
          name: row.name,
          image: row.image,
          provider: row.provider,
          role: row.role,
          isActive: row.is_active,
          lastLoginAt: row.last_login_at,
          createdAt: row.created_at,
          updatedAt: row.updated_at || row.created_at,
        };
      }
    } else {
      const existingUserStmt = db.prepare('SELECT id, email, blog_url, name, image, provider, role, is_active, last_login_at, created_at, updated_at FROM users WHERE id = ?');
      const existingUserRow = existingUserStmt.get(data.id) as any;
      existingUser = existingUserRow ? {
        id: existingUserRow.id,
        email: existingUserRow.email,
        blogUrl: existingUserRow.blog_url,
        name: existingUserRow.name,
        image: existingUserRow.image,
        provider: existingUserRow.provider,
        role: existingUserRow.role,
        isActive: existingUserRow.is_active,
        lastLoginAt: existingUserRow.last_login_at,
        createdAt: existingUserRow.created_at,
        updatedAt: existingUserRow.updated_at || existingUserRow.created_at,
      } : null;
    }
    
    if (existingUser) {
      console.log('✅ [createUser] Provider별 사용자 이미 존재:', { 
        id: data.id, 
        email: normalizedEmail,
        provider: data.provider 
      });
      
      // 로그인 시간 및 사용자 정보 업데이트 (트랜잭션 내부에서 보장)
      try {
        if (isPostgreSQL()) {
          // PostgreSQL 트랜잭션 내부에서는 클라이언트를 직접 사용
          await client.query(
            `UPDATE users 
             SET last_login_at = CURRENT_TIMESTAMP, 
                 updated_at = CURRENT_TIMESTAMP,
                 name = COALESCE($1, name),
                 image = COALESCE($2, image)
             WHERE id = $3`,
            [data.name || null, data.image || null, data.id]
          );
        } else {
          const tableInfo = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
          const hasLastLoginAt = tableInfo.some(col => col.name === 'last_login_at');
          const hasName = tableInfo.some(col => col.name === 'name');
          const hasImage = tableInfo.some(col => col.name === 'image');
          
          if (hasLastLoginAt && hasName && hasImage) {
            const updateStmt = db.prepare(
              'UPDATE users SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP, name = COALESCE(?, name), image = COALESCE(?, image) WHERE id = ?'
            );
            updateStmt.run(data.name || null, data.image || null, data.id);
          } else if (hasLastLoginAt) {
            const updateStmt = db.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
            updateStmt.run(data.id);
          } else {
            const updateStmt = db.prepare('UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?');
            updateStmt.run(data.id);
          }
        }
        
        console.log('✅ [createUser] 사용자 로그인 시간 업데이트 완료:', {
          userId: data.id,
          email: normalizedEmail,
          provider: data.provider
        });
      } catch (updateError) {
        console.error('❌ [createUser] last_login_at 업데이트 실패:', updateError);
        // 업데이트 실패해도 사용자 ID는 반환 (로그인은 성공)
      }
      return data.id;
    }

    // 기존 사용자 확인: 같은 이메일 + provider 조합으로 확인
    // Provider별로 독립적인 사용자를 만들기 위해 (email, provider) 조합으로 확인
    if (data.provider) {
      // provider 컬럼 존재 여부 재확인 (Vercel 환경 대응)
      try {
        const tableInfo = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
        const columnNames = tableInfo.map(col => col.name);
        if (!columnNames.includes('provider')) {
          db.exec('ALTER TABLE users ADD COLUMN provider TEXT');
          console.log('✅ [createUser] provider 컬럼 추가 완료 (쿼리 실행 전)');
        }
      } catch (error) {
        console.warn('⚠️ [createUser] provider 컬럼 확인 실패:', error);
      }
      
      const providerUserStmt = db.prepare('SELECT id, email, provider FROM users WHERE LOWER(TRIM(email)) = ? AND provider = ?');
      const providerUser = providerUserStmt.get(normalizedEmail, data.provider) as { id: string; email: string; provider: string } | undefined;
      
      if (providerUser) {
        // 같은 Provider로 이미 등록된 사용자가 있음
        // Provider 기반 ID와 일치하는지 확인
        if (providerUser.id === data.id) {
          // Provider 기반 ID와 일치하면 그대로 사용
          console.log('✅ [createUser] Provider 기반 ID로 사용자 확인:', {
            userId: providerUser.id,
            email: normalizedEmail,
            provider: data.provider
          });
        } else {
          // Provider 기반 ID와 일치하지 않으면 ID 마이그레이션 필요
          console.log('🔄 [createUser] Provider별 사용자 ID 마이그레이션 필요:', {
            existingId: providerUser.id,
            providerBasedId: data.id,
            email: normalizedEmail,
            provider: data.provider
          });
          
          // 기존 사용자 ID를 Provider 기반 ID로 마이그레이션
          try {
            // 관련 데이터의 user_id를 새로운 ID로 업데이트
            const updateAnalysesStmt = db.prepare('UPDATE analyses SET user_id = ? WHERE user_id = ?');
            const analysesUpdated = updateAnalysesStmt.run(data.id, providerUser.id);
            
            const updateChatStmt = db.prepare('UPDATE chat_conversations SET user_id = ? WHERE user_id = ?');
            updateChatStmt.run(data.id, providerUser.id);
            
            try {
              const updateAuthLogsStmt = db.prepare('UPDATE auth_logs SET user_id = ? WHERE user_id = ?');
              updateAuthLogsStmt.run(data.id, providerUser.id);
            } catch (e) {
              // auth_logs 테이블이 없을 수 있음
            }
            
            try {
              const updateAIAgentStmt = db.prepare('UPDATE ai_agent_usage SET user_id = ? WHERE user_id = ?');
              updateAIAgentStmt.run(data.id, providerUser.id);
            } catch (e) {
              // ai_agent_usage 테이블이 없을 수 있음
            }
            
            // 기존 사용자 삭제
            const deleteStmt = db.prepare('DELETE FROM users WHERE id = ?');
            deleteStmt.run(providerUser.id);
            
            // 새로운 Provider 기반 ID로 사용자 생성
            const tableInfo = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
            const columnNames = tableInfo.map(col => col.name);
            const hasProvider = columnNames.includes('provider');
            const hasName = columnNames.includes('name');
            const hasImage = columnNames.includes('image');
            const hasLastLoginAt = columnNames.includes('last_login_at');
            
            if (hasProvider && hasName && hasImage) {
              if (hasLastLoginAt) {
                const insertStmt = db.prepare('INSERT INTO users (id, email, blog_url, name, image, provider, last_login_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)');
                insertStmt.run(
                  data.id,
                  normalizedEmail,
                  null,
                  data.name || null,
                  data.image || null,
                  data.provider
                );
              } else {
                const insertStmt = db.prepare('INSERT INTO users (id, email, blog_url, name, image, provider) VALUES (?, ?, ?, ?, ?, ?)');
                insertStmt.run(
                  data.id,
                  normalizedEmail,
                  null,
                  data.name || null,
                  data.image || null,
                  data.provider
                );
              }
            } else {
              const insertStmt = db.prepare('INSERT INTO users (id, email, blog_url) VALUES (?, ?, ?)');
              insertStmt.run(data.id, normalizedEmail, null);
            }
            
            console.log('✅ [createUser] 사용자 ID 마이그레이션 완료:', {
              oldId: providerUser.id,
              newId: data.id,
              analysesUpdated: analysesUpdated.changes
            });
            
            return data.id;
          } catch (migrateError: any) {
            console.error('❌ [createUser] 사용자 ID 마이그레이션 실패, 기존 ID 사용:', migrateError);
            // 마이그레이션 실패 시 기존 ID 사용
            const tableInfo = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
            const hasLastLoginAt = tableInfo.some(col => col.name === 'last_login_at');
            
            if (hasLastLoginAt) {
              const updateStmt = db.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
              updateStmt.run(providerUser.id);
            } else {
              const updateStmt = db.prepare('UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?');
              updateStmt.run(providerUser.id);
            }
            
            return providerUser.id;
          }
        }
        
        // Provider 기반 ID와 일치하는 경우 last_login_at 업데이트
        if (providerUser.id === data.id) {
          try {
            const tableInfo = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
            const hasLastLoginAt = tableInfo.some(col => col.name === 'last_login_at');
            
            if (hasLastLoginAt) {
              const updateStmt = db.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
              updateStmt.run(providerUser.id);
            } else {
              const updateStmt = db.prepare('UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?');
              updateStmt.run(providerUser.id);
            }
          } catch (updateError) {
            console.warn('⚠️ [createUser] last_login_at 업데이트 실패:', updateError);
          }
          
          return providerUser.id;
        }
        // Provider 기반 ID와 일치하지 않으면 마이그레이션 필요
        // 마이그레이션은 아래에서 처리되므로 여기서는 return하지 않음
      }
    }
    
    // 기존 사용자 확인: 같은 이메일이지만 provider가 null인 경우 처리
    // 기존 사용자를 Provider별 사용자로 마이그레이션
    // provider 컬럼 존재 여부 재확인 (Vercel 환경 대응)
    try {
      const tableInfo = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
      const columnNames = tableInfo.map(col => col.name);
      if (!columnNames.includes('provider')) {
        db.exec('ALTER TABLE users ADD COLUMN provider TEXT');
        console.log('✅ [createUser] provider 컬럼 추가 완료 (기존 사용자 확인 전)');
      }
    } catch (error) {
      console.warn('⚠️ [createUser] provider 컬럼 확인 실패:', error);
    }
    
    const emailUserStmt = db.prepare('SELECT id, email, provider FROM users WHERE LOWER(TRIM(email)) = ? AND (provider IS NULL OR provider = ?)');
    const emailUser = emailUserStmt.get(normalizedEmail, '') as { id: string; email: string; provider: string | null } | undefined;
    
    if (emailUser && data.provider) {
      // 기존 사용자의 provider가 null이고, 새로운 Provider로 로그인하는 경우
      // 기존 사용자 ID를 새로운 Provider별 ID로 업데이트
      console.log('🔄 [createUser] 기존 사용자(provider null) 발견, Provider별 사용자로 마이그레이션:', {
        oldId: emailUser.id,
        newId: data.id,
        email: normalizedEmail,
        provider: data.provider
      });
      
      // 기존 사용자의 ID를 새로운 Provider별 ID로 업데이트
      // 외래 키 제약 조건 때문에 관련 데이터(analyses, chat_conversations 등)도 함께 업데이트 필요
      try {
        const tableInfo = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
        const hasLastLoginAt = tableInfo.some(col => col.name === 'last_login_at');
        
        // 1. 관련 데이터의 user_id를 새로운 ID로 업데이트
        // analyses 테이블
        const updateAnalysesStmt = db.prepare('UPDATE analyses SET user_id = ? WHERE user_id = ?');
        updateAnalysesStmt.run(data.id, emailUser.id);
        
        // chat_conversations 테이블
        const updateChatStmt = db.prepare('UPDATE chat_conversations SET user_id = ? WHERE user_id = ?');
        updateChatStmt.run(data.id, emailUser.id);
        
        // auth_logs 테이블
        try {
          const updateAuthLogsStmt = db.prepare('UPDATE auth_logs SET user_id = ? WHERE user_id = ?');
          updateAuthLogsStmt.run(data.id, emailUser.id);
        } catch (e) {
          // auth_logs 테이블이 없을 수 있음
        }
        
        // ai_agent_usage 테이블
        try {
          const updateAIAgentStmt = db.prepare('UPDATE ai_agent_usage SET user_id = ? WHERE user_id = ?');
          updateAIAgentStmt.run(data.id, emailUser.id);
        } catch (e) {
          // ai_agent_usage 테이블이 없을 수 있음
        }
        
        // 2. 기존 사용자 삭제
        const deleteStmt = db.prepare('DELETE FROM users WHERE id = ?');
        deleteStmt.run(emailUser.id);
        
        // 3. 새로운 Provider별 ID로 사용자 생성
        if (hasLastLoginAt) {
          const insertStmt = db.prepare('INSERT INTO users (id, email, blog_url, name, image, provider, last_login_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)');
          insertStmt.run(
            data.id,
            normalizedEmail,
            emailUser.email === normalizedEmail ? null : null, // 기존 사용자의 blog_url은 유지하지 않음
            data.name || null,
            data.image || null,
            data.provider
          );
        } else {
          const insertStmt = db.prepare('INSERT INTO users (id, email, blog_url, name, image, provider) VALUES (?, ?, ?, ?, ?, ?)');
          insertStmt.run(
            data.id,
            normalizedEmail,
            null,
            data.name || null,
            data.image || null,
            data.provider
          );
        }
        
        console.log('✅ [createUser] 기존 사용자 ID를 Provider별 ID로 마이그레이션 완료:', {
          oldUserId: emailUser.id,
          newUserId: data.id,
          provider: data.provider
        });
        
        return data.id;
      } catch (migrateError: any) {
        console.error('❌ [createUser] 사용자 ID 마이그레이션 실패:', migrateError);
        // 마이그레이션 실패 시 기존 사용자의 provider만 업데이트
        try {
          const tableInfo = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
          const hasLastLoginAt = tableInfo.some(col => col.name === 'last_login_at');
          
          if (hasLastLoginAt) {
            const updateStmt = db.prepare('UPDATE users SET provider = ?, name = ?, image = ?, last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
            updateStmt.run(data.provider, data.name || null, data.image || null, emailUser.id);
          } else {
            const updateStmt = db.prepare('UPDATE users SET provider = ?, name = ?, image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
            updateStmt.run(data.provider, data.name || null, data.image || null, emailUser.id);
          }
          
          console.log('✅ [createUser] 기존 사용자 provider 업데이트 완료 (마이그레이션 실패 후):', {
            userId: emailUser.id,
            provider: data.provider
          });
          
          return emailUser.id;
        } catch (updateError: any) {
          console.warn('⚠️ [createUser] 기존 사용자 provider 업데이트 실패, 새 사용자 생성 시도:', updateError);
          // 업데이트 실패 시 새 사용자 생성 계속 진행
        }
      }
    }

    // 새 사용자 생성 (정규화된 이메일 사용)
    try {
      if (isPostgreSQL()) {
        // PostgreSQL 트랜잭션 내부에서는 클라이언트를 직접 사용
        await client.query(
          `INSERT INTO users (id, email, blog_url, name, image, provider, last_login_at, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            data.id,
            normalizedEmail, // 정규화된 이메일 저장
            data.blogUrl || null,
            data.name || null,
            data.image || null,
            data.provider || null
          ]
        );
        
        console.log('✅ [createUser] PostgreSQL 새 사용자 생성 완료:', {
          userId: data.id,
          email: normalizedEmail,
          provider: data.provider
        });
      } else {
        const tableInfo = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
        const columnNames = tableInfo.map(col => col.name);
        
        // provider, name, image, last_login_at 컬럼이 있는지 확인
        const hasProvider = columnNames.includes('provider');
        const hasName = columnNames.includes('name');
        const hasImage = columnNames.includes('image');
        const hasLastLoginAt = columnNames.includes('last_login_at');
        
        // last_login_at 컬럼이 없으면 추가
        if (!hasLastLoginAt) {
          try {
            db.exec('ALTER TABLE users ADD COLUMN last_login_at DATETIME');
            console.log('✅ [createUser] last_login_at 컬럼 추가 완료');
          } catch (alterError: any) {
            if (alterError?.code !== 'SQLITE_ERROR' || !alterError?.message.includes('duplicate column')) {
              console.warn('⚠️ [createUser] last_login_at 컬럼 추가 실패:', alterError);
            }
          }
        }
        
        if (hasProvider && hasName && hasImage) {
          // last_login_at 컬럼 포함 여부에 따라 다른 쿼리 사용
          if (hasLastLoginAt || columnNames.includes('last_login_at')) {
            const stmt = db.prepare('INSERT INTO users (id, email, blog_url, name, image, provider, last_login_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)');
            stmt.run(
              data.id, 
              normalizedEmail, // 정규화된 이메일 저장
              data.blogUrl || null,
              data.name || null,
              data.image || null,
              data.provider || null
            );
          } else {
            // last_login_at이 없으면 제외하고 삽입
            const stmt = db.prepare('INSERT INTO users (id, email, blog_url, name, image, provider) VALUES (?, ?, ?, ?, ?, ?)');
            stmt.run(
              data.id, 
              normalizedEmail, // 정규화된 이메일 저장
              data.blogUrl || null,
              data.name || null,
              data.image || null,
              data.provider || null
            );
          }
        } else {
          const stmt = db.prepare('INSERT INTO users (id, email, blog_url) VALUES (?, ?, ?)');
          stmt.run(data.id, normalizedEmail, data.blogUrl || null); // 정규화된 이메일 저장
        }
      }
      
      console.log('✅ [createUser] 새 사용자 생성 완료:', {
        userId: data.id,
        email: normalizedEmail,
        provider: data.provider
      });
      
      return data.id;
    } catch (error: any) {
      // UNIQUE 제약 조건 오류인 경우 (동시성 문제 또는 email UNIQUE 제약)
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.code === '23505') {
        // 다시 확인 (Provider별 사용자 ID로만 확인)
        // 트랜잭션 내부에서는 직접 쿼리 사용
        const retryUserStmt = db.prepare('SELECT id FROM users WHERE id = ?');
        const retryUserRow = retryUserStmt.get(data.id) as { id: string } | undefined;
        if (retryUserRow) {
          return data.id;
        }
        
        // email UNIQUE 제약 조건 오류인 경우: 같은 Provider로 이미 등록된 사용자 확인
        if (data.provider) {
          // provider 컬럼 존재 여부 재확인 (Vercel 환경 대응)
          try {
            const tableInfo = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
            const columnNames = tableInfo.map(col => col.name);
            if (!columnNames.includes('provider')) {
              db.exec('ALTER TABLE users ADD COLUMN provider TEXT');
              console.log('✅ [createUser] provider 컬럼 추가 완료 (재시도 전)');
            }
          } catch (error) {
            console.warn('⚠️ [createUser] provider 컬럼 확인 실패:', error);
          }
          
          const retryProviderUserStmt = db.prepare('SELECT id FROM users WHERE LOWER(TRIM(email)) = ? AND provider = ?');
          const retryProviderUser = retryProviderUserStmt.get(normalizedEmail, data.provider) as { id: string } | undefined;
          if (retryProviderUser) {
            console.log('✅ [createUser] UNIQUE 제약 조건 오류 후 재확인: 같은 Provider 사용자 발견:', {
              userId: retryProviderUser.id,
              email: normalizedEmail,
              provider: data.provider
            });
            return retryProviderUser.id;
          }
        }
        
        // email UNIQUE 제약 조건 오류이지만 provider가 null인 기존 사용자가 있는 경우
        const retryEmailUserStmt = db.prepare('SELECT id FROM users WHERE LOWER(TRIM(email)) = ? AND (provider IS NULL OR provider = ?)');
        const retryEmailUser = retryEmailUserStmt.get(normalizedEmail, '') as { id: string } | undefined;
        if (retryEmailUser && data.provider) {
          // 기존 사용자의 provider 업데이트 시도
          try {
            const tableInfo = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
            const hasLastLoginAt = tableInfo.some(col => col.name === 'last_login_at');
            
            if (hasLastLoginAt) {
              const updateStmt = db.prepare('UPDATE users SET provider = ?, name = ?, image = ?, last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
              updateStmt.run(data.provider, data.name || null, data.image || null, retryEmailUser.id);
            } else {
              const updateStmt = db.prepare('UPDATE users SET provider = ?, name = ?, image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
              updateStmt.run(data.provider, data.name || null, data.image || null, retryEmailUser.id);
            }
            
            console.log('✅ [createUser] UNIQUE 제약 조건 오류 후 기존 사용자 provider 업데이트 완료:', {
              userId: retryEmailUser.id,
              provider: data.provider
            });
            
            return retryEmailUser.id;
          } catch (updateError) {
            console.warn('⚠️ [createUser] 기존 사용자 provider 업데이트 실패:', updateError);
          }
        }
      }
      throw error;
    }
  });
}

/**
 * 사용자 블로그 URL 업데이트
 */
export function updateUserBlogUrl(userId: string, blogUrl: string | null) {
  // updated_at 컬럼 존재 여부 확인
  const tableInfo = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
  const hasUpdatedAt = tableInfo.some(col => col.name === 'updated_at');
  
  if (hasUpdatedAt) {
    const stmt = db.prepare('UPDATE users SET blog_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(blogUrl, userId);
  } else {
    const stmt = db.prepare('UPDATE users SET blog_url = ? WHERE id = ?');
    stmt.run(blogUrl, userId);
  }
}

/**
 * 사용자 이메일 변경 및 분석 이력 마이그레이션
 * 이메일이 변경되었을 때 기존 이메일의 분석 이력을 새 이메일로 마이그레이션
 */
export function migrateUserEmail(oldEmail: string, newEmail: string): string | null {
  return dbHelpers.transaction(() => {
    const normalizedOldEmail = oldEmail.toLowerCase().trim();
    const normalizedNewEmail = newEmail.toLowerCase().trim();
    
    // 기존 이메일로 사용자 찾기 (트랜잭션 내부에서는 직접 쿼리 사용)
    const oldUserStmt = db.prepare('SELECT id, email FROM users WHERE LOWER(TRIM(email)) = ?');
    const oldUserRow = oldUserStmt.get(normalizedOldEmail) as { id: string; email: string } | undefined;
    if (!oldUserRow) {
      console.warn('⚠️ [migrateUserEmail] 기존 이메일로 사용자를 찾을 수 없음:', {
        oldEmail: normalizedOldEmail
      });
      return null;
    }
    const oldUser = { id: oldUserRow.id, email: oldUserRow.email };
    
    // 새 이메일로 사용자 찾기
    const newUserStmt = db.prepare('SELECT id, email FROM users WHERE LOWER(TRIM(email)) = ?');
    const newUserRow = newUserStmt.get(normalizedNewEmail) as { id: string; email: string } | undefined;
    const newUser = newUserRow ? { id: newUserRow.id, email: newUserRow.email } : null;
    
    if (newUser && newUser.id !== oldUser.id) {
      // 새 이메일로 이미 다른 사용자가 있는 경우, 분석 이력 마이그레이션
      console.log('🔄 [migrateUserEmail] 분석 이력 마이그레이션 시작:', {
        oldUserId: oldUser.id,
        oldEmail: normalizedOldEmail,
        newUserId: newUser.id,
        newEmail: normalizedNewEmail
      });
      
      // 기존 사용자의 분석 이력을 새 사용자로 마이그레이션
      const migrateStmt = db.prepare('UPDATE analyses SET user_id = ? WHERE user_id = ?');
      const migrateResult = migrateStmt.run(newUser.id, oldUser.id);
      
      // 기존 사용자의 채팅 이력을 새 사용자로 마이그레이션
      const migrateChatStmt = db.prepare('UPDATE chat_conversations SET user_id = ? WHERE user_id = ?');
      migrateChatStmt.run(newUser.id, oldUser.id);
      
      console.log('✅ [migrateUserEmail] 분석 이력 마이그레이션 완료:', {
        migratedAnalyses: migrateResult.changes,
        oldUserId: oldUser.id,
        newUserId: newUser.id
      });
      
      // 기존 사용자 삭제 (분석 이력은 이미 마이그레이션됨)
      const deleteStmt = db.prepare('DELETE FROM users WHERE id = ?');
      deleteStmt.run(oldUser.id);
      
      return newUser.id;
    } else if (!newUser) {
      // 새 이메일로 사용자가 없는 경우, 기존 사용자의 이메일만 업데이트
      console.log('🔄 [migrateUserEmail] 사용자 이메일 업데이트:', {
        userId: oldUser.id,
        oldEmail: normalizedOldEmail,
        newEmail: normalizedNewEmail
      });
      
      const updateStmt = db.prepare('UPDATE users SET email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      updateStmt.run(normalizedNewEmail, oldUser.id);
      
      return oldUser.id;
    }
    
    // 같은 사용자인 경우
    return oldUser.id;
  });
}

/**
 * 사용자 삭제 (CASCADE로 관련 데이터도 함께 삭제됨)
 */
export function deleteUser(userId: string) {
  return dbHelpers.transaction(() => {
    // 외래 키 제약 조건으로 인해 관련 데이터(analyses, chat_conversations)도 자동 삭제됨
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(userId);
    return result.changes > 0;
  });
}

/**
 * 채팅 대화 이력 조회
 */
export function getChatConversations(userId: string, analysisId?: string | null) {
  let stmt;
  let params: any[];

  if (analysisId) {
    stmt = db.prepare(`
      SELECT id, analysis_id, messages, created_at, updated_at
      FROM chat_conversations
      WHERE user_id = ? AND analysis_id = ?
      ORDER BY updated_at DESC
      LIMIT 1
    `);
    params = [userId, analysisId];
  } else {
    stmt = db.prepare(`
      SELECT id, analysis_id, messages, created_at, updated_at
      FROM chat_conversations
      WHERE user_id = ?
      ORDER BY updated_at DESC
      LIMIT 10
    `);
    params = [userId];
  }

  return stmt.all(...params).map((row: any) => ({
    id: row.id,
    analysisId: row.analysis_id,
    messages: JSON.parse(row.messages),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * 중복 분석 확인 (같은 URL, 같은 사용자, 최근 24시간 내)
 */
export function checkDuplicateAnalysis(userId: string, url: string, hours = 24): string | null {
  const stmt = db.prepare(`
    SELECT id FROM analyses
    WHERE user_id = ? AND url = ? 
    AND created_at > datetime('now', '-' || ? || ' hours')
    ORDER BY created_at DESC
    LIMIT 1
  `);

  const result = stmt.get(userId, url, hours) as { id: string } | undefined;
  return result?.id || null;
}

/**
 * 인증 로그 저장 (로그인/로그아웃 이력)
 */
export async function saveAuthLog(data: {
  id: string;
  userId?: string | null;
  provider: string;
  action: 'login' | 'logout' | 'signup';
  ipAddress?: string | null;
  userAgent?: string | null;
  success?: boolean;
  errorMessage?: string | null;
}): Promise<string | null> {
  try {
    if (isPostgreSQL()) {
      // PostgreSQL 사용
      return await transaction(async (client) => {
        try {
          // auth_logs 테이블 존재 여부 확인 및 생성
          await client.query(`
            CREATE TABLE IF NOT EXISTS auth_logs (
              id VARCHAR(255) PRIMARY KEY,
              user_id VARCHAR(255),
              provider VARCHAR(50) NOT NULL,
              action VARCHAR(50) NOT NULL,
              ip_address VARCHAR(255),
              user_agent TEXT,
              success BOOLEAN DEFAULT true,
              error_message TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              CONSTRAINT fk_auth_logs_user_id 
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
          `);

          // 인덱스 생성 (IF NOT EXISTS는 PostgreSQL 9.5+에서 지원)
          await client.query(`
            CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id ON auth_logs(user_id);
            CREATE INDEX IF NOT EXISTS idx_auth_logs_provider ON auth_logs(provider);
            CREATE INDEX IF NOT EXISTS idx_auth_logs_action ON auth_logs(action);
            CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON auth_logs(created_at);
            CREATE INDEX IF NOT EXISTS idx_auth_logs_user_created ON auth_logs(user_id, created_at DESC);
          `).catch(() => {
            // 인덱스가 이미 존재하는 경우 무시
          });

          // 데이터 삽입
          await client.query(
            `INSERT INTO auth_logs (
              id, user_id, provider, action, ip_address, user_agent, 
              success, error_message
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO NOTHING`,
            [
              data.id,
              data.userId || null,
              data.provider,
              data.action,
              data.ipAddress || null,
              data.userAgent || null,
              data.success !== false,
              data.errorMessage || null
            ]
          );

          return data.id;
        } catch (error: any) {
          // FOREIGN KEY 오류 처리 (사용자가 없는 경우)
          if (error.code === '23503') {
            console.warn('⚠️ [saveAuthLog] 사용자가 존재하지 않아 인증 로그 저장을 건너뜁니다:', {
              userId: data.userId,
              provider: data.provider
            });
            return null;
          }
          console.error('❌ [saveAuthLog] 인증 로그 저장 오류:', error);
          return null;
        }
      });
    } else {
      // SQLite 사용
      // auth_logs 테이블 존재 여부 확인 및 생성 (트랜잭션 외부에서 먼저 확인)
      try {
        const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='auth_logs'").get();
        if (!tableInfo) {
          console.warn('⚠️ [saveAuthLog] auth_logs 테이블이 존재하지 않습니다. 자동 생성 시도...');
          // 테이블 자동 생성 (트랜잭션 외부에서 실행)
          try {
            db.exec(`
              CREATE TABLE IF NOT EXISTS auth_logs (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                provider TEXT NOT NULL,
                action TEXT NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                success INTEGER DEFAULT 1,
                error_message TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
              );

              CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id ON auth_logs(user_id);
              CREATE INDEX IF NOT EXISTS idx_auth_logs_provider ON auth_logs(provider);
              CREATE INDEX IF NOT EXISTS idx_auth_logs_action ON auth_logs(action);
              CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON auth_logs(created_at);
              CREATE INDEX IF NOT EXISTS idx_auth_logs_user_created ON auth_logs(user_id, created_at DESC);
            `);
            console.log('✅ [saveAuthLog] auth_logs 테이블 자동 생성 완료');
          } catch (createError: any) {
            console.error('❌ [saveAuthLog] auth_logs 테이블 생성 실패:', createError);
            return null;
          }
        }
      } catch (checkError: any) {
        console.error('❌ [saveAuthLog] 테이블 확인 오류:', checkError);
        return null;
      }

      return dbHelpers.transaction(() => {
        try {
          // 테이블이 확실히 존재하는지 다시 확인
          const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='auth_logs'").get();
          if (!tableInfo) {
            console.warn('⚠️ [saveAuthLog] 트랜잭션 내부에서도 auth_logs 테이블이 없습니다.');
            return null;
          }

          const stmt = db.prepare(`
            INSERT INTO auth_logs (
              id, user_id, provider, action, ip_address, user_agent, 
              success, error_message
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `);

          stmt.run(
            data.id,
            data.userId || null,
            data.provider,
            data.action,
            data.ipAddress || null,
            data.userAgent || null,
            data.success !== false ? 1 : 0,
            data.errorMessage || null
          );

          return data.id;
        } catch (error: any) {
          // 테이블이 없거나 컬럼이 없는 경우 무시
          if (error.code === 'SQLITE_ERROR' && error.message.includes('no such table')) {
            console.warn('⚠️ [saveAuthLog] auth_logs 테이블이 존재하지 않습니다.');
            return null;
          }
          // FOREIGN KEY 오류 처리
          if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
            console.warn('⚠️ [saveAuthLog] 사용자가 존재하지 않아 인증 로그 저장을 건너뜁니다:', {
              userId: data.userId,
              provider: data.provider
            });
            return null;
          }
          console.error('❌ [saveAuthLog] 인증 로그 저장 오류:', error);
          return null;
        }
      });
    }
  } catch (error: any) {
    console.error('❌ [saveAuthLog] 인증 로그 저장 오류:', error);
    return null;
  }
}

/**
 * 사용자별 인증 로그 조회
 */
export function getUserAuthLogs(userId: string, limit = 50) {
  try {
    const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='auth_logs'").get();
    if (!tableInfo) {
      return [];
    }

    const stmt = db.prepare(`
      SELECT 
        id, provider, action, ip_address, user_agent, 
        success, error_message, created_at
      FROM auth_logs
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);

    return stmt.all(userId, limit).map((row: any) => ({
      id: row.id,
      provider: row.provider,
      action: row.action,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      success: row.success === 1,
      errorMessage: row.error_message,
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.error('인증 로그 조회 오류:', error);
    return [];
  }
}

/**
 * AI Agent 사용 이력 저장
 * PostgreSQL 및 SQLite 모두 지원
 */
export async function saveAIAgentUsage(data: {
  id: string;
  userId: string;
  analysisId?: string | null;
  conversationId?: string | null;
  agentType: 'chatgpt' | 'perplexity' | 'gemini' | 'claude';
  action: string;
  inputTokens?: number;
  outputTokens?: number;
  cost?: number;
  responseTimeMs?: number;
  success?: boolean;
  errorMessage?: string | null;
}): Promise<string | null> {
  return await transaction(async (client) => {
    try {
      // 테이블 존재 확인
      if (isPostgreSQL()) {
        const tableCheck = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'ai_agent_usage'
          ) as exists
        `);
        
        if (!tableCheck.rows[0]?.exists) {
          console.warn('⚠️ [saveAIAgentUsage] ai_agent_usage 테이블이 존재하지 않음, 자동 생성 시도');
          try {
            await client.query(`
              CREATE TABLE IF NOT EXISTS ai_agent_usage (
                id VARCHAR(255) PRIMARY KEY,
                user_id VARCHAR(255),
                analysis_id VARCHAR(255),
                conversation_id VARCHAR(255),
                agent_type VARCHAR(50) NOT NULL,
                action VARCHAR(50) NOT NULL,
                input_tokens INTEGER DEFAULT 0,
                output_tokens INTEGER DEFAULT 0,
                cost REAL DEFAULT 0.0,
                response_time_ms INTEGER,
                success BOOLEAN DEFAULT TRUE,
                error_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE SET NULL,
                FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE SET NULL
              )
            `);
            
            await client.query(`CREATE INDEX IF NOT EXISTS idx_ai_agent_user_id ON ai_agent_usage(user_id)`);
            await client.query(`CREATE INDEX IF NOT EXISTS idx_ai_agent_analysis_id ON ai_agent_usage(analysis_id)`);
            await client.query(`CREATE INDEX IF NOT EXISTS idx_ai_agent_conversation_id ON ai_agent_usage(conversation_id)`);
            await client.query(`CREATE INDEX IF NOT EXISTS idx_ai_agent_type ON ai_agent_usage(agent_type)`);
            await client.query(`CREATE INDEX IF NOT EXISTS idx_ai_agent_created_at ON ai_agent_usage(created_at)`);
            await client.query(`CREATE INDEX IF NOT EXISTS idx_ai_agent_user_created ON ai_agent_usage(user_id, created_at DESC)`);
            
            console.log('✅ [saveAIAgentUsage] ai_agent_usage 테이블 자동 생성 완료');
          } catch (createError: any) {
            console.error('❌ [saveAIAgentUsage] 테이블 생성 실패:', createError);
            return null;
          }
        }
      } else {
        const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='ai_agent_usage'").get();
        if (!tableInfo) {
          console.warn('⚠️ [saveAIAgentUsage] ai_agent_usage 테이블이 존재하지 않습니다. 마이그레이션을 실행하세요.');
          return null;
        }
      }

      // 사용자 존재 확인
      const userCheck = await getUser(data.userId);
      if (!userCheck) {
        console.error('❌ [saveAIAgentUsage] 사용자가 존재하지 않음:', {
          userId: data.userId,
          agentType: data.agentType,
          action: data.action
        });
        return null;
      }

      // INSERT 실행
      if (isPostgreSQL()) {
        // PostgreSQL 트랜잭션 내부에서는 클라이언트를 직접 사용
        await client.query(
          `INSERT INTO ai_agent_usage (
            id, user_id, analysis_id, conversation_id, agent_type, action,
            input_tokens, output_tokens, cost, response_time_ms, 
            success, error_message
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            data.id,
            data.userId,
            data.analysisId || null,
            data.conversationId || null,
            data.agentType,
            data.action,
            data.inputTokens || 0,
            data.outputTokens || 0,
            data.cost || 0.0,
            data.responseTimeMs || null,
            data.success !== false,
            data.errorMessage || null
          ]
        );
      } else {
        const stmt = db.prepare(`
          INSERT INTO ai_agent_usage (
            id, user_id, analysis_id, conversation_id, agent_type, action,
            input_tokens, output_tokens, cost, response_time_ms, 
            success, error_message
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
          data.id,
          data.userId,
          data.analysisId || null,
          data.conversationId || null,
          data.agentType,
          data.action,
          data.inputTokens || 0,
          data.outputTokens || 0,
          data.cost || 0.0,
          data.responseTimeMs || null,
          data.success !== false ? 1 : 0,
          data.errorMessage || null
        );
      }

      console.log('✅ [saveAIAgentUsage] AI Agent 사용 이력 저장 완료:', {
        id: data.id,
        userId: data.userId,
        agentType: data.agentType,
        action: data.action
      });

      return data.id;
    } catch (error: any) {
      if (error.code === 'SQLITE_ERROR' && error.message?.includes('no such table')) {
        console.warn('⚠️ [saveAIAgentUsage] ai_agent_usage 테이블이 존재하지 않습니다. 마이그레이션을 실행하세요.');
        return null;
      }
      
      // FOREIGN KEY 제약 조건 오류 처리
      if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || error.code === '23503') {
        console.error('❌ [saveAIAgentUsage] FOREIGN KEY 제약 조건 오류:', {
          userId: data.userId,
          analysisId: data.analysisId,
          conversationId: data.conversationId,
          error: error.message
        });
        return null;
      }
      
      console.error('❌ [saveAIAgentUsage] AI Agent 사용 이력 저장 오류:', {
        error: error.message,
        code: error.code,
        userId: data.userId
      });
      return null;
    }
  });
}

