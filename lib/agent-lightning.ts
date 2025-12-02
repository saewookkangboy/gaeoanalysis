/**
 * Agent Lightning 통합 모듈
 * 
 * Agent Lightning의 핵심 개념을 TypeScript로 구현하여
 * SEO, AIO, AEO, GEO 학습에 필요한 방향으로 AI Agent를 최적화합니다.
 * 
 * 참고: https://github.com/microsoft/agent-lightning
 */

import { AnalysisResult } from './analyzer';
import { AIOCitationAnalysis } from './ai-citation-analyzer';

// ============================================
// 타입 정의
// ============================================

export interface AgentSpan {
  id: string;
  type: 'prompt' | 'response' | 'tool_call' | 'reward';
  agentType: 'seo' | 'aeo' | 'geo' | 'aio' | 'chat';
  timestamp: Date;
  data: any;
  metadata?: Record<string, any>;
}

export interface PromptTemplate {
  id: string;
  agentType: 'seo' | 'aeo' | 'geo' | 'aio' | 'chat';
  template: string;
  version: number;
  performance: {
    avgScore: number;
    totalUses: number;
    successRate: number;
    lastUpdated: Date;
  };
  variables: string[];
}

export interface AgentReward {
  spanId: string;
  agentType: 'seo' | 'aeo' | 'geo' | 'aio' | 'chat';
  score: number; // 0-100
  metrics: {
    relevance: number; // 관련성 (0-1)
    accuracy: number; // 정확성 (0-1)
    usefulness: number; // 유용성 (0-1)
    userSatisfaction?: number; // 사용자 만족도 (0-1, 선택적)
  };
  feedback?: string;
  timestamp: Date;
}

export interface LearningMetrics {
  agentType: 'seo' | 'aeo' | 'geo' | 'aio' | 'chat';
  totalSpans: number;
  avgReward: number;
  improvementRate: number; // 개선율 (%)
  bestPromptVersion: number;
  lastOptimized: Date;
}

// ============================================
// Agent Lightning Store (인메모리, 추후 DB로 확장)
// ============================================

class LightningStore {
  private spans: AgentSpan[] = [];
  private promptTemplates: Map<string, PromptTemplate> = new Map();
  private rewards: AgentReward[] = [];

  // Span 저장
  emitSpan(span: AgentSpan): void {
    this.spans.push(span);
    // 최근 1000개만 유지 (메모리 관리)
    if (this.spans.length > 1000) {
      this.spans = this.spans.slice(-1000);
    }
  }

  // Prompt Template 저장/업데이트
  savePromptTemplate(template: PromptTemplate): void {
    this.promptTemplates.set(template.id, template);
  }

  // Prompt Template 조회
  getPromptTemplate(agentType: string, version?: number): PromptTemplate | null {
    const templates = Array.from(this.promptTemplates.values())
      .filter(t => t.agentType === agentType)
      .sort((a, b) => b.version - a.version);
    
    if (version !== undefined) {
      return templates.find(t => t.version === version) || null;
    }
    
    return templates[0] || null;
  }

  // Reward 저장
  emitReward(reward: AgentReward): void {
    this.rewards.push(reward);
    // 최근 500개만 유지
    if (this.rewards.length > 500) {
      this.rewards = this.rewards.slice(-500);
    }
  }

  // 학습 메트릭 계산
  getLearningMetrics(agentType: string): LearningMetrics | null {
    const typeSpans = this.spans.filter(s => s.agentType === agentType);
    const typeRewards = this.rewards.filter(r => r.agentType === agentType);

    if (typeSpans.length === 0) return null;

    const avgReward = typeRewards.length > 0
      ? typeRewards.reduce((sum, r) => sum + r.score, 0) / typeRewards.length
      : 0;

    // 최근 성능과 이전 성능 비교 (개선율 계산)
    const recentRewards = typeRewards.slice(-50);
    const olderRewards = typeRewards.slice(-100, -50);
    const recentAvg = recentRewards.length > 0
      ? recentRewards.reduce((sum, r) => sum + r.score, 0) / recentRewards.length
      : 0;
    const olderAvg = olderRewards.length > 0
      ? olderRewards.reduce((sum, r) => sum + r.score, 0) / olderRewards.length
      : 0;
    const improvementRate = olderAvg > 0
      ? ((recentAvg - olderAvg) / olderAvg) * 100
      : 0;

    // 최고 성능 프롬프트 버전 찾기
    const bestTemplate = Array.from(this.promptTemplates.values())
      .filter(t => t.agentType === agentType)
      .sort((a, b) => b.performance.avgScore - a.performance.avgScore)[0];

    return {
      agentType: agentType as any,
      totalSpans: typeSpans.length,
      avgReward,
      improvementRate,
      bestPromptVersion: bestTemplate?.version || 1,
      lastOptimized: bestTemplate?.performance.lastUpdated || new Date(),
    };
  }

  // Span 조회
  getSpans(agentType?: string, limit = 100): AgentSpan[] {
    let filtered = this.spans;
    if (agentType) {
      filtered = filtered.filter(s => s.agentType === agentType);
    }
    return filtered.slice(-limit);
  }

  // Reward 조회
  getRewards(agentType?: string, limit = 100): AgentReward[] {
    let filtered = this.rewards;
    if (agentType) {
      filtered = filtered.filter(r => r.agentType === agentType);
    }
    return filtered.slice(-limit);
  }
}

// 싱글톤 인스턴스
const lightningStore = new LightningStore();

// ============================================
// 프롬프트 최적화 시스템
// ============================================

export class PromptOptimizer {
  /**
   * SEO/AEO/GEO/AIO 특화 프롬프트 템플릿 생성
   */
  static createOptimizedPrompt(
    agentType: 'seo' | 'aeo' | 'geo' | 'aio' | 'chat',
    analysisData: AnalysisResult | null,
    aioAnalysis: AIOCitationAnalysis | null,
    context: any
  ): string {
    const template = lightningStore.getPromptTemplate(agentType);
    
    if (!template) {
      // 기본 템플릿 반환
      return this.getDefaultPrompt(agentType, analysisData, aioAnalysis, context);
    }

    // 템플릿 변수 치환
    return this.renderTemplate(template.template, {
      analysisData,
      aioAnalysis,
      context,
    });
  }

  /**
   * 기본 프롬프트 생성
   */
  private static getDefaultPrompt(
    agentType: string,
    analysisData: AnalysisResult | null,
    aioAnalysis: AIOCitationAnalysis | null,
    context: any
  ): string {
    switch (agentType) {
      case 'seo':
        return this.getSEOPrompt(analysisData);
      case 'aeo':
        return this.getAEOPrompt(analysisData);
      case 'geo':
        return this.getGEOPrompt(analysisData);
      case 'aio':
        return this.getAIOPrompt(aioAnalysis);
      case 'chat':
      default:
        return this.getChatPrompt(analysisData, aioAnalysis, context);
    }
  }

  private static getSEOPrompt(analysisData: AnalysisResult | null): string {
    if (!analysisData) {
      return 'SEO 최적화에 대한 일반적인 조언을 제공하세요.';
    }

    return `SEO 전문가로서 다음 분석 결과를 바탕으로 구체적인 개선 방안을 제시하세요.

**현재 SEO 점수: ${analysisData.seoScore}/100**

**주요 인사이트:**
${analysisData.insights
  .filter(i => i.category === 'SEO')
  .slice(0, 5)
  .map(i => `- [${i.severity}] ${i.message}`)
  .join('\n')}

**개선 우선순위:**
1. 즉시 개선 가능한 항목
2. 중기 개선 계획
3. 장기 최적화 전략

구체적이고 실행 가능한 단계별 가이드를 제공하세요.`;
  }

  private static getAEOPrompt(analysisData: AnalysisResult | null): string {
    if (!analysisData) {
      return 'AEO(Answer Engine Optimization) 최적화에 대한 조언을 제공하세요.';
    }

    return `AEO 전문가로서 다음 분석 결과를 바탕으로 답변 엔진 최적화 방안을 제시하세요.

**현재 AEO 점수: ${analysisData.aeoScore}/100**

**주요 인사이트:**
${analysisData.insights
  .filter(i => i.category === 'AEO')
  .slice(0, 5)
  .map(i => `- [${i.severity}] ${i.message}`)
  .join('\n')}

**AEO 개선 전략:**
- 질문 형식 콘텐츠 구조화
- FAQ 섹션 최적화
- 명확하고 간결한 답변 제공
- 구조화된 데이터 활용

구체적인 예시와 함께 단계별 가이드를 제공하세요.`;
  }

  private static getGEOPrompt(analysisData: AnalysisResult | null): string {
    if (!analysisData) {
      return 'GEO(Generative Engine Optimization) 최적화에 대한 조언을 제공하세요.';
    }

    return `GEO 전문가로서 다음 분석 결과를 바탕으로 생성형 검색 엔진 최적화 방안을 제시하세요.

**현재 GEO 점수: ${analysisData.geoScore}/100**

**주요 인사이트:**
${analysisData.insights
  .filter(i => i.category === 'GEO')
  .slice(0, 5)
  .map(i => `- [${i.severity}] ${i.message}`)
  .join('\n')}

**GEO 개선 전략:**
- 콘텐츠 길이와 깊이 확보
- 다중 미디어 활용
- 섹션 구조 최적화
- 키워드 다양성 확보

AI가 콘텐츠를 잘 이해하고 인용할 수 있도록 하는 구체적인 방법을 제시하세요.`;
  }

  private static getAIOPrompt(aioAnalysis: AIOCitationAnalysis | null): string {
    if (!aioAnalysis) {
      return 'AI 모델별 인용 확률 최적화에 대한 조언을 제공하세요.';
    }

    return `AI 인용 최적화 전문가로서 다음 분석 결과를 바탕으로 각 AI 모델별 최적화 전략을 제시하세요.

**AI 모델별 인용 확률:**
- ChatGPT: ${aioAnalysis.scores.chatgpt}/100
- Perplexity: ${aioAnalysis.scores.perplexity}/100
- Gemini: ${aioAnalysis.scores.gemini}/100
- Claude: ${aioAnalysis.scores.claude}/100

**모델별 개선 전략:**
${aioAnalysis.insights
  .map(i => `- ${i.model.toUpperCase()}: ${i.recommendations.join(', ')}`)
  .join('\n')}

각 모델의 특성을 고려한 맞춤형 최적화 방안을 제시하세요.`;
  }

  private static getChatPrompt(
    analysisData: AnalysisResult | null,
    aioAnalysis: AIOCitationAnalysis | null,
    context: any
  ): string {
    // 기존 chat 프롬프트 로직 사용
    // (buildAIAgentPrompt 함수와 유사)
    let prompt = `GAEO 전문 AI Agent. AI 검색 엔진 최적화 조언 제공.

**역할:** 분석 기반 개선 방안, 단계별 가이드, AI 모델별 전략 제안
**스타일:** 구체적·실행 가능, 단계별 설명, 예시 포함, 한국어, 마크다운 형식

`;

    if (analysisData) {
      const topInsights = analysisData.insights
        .sort((a, b) => {
          const severityOrder = { High: 3, Medium: 2, Low: 1 };
          return severityOrder[b.severity] - severityOrder[a.severity];
        })
        .slice(0, 5);

      prompt += `**분석 결과:**
점수: AEO ${analysisData.aeoScore} GEO ${analysisData.geoScore} SEO ${analysisData.seoScore} 종합 ${analysisData.overallScore}
인사이트: ${topInsights.map(i => `[${i.severity}] ${i.category}: ${i.message}`).join(' | ')}

`;

      if (aioAnalysis) {
        prompt += `AI인용: ChatGPT ${aioAnalysis.scores.chatgpt} Perplexity ${aioAnalysis.scores.perplexity} Gemini ${aioAnalysis.scores.gemini} Claude ${aioAnalysis.scores.claude}

`;
      }
    }

    if (context?.messages && context.messages.length > 0) {
      const recentMessages = context.messages.slice(-2);
      prompt += `이전 대화: ${recentMessages.map((m: any) => `${m.role === 'user' ? 'Q' : 'A'}: ${m.content.substring(0, 100)}`).join(' | ')}

`;
    }

    if (context?.userMessage) {
      prompt += `Q: ${context.userMessage}
A: (마크다운 형식으로 답변)`;
    }

    return prompt;
  }

  /**
   * 템플릿 렌더링
   */
  private static renderTemplate(template: string, variables: any): string {
    // 간단한 변수 치환 (추후 더 정교한 템플릿 엔진으로 확장 가능)
    let rendered = template;
    // 변수 치환 로직은 필요에 따라 구현
    return rendered;
  }

  /**
   * 프롬프트 성능 기반 자동 최적화
   */
  static optimizePrompt(
    agentType: string,
    currentTemplate: PromptTemplate,
    rewards: AgentReward[]
  ): PromptTemplate | null {
    const recentRewards = rewards
      .filter(r => r.agentType === agentType)
      .slice(-50);

    if (recentRewards.length < 10) {
      // 충분한 데이터가 없으면 최적화하지 않음
      return null;
    }

    const avgScore = recentRewards.reduce((sum, r) => sum + r.score, 0) / recentRewards.length;

    // 성능이 개선되지 않으면 최적화하지 않음
    if (avgScore <= currentTemplate.performance.avgScore) {
      return null;
    }

    // 새로운 버전의 템플릿 생성 (간단한 버전)
    // 실제로는 더 정교한 최적화 알고리즘 사용 가능
    const optimizedTemplate: PromptTemplate = {
      ...currentTemplate,
      version: currentTemplate.version + 1,
      performance: {
        avgScore,
        totalUses: currentTemplate.performance.totalUses + recentRewards.length,
        successRate: recentRewards.filter(r => r.score >= 70).length / recentRewards.length,
        lastUpdated: new Date(),
      },
    };

    return optimizedTemplate;
  }
}

// ============================================
// 응답 품질 평가 시스템
// ============================================

export class ResponseQualityEvaluator {
  /**
   * AI Agent 응답 품질 평가
   */
  static evaluateResponse(
    agentType: 'seo' | 'aeo' | 'geo' | 'aio' | 'chat',
    response: string,
    context: {
      userMessage: string;
      analysisData?: AnalysisResult | null;
      aioAnalysis?: AIOCitationAnalysis | null;
    }
  ): AgentReward {
    // 관련성 평가 (키워드 매칭, 주제 일치도)
    const relevance = this.calculateRelevance(response, context);

    // 정확성 평가 (기술적 정확성, 사실 확인)
    const accuracy = this.calculateAccuracy(response, context);

    // 유용성 평가 (실행 가능성, 구체성)
    const usefulness = this.calculateUsefulness(response, context);

    // 종합 점수 계산
    const score = Math.round(
      (relevance * 0.4 + accuracy * 0.3 + usefulness * 0.3) * 100
    );

    return {
      spanId: `reward-${Date.now()}-${Math.random()}`,
      agentType,
      score,
      metrics: {
        relevance,
        accuracy,
        usefulness,
      },
      timestamp: new Date(),
    };
  }

  private static calculateRelevance(
    response: string,
    context: any
  ): number {
    let score = 0.5; // 기본 점수

    // 사용자 메시지의 키워드가 응답에 포함되는지 확인
    if (context.userMessage) {
      const keywords = context.userMessage
        .toLowerCase()
        .split(/\s+/)
        .filter((w: string) => w.length > 2);
      const matchedKeywords = keywords.filter((kw: string) =>
        response.toLowerCase().includes(kw)
      );
      score += (matchedKeywords.length / keywords.length) * 0.3;
    }

    // 분석 데이터 관련 키워드 포함 여부
    if (context.analysisData) {
      const analysisKeywords = [
        'AEO',
        'GEO',
        'SEO',
        '점수',
        '개선',
        '최적화',
      ];
      const matched = analysisKeywords.filter((kw: string) =>
        response.includes(kw)
      );
      score += (matched.length / analysisKeywords.length) * 0.2;
    }

    return Math.min(1, score);
  }

  private static calculateAccuracy(
    response: string,
    context: any
  ): number {
    let score = 0.7; // 기본 점수 (대부분의 AI 응답은 어느 정도 정확함)

    // 기술적 키워드 사용 (정확성 지표)
    const technicalTerms = [
      '구조화',
      '데이터',
      '최적화',
      '알고리즘',
      '인덱싱',
    ];
    const hasTechnicalTerms = technicalTerms.some(term =>
      response.includes(term)
    );
    if (hasTechnicalTerms) score += 0.1;

    // 구체적인 숫자나 통계 포함 (정확성 지표)
    const hasNumbers = /\d+/.test(response);
    if (hasNumbers) score += 0.1;

    // 단계별 설명 포함 (구조화된 정확성)
    const hasSteps = /단계|step|1\.|2\.|3\./.test(response);
    if (hasSteps) score += 0.1;

    return Math.min(1, score);
  }

  private static calculateUsefulness(
    response: string,
    context: any
  ): number {
    let score = 0.5; // 기본 점수

    // 실행 가능한 조언 포함 여부
    const actionableTerms = [
      '추가하세요',
      '개선하세요',
      '최적화하세요',
      '구현하세요',
      '설정하세요',
    ];
    const hasActionableTerms = actionableTerms.some(term =>
      response.includes(term)
    );
    if (hasActionableTerms) score += 0.2;

    // 예시나 코드 포함 여부
    const hasExamples = /예시|예제|예:|코드|```/.test(response);
    if (hasExamples) score += 0.15;

    // 링크나 참고 자료 포함 여부
    const hasLinks = /http|참고|링크|자료/.test(response);
    if (hasLinks) score += 0.1;

    // 마크다운 형식 사용 (구조화된 정보)
    const hasMarkdown = /#|##|\*|`|\[/.test(response);
    if (hasMarkdown) score += 0.05;

    return Math.min(1, score);
  }
}

// ============================================
// 공개 API
// ============================================

/**
 * Agent Lightning 통합 헬퍼 함수
 */
export const agentLightning = {
  /**
   * Span 발생 (이벤트 추적)
   */
  emitSpan(span: Omit<AgentSpan, 'id' | 'timestamp'>): void {
    lightningStore.emitSpan({
      id: `span-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      ...span,
    });
  },

  /**
   * Reward 발생 (품질 평가)
   */
  emitReward(reward: Omit<AgentReward, 'spanId' | 'timestamp'>): void {
    lightningStore.emitReward({
      spanId: `reward-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      ...reward,
    });
  },

  /**
   * 최적화된 프롬프트 생성
   */
  getOptimizedPrompt(
    agentType: 'seo' | 'aeo' | 'geo' | 'aio' | 'chat',
    analysisData: AnalysisResult | null,
    aioAnalysis: AIOCitationAnalysis | null,
    context: any
  ): string {
    return PromptOptimizer.createOptimizedPrompt(
      agentType,
      analysisData,
      aioAnalysis,
      context
    );
  },

  /**
   * 응답 품질 평가
   */
  evaluateResponse(
    agentType: 'seo' | 'aeo' | 'geo' | 'aio' | 'chat',
    response: string,
    context: {
      userMessage: string;
      analysisData?: AnalysisResult | null;
      aioAnalysis?: AIOCitationAnalysis | null;
    }
  ): AgentReward {
    return ResponseQualityEvaluator.evaluateResponse(agentType, response, context);
  },

  /**
   * 학습 메트릭 조회
   */
  getLearningMetrics(agentType?: string): LearningMetrics | LearningMetrics[] | null {
    if (agentType) {
      return lightningStore.getLearningMetrics(agentType);
    }
    
    const types = ['seo', 'aeo', 'geo', 'aio', 'chat'];
    const metrics = types
      .map(type => lightningStore.getLearningMetrics(type))
      .filter(m => m !== null) as LearningMetrics[];
    
    return metrics.length > 0 ? metrics : null;
  },

  /**
   * 프롬프트 템플릿 저장
   */
  savePromptTemplate(template: PromptTemplate): void {
    lightningStore.savePromptTemplate(template);
  },

  /**
   * 프롬프트 템플릿 조회
   */
  getPromptTemplate(agentType: string, version?: number): PromptTemplate | null {
    return lightningStore.getPromptTemplate(agentType, version);
  },
};

export default agentLightning;

