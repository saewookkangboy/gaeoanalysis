#!/usr/bin/env tsx

/**
 * 데이터베이스 최적화 스크립트
 * VACUUM 및 ANALYZE 실행
 */

import { dbHelpers } from '../lib/db';

console.log('🔧 데이터베이스 최적화 시작...\n');

try {
  // 최적화 전 통계
  const beforeStats = dbHelpers.getStats();
  console.log('최적화 전 통계:');
  console.log(`  - 사용자: ${beforeStats.users.count}명`);
  console.log(`  - 분석: ${beforeStats.analyses.count}개`);
  console.log(`  - 대화: ${beforeStats.conversations.count}개`);
  console.log(`  - DB 크기: ${beforeStats.dbSize.toFixed(2)} MB\n`);

  // 최적화 실행
  console.log('⚙️  VACUUM 및 ANALYZE 실행 중...');
  dbHelpers.optimize();

  // 최적화 후 통계
  const afterStats = dbHelpers.getStats();
  console.log('\n최적화 후 통계:');
  console.log(`  - 사용자: ${afterStats.users.count}명`);
  console.log(`  - 분석: ${afterStats.analyses.count}개`);
  console.log(`  - 대화: ${afterStats.conversations.count}개`);
  console.log(`  - DB 크기: ${afterStats.dbSize.toFixed(2)} MB`);

  const sizeDiff = beforeStats.dbSize - afterStats.dbSize;
  if (sizeDiff > 0) {
    console.log(`\n✅ ${sizeDiff.toFixed(2)} MB 절약됨`);
  } else {
    console.log('\n✅ 최적화 완료');
  }
} catch (error) {
  console.error('❌ 최적화 실패:', error);
  process.exit(1);
}

