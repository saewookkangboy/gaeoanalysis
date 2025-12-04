#!/usr/bin/env node
/**
 * 사용자 데이터 확인 스크립트
 * 이메일 주소로 사용자의 로그인 이력과 분석 결과를 조회합니다.
 */

import { query } from '../lib/db-adapter';

async function checkUserData(emails: string[]) {
  console.log('🔍 사용자 데이터 확인 시작...\n');

  for (const email of emails) {
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`\n📧 ${email} (${normalizedEmail})`);
    console.log('─'.repeat(60));

    try {
      // 1. 사용자 정보 조회
      const userResult = await query(
        `SELECT id, email, name, provider, role, created_at, last_login_at 
         FROM users 
         WHERE LOWER(TRIM(email)) = $1`,
        [normalizedEmail]
      );

      if (userResult.rows.length === 0) {
        console.log('  ❌ 사용자를 찾을 수 없습니다.');
        continue;
      }

      const user = userResult.rows[0] as any;
      console.log(`  ✅ 사용자 발견:`);
      console.log(`     - ID: ${user.id}`);
      console.log(`     - 이메일: ${user.email}`);
      console.log(`     - 이름: ${user.name || 'N/A'}`);
      console.log(`     - Provider: ${user.provider || 'N/A'}`);
      console.log(`     - Role: ${user.role || 'user'}`);
      console.log(`     - 가입일: ${user.created_at}`);
      console.log(`     - 최근 로그인: ${user.last_login_at || 'N/A'}`);

      const userId = user.id;

      // 2. 로그인 이력 조회
      const authLogsResult = await query(
        `SELECT id, provider, action, success, ip_address, created_at 
         FROM auth_logs 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 10`,
        [userId]
      );

      console.log(`\n  📝 로그인 이력 (최근 ${authLogsResult.rows.length}건):`);
      if (authLogsResult.rows.length === 0) {
        console.log('     - 로그인 이력이 없습니다.');
      } else {
        authLogsResult.rows.forEach((log: any, index: number) => {
          console.log(`     ${index + 1}. ${log.action} (${log.provider}) - ${log.success ? '✅ 성공' : '❌ 실패'} - ${log.created_at}`);
          if (log.ip_address) {
            console.log(`        IP: ${log.ip_address}`);
          }
        });
      }

      // 전체 로그인 이력 수
      const totalLogsResult = await query(
        `SELECT COUNT(*) as count FROM auth_logs WHERE user_id = $1`,
        [userId]
      );
      const totalLogs = parseInt(totalLogsResult.rows[0]?.count as string, 10) || 0;
      console.log(`     총 로그인 이력: ${totalLogs}건`);

      // 3. 분석 결과 조회
      const analysesResult = await query(
        `SELECT id, url, overall_score, aeo_score, geo_score, seo_score, created_at 
         FROM analyses 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 10`,
        [userId]
      );

      console.log(`\n  📊 분석 결과 (최근 ${analysesResult.rows.length}건):`);
      if (analysesResult.rows.length === 0) {
        console.log('     - 분석 결과가 없습니다.');
      } else {
        analysesResult.rows.forEach((analysis: any, index: number) => {
          console.log(`     ${index + 1}. ${analysis.url}`);
          console.log(`        총점: ${analysis.overall_score} | AEO: ${analysis.aeo_score} | GEO: ${analysis.geo_score} | SEO: ${analysis.seo_score}`);
          console.log(`        분석일: ${analysis.created_at}`);
        });
      }

      // 전체 분석 수
      const totalAnalysesResult = await query(
        `SELECT COUNT(*) as count FROM analyses WHERE user_id = $1`,
        [userId]
      );
      const totalAnalyses = parseInt(totalAnalysesResult.rows[0]?.count as string, 10) || 0;
      console.log(`     총 분석 결과: ${totalAnalyses}건`);

      // 4. 오늘의 활동
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayLogsResult = await query(
        `SELECT COUNT(*) as count FROM auth_logs 
         WHERE user_id = $1 AND action = 'login' AND success = 1 AND created_at >= $2`,
        [userId, todayStart.toISOString()]
      );
      const todayLogs = parseInt(todayLogsResult.rows[0]?.count as string, 10) || 0;

      const todayAnalysesResult = await query(
        `SELECT COUNT(*) as count FROM analyses 
         WHERE user_id = $1 AND created_at >= $2`,
        [userId, todayStart.toISOString()]
      );
      const todayAnalyses = parseInt(todayAnalysesResult.rows[0]?.count as string, 10) || 0;

      console.log(`\n  📅 오늘의 활동:`);
      console.log(`     - 로그인: ${todayLogs}회`);
      console.log(`     - 분석: ${todayAnalyses}회`);

    } catch (error: any) {
      console.error(`  ❌ 오류 발생: ${error.message}`);
    }
  }

  console.log('\n✅ 확인 완료!\n');
}

// 스크립트 실행
const emails = process.argv.slice(2);

if (emails.length === 0) {
  console.log('사용법: npx tsx scripts/check-user-data.ts <email1> <email2> ...');
  console.log('예시: npx tsx scripts/check-user-data.ts chunghyo@troe.kr chunghyo@kakao.com');
  process.exit(1);
}

checkUserData(emails)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 스크립트 실행 오류:', error);
    process.exit(1);
  });

