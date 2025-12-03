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
  // 핵심: 이메일 기반으로 일관된 사용자 ID 사용 (auth.ts와 동일한 로직)
  let analysisId = null;
  if (userId) {
    const normalizedEmail = session?.user?.email ? session.user.email.toLowerCase().trim() : null;
    let finalUserId = userId;
    
    // 프로세스 1: 이메일 기반으로 일관된 사용자 ID 확인/생성
    if (normalizedEmail) {
      // 1-1. 이메일 기반 ID 생성 (auth.ts와 동일)
      const emailBasedUserId = generateUserIdFromEmail(normalizedEmail);
      
      // 1-2. 이메일로 사용자 찾기 (기존 사용자 확인)
      const userByEmail = getUserByEmail(normalizedEmail);
      if (userByEmail) {
        // 기존 사용자가 있으면 그 ID 사용 (분석 이력 유지)
        finalUserId = userByEmail.id;
        console.log('✅ [Analyze API] 이메일로 기존 사용자 확인:', { 
          sessionId: userId, 
          emailBasedId: emailBasedUserId,
          actualUserId: finalUserId, 
          email: normalizedEmail 
        });
      } else {
        // 1-3. 기존 사용자가 없으면 이메일 기반 ID로 생성
        try {
          const provider = session.user.provider || (session as any).account?.provider || null;
          
          console.log('👤 [Analyze API] 이메일 기반 ID로 사용자 생성:', {
            email: normalizedEmail,
            emailBasedUserId: emailBasedUserId,
            sessionId: userId
          });
          
          // createUser는 이메일로 기존 사용자를 찾으면 기존 ID 반환
          const createdUserId = createUser({
            id: emailBasedUserId,
            email: normalizedEmail,
            blogUrl: null,
            name: session.user.name || undefined,
            image: session.user.image || undefined,
            provider: provider,
          });
          
          // createUser가 반환한 실제 사용자 ID 사용
          finalUserId = createdUserId || emailBasedUserId;
          console.log('✅ [Analyze API] 사용자 생성 완료:', {
            emailBasedUserId: emailBasedUserId,
            finalUserId: finalUserId,
            email: normalizedEmail
          });
        } catch (error: any) {
          console.error('❌ [Analyze API] 사용자 생성 오류:', error);
          // 사용자 생성 실패 시 이메일 기반 ID 사용
          finalUserId = emailBasedUserId;
        }
      }
    } else {
      // 이메일이 없으면 세션 ID로 사용자 확인
      const user = getUser(userId);
      if (user) {
        finalUserId = user.id;
        console.log('✅ [Analyze API] 세션 ID로 사용자 확인:', { 
          sessionId: userId, 
          actualUserId: finalUserId 
        });
      } else {
        console.warn('⚠️ [Analyze API] 세션 ID로 사용자를 찾을 수 없음:', {
          sessionId: userId
        });
      }
    }

    analysisId = uuidv4();
    try {
      // 저장 전 사용자 확인
      const userBeforeSave = getUser(finalUserId);
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
      
      // 저장 직후 DB에서 직접 확인
      try {
        const directCheck = db.prepare('SELECT id, user_id, url, created_at FROM analyses WHERE id = ?').get(savedId) as {
          id: string;
          user_id: string;
          url: string;
          created_at: string;
        } | undefined;
        
        if (directCheck) {
          console.log('✅ [Analyze API] 저장 직후 DB 직접 확인 성공:', {
            analysisId: directCheck.id,
            userId: directCheck.user_id,
            url: directCheck.url,
            createdAt: directCheck.created_at,
            matches: directCheck.user_id === finalUserId
          });
        } else {
          console.error('❌ [Analyze API] 저장 직후 DB 직접 확인 실패 - 레코드 없음:', {
            analysisId: savedId,
            userId: finalUserId
          });
        }
      } catch (directCheckError) {
        console.error('❌ [Analyze API] 저장 직후 DB 직접 확인 오류:', directCheckError);
      }
      
      // 저장 후 즉시 확인 (실제 사용자 ID로 조회, 최대 3회 재시도)
      let savedRecord = null;
      let savedAnalyses: any[] = [];
      let verificationAttempts = 0;
      const maxVerificationAttempts = 3;
      
      while (!savedRecord && verificationAttempts < maxVerificationAttempts) {
        verificationAttempts++;
        
        // Vercel 환경에서는 Blob Storage 동기화를 위해 짧은 대기
        if (process.env.VERCEL && verificationAttempts > 1) {
          await new Promise(resolve => setTimeout(resolve, 500 * verificationAttempts));
        }
        
        savedAnalyses = getUserAnalyses(finalUserId, { limit: 10 });
        savedRecord = savedAnalyses.find(a => a.id === savedId);
        
        if (savedRecord) {
          console.log(`✅ [Analyze API] 분석 결과 저장 및 확인 성공 (시도 ${verificationAttempts}/${maxVerificationAttempts}):`, { 
            analysisId: savedId, 
            userId: finalUserId,
            sessionId: userId,
            email: normalizedEmail,
            url: sanitizedUrl,
            savedAt: savedRecord.createdAt,
            totalAnalyses: savedAnalyses.length,
            scores: {
              aeo: result.aeoScore,
              geo: result.geoScore,
              seo: result.seoScore,
              overall: result.overallScore
            }
          });
          break;
        } else if (verificationAttempts < maxVerificationAttempts) {
          console.warn(`⚠️ [Analyze API] 저장 확인 실패, 재시도 중 (${verificationAttempts}/${maxVerificationAttempts}):`, { 
            analysisId: savedId, 
            userId: finalUserId,
            totalAnalyses: savedAnalyses.length,
            allAnalysisIds: savedAnalyses.map(a => a.id)
          });
        }
      }
      
      if (!savedRecord) {
        console.error('❌ [Analyze API] 분석 저장 후 확인 실패 (최대 재시도 횟수 초과):', { 
          analysisId: savedId, 
          userId: finalUserId,
          sessionId: userId,
          email: normalizedEmail,
          totalAnalyses: savedAnalyses.length,
          allAnalysisIds: savedAnalyses.map(a => a.id),
          allAnalyses: savedAnalyses.map(a => ({ id: a.id, url: a.url, userId: '확인 필요' }))
        });
        
        // 세션 ID로도 확인 시도
        if (finalUserId !== userId) {
          const sessionAnalyses = getUserAnalyses(userId, { limit: 10 });
          console.log('🔍 [Analyze API] 세션 ID로 분석 이력 확인:', {
            sessionId: userId,
            count: sessionAnalyses.length,
            analyses: sessionAnalyses.map(a => ({ id: a.id, url: a.url }))
          });
        }
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
      if (error?.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' && session?.user?.email) {
        console.warn('🔄 FOREIGN KEY 제약 조건 오류, 사용자 확인 및 생성 후 재시도:', error);
        try {
          // 이메일로 사용자 찾기 시도
          let retryUserId = finalUserId;
          const userByEmail = getUserByEmail(session.user.email);
          if (userByEmail) {
            retryUserId = userByEmail.id;
            console.log('📧 재시도: 이메일로 사용자 발견:', { 
              originalId: finalUserId, 
              foundId: retryUserId,
              email: session.user.email 
            });
          } else {
            // 사용자 생성 또는 기존 사용자 ID 가져오기
            const provider = (session as any).account?.provider || null;
            const createdUserId = createUser({
              id: userId,
              email: session.user.email,
              blogUrl: null,
              name: session.user.name || undefined,
              image: session.user.image || undefined,
              provider: provider,
            });
            
            // createUser가 반환한 실제 사용자 ID 사용
            retryUserId = createdUserId || userId;
            console.log('👤 재시도: 사용자 확인/생성 완료:', { 
              originalSessionId: userId, 
              finalUserId: retryUserId,
              email: session.user.email 
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
          const savedAnalyses = getUserAnalyses(retryUserId, { limit: 10 });
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

