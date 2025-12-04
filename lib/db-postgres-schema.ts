/**
 * PostgreSQL 스키마 초기화
 * Railway PostgreSQL 데이터베이스 테이블 자동 생성
 */

import { query } from './db-postgres';
import { isPostgreSQL } from './db-adapter';

/**
 * PostgreSQL 스키마 초기화
 * 테이블이 없으면 자동으로 생성합니다.
 */
export async function initializePostgresSchema(): Promise<void> {
  if (!isPostgreSQL()) {
    return; // SQLite 환경에서는 스킵
  }

  try {
    console.log('🔄 [PostgreSQL Schema] 스키마 초기화 시작...');

    // users 테이블 생성
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        blog_url TEXT,
        name TEXT,
        image TEXT,
        provider TEXT,
        role TEXT DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        last_login_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // analyses 테이블 생성
    await query(`
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // chat_conversations 테이블 생성
    await query(`
      CREATE TABLE IF NOT EXISTS chat_conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        analysis_id TEXT,
        messages TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
      );
    `);

    // schema_migrations 테이블 생성
    await query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // auth_logs 테이블 생성
    await query(`
      CREATE TABLE IF NOT EXISTS auth_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        provider TEXT NOT NULL,
        action TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        success BOOLEAN DEFAULT true,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    // ai_agent_usage 테이블 생성
    await query(`
      CREATE TABLE IF NOT EXISTS ai_agent_usage (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        analysis_id TEXT,
        agent_type TEXT NOT NULL,
        action TEXT NOT NULL,
        prompt TEXT,
        response TEXT,
        input_tokens INTEGER,
        output_tokens INTEGER,
        cost REAL,
        response_time_ms INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE SET NULL
      );
    `);

    // 인덱스 생성
    await query(`
      CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
      CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at);
      CREATE INDEX IF NOT EXISTS idx_chat_user_id ON chat_conversations(user_id);
      CREATE INDEX IF NOT EXISTS idx_chat_analysis_id ON chat_conversations(analysis_id);
      CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id ON auth_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON auth_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_ai_agent_usage_user_id ON ai_agent_usage(user_id);
      CREATE INDEX IF NOT EXISTS idx_ai_agent_usage_created_at ON ai_agent_usage(created_at);
    `);

    // 복합 인덱스 생성
    await query(`
      CREATE INDEX IF NOT EXISTS idx_analyses_user_created 
      ON analyses(user_id, created_at DESC);
      
      CREATE INDEX IF NOT EXISTS idx_analyses_url_created 
      ON analyses(url, created_at DESC);
      
      CREATE INDEX IF NOT EXISTS idx_chat_user_updated 
      ON chat_conversations(user_id, updated_at DESC);
    `);

    console.log('✅ [PostgreSQL Schema] 스키마 초기화 완료');
  } catch (error: any) {
    // 테이블이 이미 존재하는 경우 무시 (IF NOT EXISTS)
    if (error.code === '42P07') {
      console.log('ℹ️ [PostgreSQL Schema] 일부 테이블이 이미 존재합니다.');
      return;
    }
    
    console.error('❌ [PostgreSQL Schema] 스키마 초기화 오류:', {
      error: error.message,
      code: error.code,
    });
    throw error;
  }
}

/**
 * 스키마 초기화 확인 및 실행
 * 연결 시 자동으로 호출됩니다.
 */
let schemaInitialized = false;
export async function ensurePostgresSchema(): Promise<void> {
  if (!isPostgreSQL()) {
    return; // SQLite 환경에서는 스킵
  }

  if (schemaInitialized) {
    return; // 이미 초기화됨
  }

  try {
    await initializePostgresSchema();
    schemaInitialized = true;
  } catch (error: any) {
    // 초기화 실패해도 계속 진행 (테이블이 이미 존재할 수 있음)
    console.warn('⚠️ [PostgreSQL Schema] 스키마 초기화 실패 (계속 진행):', error.message);
  }
}

