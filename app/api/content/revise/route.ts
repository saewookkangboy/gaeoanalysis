import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { reviseContent } from '@/lib/content-revision/revision-engine';
import { withRetry } from '@/lib/retry';
import { sanitizeUrl } from '@/lib/api-utils';

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
    
    // Gemini API 키 확인
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // 원본 콘텐츠 가져오기
    console.log('🔄 [Content Revision] 원본 콘텐츠 가져오는 중:', sanitizedUrl);
    
    const originalContent = await withRetry(
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
        maxAttempts: 3,
        initialDelay: 1000,
        backoffMultiplier: 2,
      }
    );

    // 콘텐츠 수정
    console.log('🔄 [Content Revision] 콘텐츠 수정 중...');
    
    const revisionResult = await reviseContent(
      {
        originalContent,
        analysisResult,
        url: sanitizedUrl,
      },
      apiKey
    );

    console.log('✅ [Content Revision] 콘텐츠 수정 완료');

    return NextResponse.json({
      success: true,
      result: revisionResult,
    });
  } catch (error: any) {
    console.error('❌ [Content Revision] 오류:', error);
    
    return NextResponse.json(
      {
        error: error.message || '콘텐츠 수정 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

