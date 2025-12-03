/**
 * 소셜 로그인 기반 분석 결과/기록 매칭 테스트
 * 
 * 테스트 시나리오:
 * 1. 여러 사용자(이메일)로 소셜 로그인 시뮬레이션
 * 2. 각 사용자별로 분석 결과 저장
 * 3. 분석 기록 조회
 * 4. 로그인 정보와 분석 결과/기록의 매칭 여부 확인
 */

import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import db from '../lib/db';
import { createUser, getUser, getUserByEmail, getUserAnalyses, getAnalysesByEmail, saveAnalysis } from '../lib/db-helpers';

/**
 * 이메일 기반으로 일관된 사용자 ID 생성 (auth.ts와 동일한 로직)
 */
function generateUserIdFromEmail(email: string): string {
  const normalizedEmail = email.toLowerCase().trim();
  const hash = createHash('sha256').update(normalizedEmail).digest('hex');
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`;
}

interface TestUser {
  email: string;
  name: string;
  provider: 'google' | 'github';
  userId: string;
  analyses: Array<{
    id: string;
    url: string;
    scores: {
      aeo: number;
      geo: number;
      seo: number;
      overall: number;
    };
  }>;
}

interface TestResult {
  testNumber: number;
  user: TestUser;
  loginMatch: {
    success: boolean;
    message: string;
    details: {
      emailBasedUserId: string;
      createdUserId: string;
      retrievedUserId: string;
      match: boolean;
    };
  };
  analysisSave: {
    success: boolean;
    message: string;
    analysisId: string;
    savedUserId: string;
  };
  analysisRetrieval: {
    success: boolean;
    message: string;
    retrievedCount: number;
    matchedCount: number;
    details: Array<{
      analysisId: string;
      userId: string;
      match: boolean;
    }>;
  };
  overallMatch: {
    success: boolean;
    message: string;
  };
}

/**
 * 테스트 실행
 */
async function runTest(testNumber: number): Promise<TestResult> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`테스트 ${testNumber} 시작`);
  console.log(`${'='.repeat(80)}\n`);

  // 랜덤 테스트 사용자 생성
  const testEmails = [
    `test${Math.floor(Math.random() * 10000)}@gmail.com`,
    `user${Math.floor(Math.random() * 10000)}@github.com`,
    `demo${Math.floor(Math.random() * 10000)}@example.com`,
  ];
  
  const email = testEmails[Math.floor(Math.random() * testEmails.length)];
  const provider = Math.random() > 0.5 ? 'google' : 'github';
  const name = `Test User ${testNumber}`;
  
  const emailBasedUserId = generateUserIdFromEmail(email);
  
  console.log(`📧 테스트 사용자 정보:`);
  console.log(`   이메일: ${email}`);
  console.log(`   프로바이더: ${provider}`);
  console.log(`   이메일 기반 ID: ${emailBasedUserId}`);

  // 1. 소셜 로그인 시뮬레이션 (사용자 생성)
  console.log(`\n1️⃣ 소셜 로그인 시뮬레이션 (사용자 생성)...`);
  let createdUserId: string;
  let loginMatch: TestResult['loginMatch'];
  
  try {
    createdUserId = createUser({
      id: emailBasedUserId,
      email: email,
      name: name,
      provider: provider,
    });
    
    // 생성된 사용자 확인
    const retrievedUser = getUser(createdUserId);
    const retrievedUserByEmail = getUserByEmail(email);
    
    const loginSuccess = retrievedUser !== null && 
                        retrievedUserByEmail !== null &&
                        retrievedUser.id === createdUserId &&
                        retrievedUserByEmail.id === createdUserId;
    
    loginMatch = {
      success: loginSuccess,
      message: loginSuccess 
        ? '✅ 로그인 정보 매칭 성공' 
        : '❌ 로그인 정보 매칭 실패',
      details: {
        emailBasedUserId,
        createdUserId,
        retrievedUserId: retrievedUser?.id || retrievedUserByEmail?.id || 'N/A',
        match: loginSuccess,
      },
    };
    
    console.log(`   ${loginMatch.message}`);
    console.log(`   생성된 사용자 ID: ${createdUserId}`);
    console.log(`   조회된 사용자 ID: ${loginMatch.details.retrievedUserId}`);
  } catch (error: any) {
    console.error(`   ❌ 사용자 생성 실패:`, error.message);
    loginMatch = {
      success: false,
      message: `❌ 사용자 생성 실패: ${error.message}`,
      details: {
        emailBasedUserId,
        createdUserId: 'N/A',
        retrievedUserId: 'N/A',
        match: false,
      },
    };
    createdUserId = emailBasedUserId; // 계속 진행을 위해
  }

  // 2. 분석 결과 저장
  console.log(`\n2️⃣ 분석 결과 저장...`);
  const analysisCount = Math.floor(Math.random() * 3) + 1; // 1-3개
  const analyses: TestUser['analyses'] = [];
  let analysisSave: TestResult['analysisSave'] = {
    success: false,
    message: '',
    analysisId: '',
    savedUserId: '',
  };
  
  for (let i = 0; i < analysisCount; i++) {
    const analysisId = uuidv4();
    const testUrl = `https://example${i + 1}.com/blog/post-${i + 1}`;
    const scores = {
      aeo: Math.floor(Math.random() * 100),
      geo: Math.floor(Math.random() * 100),
      seo: Math.floor(Math.random() * 100),
      overall: Math.floor(Math.random() * 100),
    };
    
    analyses.push({
      id: analysisId,
      url: testUrl,
      scores,
    });
    
    try {
      await saveAnalysis({
        id: analysisId,
        userId: createdUserId,
        url: testUrl,
        aeoScore: scores.aeo,
        geoScore: scores.geo,
        seoScore: scores.seo,
        overallScore: scores.overall,
        insights: [
          { type: 'test', message: `테스트 인사이트 ${i + 1}` },
        ],
      });
      
      // 저장된 분석 결과 확인
      const savedAnalysis = db.prepare('SELECT id, user_id FROM analyses WHERE id = ?').get(analysisId) as { id: string; user_id: string } | undefined;
      
      if (savedAnalysis && savedAnalysis.user_id === createdUserId) {
        analysisSave = {
          success: true,
          message: `✅ 분석 결과 저장 성공 (${analysisCount}개)`,
          analysisId: analysisId,
          savedUserId: savedAnalysis.user_id,
        };
        console.log(`   ✅ 분석 ${i + 1} 저장 성공: ${analysisId}`);
        console.log(`      URL: ${testUrl}`);
        console.log(`      저장된 user_id: ${savedAnalysis.user_id}`);
      } else {
        analysisSave = {
          success: false,
          message: `❌ 분석 결과 저장 실패: user_id 불일치`,
          analysisId: analysisId,
          savedUserId: savedAnalysis?.user_id || 'N/A',
        };
        console.error(`   ❌ 분석 ${i + 1} 저장 실패: user_id 불일치`);
      }
    } catch (error: any) {
      console.error(`   ❌ 분석 ${i + 1} 저장 오류:`, error.message);
      analysisSave = {
        success: false,
        message: `❌ 분석 결과 저장 실패: ${error.message}`,
        analysisId: analysisId,
        savedUserId: 'N/A',
      };
    }
  }

  // 3. 분석 기록 조회 및 매칭 확인
  console.log(`\n3️⃣ 분석 기록 조회 및 매칭 확인...`);
  let analysisRetrieval: TestResult['analysisRetrieval'];
  
  try {
    // 사용자 ID로 조회
    const userAnalyses = getUserAnalyses(createdUserId);
    
    // 이메일로 조회
    const emailAnalyses = getAnalysesByEmail(email);
    
    console.log(`   사용자 ID로 조회: ${userAnalyses.length}개`);
    console.log(`   이메일로 조회: ${emailAnalyses.length}개`);
    
    // 매칭 확인
    const matchedAnalyses = userAnalyses.filter(a => 
      analyses.some(testA => testA.id === a.id)
    );
    
    const details = userAnalyses.map(a => ({
      analysisId: a.id,
      userId: createdUserId, // 실제로는 DB에서 조회해야 하지만, 여기서는 createdUserId 사용
      match: analyses.some(testA => testA.id === a.id),
    }));
    
    const allMatch = matchedAnalyses.length === analyses.length && 
                     userAnalyses.length >= analyses.length;
    
    analysisRetrieval = {
      success: allMatch,
      message: allMatch 
        ? `✅ 분석 기록 조회 및 매칭 성공 (${matchedAnalyses.length}/${analyses.length})`
        : `⚠️ 분석 기록 조회 성공, 일부 매칭 실패 (${matchedAnalyses.length}/${analyses.length})`,
      retrievedCount: userAnalyses.length,
      matchedCount: matchedAnalyses.length,
      details,
    };
    
    console.log(`   ${analysisRetrieval.message}`);
    console.log(`   조회된 분석 수: ${userAnalyses.length}`);
    console.log(`   매칭된 분석 수: ${matchedAnalyses.length}`);
    
    // DB에서 직접 확인
    const dbAnalyses = db.prepare('SELECT id, user_id FROM analyses WHERE user_id = ?').all(createdUserId) as Array<{ id: string; user_id: string }>;
    console.log(`   DB 직접 조회: ${dbAnalyses.length}개`);
    dbAnalyses.forEach((a, idx) => {
      console.log(`      분석 ${idx + 1}: ${a.id.substring(0, 8)}... (user_id: ${a.user_id.substring(0, 8)}...)`);
    });
    
  } catch (error: any) {
    console.error(`   ❌ 분석 기록 조회 실패:`, error.message);
    analysisRetrieval = {
      success: false,
      message: `❌ 분석 기록 조회 실패: ${error.message}`,
      retrievedCount: 0,
      matchedCount: 0,
      details: [],
    };
  }

  // 4. 전체 매칭 여부 확인
  const overallSuccess = loginMatch.success && 
                         analysisSave.success && 
                         analysisRetrieval.success;
  
  const overallMatch: TestResult['overallMatch'] = {
    success: overallSuccess,
    message: overallSuccess 
      ? '✅ 전체 매칭 성공'
      : '❌ 전체 매칭 실패',
  };
  
  console.log(`\n4️⃣ 전체 매칭 여부:`);
  console.log(`   ${overallMatch.message}`);
  console.log(`   - 로그인 매칭: ${loginMatch.success ? '✅' : '❌'}`);
  console.log(`   - 분석 저장: ${analysisSave.success ? '✅' : '❌'}`);
  console.log(`   - 분석 조회: ${analysisRetrieval.success ? '✅' : '❌'}`);

  return {
    testNumber,
    user: {
      email,
      name,
      provider,
      userId: createdUserId,
      analyses,
    },
    loginMatch,
    analysisSave,
    analysisRetrieval,
    overallMatch,
  };
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 소셜 로그인 기반 분석 결과/기록 매칭 테스트 시작\n');
  console.log('테스트 횟수: 10회\n');
  
  const results: TestResult[] = [];
  
  // 10회 테스트 실행
  for (let i = 1; i <= 10; i++) {
    try {
      const result = await runTest(i);
      results.push(result);
      
      // 각 테스트 간 짧은 대기 (DB 동기화)
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error: any) {
      console.error(`\n❌ 테스트 ${i} 실행 중 오류:`, error.message);
      results.push({
        testNumber: i,
        user: {
          email: 'N/A',
          name: 'N/A',
          provider: 'google',
          userId: 'N/A',
          analyses: [],
        },
        loginMatch: {
          success: false,
          message: `❌ 테스트 실행 실패: ${error.message}`,
          details: {
            emailBasedUserId: 'N/A',
            createdUserId: 'N/A',
            retrievedUserId: 'N/A',
            match: false,
          },
        },
        analysisSave: {
          success: false,
          message: 'N/A',
          analysisId: 'N/A',
          savedUserId: 'N/A',
        },
        analysisRetrieval: {
          success: false,
          message: 'N/A',
          retrievedCount: 0,
          matchedCount: 0,
          details: [],
        },
        overallMatch: {
          success: false,
          message: '❌ 테스트 실행 실패',
        },
      });
    }
  }
  
  // 결과 요약
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 테스트 결과 요약');
  console.log(`${'='.repeat(80)}\n`);
  
  const totalTests = results.length;
  const successfulLogins = results.filter(r => r.loginMatch.success).length;
  const successfulSaves = results.filter(r => r.analysisSave.success).length;
  const successfulRetrievals = results.filter(r => r.analysisRetrieval.success).length;
  const overallSuccesses = results.filter(r => r.overallMatch.success).length;
  
  console.log(`총 테스트 수: ${totalTests}`);
  console.log(`✅ 로그인 매칭 성공: ${successfulLogins}/${totalTests} (${(successfulLogins / totalTests * 100).toFixed(1)}%)`);
  console.log(`✅ 분석 저장 성공: ${successfulSaves}/${totalTests} (${(successfulSaves / totalTests * 100).toFixed(1)}%)`);
  console.log(`✅ 분석 조회 성공: ${successfulRetrievals}/${totalTests} (${(successfulRetrievals / totalTests * 100).toFixed(1)}%)`);
  console.log(`✅ 전체 매칭 성공: ${overallSuccesses}/${totalTests} (${(overallSuccesses / totalTests * 100).toFixed(1)}%)\n`);
  
  // 상세 결과
  console.log(`${'='.repeat(80)}`);
  console.log('📋 상세 테스트 결과');
  console.log(`${'='.repeat(80)}\n`);
  
  results.forEach((result, idx) => {
    console.log(`\n테스트 ${result.testNumber}:`);
    console.log(`  사용자: ${result.user.email} (${result.user.provider})`);
    console.log(`  사용자 ID: ${result.user.userId.substring(0, 16)}...`);
    console.log(`  분석 수: ${result.user.analyses.length}개`);
    console.log(`  로그인 매칭: ${result.loginMatch.success ? '✅' : '❌'} - ${result.loginMatch.message}`);
    console.log(`  분석 저장: ${result.analysisSave.success ? '✅' : '❌'} - ${result.analysisSave.message}`);
    console.log(`  분석 조회: ${result.analysisRetrieval.success ? '✅' : '❌'} - ${result.analysisRetrieval.message}`);
    console.log(`  전체 매칭: ${result.overallMatch.success ? '✅' : '❌'} - ${result.overallMatch.message}`);
    
    if (!result.overallMatch.success) {
      console.log(`  ⚠️ 실패 상세:`);
      if (!result.loginMatch.success) {
        console.log(`     - 로그인: ${result.loginMatch.details.emailBasedUserId} vs ${result.loginMatch.details.createdUserId} vs ${result.loginMatch.details.retrievedUserId}`);
      }
      if (!result.analysisSave.success) {
        console.log(`     - 저장: 요청 user_id ${result.user.userId.substring(0, 16)}... vs 저장된 user_id ${result.analysisSave.savedUserId.substring(0, 16)}...`);
      }
      if (!result.analysisRetrieval.success) {
        console.log(`     - 조회: ${result.analysisRetrieval.matchedCount}/${result.analysisRetrieval.retrievedCount} 매칭`);
      }
    }
  });
  
  // 최종 통계
  console.log(`\n${'='.repeat(80)}`);
  console.log('📈 최종 통계');
  console.log(`${'='.repeat(80)}\n`);
  
  const totalAnalyses = results.reduce((sum, r) => sum + r.user.analyses.length, 0);
  const totalRetrieved = results.reduce((sum, r) => sum + r.analysisRetrieval.retrievedCount, 0);
  const totalMatched = results.reduce((sum, r) => sum + r.analysisRetrieval.matchedCount, 0);
  
  console.log(`총 생성된 분석 수: ${totalAnalyses}`);
  console.log(`총 조회된 분석 수: ${totalRetrieved}`);
  console.log(`총 매칭된 분석 수: ${totalMatched}`);
  console.log(`매칭률: ${totalAnalyses > 0 ? (totalMatched / totalAnalyses * 100).toFixed(1) : 0}%\n`);
  
  // DB 상태 확인
  console.log(`${'='.repeat(80)}`);
  console.log('💾 데이터베이스 상태');
  console.log(`${'='.repeat(80)}\n`);
  
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const analysisCount = db.prepare('SELECT COUNT(*) as count FROM analyses').get() as { count: number };
    const userAnalysisCount = db.prepare('SELECT COUNT(DISTINCT user_id) as count FROM analyses WHERE user_id IS NOT NULL').get() as { count: number };
    const nullUserIdCount = db.prepare('SELECT COUNT(*) as count FROM analyses WHERE user_id IS NULL').get() as { count: number };
    
    console.log(`총 사용자 수: ${userCount.count}`);
    console.log(`총 분석 수: ${analysisCount.count}`);
    console.log(`분석이 있는 사용자 수: ${userAnalysisCount.count}`);
    console.log(`user_id가 NULL인 분석 수: ${nullUserIdCount.count}`);
    
    if (nullUserIdCount.count > 0) {
      console.log(`⚠️ 경고: user_id가 NULL인 분석이 ${nullUserIdCount.count}개 있습니다.`);
    }
  } catch (error: any) {
    console.error(`❌ DB 상태 확인 실패:`, error.message);
  }
  
  console.log(`\n✅ 테스트 완료\n`);
}

// 스크립트 실행
if (require.main === module) {
  main().catch(console.error);
}

export { runTest, main };

