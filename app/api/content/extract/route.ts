import { NextRequest, NextResponse } from 'next/server';
import { withRetry } from '@/lib/retry';
import { sanitizeUrl } from '@/lib/api-utils';
import * as cheerio from 'cheerio';

// 간단한 메모리 캐시 (실제 운영에서는 Redis 등 사용 권장)
const contentCache = new Map<string, { content: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5분

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'URL이 필요합니다.' },
        { status: 400 }
      );
    }

    // URL 검증
    const sanitizedUrl = sanitizeUrl(url);

    // 캐시 확인
    const cached = contentCache.get(sanitizedUrl);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        content: cached.content,
        cached: true,
      });
    }

    // 원본 콘텐츠 가져오기
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

    // HTML에서 텍스트 추출
    const $ = cheerio.load(html);
    
    // 불필요한 태그 제거
    $('script, style, nav, footer, header, aside').remove();
    
    // 본문 텍스트 추출
    const bodyText = $('body').text().trim();
    const mainContent = $('main, article, .content, #content').text().trim() || bodyText;
    
    // 최대 5000자로 제한
    const content = mainContent.length > 5000 
      ? mainContent.substring(0, 5000) + '...' 
      : mainContent;

    // 캐시 저장
    contentCache.set(sanitizedUrl, {
      content,
      timestamp: Date.now(),
    });

    // 캐시 크기 제한 (최대 50개)
    if (contentCache.size > 50) {
      // 첫 번째 키 가져오기 (Map이 비어있지 않으므로 첫 번째 키는 항상 존재)
      const keysArray = Array.from(contentCache.keys());
      if (keysArray.length > 0) {
        const firstKey = keysArray[0];
        if (firstKey) {
          contentCache.delete(firstKey);
        }
      }
    }

    return NextResponse.json({
      content,
      cached: false,
    });
  } catch (error: any) {
    console.error('❌ [Content Extract] 오류:', error);
    
    return NextResponse.json(
      {
        error: error.message || '콘텐츠 추출 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
