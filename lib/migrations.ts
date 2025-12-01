import db from './db';

/**
 * 마이그레이션 인터페이스
 */
export interface Migration {
  version: number;
  name: string;
  up: () => void;
  down?: () => void;
}

/**
 * 마이그레이션 목록
 */
const migrations: Migration[] = [
  {
    version: 1,
    name: 'add_ai_scores',
    up: () => {
      const tableInfo = db.prepare("PRAGMA table_info(analyses)").all() as Array<{ name: string }>;
      const columnNames = tableInfo.map(col => col.name);

      if (!columnNames.includes('chatgpt_score')) {
        db.exec(`
          ALTER TABLE analyses ADD COLUMN chatgpt_score INTEGER CHECK(chatgpt_score IS NULL OR (chatgpt_score >= 0 AND chatgpt_score <= 100));
          ALTER TABLE analyses ADD COLUMN perplexity_score INTEGER CHECK(perplexity_score IS NULL OR (perplexity_score >= 0 AND perplexity_score <= 100));
          ALTER TABLE analyses ADD COLUMN gemini_score INTEGER CHECK(gemini_score IS NULL OR (gemini_score >= 0 AND gemini_score <= 100));
          ALTER TABLE analyses ADD COLUMN claude_score INTEGER CHECK(claude_score IS NULL OR (claude_score >= 0 AND claude_score <= 100));
        `);
      }
    },
  },
  {
    version: 2,
    name: 'add_users_updated_at',
    up: () => {
      const tableInfo = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
      const columnNames = tableInfo.map(col => col.name);

      if (!columnNames.includes('updated_at')) {
        // SQLite는 CURRENT_TIMESTAMP를 기본값으로 사용할 수 없으므로
        // 먼저 컬럼을 추가하고 값을 업데이트
        db.exec(`
          ALTER TABLE users ADD COLUMN updated_at DATETIME;
          UPDATE users SET updated_at = created_at WHERE updated_at IS NULL;
        `);
      }
    },
  },
  {
    version: 3,
    name: 'add_composite_indexes',
    up: () => {
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_analyses_user_created 
        ON analyses(user_id, created_at DESC);
        
        CREATE INDEX IF NOT EXISTS idx_analyses_url_created 
        ON analyses(url, created_at DESC);
        
        CREATE INDEX IF NOT EXISTS idx_chat_user_updated 
        ON chat_conversations(user_id, updated_at DESC);
      `);
    },
  },
  {
    version: 4,
    name: 'add_users_provider_and_role',
    up: () => {
      const tableInfo = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
      const columnNames = tableInfo.map(col => col.name);

      if (!columnNames.includes('provider')) {
        db.exec(`
          ALTER TABLE users ADD COLUMN provider TEXT;
          ALTER TABLE users ADD COLUMN name TEXT;
          ALTER TABLE users ADD COLUMN image TEXT;
          ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
          ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1;
          ALTER TABLE users ADD COLUMN last_login_at DATETIME;
        `);
      }
    },
  },
  {
    version: 5,
    name: 'create_auth_logs_table',
    up: () => {
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
    },
  },
  {
    version: 6,
    name: 'create_ai_agent_usage_table',
    up: () => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS ai_agent_usage (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          analysis_id TEXT,
          conversation_id TEXT,
          agent_type TEXT NOT NULL,
          action TEXT NOT NULL,
          input_tokens INTEGER DEFAULT 0,
          output_tokens INTEGER DEFAULT 0,
          cost REAL DEFAULT 0.0,
          response_time_ms INTEGER,
          success INTEGER DEFAULT 1,
          error_message TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE SET NULL,
          FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE SET NULL
        );

        CREATE INDEX IF NOT EXISTS idx_ai_agent_user_id ON ai_agent_usage(user_id);
        CREATE INDEX IF NOT EXISTS idx_ai_agent_analysis_id ON ai_agent_usage(analysis_id);
        CREATE INDEX IF NOT EXISTS idx_ai_agent_conversation_id ON ai_agent_usage(conversation_id);
        CREATE INDEX IF NOT EXISTS idx_ai_agent_type ON ai_agent_usage(agent_type);
        CREATE INDEX IF NOT EXISTS idx_ai_agent_created_at ON ai_agent_usage(created_at);
        CREATE INDEX IF NOT EXISTS idx_ai_agent_user_created ON ai_agent_usage(user_id, created_at DESC);
      `);
    },
  },
  {
    version: 7,
    name: 'create_site_statistics_table',
    up: () => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS site_statistics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date DATE NOT NULL UNIQUE,
          total_users INTEGER DEFAULT 0,
          new_users INTEGER DEFAULT 0,
          total_analyses INTEGER DEFAULT 0,
          new_analyses INTEGER DEFAULT 0,
          total_chat_conversations INTEGER DEFAULT 0,
          new_chat_conversations INTEGER DEFAULT 0,
          total_ai_agent_usage INTEGER DEFAULT 0,
          total_ai_agent_cost REAL DEFAULT 0.0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_site_stats_date ON site_statistics(date);

        CREATE TRIGGER IF NOT EXISTS update_site_statistics_updated_at
        AFTER UPDATE ON site_statistics
        FOR EACH ROW
        BEGIN
          UPDATE site_statistics SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END;
      `);
    },
  },
  {
    version: 8,
    name: 'create_admin_logs_table',
    up: () => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS admin_logs (
          id TEXT PRIMARY KEY,
          admin_user_id TEXT NOT NULL,
          action TEXT NOT NULL,
          target_type TEXT,
          target_id TEXT,
          details TEXT,
          ip_address TEXT,
          user_agent TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_user_id ON admin_logs(admin_user_id);
        CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
        CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON admin_logs(target_type, target_id);
        CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);
      `);
    },
  },
  {
    version: 9,
    name: 'add_users_indexes',
    up: () => {
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider);
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
        CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
      `);
    },
  },
];

/**
 * 적용된 마이그레이션 버전 조회
 */
function getAppliedVersions(): number[] {
  try {
    const rows = db.prepare('SELECT version FROM schema_migrations ORDER BY version').all() as Array<{ version: number }>;
    return rows.map(row => row.version);
  } catch (error) {
    // schema_migrations 테이블이 없으면 빈 배열 반환
    return [];
  }
}

/**
 * 마이그레이션 적용
 */
function applyMigration(migration: Migration) {
  console.log(`🔄 마이그레이션 적용 중: ${migration.name} (v${migration.version})`);
  
  try {
    db.transaction(() => {
      migration.up();
      
      // 마이그레이션 기록 저장
      db.prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)').run(
        migration.version,
        migration.name
      );
    })();
    
    console.log(`✅ 마이그레이션 완료: ${migration.name} (v${migration.version})`);
  } catch (error) {
    console.error(`❌ 마이그레이션 실패: ${migration.name} (v${migration.version})`, error);
    throw error;
  }
}

/**
 * 모든 마이그레이션 실행
 */
export function runMigrations() {
  console.log('🚀 마이그레이션 시작...');
  
  const appliedVersions = getAppliedVersions();
  const pendingMigrations = migrations.filter(m => !appliedVersions.includes(m.version));
  
  if (pendingMigrations.length === 0) {
    console.log('✅ 적용할 마이그레이션이 없습니다.');
    return;
  }
  
  // 버전 순으로 정렬
  pendingMigrations.sort((a, b) => a.version - b.version);
  
  for (const migration of pendingMigrations) {
    applyMigration(migration);
  }
  
  console.log(`✨ 마이그레이션 완료: ${pendingMigrations.length}개 적용됨`);
}

/**
 * 마이그레이션 상태 확인
 */
export function getMigrationStatus() {
  const appliedVersions = getAppliedVersions();
  
  return {
    total: migrations.length,
    applied: appliedVersions.length,
    pending: migrations.filter(m => !appliedVersions.includes(m.version)).length,
    migrations: migrations.map(m => ({
      version: m.version,
      name: m.name,
      applied: appliedVersions.includes(m.version),
    })),
  };
}

