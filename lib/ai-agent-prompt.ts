import { AnalysisResult } from './analyzer';
import { AIOCitationAnalysis } from './ai-citation-analyzer';

export interface ChatContext {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  analysisData: AnalysisResult | null;
  aioAnalysis: AIOCitationAnalysis | null;
}

/**
 * AI Agent를 위한 고도화된 프롬프트 생성
 */
export function buildAIAgentPrompt(
  userMessage: string,
  context: ChatContext
): string {
  const { analysisData, aioAnalysis, messages } = context;

  // 시스템 프롬프트 (토큰 최소화)
  let systemPrompt = `GAEO 전문 AI Agent. AI 검색 엔진 최적화 조언 제공.

**역할:** 분석 기반 개선 방안, 단계별 가이드, AI 모델별 전략 제안
**스타일:** 구체적·실행 가능, 단계별 설명, 예시 포함, 한국어, 마크다운 형식

`;

  // 분석 데이터 컨텍스트 (토큰 최소화)
  let analysisContext = '';
  if (analysisData) {
    // 핵심 인사이트만 선택 (최대 5개)
    const topInsights = analysisData.insights
      .sort((a, b) => {
        const severityOrder = { High: 3, Medium: 2, Low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      })
      .slice(0, 5);

    analysisContext = `**분석 결과:**
점수: AEO ${analysisData.aeoScore} GEO ${analysisData.geoScore} SEO ${analysisData.seoScore} 종합 ${analysisData.overallScore}
인사이트: ${topInsights.map(i => `[${i.severity}] ${i.category}: ${i.message}`).join(' | ')}`;

    if (aioAnalysis) {
      analysisContext += ` AI인용: ChatGPT ${aioAnalysis.scores.chatgpt} Perplexity ${aioAnalysis.scores.perplexity} Grok ${aioAnalysis.scores.grok} Gemini ${aioAnalysis.scores.gemini} Claude ${aioAnalysis.scores.claude}`;
    }
  }

  // 대화 이력 컨텍스트 (토큰 최소화 - 최근 2개만)
  let conversationContext = '';
  if (messages.length > 0) {
    const recentMessages = messages.slice(-2);
    conversationContext = `이전: ${recentMessages.map(m => `${m.role === 'user' ? 'Q' : 'A'}: ${m.content.substring(0, 100)}`).join(' | ')}`;
  }

  // 최종 프롬프트 조합 (토큰 최소화)
  const fullPrompt = `${systemPrompt}${analysisContext ? '\n' + analysisContext : ''}${conversationContext ? '\n' + conversationContext : ''}

Q: ${userMessage}
A: (마크다운 형식으로 답변)`;

  return fullPrompt;
}

function getScoreEmoji(score: number): string {
  if (score >= 80) return '✅';
  if (score >= 60) return '⚠️';
  return '❌';
}

/**
 * 빠른 질문 템플릿 생성
 */
export function getQuickQuestions(analysisData: AnalysisResult | null): string[] {
  if (!analysisData) {
    return [
      'AI 검색 엔진 최적화란 무엇인가요?',
      'AEO와 GEO의 차이는 무엇인가요?',
      '어떻게 시작하면 좋을까요?',
    ];
  }

  const questions: string[] = [];

  // 점수 기반 질문
  if (analysisData.overallScore < 60) {
    questions.push('점수를 빠르게 올리는 방법은?');
    questions.push('가장 시급하게 개선해야 할 부분은?');
  } else if (analysisData.overallScore < 80) {
    questions.push('점수를 더 높이려면 어떻게 해야 하나요?');
    questions.push('어떤 부분을 개선하면 가장 효과적일까요?');
  } else {
    questions.push('점수를 유지하려면 어떻게 해야 하나요?');
    questions.push('더 나아가기 위한 팁은?');
  }

  // 특정 점수 기반 질문
  if (analysisData.aeoScore < 60) {
    questions.push('AEO 점수를 올리는 구체적인 방법은?');
  }
  if (analysisData.geoScore < 60) {
    questions.push('GEO 점수를 올리는 구체적인 방법은?');
  }
  if (analysisData.seoScore < 60) {
    questions.push('SEO 점수를 올리는 구체적인 방법은?');
  }

  // AI 모델별 질문
  questions.push('ChatGPT에 잘 인용되려면?');
  questions.push('Perplexity에 잘 인용되려면?');
  questions.push('Grok에 잘 인용되려면?');

  return questions.slice(0, 6); // 최대 6개
}
