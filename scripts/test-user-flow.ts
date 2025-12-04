/**
 * 모의 사용자 데이터 100명을 대상으로 전체 플로우 테스트
 * - 소셜 로그인
 * - 분석 진행 후 분석 결과, 분석 기록
 * - 로그아웃
 */

import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { createUser, getUser, getUserAnalyses, saveAnalysis, saveAuthLog } from '../lib/db-helpers';
import { isPostgreSQL, isSQLite } from '../lib/db-adapter';
import { query } from '../lib/db-adapter';

// 테스트 환경 설정
const TEST_ENV = process.env.TEST_ENV || 'localhost'; // 'localhost' 또는 'production'
const BASE_URL = TEST_ENV === 'production' 
  ? process.env.AUTH_URL || process.env.NEXTAUTH_URL || 'https://gaeoanalysis.vercel.app'
  : 'http://localhost:3000';

// 모의 사용자 데이터 생성
interface MockUser {
  id: string;
  email: string;
  name: string;
  provider: 'google' | 'github';
  image?: string;
}

function generateMockUsers(count: number): MockUser[] {
  const users: MockUser[] = [];
  const providers: ('google' | 'github')[] = ['google', 'github'];
  
  for (let i = 0; i < count; i++) {
    const provider = providers[i % 2]; // 번갈아가며 Google과 GitHub
    const email = `testuser${i + 1}@example.com`;
    const name = `Test User ${i + 1}`;
    
    // Provider별 독립적인 사용자 ID 생성 (auth.ts와 동일한 로직)
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedProvider = provider.toLowerCase().trim();
    const combinedKey = `${normalizedEmail}:${normalizedProvider}`;
    const hash = createHash('sha256').update(combinedKey).digest('hex');
    const id = `${hash.substring(0, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`;
    
    users.push({
      id,
      email,
      name,
      provider,
      image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 1}`,
    });
  }
  
  return users;
}

// 모의 분석 결과 생성
function generateMockAnalysis(userId: string, urlIndex: number) {
  const baseUrl = `https://example${urlIndex}.com`;
  const aeoScore = Math.floor(Math.random() * 40) + 60; // 60-100
  const geoScore = Math.floor(Math.random() * 40) + 60;
  const seoScore = Math.floor(Math.random() * 40) + 60;
  const overallScore = (aeoScore + geoScore + seoScore) / 3;
  
  return {
    id: uuidv4(),
    userId,
    url: baseUrl,
    aeoScore,
    geoScore,
    seoScore,
    overallScore,
    insights: [
      { type: 'strength', content: '콘텐츠가 잘 구성되어 있습니다.' },
      { type: 'improvement', content: '메타 태그를 개선할 수 있습니다.' },
    ],
    aioScores: {
      chatgpt: Math.floor(Math.random() * 20) + 80,
      perplexity: Math.floor(Math.random() * 20) + 80,
      gemini: Math.floor(Math.random() * 20) + 80,
      claude: Math.floor(Math.random() * 20) + 80,
    },
  };
}

// 테스트 결과 인터페이스
interface TestResult {
  userId: string;
  email: string;
  provider: string;
  loginSuccess: boolean;
  userCreated: boolean;
  analysesCreated: number;
  analysesRetrieved: number;
  logoutSuccess: boolean;
  errors: string[];
}

// 단일 사용자 플로우 테스트
async function testUserFlow(user: MockUser, analysisCount: number = 3): Promise<TestResult> {
  const result: TestResult = {
    userId: user.id,
    email: user.email,
    provider: user.provider,
    loginSuccess: false,
    userCreated: false,
    analysesCreated: 0,
    analysesRetrieved: 0,
    logoutSuccess: false,
    errors: [],
  };
  
  try {
    // 1. 소셜 로그인 시뮬레이션 (사용자 생성/업데이트)
    console.log(`\n🔐 [${user.email}] 소셜 로그인 시뮬레이션 시작...`);
    
    try {
      const createdUserId = await createUser({
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        provider: user.provider,
      });
      
      if (createdUserId) {
        result.userCreated = true;
        result.loginSuccess = true;
        console.log(`✅ [${user.email}] 사용자 생성/업데이트 완료: ${createdUserId}`);
        
        // 로그인 이력 저장
        try {
          await saveAuthLog({
            id: uuidv4(),
            userId: createdUserId,
            provider: user.provider,
            action: 'login',
            success: true,
          });
          console.log(`✅ [${user.email}] 로그인 이력 저장 완료`);
        } catch (logError: any) {
          result.errors.push(`로그인 이력 저장 실패: ${logError.message}`);
          console.warn(`⚠️ [${user.email}] 로그인 이력 저장 실패:`, logError.message);
        }
      } else {
        result.errors.push('사용자 생성 실패: createUser가 null 반환');
        console.error(`❌ [${user.email}] 사용자 생성 실패`);
      }
    } catch (createError: any) {
      result.errors.push(`사용자 생성 오류: ${createError.message}`);
      console.error(`❌ [${user.email}] 사용자 생성 오류:`, createError.message);
      return result; // 사용자 생성 실패 시 중단
    }
    
    // 사용자 확인
    const createdUser = await getUser(user.id);
    if (!createdUser) {
      result.errors.push('사용자 조회 실패: 생성 후 조회 불가');
      console.error(`❌ [${user.email}] 사용자 조회 실패`);
      return result;
    }
    
    console.log(`✅ [${user.email}] 사용자 확인 완료:`, {
      id: createdUser.id,
      email: createdUser.email,
      provider: createdUser.provider,
      lastLoginAt: createdUser.lastLoginAt,
    });
    
    // 2. 분석 진행 및 결과 저장
    console.log(`\n📊 [${user.email}] 분석 진행 및 결과 저장 시작...`);
    
    const analysisIds: string[] = [];
    
    for (let i = 0; i < analysisCount; i++) {
      try {
        const analysis = generateMockAnalysis(user.id, i + 1);
        
        console.log(`  📝 [${user.email}] 분석 ${i + 1}/${analysisCount} 저장 시도:`, {
          url: analysis.url,
          overallScore: analysis.overallScore,
        });
        
        const savedId = await saveAnalysis({
          id: analysis.id,
          userId: analysis.userId,
          url: analysis.url,
          aeoScore: analysis.aeoScore,
          geoScore: analysis.geoScore,
          seoScore: analysis.seoScore,
          overallScore: analysis.overallScore,
          insights: analysis.insights,
          aioScores: analysis.aioScores,
        });
        
        if (savedId) {
          analysisIds.push(savedId);
          result.analysesCreated++;
          console.log(`  ✅ [${user.email}] 분석 ${i + 1}/${analysisCount} 저장 완료: ${savedId}`);
        } else {
          result.errors.push(`분석 ${i + 1} 저장 실패: saveAnalysis가 null 반환`);
          console.error(`  ❌ [${user.email}] 분석 ${i + 1}/${analysisCount} 저장 실패`);
        }
      } catch (analysisError: any) {
        result.errors.push(`분석 ${i + 1} 저장 오류: ${analysisError.message}`);
        console.error(`  ❌ [${user.email}] 분석 ${i + 1}/${analysisCount} 저장 오류:`, analysisError.message);
      }
    }
    
    // 3. 분석 기록 조회 확인
    console.log(`\n📋 [${user.email}] 분석 기록 조회 확인...`);
    
    try {
      // 저장 후 즉시 조회 (PostgreSQL 실시간 동기화 확인)
      let userAnalyses = await getUserAnalyses(user.id, { limit: 100 });
      
      // 최대 3회 재시도 (트랜잭션 커밋 지연 대응)
      let retryCount = 0;
      const maxRetries = 3;
      
      while (userAnalyses.length < result.analysesCreated && retryCount < maxRetries) {
        if (retryCount > 0) {
          await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
        }
        userAnalyses = await getUserAnalyses(user.id, { limit: 100 });
        retryCount++;
      }
      
      result.analysesRetrieved = userAnalyses.length;
      
      if (userAnalyses.length >= result.analysesCreated) {
        console.log(`✅ [${user.email}] 분석 기록 조회 성공:`, {
          저장된_분석_수: result.analysesCreated,
          조회된_분석_수: userAnalyses.length,
          재시도_횟수: retryCount,
        });
        
        // 저장된 분석 ID 확인
        const savedAnalysisIds = userAnalyses.map(a => a.id);
        const missingAnalyses = analysisIds.filter(id => !savedAnalysisIds.includes(id));
        
        if (missingAnalyses.length > 0) {
          result.errors.push(`일부 분석이 조회되지 않음: ${missingAnalyses.join(', ')}`);
          console.warn(`⚠️ [${user.email}] 일부 분석이 조회되지 않음:`, missingAnalyses);
        }
      } else {
        result.errors.push(`분석 기록 조회 불완전: 저장 ${result.analysesCreated}개, 조회 ${userAnalyses.length}개`);
        console.warn(`⚠️ [${user.email}] 분석 기록 조회 불완전:`, {
          저장된_분석_수: result.analysesCreated,
          조회된_분석_수: userAnalyses.length,
        });
      }
    } catch (retrieveError: any) {
      result.errors.push(`분석 기록 조회 오류: ${retrieveError.message}`);
      console.error(`❌ [${user.email}] 분석 기록 조회 오류:`, retrieveError.message);
    }
    
    // 4. 로그아웃 시뮬레이션
    console.log(`\n🚪 [${user.email}] 로그아웃 시뮬레이션...`);
    
    try {
      await saveAuthLog({
        id: uuidv4(),
        userId: user.id,
        provider: user.provider,
        action: 'logout',
        success: true,
      });
      
      result.logoutSuccess = true;
      console.log(`✅ [${user.email}] 로그아웃 이력 저장 완료`);
    } catch (logoutError: any) {
      result.errors.push(`로그아웃 이력 저장 실패: ${logoutError.message}`);
      console.warn(`⚠️ [${user.email}] 로그아웃 이력 저장 실패:`, logoutError.message);
    }
    
    console.log(`\n✅ [${user.email}] 전체 플로우 테스트 완료`);
    
  } catch (error: any) {
    result.errors.push(`전체 플로우 오류: ${error.message}`);
    console.error(`❌ [${user.email}] 전체 플로우 오류:`, error.message);
  }
  
  return result;
}

// 전체 테스트 실행
async function runTests() {
  console.log('🚀 모의 사용자 데이터 100명 전체 플로우 테스트 시작\n');
  console.log(`📌 테스트 환경: ${TEST_ENV}`);
  console.log(`📌 Base URL: ${BASE_URL}`);
  console.log(`📌 데이터베이스: ${isPostgreSQL() ? 'PostgreSQL' : 'SQLite'}\n`);
  
  // 모의 사용자 생성
  const users = generateMockUsers(100);
  console.log(`✅ 모의 사용자 100명 생성 완료\n`);
  
  // 테스트 결과 수집
  const results: TestResult[] = [];
  const startTime = Date.now();
  
  // 병렬 처리 (동시에 10명씩 처리)
  const batchSize = 10;
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(users.length / batchSize);
    
    console.log(`\n📦 배치 ${batchNumber}/${totalBatches} 처리 중 (${batch.length}명)...`);
    
    const batchResults = await Promise.all(
      batch.map(user => testUserFlow(user, 3)) // 사용자당 3개의 분석 생성
    );
    
    results.push(...batchResults);
    
    // 배치 간 짧은 대기 (DB 부하 방지)
    if (i + batchSize < users.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // 결과 요약
  // 결과를 파일로도 저장
  const fs = require('fs');
  const path = require('path');
  const resultsDir = path.join(process.cwd(), 'test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFile = path.join(resultsDir, `test-results-${TEST_ENV}-${timestamp}.json`);
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\n💾 테스트 결과 저장: ${resultsFile}`);
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 테스트 결과 요약');
  console.log('='.repeat(80));
  
  const totalUsers = results.length;
  const successfulLogins = results.filter(r => r.loginSuccess).length;
  const successfulUserCreation = results.filter(r => r.userCreated).length;
  const totalAnalysesCreated = results.reduce((sum, r) => sum + r.analysesCreated, 0);
  const totalAnalysesRetrieved = results.reduce((sum, r) => sum + r.analysesRetrieved, 0);
  const successfulLogouts = results.filter(r => r.logoutSuccess).length;
  const usersWithErrors = results.filter(r => r.errors.length > 0).length;
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  
  console.log(`\n✅ 성공 통계:`);
  console.log(`   - 총 사용자: ${totalUsers}명`);
  console.log(`   - 로그인 성공: ${successfulLogins}/${totalUsers} (${((successfulLogins / totalUsers) * 100).toFixed(1)}%)`);
  console.log(`   - 사용자 생성 성공: ${successfulUserCreation}/${totalUsers} (${((successfulUserCreation / totalUsers) * 100).toFixed(1)}%)`);
  console.log(`   - 분석 생성 성공: ${totalAnalysesCreated}개 (목표: ${totalUsers * 3}개, ${((totalAnalysesCreated / (totalUsers * 3)) * 100).toFixed(1)}%)`);
  console.log(`   - 분석 조회 성공: ${totalAnalysesRetrieved}개 (${((totalAnalysesRetrieved / totalAnalysesCreated) * 100).toFixed(1)}%)`);
  console.log(`   - 로그아웃 성공: ${successfulLogouts}/${totalUsers} (${((successfulLogouts / totalUsers) * 100).toFixed(1)}%)`);
  console.log(`\n⏱️  소요 시간: ${duration}초`);
  console.log(`   - 평균 사용자당: ${(parseFloat(duration) / totalUsers).toFixed(2)}초`);
  
  if (usersWithErrors > 0) {
    console.log(`\n❌ 오류 통계:`);
    console.log(`   - 오류 발생 사용자: ${usersWithErrors}/${totalUsers} (${((usersWithErrors / totalUsers) * 100).toFixed(1)}%)`);
    console.log(`   - 총 오류 수: ${totalErrors}개`);
    
    // 주요 오류 유형별 통계
    const errorTypes: { [key: string]: number } = {};
    results.forEach(r => {
      r.errors.forEach(err => {
        const errorType = err.split(':')[0];
        errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
      });
    });
    
    console.log(`\n   주요 오류 유형:`);
    Object.entries(errorTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([type, count]) => {
        console.log(`     - ${type}: ${count}회`);
      });
    
    // 오류가 있는 사용자 상세 정보
    console.log(`\n   오류가 있는 사용자 (최대 10명):`);
    results
      .filter(r => r.errors.length > 0)
      .slice(0, 10)
      .forEach(r => {
        console.log(`     - ${r.email} (${r.provider}): ${r.errors.length}개 오류`);
        r.errors.slice(0, 2).forEach(err => {
          console.log(`       • ${err}`);
        });
      });
  } else {
    console.log(`\n✅ 모든 테스트 성공! 오류 없음`);
  }
  
  // 데이터베이스 상태 확인
  console.log(`\n📊 데이터베이스 상태 확인:`);
  try {
    if (isPostgreSQL()) {
      const userCount = await query('SELECT COUNT(*) as count FROM users');
      const analysisCount = await query('SELECT COUNT(*) as count FROM analyses');
      const authLogCount = await query('SELECT COUNT(*) as count FROM auth_logs');
      
      console.log(`   - 총 사용자 수: ${parseInt(userCount.rows[0]?.count as string, 10) || 0}명`);
      console.log(`   - 총 분석 수: ${parseInt(analysisCount.rows[0]?.count as string, 10) || 0}개`);
      console.log(`   - 총 인증 로그 수: ${parseInt(authLogCount.rows[0]?.count as string, 10) || 0}개`);
    } else {
      const db = require('../lib/db').default;
      const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
      const analysisCount = db.prepare('SELECT COUNT(*) as count FROM analyses').get() as { count: number };
      const authLogCount = db.prepare('SELECT COUNT(*) as count FROM auth_logs').get() as { count: number };
      
      console.log(`   - 총 사용자 수: ${userCount.count}명`);
      console.log(`   - 총 분석 수: ${analysisCount.count}개`);
      console.log(`   - 총 인증 로그 수: ${authLogCount.count}개`);
    }
  } catch (dbError: any) {
    console.warn(`   ⚠️ 데이터베이스 상태 확인 실패: ${dbError.message}`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✨ 테스트 완료\n');
  
  // 성공률에 따른 종료 코드
  const successRate = (successfulLogins / totalUsers) * 100;
  if (successRate < 90) {
    console.error('❌ 테스트 실패: 성공률이 90% 미만입니다.');
    process.exit(1);
  } else {
    console.log('✅ 테스트 성공: 성공률이 90% 이상입니다.');
    process.exit(0);
  }
}

// 스크립트 실행
if (require.main === module) {
  runTests().catch((error) => {
    console.error('❌ 테스트 실행 오류:', error);
    process.exit(1);
  });
}

export { runTests, testUserFlow, generateMockUsers };

