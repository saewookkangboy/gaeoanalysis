/**
 * 구독 및 사용량 추적 테이블 추가 마이그레이션
 * 
 * 이 마이그레이션은 다음을 추가합니다:
 * - subscriptions: 사용자 구독 정보
 * - usage_tracking: 사용량 추적
 * - payments: 결제 이력
 */

import db from '../db';

export const version = 3;
export const name = 'add_subscription_tables';

export function up() {
  console.log(`🔄 [Migration ${version}] ${name} - 시작`);

  // subscriptions 테이블 생성
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      plan_type TEXT NOT NULL CHECK(plan_type IN ('free', 'pro', 'business')),
      status TEXT NOT NULL CHECK(status IN ('active', 'cancelled', 'expired', 'trial')),
      current_period_start DATETIME NOT NULL,
      current_period_end DATETIME NOT NULL,
      cancel_at_period_end BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // usage_tracking 테이블 생성
  db.exec(`
    CREATE TABLE IF NOT EXISTS usage_tracking (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      resource_type TEXT NOT NULL CHECK(resource_type IN ('analysis', 'chat', 'export')),
      count INTEGER DEFAULT 1,
      period_start DATETIME NOT NULL,
      period_end DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // payments 테이블 생성
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subscription_id TEXT,
      amount INTEGER NOT NULL,
      currency TEXT DEFAULT 'KRW',
      status TEXT NOT NULL CHECK(status IN ('pending', 'completed', 'failed', 'refunded')),
      payment_method TEXT,
      payment_provider TEXT,
      transaction_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL
    );
  `);

  // 인덱스 생성
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_period ON subscriptions(current_period_start, current_period_end);
    
    CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_period 
    ON usage_tracking(user_id, period_start, period_end);
    CREATE INDEX IF NOT EXISTS idx_usage_tracking_resource 
    ON usage_tracking(resource_type, period_start, period_end);
    
    CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
    CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
  `);

  // 트리거: subscriptions updated_at 자동 업데이트
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_subscriptions_updated_at
    AFTER UPDATE ON subscriptions
    FOR EACH ROW
    BEGIN
      UPDATE subscriptions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `);

  // 기존 사용자들에게 Free 플랜 구독 자동 생성
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30일 후

  const users = db.prepare('SELECT id FROM users').all() as Array<{ id: string }>;
  const { v4: uuidv4 } = require('uuid');

  for (const user of users) {
    // 이미 구독이 있는지 확인
    const existing = db
      .prepare('SELECT id FROM subscriptions WHERE user_id = ?')
      .get(user.id) as { id: string } | undefined;

    if (!existing) {
      // Free 플랜 구독 생성
      db.prepare(`
        INSERT INTO subscriptions (
          id, user_id, plan_type, status,
          current_period_start, current_period_end, cancel_at_period_end
        )
        VALUES (?, ?, 'free', 'active', ?, ?, 0)
      `).run(
        uuidv4(),
        user.id,
        now.toISOString(),
        periodEnd.toISOString()
      );
    }
  }

  console.log(`✅ [Migration ${version}] ${name} - 완료`);
}

export function down() {
  console.log(`🔄 [Migration ${version}] ${name} - 롤백 시작`);

  // 트리거 삭제
  db.exec('DROP TRIGGER IF EXISTS update_subscriptions_updated_at');

  // 인덱스 삭제
  db.exec(`
    DROP INDEX IF EXISTS idx_subscriptions_user_id;
    DROP INDEX IF EXISTS idx_subscriptions_status;
    DROP INDEX IF EXISTS idx_subscriptions_period;
    DROP INDEX IF EXISTS idx_usage_tracking_user_period;
    DROP INDEX IF EXISTS idx_usage_tracking_resource;
    DROP INDEX IF EXISTS idx_payments_user_id;
    DROP INDEX IF EXISTS idx_payments_subscription_id;
    DROP INDEX IF EXISTS idx_payments_status;
  `);

  // 테이블 삭제
  db.exec(`
    DROP TABLE IF EXISTS payments;
    DROP TABLE IF EXISTS usage_tracking;
    DROP TABLE IF EXISTS subscriptions;
  `);

  console.log(`✅ [Migration ${version}] ${name} - 롤백 완료`);
}

