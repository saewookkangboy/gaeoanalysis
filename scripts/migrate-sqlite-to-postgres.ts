/**
 * SQLite에서 PostgreSQL로 데이터 마이그레이션 스크립트
 * 
 * 사용법:
 * 1. Railway에서 PostgreSQL 데이터베이스 생성
 * 2. DATABASE_URL 환경 변수 설정
 * 3. npm run db:migrate-to-postgres
 */

import Database from 'better-sqlite3';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

// 환경 변수 확인
const sqliteDbPath = process.env.SQLITE_DB_PATH || join(process.cwd(), 'data', 'gaeo.db');
const postgresUrl = process.env.DATABASE_URL;

if (!postgresUrl) {
  console.error('❌ DATABASE_URL 환경 변수가 설정되지 않았습니다.');
  console.error('💡 Railway PostgreSQL 연결 정보를 DATABASE_URL에 설정하세요.');
  process.exit(1);
}

// SQLite 연결
let sqliteDb: Database.Database;
try {
  sqliteDb = new Database(sqliteDbPath);
  console.log('✅ [SQLite] 연결 성공:', sqliteDbPath);
} catch (error) {
  console.error('❌ [SQLite] 연결 실패:', error);
  process.exit(1);
}

// PostgreSQL 연결
const postgresPool = new Pool({
  connectionString: postgresUrl,
  ssl: { rejectUnauthorized: false },
});

// PostgreSQL 스키마 생성
async function createPostgresSchema() {
  console.log('📋 [PostgreSQL] 스키마 생성 중...');
  
  try {
    const schemaPath = join(process.cwd(), 'database', 'schema.postgresql.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    // 스키마 실행
    await postgresPool.query(schema);
    console.log('✅ [PostgreSQL] 스키마 생성 완료');
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️ [PostgreSQL] 스키마가 이미 존재합니다.');
    } else {
      console.error('❌ [PostgreSQL] 스키마 생성 실패:', error);
      throw error;
    }
  }
}

// 데이터 마이그레이션
async function migrateTable(
  tableName: string,
  columns: string[],
  transformRow?: (row: any) => any
) {
  console.log(`📦 [Migration] ${tableName} 테이블 마이그레이션 중...`);
  
  // SQLite에서 데이터 읽기
  const rows = sqliteDb.prepare(`SELECT * FROM ${tableName}`).all() as any[];
  
  if (rows.length === 0) {
    console.log(`  ℹ️ ${tableName}: 데이터 없음 (건너뜀)`);
    return;
  }
  
  console.log(`  📊 ${tableName}: ${rows.length}개 레코드 발견`);
  
  // PostgreSQL에 데이터 삽입
  const columnList = columns.join(', ');
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
  const insertQuery = `INSERT INTO ${tableName} (${columnList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
  
  let inserted = 0;
  let skipped = 0;
  
  for (const row of rows) {
    try {
      // 데이터 변환 (필요한 경우)
      const transformedRow = transformRow ? transformRow(row) : row;
      
      // 컬럼 순서에 맞게 값 배열 생성
      const values = columns.map(col => {
        const value = transformedRow[col];
        
        // SQLite INTEGER (0/1) -> PostgreSQL BOOLEAN 변환
        if (col === 'is_active' || col === 'success') {
          return value === 1 || value === true;
        }
        
        // NULL 처리
        if (value === null || value === undefined) {
          return null;
        }
        
        return value;
      });
      
      const result = await postgresPool.query(insertQuery, values);
      
      if (result.rowCount && result.rowCount > 0) {
        inserted++;
      } else {
        skipped++;
      }
    } catch (error: any) {
      if (error.code === '23505') { // UNIQUE constraint violation
        skipped++;
      } else {
        console.error(`  ❌ ${tableName} 레코드 삽입 실패:`, {
          id: row.id,
          error: error.message,
        });
      }
    }
  }
  
  console.log(`  ✅ ${tableName}: ${inserted}개 삽입, ${skipped}개 건너뜀`);
}

// 전체 마이그레이션 실행
async function migrate() {
  try {
    console.log('🚀 [Migration] SQLite → PostgreSQL 마이그레이션 시작\n');
    
    // 1. PostgreSQL 스키마 생성
    await createPostgresSchema();
    console.log('');
    
    // 2. users 테이블 마이그레이션
    await migrateTable('users', [
      'id', 'email', 'name', 'image', 'blog_url', 'provider',
      'role', 'is_active', 'last_login_at', 'created_at', 'updated_at'
    ], (row) => ({
      ...row,
      is_active: row.is_active === 1 || row.is_active === true,
    }));
    console.log('');
    
    // 3. auth_logs 테이블 마이그레이션
    await migrateTable('auth_logs', [
      'id', 'user_id', 'provider', 'action', 'ip_address', 'user_agent',
      'success', 'error_message', 'created_at'
    ], (row) => ({
      ...row,
      success: row.success === 1 || row.success === true,
    }));
    console.log('');
    
    // 4. analyses 테이블 마이그레이션
    await migrateTable('analyses', [
      'id', 'user_id', 'url', 'aeo_score', 'geo_score', 'seo_score',
      'overall_score', 'insights', 'chatgpt_score', 'perplexity_score',
      'gemini_score', 'claude_score', 'created_at'
    ]);
    console.log('');
    
    // 5. chat_conversations 테이블 마이그레이션
    await migrateTable('chat_conversations', [
      'id', 'user_id', 'analysis_id', 'messages', 'created_at', 'updated_at'
    ]);
    console.log('');
    
    // 6. ai_agent_usage 테이블 마이그레이션
    await migrateTable('ai_agent_usage', [
      'id', 'user_id', 'analysis_id', 'conversation_id', 'agent_type', 'action',
      'input_tokens', 'output_tokens', 'cost', 'response_time_ms',
      'success', 'error_message', 'created_at'
    ], (row) => ({
      ...row,
      success: row.success === 1 || row.success === true,
    }));
    console.log('');
    
    // 7. site_statistics 테이블 마이그레이션
    await migrateTable('site_statistics', [
      'date', 'total_users', 'new_users', 'total_analyses', 'new_analyses',
      'total_chat_conversations', 'new_chat_conversations',
      'total_ai_agent_usage', 'total_ai_agent_cost',
      'created_at', 'updated_at'
    ]);
    console.log('');
    
    // 8. admin_logs 테이블 마이그레이션
    await migrateTable('admin_logs', [
      'id', 'admin_user_id', 'action', 'target_type', 'target_id',
      'details', 'ip_address', 'user_agent', 'created_at'
    ]);
    console.log('');
    
    // 9. schema_migrations 테이블 마이그레이션
    await migrateTable('schema_migrations', [
      'version', 'name', 'applied_at'
    ]);
    console.log('');
    
    console.log('✅ [Migration] 마이그레이션 완료!');
    
    // 통계 출력
    const stats = await postgresPool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM analyses) as analyses,
        (SELECT COUNT(*) FROM chat_conversations) as conversations,
        (SELECT COUNT(*) FROM auth_logs) as auth_logs
    `);
    
    console.log('\n📊 [Migration] 마이그레이션 결과:');
    console.log(JSON.stringify(stats.rows[0], null, 2));
    
  } catch (error) {
    console.error('❌ [Migration] 마이그레이션 실패:', error);
    throw error;
  } finally {
    // 연결 종료
    sqliteDb.close();
    await postgresPool.end();
  }
}

// 실행
migrate()
  .then(() => {
    console.log('\n🎉 마이그레이션이 성공적으로 완료되었습니다!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 마이그레이션 실패:', error);
    process.exit(1);
  });

