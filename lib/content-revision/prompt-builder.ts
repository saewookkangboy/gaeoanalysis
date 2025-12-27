import { AnalysisResult } from '@/lib/analyzer';

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
    .slice(0, 5)
    .map((insight) => `- [${insight.category}] ${insight.message}`);
  
  checklistItems.push(...highPriorityInsights);
  
  // AI 모델별 추천사항 추가
  if (analysisResult.aioAnalysis) {
    analysisResult.aioAnalysis.insights.forEach((insight) => {
      insight.recommendations.slice(0, 2).forEach((rec) => {
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
  
  const prompt = `당신은 SEO/AEO/GEO 전문 콘텐츠 편집자입니다. 
다음 웹페이지 콘텐츠를 분석 결과를 바탕으로 개선하여 수정해주세요.

[원본 콘텐츠]
${originalContent.substring(0, 8000)}${originalContent.length > 8000 ? '...' : ''}

[현재 분석 점수]
- SEO: ${analysisResult.seoScore}/100
- AEO: ${analysisResult.aeoScore}/100
- GEO: ${analysisResult.geoScore}/100
- 종합: ${analysisResult.overallScore}/100

[개선이 필요한 사항]
${checklistItems.join('\n')}

[수정 지침]
1. 원본 콘텐츠의 톤, 스타일, 핵심 메시지를 유지하세요
2. HTML 구조와 태그 형식을 보존하세요 (태그를 삭제하거나 구조를 망가뜨리지 마세요)
3. 위 개선 사항을 자연스럽게 통합하세요
4. 변경 사항은 명확하고 구체적으로 하되, 원본의 의도를 해치지 마세요
5. 마크다운 형식으로 출력하되, HTML 태그가 있다면 유지하세요

[중요]
- 원본 콘텐츠의 핵심 내용은 변경하지 마세요
- 메타 태그, 제목 태그, 구조화된 데이터 등을 추가/개선하세요
- FAQ 섹션이 없으면 추가하세요
- 이미지에 alt 속성이 없으면 추가하세요
- 콘텐츠가 너무 짧으면 관련 섹션을 확장하세요

수정된 콘텐츠를 마크다운 형식으로 출력해주세요:`;

  return prompt;
}

