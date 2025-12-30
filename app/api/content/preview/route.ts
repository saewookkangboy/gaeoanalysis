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

    // 원본 콘텐츠 가져오기 (간단한 요약만)
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
    
    // 전체 콘텐츠 사용 (완성형 미리보기를 위해)
    // 너무 긴 경우를 대비해 최대 10000자로 제한
    const maxLength = 10000;
    const originalContent = html.length > maxLength ? html.substring(0, maxLength) : html;

    // 완성형 미리보기 생성
    const previewResult = await reviseContent(
      {
        originalContent,
        analysisResult,
        url: sanitizedUrl,
      },
      apiKey
    );

    return NextResponse.json({
      success: true,
      preview: {
        revisedMarkdown: previewResult.revisedMarkdown, // 전체 콘텐츠 반환
        predictedScores: previewResult.predictedScores,
        improvements: previewResult.improvements,
      },
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

