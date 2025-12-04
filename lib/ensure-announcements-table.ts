import { query } from './db-postgres';

/**
 * announcements 테이블이 존재하는지 확인하고 없으면 생성
 */
export async function ensureAnnouncementsTable(): Promise<void> {
  try {
    // 테이블 존재 여부 확인
    const checkResult = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'announcements'
      );
    `);

    const tableExists = checkResult.rows[0]?.exists;

    if (!tableExists) {
      console.log('🔄 [Announcements] 테이블이 없습니다. 생성 중...');
      
      // 테이블 생성
      await query(`
        CREATE TABLE IF NOT EXISTS announcements (
          id VARCHAR(255) PRIMARY KEY,
          message TEXT NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_by VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        );
      `);

      // 인덱스 생성
      await query(`
        CREATE INDEX IF NOT EXISTS idx_announcements_is_active 
        ON announcements(is_active);
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS idx_announcements_created_at 
        ON announcements(created_at DESC);
      `);

      // 트리거 함수 생성
      await query(`
        CREATE OR REPLACE FUNCTION update_announcements_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);

      // 트리거 생성
      await query(`
        DROP TRIGGER IF EXISTS update_announcements_updated_at ON announcements;
        CREATE TRIGGER update_announcements_updated_at
        BEFORE UPDATE ON announcements
        FOR EACH ROW
        EXECUTE FUNCTION update_announcements_updated_at();
      `);

      console.log('✅ [Announcements] 테이블 생성 완료');
    }
  } catch (error: any) {
    console.error('❌ [Announcements] 테이블 생성 오류:', error);
    throw error;
  }
}

