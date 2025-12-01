#!/usr/bin/env tsx

/**
 * 데이터베이스 마이그레이션 실행 스크립트
 * 사용법: npx tsx scripts/migrate-db.ts
 */

import { runMigrations, getMigrationStatus } from '../lib/migrations';

console.log('📊 마이그레이션 상태 확인...\n');
const status = getMigrationStatus();

console.log(`총 마이그레이션: ${status.total}개`);
console.log(`적용됨: ${status.applied}개`);
console.log(`대기 중: ${status.pending}개\n`);

if (status.pending > 0) {
  console.log('대기 중인 마이그레이션:');
  status.migrations
    .filter(m => !m.applied)
    .forEach(m => {
      console.log(`  - v${m.version}: ${m.name}`);
    });
  console.log('');
}

runMigrations();

console.log('\n📊 최종 상태:');
const finalStatus = getMigrationStatus();
console.log(`적용됨: ${finalStatus.applied}/${finalStatus.total}개`);
