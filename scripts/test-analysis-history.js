/**
 * 분석 이력 저장 및 조회 테스트 스크립트
 * 
 * 사용법:
 * node scripts/test-analysis-history.js
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// DB 경로 설정
const dbDir = path.join(process.cwd(), 'data');
const dbPath = path.join(dbDir, 'gaeo.db');

if (!fs.existsSync(dbPath)) {
  console.error('❌ 데이터베이스 파일을 찾을 수 없습니다:', dbPath);
  process.exit(1);
}

const db = new Database(dbPath);

console.log('🧪 분석 이력 저장 및 조회 테스트 시작...\n');

// 1. 테이블 존재 확인
console.log('1️⃣ 테이블 존재 확인');
const tables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' AND name IN ('users', 'analyses')
`).all();

if (tables.length < 2) {
  console.error('❌ 필수 테이블이 존재하지 않습니다.');
  process.exit(1);
}
console.log('✅ 필수 테이블 존재 확인:', tables.map(t => t.name).join(', '));

// 2. 사용자 확인
console.log('\n2️⃣ 사용자 확인');
const users = db.prepare('SELECT id, email, created_at FROM users ORDER BY created_at DESC LIMIT 5').all();
console.log(`✅ 총 사용자 수: ${db.prepare('SELECT COUNT(*) as count FROM users').get().count}`);
if (users.length > 0) {
  console.log('최근 사용자:');
  users.forEach((user, index) => {
    console.log(`  ${index + 1}. ${user.email} (${user.id.substring(0, 8)}...) - ${user.created_at}`);
  });
} else {
  console.log('⚠️ 사용자가 없습니다. 먼저 로그인을 해주세요.');
}

// 3. 분석 이력 확인
console.log('\n3️⃣ 분석 이력 확인');
const totalAnalyses = db.prepare('SELECT COUNT(*) as count FROM analyses').get().count;
console.log(`✅ 총 분석 이력 수: ${totalAnalyses}`);

if (totalAnalyses > 0) {
  const recentAnalyses = db.prepare(`
    SELECT 
      a.id, a.url, a.user_id, 
      a.aeo_score, a.geo_score, a.seo_score, a.overall_score,
      a.created_at,
      u.email
    FROM analyses a
    LEFT JOIN users u ON a.user_id = u.id
    ORDER BY a.created_at DESC
    LIMIT 10
  `).all();
  
  console.log('\n최근 분석 이력:');
  recentAnalyses.forEach((analysis, index) => {
    console.log(`\n  ${index + 1}. 분석 ID: ${analysis.id.substring(0, 8)}...`);
    console.log(`     URL: ${analysis.url}`);
    console.log(`     사용자: ${analysis.email || analysis.user_id?.substring(0, 8) || 'N/A'}...`);
    console.log(`     점수: AEO=${analysis.aeo_score}, GEO=${analysis.geo_score}, SEO=${analysis.seo_score}, 종합=${analysis.overall_score}`);
    console.log(`     생성일: ${analysis.created_at}`);
  });
  
  // 사용자별 분석 이력 통계
  console.log('\n4️⃣ 사용자별 분석 이력 통계');
  const userStats = db.prepare(`
    SELECT 
      u.id,
      u.email,
      COUNT(a.id) as analysis_count,
      MAX(a.created_at) as last_analysis_at
    FROM users u
    LEFT JOIN analyses a ON u.id = a.user_id
    GROUP BY u.id, u.email
    HAVING COUNT(a.id) > 0
    ORDER BY analysis_count DESC
    LIMIT 10
  `).all();
  
  if (userStats.length > 0) {
    console.log('사용자별 분석 이력:');
    userStats.forEach((stat, index) => {
      console.log(`  ${index + 1}. ${stat.email}: ${stat.analysis_count}개 분석 (마지막: ${stat.last_analysis_at})`);
    });
  } else {
    console.log('⚠️ 분석 이력이 있는 사용자가 없습니다.');
  }
} else {
  console.log('⚠️ 분석 이력이 없습니다. 먼저 분석을 수행해주세요.');
}

// 5. 데이터 무결성 확인
console.log('\n5️⃣ 데이터 무결성 확인');
const orphanAnalyses = db.prepare(`
  SELECT COUNT(*) as count 
  FROM analyses a
  LEFT JOIN users u ON a.user_id = u.id
  WHERE a.user_id IS NOT NULL AND u.id IS NULL
`).get();

if (orphanAnalyses.count > 0) {
  console.log(`⚠️ 부모 사용자가 없는 분석 이력: ${orphanAnalyses.count}개`);
} else {
  console.log('✅ 모든 분석 이력이 유효한 사용자와 연결되어 있습니다.');
}

// 6. 인덱스 확인
console.log('\n6️⃣ 인덱스 확인');
const indexes = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='index' AND tbl_name='analyses'
`).all();
console.log(`✅ analyses 테이블 인덱스: ${indexes.map(i => i.name).join(', ') || '없음'}`);

db.close();
console.log('\n✨ 테스트 완료!');
console.log('\n💡 다음 단계:');
console.log('   1. 브라우저에서 로그인');
console.log('   2. URL 분석 수행');
console.log('   3. /history 페이지에서 분석 이력 확인');

