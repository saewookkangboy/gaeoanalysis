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

