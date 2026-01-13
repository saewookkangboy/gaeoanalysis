import { AnalysisResult } from '@/lib/analyzer';
import { getBlogPlatformFromURL } from '@/lib/blog-detector';

export interface RevisionRequest {
  originalContent: string;
  analysisResult: AnalysisResult;
  url: string;
}

/**
 * 콘텐츠 수정을 위한 프롬프트 생성
 */
export function buildRevisionPrompt(request: RevisionRequest): string {
  const { originalContent, analysisResult, url } = request;
  
  // 블로그 플랫폼 감지
  const blogPlatform = getBlogPlatformFromURL(url);
  const isNaverBlog = blogPlatform?.type === 'naver';
  const originalContentLower = originalContent.toLowerCase();
  const hasIframe = originalContentLower.includes('<iframe') || originalContentLower.includes('frameset');
  
  // 체크리스트 항목 추출
  const checklistItems: string[] = [];
  
  // 개선 우선순위에서 실행 가능한 팁 추출
  if (analysisResult.improvementPriorities) {
    analysisResult.improvementPriorities.forEach((priority) => {
      if (priority.actionableTips) {
        priority.actionableTips.forEach((tip) => {
          checklistItems.push(`- [${priority.category}] ${tip.title}: ${tip.steps[0]}`);
        });
      }
    });
  }
  
  // High 우선순위 인사이트 추가
  const highPriorityInsights = analysisResult.insights
    .filter((insight) => insight.severity === 'High')
    .slice(0, 10)
    .map((insight) => `- [${insight.category}] ${insight.message}`);
  
  checklistItems.push(...highPriorityInsights);
  
  // AI 모델별 추천사항 추가
  if (analysisResult.aioAnalysis) {
    analysisResult.aioAnalysis.insights.forEach((insight) => {
      insight.recommendations.slice(0, 3).forEach((rec) => {
        checklistItems.push(`- [AIO] ${rec}`);
      });
    });
  }
  
  // 콘텐츠 가이드라인 추가
  if (analysisResult.contentGuidelines) {
    analysisResult.contentGuidelines.slice(0, 5).forEach((guideline) => {
      checklistItems.push(`- ${guideline}`);
    });
  }
  
  // 개선 사항을 카테고리별로 정리
  const improvementsByCategory: Record<string, string[]> = {
    SEO: [],
    AEO: [],
    GEO: [],
    기타: [],
  };

  checklistItems.forEach((item) => {
    if (item.includes('[SEO]') || item.includes('SEO')) {
      improvementsByCategory.SEO.push(item);
    } else if (item.includes('[AEO]') || item.includes('AEO')) {
      improvementsByCategory.AEO.push(item);
    } else if (item.includes('[GEO]') || item.includes('GEO')) {
      improvementsByCategory.GEO.push(item);
    } else {
      improvementsByCategory.기타.push(item);
    }
  });

  // 네이버 블로그 또는 iframe 구조인 경우 특별 처리
  if (isNaverBlog || hasIframe) {
    const prompt = `당신은 SEO/AEO/GEO 전문 콘텐츠 개선 가이드 작성자입니다.
현재 분석된 웹페이지는 ${isNaverBlog ? '네이버 블로그' : 'iframe 구조'}로 되어 있어 실제 콘텐츠가 iframe 내부에 있습니다.
따라서 HTML 구조를 수정하는 것이 아니라, **실제 블로그 콘텐츠에 적용할 수 있는 구체적인 개선 포인트와 가이드**를 제공해야 합니다.

[현재 분석 점수]
- SEO: ${analysisResult.seoScore}/100 (목표: 80점 이상)
- AEO: ${analysisResult.aeoScore}/100 (목표: 80점 이상)
- GEO: ${analysisResult.geoScore}/100 (목표: 80점 이상)
- 종합: ${analysisResult.overallScore}/100

[분석 결과 기반 개선이 필요한 사항]
${Object.entries(improvementsByCategory)
  .filter(([_, items]) => items.length > 0)
  .map(([category, items]) => `\n## ${category} 개선 사항\n${items.join('\n')}`)
  .join('\n')}

[출력 형식 요구사항]
다음 형식으로 **개선 가이드 문서**를 작성해주세요:

# 콘텐츠 개선 가이드

## 현재 상태 분석
- 현재 점수와 목표 점수의 차이를 명확히 제시
- 가장 시급하게 개선해야 할 영역 3가지를 우선순위로 제시

## 구체적인 개선 포인트

### 1. SEO 개선 포인트
각 개선 사항에 대해:
- **개선 항목**: 무엇을 개선해야 하는지
- **현재 상태**: 현재 어떤 문제가 있는지
- **개선 방법**: 구체적으로 어떻게 개선할 수 있는지 (실행 가능한 단계)
- **예상 효과**: 이 개선으로 기대되는 점수 향상

### 2. AEO 개선 포인트
(동일한 형식)

### 3. GEO 개선 포인트
(동일한 형식)

## 실제 적용 가이드
각 개선 포인트를 실제 블로그 콘텐츠에 적용하는 방법을 단계별로 안내:
- 블로그 에디터에서 어떻게 수정할 수 있는지
- 어떤 섹션에 추가하면 좋은지
- 예시 텍스트나 구조 제시

## 예상 개선 효과
- SEO 점수: ${analysisResult.seoScore} → 예상 80+ 점
- AEO 점수: ${analysisResult.aeoScore} → 예상 80+ 점
- GEO 점수: ${analysisResult.geoScore} → 예상 80+ 점

**중요**: HTML 코드를 보여주지 말고, 실제 블로그 콘텐츠 작성자가 바로 적용할 수 있는 **실행 가능한 개선 가이드**를 제공하세요.`;

    return prompt;
  }

  // 일반 웹사이트의 경우 기존 방식 유지하되 개선
  const prompt = `당신은 SEO/AEO/GEO 전문 콘텐츠 편집자입니다. 
다음 웹페이지 콘텐츠를 분석 결과를 바탕으로 개선하여 수정해주세요.

[원본 콘텐츠]
${originalContent.substring(0, 10000)}${originalContent.length > 10000 ? '...' : ''}

[현재 분석 점수]
- SEO: ${analysisResult.seoScore}/100 (목표: 80점 이상)
- AEO: ${analysisResult.aeoScore}/100 (목표: 80점 이상)
- GEO: ${analysisResult.geoScore}/100 (목표: 80점 이상)
- 종합: ${analysisResult.overallScore}/100

[분석 결과 기반 개선이 필요한 사항]
${Object.entries(improvementsByCategory)
  .filter(([_, items]) => items.length > 0)
  .map(([category, items]) => `\n## ${category} 개선 사항\n${items.join('\n')}`)
  .join('\n')}

[출력 형식]
다음 형식으로 개선된 콘텐츠와 개선 포인트를 함께 제공해주세요:

# 개선된 콘텐츠

## 주요 개선 포인트 요약
- SEO: [개선된 항목 3-5개]
- AEO: [개선된 항목 3-5개]
- GEO: [개선된 항목 3-5개]

## 개선된 콘텐츠
[실제 개선된 콘텐츠 내용 - 마크다운 형식]

## 개선 상세 설명
각 개선 사항에 대해:
- **개선 항목**: 무엇을 개선했는지
- **개선 방법**: 어떻게 개선했는지
- **예상 효과**: 이 개선으로 기대되는 점수 향상

[수정 지침]
1. 원본 콘텐츠의 톤, 스타일, 핵심 메시지를 유지하세요
2. HTML 구조와 태그 형식을 보존하세요 (태그를 삭제하거나 구조를 망가뜨리지 마세요)
3. 위 개선 사항을 자연스럽게 통합하세요
4. 변경 사항은 명확하고 구체적으로 하되, 원본의 의도를 해치지 마세요
5. 마크다운 형식으로 출력하세요

[중요]
- 원본 콘텐츠의 핵심 내용은 변경하지 마세요
- 모든 변경 사항은 자연스럽고 읽기 쉽게 통합하세요
- 과도한 키워드 삽입은 피하세요
- 사용자 경험을 최우선으로 고려하세요`;

  return prompt;
}

