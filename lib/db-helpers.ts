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
 * 사용자 생성 (트랜잭션 사용)
 */
export function createUser(data: { id: string; email: string; blogUrl?: string | null }) {
  return dbHelpers.transaction(() => {
    const stmt = db.prepare('INSERT INTO users (id, email, blog_url) VALUES (?, ?, ?)');
    stmt.run(data.id, data.email, data.blogUrl || null);
    return data.id;
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

