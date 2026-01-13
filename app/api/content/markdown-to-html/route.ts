import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { markdown } = body;

    if (!markdown || typeof markdown !== 'string') {
      return NextResponse.json(
        { error: '마크다운 텍스트가 필요합니다.' },
        { status: 400 }
      );
    }

    // 간단한 마크다운을 HTML로 변환
    let html = markdown
      // 헤더
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // 볼드
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // 이탤릭
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // 링크
      .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>')
      // 인라인 코드
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // 코드 블록
      .replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>')
      // 줄바꿈
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    // 문단 태그 추가
    html = '<p>' + html + '</p>';

    return NextResponse.json({
      html,
    });
  } catch (error: any) {
    console.error('❌ [Markdown to HTML] 오류:', error);
    
    return NextResponse.json(
      {
        error: error.message || '변환 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
