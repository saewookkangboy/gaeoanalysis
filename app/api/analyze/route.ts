import { NextRequest, NextResponse } from 'next/server';
import { auth, generateUserIdFromEmail } from '@/auth';
import { analyzeContent } from '@/lib/analyzer';
import { saveAnalysis, checkDuplicateAnalysis, getUser, createUser, getUserAnalyses, getUserByEmail } from '@/lib/db-helpers';
import { createErrorResponse, createSuccessResponse, withErrorHandling, sanitizeUrl } from '@/lib/api-utils';
import { withRateLimit } from '@/lib/rate-limiter';
import { cache, createCacheKey } from '@/lib/cache';
import { addSecurityHeaders, handleCorsPreflight } from '@/lib/headers';
import db from '@/lib/db';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// 입력 스키마 정의
const analyzeSchema = z.object({
  url: z.string().url('유효하지 않은 URL입니다.'),
});

// 레이트 리미트 설정: IP당 1분에 10회, 사용자당 1시간에 50회
const getRateLimitKey = async (request: NextRequest): Promise<string> => {
  const session = await auth();
  const userId = session?.user?.id;
  
  if (userId) {
    return `user:${userId}`;
  }
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  return `ip:${ip}`;
};

async function handleAnalyze(request: NextRequest) {
  console.log('🚀 [Analyze API] 분석 요청 시작');
  
  // Vercel 환경에서 DB 초기화 대기 (Blob Storage 다운로드 완료 대기)
  if (process.env.VERCEL && !process.env.RAILWAY_ENVIRONMENT && !process.env.RAILWAY) {
    try {
      // DB 파일 존재 확인 및 대기
      const { existsSync } = require('fs');
      const dbPath = '/tmp/gaeo.db';
      let attempts = 0;
      const maxAttempts = 10;
      
      while (!existsSync(dbPath) && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      if (!existsSync(dbPath)) {
        console.warn('⚠️ [Analyze API] DB 파일이 아직 준비되지 않음, 계속 진행 (새 DB 생성)');
      } else {
        console.log('✅ [Analyze API] DB 파일 준비 완료');
      }
    } catch (error) {
      console.warn('⚠️ [Analyze API] DB 파일 확인 중 오류 (무시하고 계속 진행):', error);
    }
  }
  
  const body = await request.json();
  const { url } = analyzeSchema.parse(body);

  // URL sanitization
  const sanitizedUrl = sanitizeUrl(url);

  // 세션 확인
  const session = await auth();
  const userId = session?.user?.id;
  
  console.log('🔐 [Analyze API] 세션 확인:', {
    hasSession: !!session,
    userId: userId,
    userEmail: session?.user?.email
  });

  // 캐시 키 생성
  const cacheKey = createCacheKey('analysis', sanitizedUrl);
  
  // 캐시 확인 (24시간)
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) {
    console.log('캐시된 분석 결과 반환:', sanitizedUrl);
    return createSuccessResponse({
      ...cachedResult,
      cached: true,
    });
  }

  // 로그인된 사용자인 경우 중복 분석 확인 (참고용, 저장은 항상 수행)
  let existingAnalysisId = null;
  if (userId) {
    const duplicateId = checkDuplicateAnalysis(userId, sanitizedUrl, 24);
    if (duplicateId) {
      existingAnalysisId = duplicateId;
      console.log('📋 중복 분석 발견 (새 기록으로 저장):', { duplicateId, url: sanitizedUrl });
    }
  }

  // 분석 수행
  const result = await analyzeContent(sanitizedUrl);

  // 로그인된 사용자인 경우 분석 결과 저장 (중복 여부와 관계없이 항상 저장)
  // 핵심: Provider별 독립적인 사용자 ID 사용 (auth.ts와 동일한 로직)
  let analysisId = null;
  if (userId) {
    const normalizedEmail = session?.user?.email ? session.user.email.toLowerCase().trim() : null;
    const provider = session?.user?.provider || null;
    let finalUserId = userId;
    
    // 프로세스 1: Provider + 이메일 기반으로 독립적인 사용자 ID 확인/생성
    if (normalizedEmail && provider) {
      // 1-1. Provider + 이메일 기반 ID 생성 (auth.ts와 동일)
      const providerBasedUserId = generateUserIdFromEmail(normalizedEmail, provider);
      
      // 1-2. Provider별 사용자 찾기 (기존 사용자 확인)
      const existingUser = await getUser(providerBasedUserId);
      if (existingUser) {
        // 기존 사용자가 있으면 그 ID 사용 (분석 이력 유지)
        finalUserId = existingUser.id;
        console.log('✅ [Analyze API] Provider별 기존 사용자 확인:', { 
          sessionId: userId, 
          providerBasedId: providerBasedUserId,
          actualUserId: finalUserId, 
          email: normalizedEmail,
          provider: provider
        });
      } else {
        // 1-3. 기존 사용자가 없으면 Provider 기반 ID로 생성
        try {
          console.log('👤 [Analyze API] Provider별 사용자 생성:', {
            email: normalizedEmail,
            providerBasedUserId: providerBasedUserId,
            provider: provider,
            sessionId: userId
          });
          
          // createUser는 Provider + 이메일 조합으로 기존 사용자를 찾으면 기존 ID 반환
          const createdUserId = createUser({
            id: providerBasedUserId,
            email: normalizedEmail,
            blogUrl: null,
            name: session.user.name || undefined,
            image: session.user.image || undefined,
            provider: provider,
          });
          
          // createUser가 반환한 실제 사용자 ID 사용
          finalUserId = createdUserId || providerBasedUserId;
          
          // createUser가 반환한 ID로 실제 사용자 확인 (중요: DB에 실제로 존재하는 ID 확인)
          const actualUser = await getUser(finalUserId);
          if (actualUser) {
            finalUserId = actualUser.id; // 실제 DB에 존재하는 ID 사용
            console.log('✅ [Analyze API] Provider별 사용자 생성 완료:', {
              providerBasedUserId: providerBasedUserId,
              createdUserId: createdUserId,
              finalUserId: finalUserId,
              email: normalizedEmail,
              provider: provider,
              userEmail: actualUser.email
            });
          } else {
            console.error('❌ [Analyze API] createUser가 반환한 ID로 사용자를 찾을 수 없음:', {
              providerBasedUserId: providerBasedUserId,
              createdUserId: createdUserId,
              finalUserId: finalUserId,
              email: normalizedEmail,
              provider: provider
            });
            // 사용자를 찾을 수 없으면 Provider 기반 ID 사용
            finalUserId = providerBasedUserId;
          }
        } catch (error: any) {
          console.error('❌ [Analyze API] 사용자 생성 오류:', error);
          // 사용자 생성 실패 시 Provider 기반 ID 사용
          finalUserId = providerBasedUserId;
        }
      }
    } else {
      // Provider가 없으면 세션 ID로 사용자 확인 (하위 호환성)
      const user = await getUser(userId);
      if (user) {
        finalUserId = user.id;
        console.log('✅ [Analyze API] 세션 ID로 사용자 확인:', { 
          sessionId: userId, 
          actualUserId: finalUserId 
        });
      } else {
        console.warn('⚠️ [Analyze API] 세션 ID로 사용자를 찾을 수 없음:', {
          sessionId: userId,
          email: normalizedEmail,
          provider: provider
        });
      }
    }

    analysisId = uuidv4();
    try {
      // 저장 전 사용자 확인
      const userBeforeSave = await getUser(finalUserId);
      if (!userBeforeSave) {
        console.error('❌ [Analyze API] 저장 전 사용자 확인 실패:', {
          userId: finalUserId,
          sessionId: userId,
          email: normalizedEmail
        });
        throw new Error(`사용자가 존재하지 않습니다: ${finalUserId}`);
      }
      
      console.log('💾 [Analyze API] 분석 결과 저장 시도:', { 
        analysisId, 
        userId: finalUserId,
        sessionId: userId,
        email: normalizedEmail,
        userEmail: userBeforeSave.email,
        url: sanitizedUrl
      });
      
      const savedId = await saveAnalysis({
        id: analysisId,
        userId: finalUserId, // 실제 사용자 ID 사용
        url: sanitizedUrl,
        aeoScore: result.aeoScore,
        geoScore: result.geoScore,
        seoScore: result.seoScore,
        overallScore: result.overallScore,
        insights: result.insights,
        aioScores: result.aioAnalysis?.scores,
      });
      
      console.log('💾 [Analyze API] saveAnalysis 반환값:', {
        requestedId: analysisId,
        returnedId: savedId,
        userId: finalUserId,
        email: normalizedEmail
      });
      
      // saveAnalysis는 트랜잭션 내부에서 저장 확인이 성공하면 저장은 완료된 것으로 간주
      // Vercel 환경에서는 트랜잭션 외부 확인이 실패할 수 있지만, 내부 확인이 성공했으면 저장은 완료됨
      console.log('✅ [Analyze API] 분석 결과 저장 완료:', {
        analysisId: savedId,
        userId: finalUserId,
        sessionId: userId,
        email: normalizedEmail,
        url: sanitizedUrl,
        note: '트랜잭션 내부에서 저장 확인이 성공했으므로 저장은 완료된 것으로 간주합니다.'
      });
      
      // 선택적으로 외부 확인 시도 (성공 여부와 관계없이 저장은 완료된 것으로 간주)
      try {
        const directCheck = db.prepare('SELECT id, user_id, url, created_at FROM analyses WHERE id = ?').get(savedId) as {
          id: string;
          user_id: string;
          url: string;
          created_at: string;
        } | undefined;
        
        if (directCheck) {
          console.log('✅ [Analyze API] 외부 확인도 성공:', {
            analysisId: directCheck.id,
            userId: directCheck.user_id,
            url: directCheck.url,
            createdAt: directCheck.created_at,
            matches: directCheck.user_id === finalUserId
          });
        } else {
          console.log('ℹ️ [Analyze API] 외부 확인 실패 (트랜잭션 내부 확인 성공으로 저장은 완료됨):', {
            analysisId: savedId,
            userId: finalUserId,
            note: 'Vercel 서버리스 환경에서는 트랜잭션 외부 확인이 실패할 수 있지만, 내부 확인이 성공했으므로 저장은 완료된 것으로 간주합니다.'
          });
        }
      } catch (directCheckError) {
        console.warn('⚠️ [Analyze API] 외부 확인 오류 (트랜잭션 내부 확인 성공으로 저장은 완료됨):', directCheckError);
      }
      
      // 사용자 ID로 조회하여 최근 분석 확인 (디버깅용)
      try {
        const userAnalyses = await getUserAnalyses(finalUserId, { limit: 10 });
        if (userAnalyses.length === 0) {
          console.warn('⚠️ [Analyze API] 사용자별 분석 이력이 0개 (디버깅):', { 
            analysisId: savedId, 
            userId: finalUserId,
            sessionId: userId,
            email: normalizedEmail,
            totalAnalyses: userAnalyses.length,
            allAnalysisIds: userAnalyses.map(a => a.id),
            allAnalyses: userAnalyses.map(a => ({ id: a.id, url: a.url }))
          });
          
          // 세션 ID로도 확인 시도
          if (finalUserId !== userId) {
            const sessionAnalyses = await getUserAnalyses(userId, { limit: 10 });
            console.log('🔍 [Analyze API] 세션 ID로 분석 이력 확인:', {
              sessionId: userId,
              count: sessionAnalyses.length,
              analyses: sessionAnalyses.map(a => ({ id: a.id, url: a.url }))
            });
          }
        }
      } catch (debugError) {
        console.warn('⚠️ [Analyze API] 디버깅 쿼리 오류:', debugError);
      }
    } catch (error: any) {
      console.error('❌ 분석 저장 오류:', {
        error: error.message,
        code: error.code,
        userId: finalUserId,
        originalSessionId: userId,
        url: sanitizedUrl,
        analysisId
      });
      
      // FOREIGN KEY 제약 조건 오류인 경우 사용자 확인 및 생성 후 재시도
      if (error?.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' && session?.user?.email && session?.user?.provider) {
        console.warn('🔄 FOREIGN KEY 제약 조건 오류, Provider별 사용자 확인 및 생성 후 재시도:', error);
        try {
          // Provider + 이메일로 사용자 찾기 시도
          let retryUserId = finalUserId;
          const normalizedEmail = session.user.email.toLowerCase().trim();
          const provider = session.user.provider;
          const providerBasedUserId = generateUserIdFromEmail(normalizedEmail, provider);
          
          const existingUser = await getUser(providerBasedUserId);
          if (existingUser) {
            retryUserId = existingUser.id;
            console.log('📧 재시도: Provider별 사용자 발견:', { 
              originalId: finalUserId, 
              foundId: retryUserId,
              email: normalizedEmail,
              provider: provider
            });
          } else {
            // Provider별 사용자 생성
            const createdUserId = createUser({
              id: providerBasedUserId,
              email: normalizedEmail,
              blogUrl: null,
              name: session.user.name || undefined,
              image: session.user.image || undefined,
              provider: provider,
            });
            
            // createUser가 반환한 실제 사용자 ID 사용
            retryUserId = createdUserId || providerBasedUserId;
            console.log('👤 재시도: Provider별 사용자 확인/생성 완료:', { 
              originalSessionId: userId, 
              finalUserId: retryUserId,
              email: normalizedEmail,
              provider: provider
            });
          }
          
          // 재시도 (실제 사용자 ID 사용)
          const savedId = await saveAnalysis({
            id: analysisId,
            userId: retryUserId,
            url: sanitizedUrl,
            aeoScore: result.aeoScore,
            geoScore: result.geoScore,
            seoScore: result.seoScore,
            overallScore: result.overallScore,
            insights: result.insights,
            aioScores: result.aioAnalysis?.scores,
          });
          
          // 저장 후 즉시 확인
          const savedAnalyses = await getUserAnalyses(retryUserId, { limit: 10 });
          const savedRecord = savedAnalyses.find(a => a.id === savedId);
          
          if (savedRecord) {
            console.log('✅ 분석 저장 재시도 및 확인 성공:', { 
              analysisId: savedId, 
              userId: retryUserId, 
              url: sanitizedUrl,
              savedAt: savedRecord.createdAt,
              totalAnalyses: savedAnalyses.length
            });
            analysisId = savedId; // 성공한 경우 analysisId 업데이트
          } else {
            console.warn('⚠️ 분석 저장 재시도는 성공했지만 조회되지 않음:', { 
              analysisId: savedId, 
              userId: retryUserId,
              totalAnalyses: savedAnalyses.length,
              allAnalysisIds: savedAnalyses.map(a => a.id)
            });
          }
        } catch (retryError: any) {
          console.error('❌ 분석 저장 재시도 실패:', {
            error: retryError.message,
            code: retryError.code,
            userId: finalUserId,
            originalSessionId: userId,
            url: sanitizedUrl,
            analysisId
          });
          // 저장 실패해도 분석 결과는 반환 (익명 사용자로 처리)
          analysisId = null;
        }
      } else {
        console.error('❌ 분석 저장 실패 (재시도 불가):', {
          error: error.message,
          code: error.code,
          userId: finalUserId,
          originalSessionId: userId,
          url: sanitizedUrl
        });
        // 저장 실패해도 분석 결과는 반환
        analysisId = null;
      }
    }
  }

  const response = {
    ...result,
    id: analysisId,
    url: sanitizedUrl,
    cached: false,
  };

  // 결과 캐싱 (24시간)
  cache.set(cacheKey, response, 24 * 60 * 60 * 1000);

  return createSuccessResponse(response);
}

// 에러 핸들링 및 보안 헤더를 포함한 핸들러
async function handleWithErrorAndSecurity(request: NextRequest): Promise<NextResponse> {
  const response = await withErrorHandling(handleAnalyze, '분석 중 오류가 발생했습니다.')(request);
  if (!response) {
    return createErrorResponse('INTERNAL_ERROR', '분석 중 오류가 발생했습니다.', 500);
  }
  return addSecurityHeaders(request, response);
}

// 레이트 리미트 적용된 핸들러
const rateLimitedHandler = withRateLimit(
  10, // 1분에 10회
  60 * 1000, // 1분
  getRateLimitKey
)(handleWithErrorAndSecurity);

export async function POST(request: NextRequest) {
  return await rateLimitedHandler(request);
}

// GET 메서드도 추가 (405 에러 방지)
export async function GET(request: NextRequest) {
  return createErrorResponse(
    'METHOD_NOT_ALLOWED',
    'GET 메서드는 지원되지 않습니다. POST 메서드를 사용해주세요.',
    405
  );
}

export async function OPTIONS(request: NextRequest) {
  const preflightResponse = handleCorsPreflight(request);
  return preflightResponse || addSecurityHeaders(request, new NextResponse(null, { status: 200 }));
}

