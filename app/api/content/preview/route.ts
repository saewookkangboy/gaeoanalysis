import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { reviseContent } from '@/lib/content-revision/revision-engine';
import { withRetry } from '@/lib/retry';
import { sanitizeUrl } from '@/lib/api-utils';
import * as cheerio from 'cheerio';

// 미리보기 결과 캐시
const previewCache = new Map<string, { 
  preview: any; 
  timestamp: number;
  analysisId?: string;
}>();
const CACHE_TTL = 10 * 60 * 1000; // 10분

export async function POST(request: NextRequest) {
  try {
    // 세션 확인
    const session = await auth();
    const userId = session?.user?.id;

    if (!session || !userId) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { url, analysisResult } = body;

    if (!url || !analysisResult) {
      return NextResponse.json(
        { error: 'URL과 분석 결과가 필요합니다.' },
        { status: 400 }
      );
    }

    // URL 검증
    const sanitizedUrl = sanitizeUrl(url);
    
    // 캐시 키 생성 (URL + 분석 결과 해시)
    const analysisHash = JSON.stringify({
      seo: analysisResult.seoScore,
      aeo: analysisResult.aeoScore,
      geo: analysisResult.geoScore,
      overall: analysisResult.overallScore,
    });
    const cacheKey = `${sanitizedUrl}:${analysisHash}`;
    
    // 캐시 확인
    const cached = previewCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('✅ [Content Preview] 캐시에서 반환');
      return NextResponse.json({
        success: true,
        preview: cached.preview,
        cached: true,
      });
    }
    
    // Gemini API 키 확인
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const startTime = Date.now();
    
    // 원본 콘텐츠 가져오기 (최적화: 필요한 부분만)
    const html = await withRetry(
      async () => {
        const response = await fetch(sanitizedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.text();
      },
      {
        maxAttempts: 2,
        initialDelay: 1000,
      }
    );
    
    // HTML 파싱 및 본문 추출 (더 정확한 콘텐츠 추출)
    const $ = cheerio.load(html);
    
    // 불필요한 태그 제거
    $('script, style, nav, footer, header, aside, .ad, .advertisement').remove();
    
    // 본문 콘텐츠 추출
    const mainContent = $('main, article, .content, #content, .post-content, .entry-content').first();
    const bodyText = mainContent.length > 0 ? mainContent.html() || '' : $('body').html() || '';
    
    // 전체 콘텐츠 사용 (완성형 미리보기를 위해)
    // 너무 긴 경우를 대비해 최대 12000자로 제한 (약간 증가)
    const maxLength = 12000;
    const originalContent = bodyText.length > maxLength 
      ? bodyText.substring(0, maxLength) + '...' 
      : bodyText;

    // 완성형 미리보기 생성
    const previewResult = await reviseContent(
      {
        originalContent,
        analysisResult,
        url: sanitizedUrl,
      },
      apiKey
    );

    const elapsedTime = Date.now() - startTime;
    console.log(`✅ [Content Preview] 생성 완료 (${elapsedTime}ms)`);

    const previewData = {
      revisedMarkdown: previewResult.revisedMarkdown,
      predictedScores: previewResult.predictedScores,
      improvements: previewResult.improvements,
    };

    // 캐시 저장
    previewCache.set(cacheKey, {
      preview: previewData,
      timestamp: Date.now(),
      analysisId: (analysisResult as any).id,
    });

    // 캐시 크기 제한 (최대 30개)
    if (previewCache.size > 30) {
      // 첫 번째 키 가져오기 (Map이 비어있지 않으므로 첫 번째 키는 항상 존재)
      const keysArray = Array.from(previewCache.keys());
      if (keysArray.length > 0 && keysArray[0]) {
        previewCache.delete(keysArray[0]);
      }
    }

    return NextResponse.json({
      success: true,
      preview: previewData,
      cached: false,
      processingTime: elapsedTime,
    });
  } catch (error: any) {
    console.error('❌ [Content Preview] 오류:', error);
    
    return NextResponse.json(
      {
        error: error.message || '미리보기 생성 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

