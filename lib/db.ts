import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Vercel 환경에서는 /tmp 디렉토리 사용, 로컬에서는 data 디렉토리 사용
const dbDir = process.env.VERCEL 
  ? '/tmp' 
  : join(process.cwd(), 'data');

// 디렉토리가 없으면 생성 (Vercel에서는 /tmp가 이미 존재하므로 안전)
if (!existsSync(dbDir)) {
  try {
    mkdirSync(dbDir, { recursive: true });
  } catch (error) {
    // Vercel 환경에서 mkdirSync가 실패할 수 있으므로 에러 무시
    console.warn('디렉토리 생성 실패 (무시됨):', error);
  }
}

const dbPath = join(dbDir, 'gaeo.db');
const db = new Database(dbPath);

// 성능 최적화 설정
db.pragma('journal_mode = WAL'); // Write-Ahead Logging
db.pragma('synchronous = NORMAL'); // 성능과 안정성 균형
db.pragma('foreign_keys = ON'); // 외래 키 제약 조건 활성화
db.pragma('busy_timeout = 5000'); // 5초 타임아웃

// 테이블 생성
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    blog_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS analyses (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    url TEXT NOT NULL,
    aeo_score INTEGER NOT NULL CHECK(aeo_score >= 0 AND aeo_score <= 100),
    geo_score INTEGER NOT NULL CHECK(geo_score >= 0 AND geo_score <= 100),
    seo_score INTEGER NOT NULL CHECK(seo_score >= 0 AND seo_score <= 100),
    overall_score REAL NOT NULL CHECK(overall_score >= 0 AND overall_score <= 100),
    insights TEXT NOT NULL,
    chatgpt_score INTEGER CHECK(chatgpt_score IS NULL OR (chatgpt_score >= 0 AND chatgpt_score <= 100)),
    perplexity_score INTEGER CHECK(perplexity_score IS NULL OR (perplexity_score >= 0 AND perplexity_score <= 100)),
    gemini_score INTEGER CHECK(gemini_score IS NULL OR (gemini_score >= 0 AND gemini_score <= 100)),
    claude_score INTEGER CHECK(claude_score IS NULL OR (claude_score >= 0 AND claude_score <= 100)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

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

  -- 스키마 버전 관리 테이블
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// 기본 인덱스
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
  CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at);
  CREATE INDEX IF NOT EXISTS idx_chat_user_id ON chat_conversations(user_id);
  CREATE INDEX IF NOT EXISTS idx_chat_analysis_id ON chat_conversations(analysis_id);
`);

// 복합 인덱스 추가 (성능 최적화)
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_analyses_user_created 
  ON analyses(user_id, created_at DESC);
  
  CREATE INDEX IF NOT EXISTS idx_analyses_url_created 
  ON analyses(url, created_at DESC);
  
  CREATE INDEX IF NOT EXISTS idx_chat_user_updated 
  ON chat_conversations(user_id, updated_at DESC);
`);

// 트리거: updated_at 자동 업데이트
db.exec(`
  CREATE TRIGGER IF NOT EXISTS update_users_updated_at
  AFTER UPDATE ON users
  FOR EACH ROW
  BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

  CREATE TRIGGER IF NOT EXISTS update_chat_conversations_updated_at
  AFTER UPDATE ON chat_conversations
  FOR EACH ROW
  BEGIN
    UPDATE chat_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;
`);

// 마이그레이션 실행 (비동기로 처리하여 순환 참조 방지)
setImmediate(() => {
  try {
    // 동적 import로 순환 참조 방지
    import('./migrations').then(({ runMigrations }) => {
      runMigrations();
    }).catch((error) => {
      console.error('마이그레이션 실행 오류:', error);
    });
  } catch (error) {
    console.error('마이그레이션 로드 오류:', error);
  }
});

// 데이터베이스 헬퍼 함수
export const dbHelpers = {
  /**
   * 트랜잭션 실행
   */
  transaction<T>(callback: () => T): T {
    return db.transaction(callback)();
  },

  /**
   * 안전한 쿼리 실행 (에러 처리 포함)
   */
  safeQuery<T>(query: () => T, errorMessage = '쿼리 실행 중 오류가 발생했습니다.'): T {
    try {
      return query();
    } catch (error) {
      console.error(errorMessage, error);
      throw error;
    }
  },

  /**
   * 데이터베이스 통계 정보
   */
  getStats() {
    const stats = {
      users: db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number },
      analyses: db.prepare('SELECT COUNT(*) as count FROM analyses').get() as { count: number },
      conversations: db.prepare('SELECT COUNT(*) as count FROM chat_conversations').get() as { count: number },
      dbSize: 0,
    };

    try {
      const dbFile = db.prepare('PRAGMA page_count').get() as { page_count: number };
      const pageSize = db.prepare('PRAGMA page_size').get() as { page_size: number };
      stats.dbSize = (dbFile.page_count * pageSize.page_size) / 1024 / 1024; // MB
    } catch (error) {
      console.error('DB 크기 계산 오류:', error);
    }

    return stats;
  },

  /**
   * 데이터베이스 최적화 (VACUUM)
   */
  optimize() {
    try {
      db.exec('VACUUM');
      db.exec('ANALYZE');
      console.log('데이터베이스 최적화 완료');
    } catch (error) {
      console.error('데이터베이스 최적화 오류:', error);
      throw error;
    }
  },

  /**
   * 쿼리 실행 계획 분석
   */
  explainQuery(sql: string, params: any[] = []) {
    try {
      const stmt = db.prepare(`EXPLAIN QUERY PLAN ${sql}`);
      return stmt.all(...params);
    } catch (error) {
      console.error('쿼리 계획 분석 오류:', error);
      return [];
    }
  },
};

export default db;
