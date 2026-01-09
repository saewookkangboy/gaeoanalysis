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
        grok_score INTEGER CHECK(grok_score IS NULL OR (grok_score >= 0 AND grok_score <= 100)),
        gemini_score INTEGER CHECK(gemini_score IS NULL OR (gemini_score >= 0 AND gemini_score <= 100)),
        claude_score INTEGER CHECK(claude_score IS NULL OR (claude_score >= 0 AND claude_score <= 100)),
        ai_visibility_score INTEGER CHECK(ai_visibility_score IS NULL OR (ai_visibility_score >= 0 AND ai_visibility_score <= 100)),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // citations 테이블 생성
    await query(`
      CREATE TABLE IF NOT EXISTS citations (
        id TEXT PRIMARY KEY,
        analysis_id TEXT NOT NULL,
        url TEXT NOT NULL,
        domain TEXT NOT NULL,
        anchor_text TEXT,
        position INTEGER CHECK(position >= 0 AND position <= 100),
        is_target_url BOOLEAN DEFAULT false,
        link_type TEXT CHECK(link_type IN ('internal', 'external', 'citation', 'reference')),
        context TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
      );
    `);

    // citations 인덱스 생성
    await query(`
      CREATE INDEX IF NOT EXISTS idx_citations_analysis_id ON citations(analysis_id);
      CREATE INDEX IF NOT EXISTS idx_citations_domain ON citations(domain);
      CREATE INDEX IF NOT EXISTS idx_citations_is_target_url ON citations(is_target_url);
      CREATE INDEX IF NOT EXISTS idx_citations_link_type ON citations(link_type);
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

    // admin_logs 테이블 생성
    await query(`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id TEXT PRIMARY KEY,
        admin_user_id TEXT NOT NULL,
        action TEXT NOT NULL,
        target_type TEXT,
        target_id TEXT,
        details TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // ai_reports 테이블 생성
    await query(`
      CREATE TABLE IF NOT EXISTS ai_reports (
        id TEXT PRIMARY KEY,
        admin_user_id TEXT NOT NULL,
        user_id TEXT,
        report_type TEXT NOT NULL CHECK(report_type IN ('summary', 'detailed', 'trend')),
        report_content TEXT NOT NULL,
        metadata TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    // ai_reports 인덱스 생성
    await query(`
      CREATE INDEX IF NOT EXISTS idx_ai_reports_admin_user_id ON ai_reports(admin_user_id);
      CREATE INDEX IF NOT EXISTS idx_ai_reports_user_id ON ai_reports(user_id);
      CREATE INDEX IF NOT EXISTS idx_ai_reports_created_at ON ai_reports(created_at);
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
      CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_user_id ON admin_logs(admin_user_id);
      CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);
      
      CREATE INDEX IF NOT EXISTS idx_ai_reports_admin_user_id ON ai_reports(admin_user_id);
      CREATE INDEX IF NOT EXISTS idx_ai_reports_user_id ON ai_reports(user_id);
      CREATE INDEX IF NOT EXISTS idx_ai_reports_created_at ON ai_reports(created_at);
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
let schemaCheckPromise: Promise<void> | null = null;

export async function ensurePostgresSchema(): Promise<void> {
  if (!isPostgreSQL()) {
    return; // SQLite 환경에서는 스킵
  }

  if (schemaInitialized) {
    return; // 이미 초기화됨
  }

  // 이미 초기화 중이면 대기
  if (schemaCheckPromise) {
    return schemaCheckPromise;
  }

  // 테이블 존재 여부를 먼저 확인하여 불필요한 CREATE TABLE 실행 방지
  schemaCheckPromise = (async () => {
    try {
      const { query } = await import('./db-postgres');
      
      // 주요 테이블 존재 여부 확인
      const checkQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN ('users', 'analyses', 'auth_logs', 'admin_logs')
        ) as tables_exist;
      `;
      
      const checkResult = await query(checkQuery);
      const tablesExist = checkResult.rows[0]?.tables_exist;
      
      if (tablesExist) {
        // 테이블이 이미 존재하면 필요한 컬럼/테이블이 있는지 확인하고 추가
        console.log('✅ [PostgreSQL Schema] 테이블이 이미 존재합니다. 마이그레이션 확인 중...');
        
        // analyses 테이블에 ai_visibility_score 컬럼이 있는지 확인
        const columnCheckQuery = `
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'analyses' 
            AND column_name = 'ai_visibility_score'
          ) as column_exists;
        `;
        
        try {
          const columnCheckResult = await query(columnCheckQuery);
          const columnExists = columnCheckResult.rows[0]?.column_exists;
          
          if (!columnExists) {
            console.log('🔄 [PostgreSQL Schema] ai_visibility_score 컬럼이 없습니다. 추가 중...');
            await query(`
              ALTER TABLE analyses 
              ADD COLUMN IF NOT EXISTS ai_visibility_score INTEGER 
              CHECK(ai_visibility_score IS NULL OR (ai_visibility_score >= 0 AND ai_visibility_score <= 100));
            `);
            console.log('✅ [PostgreSQL Schema] ai_visibility_score 컬럼 추가 완료');
          } else {
            console.log('✅ [PostgreSQL Schema] ai_visibility_score 컬럼이 이미 존재합니다.');
          }
        } catch (error: any) {
          // 컬럼 추가 실패 시에도 계속 진행 (이미 존재할 수 있음)
          console.warn('⚠️ [PostgreSQL Schema] 컬럼 확인/추가 중 오류 (계속 진행):', error.message);
        }

        // analyses 테이블에 grok_score 컬럼이 있는지 확인
        const grokColumnCheckQuery = `
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'analyses' 
            AND column_name = 'grok_score'
          ) as column_exists;
        `;

        try {
          const grokColumnCheckResult = await query(grokColumnCheckQuery);
          const grokColumnExists = grokColumnCheckResult.rows[0]?.column_exists;

          if (!grokColumnExists) {
            console.log('🔄 [PostgreSQL Schema] grok_score 컬럼이 없습니다. 추가 중...');
            await query(`
              ALTER TABLE analyses 
              ADD COLUMN IF NOT EXISTS grok_score INTEGER 
              CHECK(grok_score IS NULL OR (grok_score >= 0 AND grok_score <= 100));
            `);
            console.log('✅ [PostgreSQL Schema] grok_score 컬럼 추가 완료');
          } else {
            console.log('✅ [PostgreSQL Schema] grok_score 컬럼이 이미 존재합니다.');
          }
        } catch (error: any) {
          console.warn('⚠️ [PostgreSQL Schema] grok_score 컬럼 확인/추가 중 오류 (계속 진행):', error.message);
        }
        
        // ai_reports 테이블이 있는지 확인하고 없으면 생성
        try {
          const aiReportsTableCheckQuery = `
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = 'ai_reports'
            ) as table_exists;
          `;
          const aiReportsTableCheckResult = await query(aiReportsTableCheckQuery);
          const aiReportsTableExists = aiReportsTableCheckResult.rows[0]?.table_exists;
          
          if (!aiReportsTableExists) {
            console.log('🔄 [PostgreSQL Schema] ai_reports 테이블이 없습니다. 생성 중...');
            await query(`
              CREATE TABLE IF NOT EXISTS ai_reports (
                id TEXT PRIMARY KEY,
                admin_user_id TEXT NOT NULL,
                user_id TEXT,
                report_type TEXT NOT NULL CHECK(report_type IN ('summary', 'detailed', 'trend')),
                report_content TEXT NOT NULL,
                metadata TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
              );
            `);
            // 인덱스 생성
            await query(`
              CREATE INDEX IF NOT EXISTS idx_ai_reports_admin_user_id ON ai_reports(admin_user_id);
              CREATE INDEX IF NOT EXISTS idx_ai_reports_user_id ON ai_reports(user_id);
              CREATE INDEX IF NOT EXISTS idx_ai_reports_created_at ON ai_reports(created_at);
            `);
            console.log('✅ [PostgreSQL Schema] ai_reports 테이블 생성 완료');
          } else {
            console.log('✅ [PostgreSQL Schema] ai_reports 테이블이 이미 존재합니다.');
          }
        } catch (error: any) {
          // 테이블 생성 실패 시에도 계속 진행 (이미 존재할 수 있음)
          console.warn('⚠️ [PostgreSQL Schema] ai_reports 테이블 확인/생성 중 오류 (계속 진행):', error.message);
        }
        
        schemaInitialized = true;
        return;
      }
      
      // 테이블이 없으면 초기화 실행
      await initializePostgresSchema();
      schemaInitialized = true;
    } catch (error: any) {
      // 초기화 실패해도 계속 진행 (테이블이 이미 존재할 수 있음)
      console.warn('⚠️ [PostgreSQL Schema] 스키마 초기화 실패 (계속 진행):', error.message);
      // 에러가 발생해도 스키마가 이미 존재할 수 있으므로 플래그 설정
      schemaInitialized = true;
    } finally {
      schemaCheckPromise = null;
    }
  })();

  return schemaCheckPromise;
}
