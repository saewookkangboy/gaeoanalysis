import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/llm/gemini';
import { modelForTask } from '@/lib/llm/models';

export async function POST(request: NextRequest) {
  try {
    const { analysisData, aioAnalysis, conversationHistory, askedQuestions } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // 분석 데이터 요약
    let contextSummary = '';
    if (analysisData) {
      contextSummary = `점수: AEO ${analysisData.aeoScore} GEO ${analysisData.geoScore} SEO ${analysisData.seoScore} 종합 ${analysisData.overallScore}`;
    }

    // 이미 질문한 내용
    const askedSummary = askedQuestions && askedQuestions.length > 0 
      ? `이미 질문한 내용: ${askedQuestions.join(', ')}` 
      : '';

    // 대화 이력 요약
    const conversationSummary = conversationHistory && conversationHistory.length > 0
      ? `최근 대화 주제: ${conversationHistory.slice(-3).map((m: any) => m.content.substring(0, 50)).join(', ')}`
      : '';

    const prompt = `GAEO 분석 도구의 AI Agent입니다. 사용자에게 유용한 추천 질문 3개를 생성해주세요.

${contextSummary ? `현재 분석 결과: ${contextSummary}` : ''}
${conversationSummary ? `\n${conversationSummary}` : ''}
${askedSummary ? `\n${askedSummary}` : ''}

요구사항:
- 이미 질문한 내용과 중복되지 않도록
- 분석 결과나 대화 맥락과 관련된 실용적인 질문
- 간결하고 명확한 질문 (각 질문은 20자 이내)
- 한국어로 작성

형식: 각 질문을 줄바꿈으로 구분하여 출력 (번호나 기호 없이)

추천 질문:`;

    const { text } = await generateText({
      model: modelForTask('suggestions'),
      prompt,
      temperature: 0.8,
      maxOutputTokens: 512,
      thinkingBudget: 0, // 경량 태스크 — 추론 비활성으로 지연/비용 최소화
    });

    // 질문들을 배열로 변환
    const questions = text
      .split('\n')
      .map(q => q.trim())
      .filter(q => q.length > 0 && q.length < 50)
      .slice(0, 3);

    // 질문이 부족하면 기본 질문 추가
    const defaultQuestions = [
      '점수를 올리는 방법은?',
      '개선 우선순위는?',
      'AI 모델별 최적화 팁은?'
    ];

    const finalQuestions = questions.length >= 3 
      ? questions 
      : [...questions, ...defaultQuestions.slice(0, 3 - questions.length)];

    return NextResponse.json({ questions: finalQuestions });
  } catch (error) {
    console.error('추천 질문 생성 오류:', error);
    // 오류 시 기본 질문 반환
    return NextResponse.json({ 
      questions: [
        '점수를 올리는 방법은?',
        '개선 우선순위는?',
        'AI 모델별 최적화 팁은?'
      ]
    });
  }
}

