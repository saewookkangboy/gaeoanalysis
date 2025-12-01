import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { analyzeContent } from '@/lib/analyzer';
import { saveAnalysis, checkDuplicateAnalysis, getUser, createUser } from '@/lib/db-helpers';
import { createErrorResponse, createSuccessResponse, withErrorHandling, sanitizeUrl } from '@/lib/api-utils';
import { withRateLimit } from '@/lib/rate-limiter';
import { cache, createCacheKey } from '@/lib/cache';
import { addSecurityHeaders, handleCorsPreflight } from '@/lib/headers';
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
  const body = await request.json();
  const { url } = analyzeSchema.parse(body);

  // URL sanitization
  const sanitizedUrl = sanitizeUrl(url);

  // 세션 확인
  const session = await auth();
  const userId = session?.user?.id;

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
  let analysisId = null;
  if (userId) {
    // 사용자가 DB에 존재하는지 확인하고, 없으면 생성
    let user = getUser(userId);
    if (!user && session?.user?.email) {
      try {
        createUser({
          id: userId,
          email: session.user.email,
          blogUrl: null,
        });
        console.log('분석 중 사용자 자동 생성:', { id: userId, email: session.user.email });
      } catch (error) {
        console.error('사용자 생성 오류:', error);
        // 사용자 생성 실패해도 분석은 계속 진행 (익명 사용자로 처리)
      }
    }

    analysisId = uuidv4();
    try {
      const savedId = saveAnalysis({
        id: analysisId,
        userId,
        url: sanitizedUrl,
        aeoScore: result.aeoScore,
        geoScore: result.geoScore,
        seoScore: result.seoScore,
        overallScore: result.overallScore,
        insights: result.insights,
        aioScores: result.aioAnalysis?.scores,
      });
      console.log('✅ 분석 결과 저장 성공:', { 
        analysisId: savedId, 
        userId, 
        url: sanitizedUrl,
        scores: {
          aeo: result.aeoScore,
          geo: result.geoScore,
          seo: result.seoScore,
          overall: result.overallScore
        }
      });
    } catch (error: any) {
      console.error('❌ 분석 저장 오류:', {
        error: error.message,
        code: error.code,
        userId,
        url: sanitizedUrl,
        analysisId
      });
      
      // FOREIGN KEY 제약 조건 오류인 경우 사용자 생성 후 재시도
      if (error?.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' && session?.user?.email) {
        console.warn('🔄 FOREIGN KEY 제약 조건 오류, 사용자 생성 후 재시도:', error);
        try {
          createUser({
            id: userId,
            email: session.user.email,
            blogUrl: null,
          });
          console.log('✅ 사용자 생성 완료, 분석 저장 재시도:', { userId, email: session.user.email });
          
          // 재시도
          const savedId = saveAnalysis({
            id: analysisId,
            userId,
            url: sanitizedUrl,
            aeoScore: result.aeoScore,
            geoScore: result.geoScore,
            seoScore: result.seoScore,
            overallScore: result.overallScore,
            insights: result.insights,
            aioScores: result.aioAnalysis?.scores,
          });
          console.log('✅ 분석 저장 재시도 성공:', { analysisId: savedId, userId, url: sanitizedUrl });
        } catch (retryError: any) {
          console.error('❌ 분석 저장 재시도 실패:', {
            error: retryError.message,
            code: retryError.code,
            userId,
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
          userId,
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

