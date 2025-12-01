import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { analyzeContent } from '@/lib/analyzer';
import { saveAnalysis, checkDuplicateAnalysis } from '@/lib/db-helpers';
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
  const session = await getServerSession(authOptions);
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
  const session = await getServerSession(authOptions);
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

  // 로그인된 사용자인 경우 중복 분석 확인
  let analysisId = null;
  if (userId) {
    const duplicateId = checkDuplicateAnalysis(userId, sanitizedUrl, 24);
    if (duplicateId) {
      analysisId = duplicateId;
      // 기존 분석 결과를 DB에서 가져와서 캐시에 저장
      // (현재는 분석을 다시 수행하지만, 향후 DB에서 조회하도록 개선 가능)
    }
  }

  // 분석 수행
  const result = await analyzeContent(sanitizedUrl);

  // 로그인된 사용자인 경우 분석 결과 저장
  if (userId && !analysisId) {
    analysisId = uuidv4();
    saveAnalysis({
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

// 최종 핸들러: 에러 핸들링 + 보안 헤더
async function finalHandler(request: NextRequest): Promise<NextResponse> {
  const response = await withErrorHandling(handleAnalyze, '분석 중 오류가 발생했습니다.')(request);
  return addSecurityHeaders(request, response);
}

// 레이트 리미트 적용된 핸들러
const rateLimitedHandler = withRateLimit(
  10, // 1분에 10회
  60 * 1000, // 1분
  getRateLimitKey
)(finalHandler);

export async function POST(request: NextRequest) {
  return rateLimitedHandler(request);
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
  return handleCorsPreflight(request) || new NextResponse(null, { status: 200 });
}

