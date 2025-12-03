import db, { dbHelpers } from './db';

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
 * 사용자별 분석 이력 조회 (최적화된 쿼리)
 */
export function getUserAnalyses(userId: string, options: QueryOptions = {}) {
  const { limit = 10, offset = 0, orderBy = 'created_at', orderDirection = 'DESC' } = options;

  const stmt = db.prepare(`
    SELECT 
      id, url, aeo_score, geo_score, seo_score, overall_score, 
      insights, chatgpt_score, perplexity_score, gemini_score, claude_score, 
      created_at
    FROM analyses
    WHERE user_id = ?
    ORDER BY ${orderBy} ${orderDirection}
    LIMIT ? OFFSET ?
  `);

  return stmt.all(userId, limit, offset).map((row: any) => ({
    id: row.id,
    url: row.url,
    aeoScore: row.aeo_score,
    geoScore: row.geo_score,
    seoScore: row.seo_score,
    overallScore: row.overall_score,
    insights: JSON.parse(row.insights),
    aioScores: {
      chatgpt: row.chatgpt_score,
      perplexity: row.perplexity_score,
      gemini: row.gemini_score,
      claude: row.claude_score,
    },
    createdAt: row.created_at,
  }));
}

/**
 * 분석 결과 저장 (트랜잭션 사용)
 */
export function saveAnalysis(data: {
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
  return dbHelpers.transaction(() => {
    const stmt = db.prepare(`
      INSERT INTO analyses (
        id, user_id, url, aeo_score, geo_score, seo_score, 
        overall_score, insights, chatgpt_score, perplexity_score, 
        gemini_score, claude_score
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
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
    );

    return data.id;
  });
}

/**
 * 채팅 대화 저장 또는 업데이트 (트랜잭션 사용)
 */
export function saveOrUpdateChatConversation(data: {
  conversationId?: string;
  userId: string;
  analysisId: string | null;
  messages: any[];
}) {
  return dbHelpers.transaction(() => {
    // 기존 대화 확인
    if (data.conversationId) {
      const existing = db
        .prepare('SELECT id FROM chat_conversations WHERE id = ? AND user_id = ?')
        .get(data.conversationId, data.userId);

      if (existing) {
        // 업데이트
        const updateStmt = db.prepare(`
          UPDATE chat_conversations
          SET messages = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND user_id = ?
        `);
        updateStmt.run(JSON.stringify(data.messages), data.conversationId, data.userId);
        return data.conversationId;
      }
    }

    // 새 대화 생성
    const { v4: uuidv4 } = require('uuid');
    const conversationId = data.conversationId || uuidv4();

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

    return conversationId;
  });
}

/**
 * 사용자 정보 조회
 */
export function getUser(userId: string) {
  // updated_at 컬럼 존재 여부 확인
  const tableInfo = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
  const hasUpdatedAt = tableInfo.some(col => col.name === 'updated_at');
  
  const columns = hasUpdatedAt 
    ? 'id, email, blog_url, created_at, updated_at'
    : 'id, email, blog_url, created_at';
  
  const stmt = db.prepare(`SELECT ${columns} FROM users WHERE id = ?`);
  const row = stmt.get(userId) as any;
  
  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    blogUrl: row.blog_url,
    createdAt: row.created_at,
    updatedAt: hasUpdatedAt ? row.updated_at : row.created_at, // updated_at이 없으면 created_at 사용
  };
}

/**
 * 이메일로 사용자 정보 조회
 * 이메일은 정규화(소문자, 트림)하여 검색
 */
export function getUserByEmail(email: string) {
  // 이메일 정규화 (소문자, 트림) - 일관된 사용자 식별을 위해 중요
  const normalizedEmail = email.toLowerCase().trim();
  
  // updated_at 컬럼 존재 여부 확인
  const tableInfo = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
  const hasUpdatedAt = tableInfo.some(col => col.name === 'updated_at');
  
  const columns = hasUpdatedAt 
    ? 'id, email, blog_url, created_at, updated_at'
    : 'id, email, blog_url, created_at';
  
  // 대소문자 구분 없이 검색 (SQLite는 기본적으로 대소문자를 구분하지만, 정규화된 이메일로 검색)
  const stmt = db.prepare(`SELECT ${columns} FROM users WHERE LOWER(TRIM(email)) = ?`);
  const row = stmt.get(normalizedEmail) as any;
  
  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    blogUrl: row.blog_url,
    createdAt: row.created_at,
    updatedAt: hasUpdatedAt ? row.updated_at : row.created_at,
  };
}

/**
 * 사용자 생성 (트랜잭션 사용)
 * 이미 존재하는 경우 무시하고 기존 사용자 ID 반환
 */
export function createUser(data: { 
  id: string; 
  email: string; 
  blogUrl?: string | null;
  name?: string;
  image?: string;
  provider?: string;
}) {
  return dbHelpers.transaction(() => {
    // 이메일 정규화 (소문자, 트림) - 일관된 사용자 식별을 위해 중요
    const normalizedEmail = data.email.toLowerCase().trim();
    
    // 먼저 사용자가 존재하는지 확인
    const existingUser = getUser(data.id);
    if (existingUser) {
      console.log('사용자 이미 존재:', { id: data.id, email: normalizedEmail });
      // last_login_at 업데이트
      const updateStmt = db.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      updateStmt.run(data.id);
      return data.id;
    }

    // 이메일로도 확인 (다른 ID로 이미 등록된 경우)
    // 대소문자 구분 없이 검색
    const emailStmt = db.prepare('SELECT id FROM users WHERE LOWER(TRIM(email)) = ?');
    const emailUser = emailStmt.get(normalizedEmail) as { id: string } | undefined;
    if (emailUser) {
      console.log('이메일로 이미 등록된 사용자 발견:', { 
        existingId: emailUser.id, 
        newId: data.id, 
        email: normalizedEmail 
      });
      // 기존 사용자 ID 반환 (FOREIGN KEY 제약 조건을 위해)
      // last_login_at 업데이트
      const updateStmt = db.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      updateStmt.run(emailUser.id);
      return emailUser.id;
    }

    // 새 사용자 생성 (정규화된 이메일 사용)
    try {
      const tableInfo = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
      const columnNames = tableInfo.map(col => col.name);
      
      // provider, name, image 컬럼이 있는지 확인
      const hasProvider = columnNames.includes('provider');
      const hasName = columnNames.includes('name');
      const hasImage = columnNames.includes('image');
      
      if (hasProvider && hasName && hasImage) {
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
        const stmt = db.prepare('INSERT INTO users (id, email, blog_url) VALUES (?, ?, ?)');
        stmt.run(data.id, normalizedEmail, data.blogUrl || null); // 정규화된 이메일 저장
      }
      return data.id;
    } catch (error: any) {
      // UNIQUE 제약 조건 오류인 경우 (동시성 문제)
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        // 다시 확인
        const retryUser = getUser(data.id);
        if (retryUser) {
          return data.id;
        }
        const retryEmailUser = emailStmt.get(normalizedEmail) as { id: string } | undefined;
        if (retryEmailUser) {
          return retryEmailUser.id;
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
export function saveAuthLog(data: {
  id: string;
  userId?: string | null;
  provider: string;
  action: 'login' | 'logout' | 'signup';
  ipAddress?: string | null;
  userAgent?: string | null;
  success?: boolean;
  errorMessage?: string | null;
}) {
  return dbHelpers.transaction(() => {
    // auth_logs 테이블 존재 여부 확인
    try {
      const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='auth_logs'").get();
      if (!tableInfo) {
        console.warn('auth_logs 테이블이 존재하지 않습니다. 마이그레이션을 실행하세요.');
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
        console.warn('auth_logs 테이블이 존재하지 않습니다. 마이그레이션을 실행하세요.');
        return null;
      }
      console.error('인증 로그 저장 오류:', error);
      return null;
    }
  });
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
 */
export function saveAIAgentUsage(data: {
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
}) {
  return dbHelpers.transaction(() => {
    try {
      const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='ai_agent_usage'").get();
      if (!tableInfo) {
        console.warn('ai_agent_usage 테이블이 존재하지 않습니다. 마이그레이션을 실행하세요.');
        return null;
      }

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

      return data.id;
    } catch (error: any) {
      if (error.code === 'SQLITE_ERROR' && error.message.includes('no such table')) {
        console.warn('ai_agent_usage 테이블이 존재하지 않습니다. 마이그레이션을 실행하세요.');
        return null;
      }
      console.error('AI Agent 사용 이력 저장 오류:', error);
      return null;
    }
  });
}

