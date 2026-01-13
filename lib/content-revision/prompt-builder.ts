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

  const prompt = `당신은 SEO/AEO/GEO 전문 콘텐츠 편집자입니다. 
다음 웹페이지 콘텐츠를 분석 결과를 바탕으로 개선하여 수정해주세요.

[원본 콘텐츠]
${originalContent.substring(0, 10000)}${originalContent.length > 10000 ? '...' : ''}

[현재 분석 점수]
- SEO: ${analysisResult.seoScore}/100 (목표: 80점 이상)
- AEO: ${analysisResult.aeoScore}/100 (목표: 80점 이상)
- GEO: ${analysisResult.geoScore}/100 (목표: 80점 이상)
- 종합: ${analysisResult.overallScore}/100

[개선이 필요한 사항]
${Object.entries(improvementsByCategory)
  .filter(([_, items]) => items.length > 0)
  .map(([category, items]) => `\n## ${category} 개선 사항\n${items.join('\n')}`)
  .join('\n')}

[수정 지침]
1. 원본 콘텐츠의 톤, 스타일, 핵심 메시지를 유지하세요
2. HTML 구조와 태그 형식을 보존하세요 (태그를 삭제하거나 구조를 망가뜨리지 마세요)
3. 위 개선 사항을 자연스럽게 통합하세요
4. 변경 사항은 명확하고 구체적으로 하되, 원본의 의도를 해치지 마세요
5. 마크다운 형식으로 출력하되, HTML 태그가 있다면 유지하세요

[SEO 개선 포인트]
- 제목 태그(H1)가 명확하고 검색 키워드를 포함하는지 확인
- 메타 설명이 매력적이고 클릭을 유도하는지 확인
- 구조화된 데이터(Schema.org) 추가 고려
- 이미지 alt 속성 추가/개선
- 내부/외부 링크 최적화

[AEO 개선 포인트]
- 질문 형식의 제목 및 소제목 추가
- FAQ 섹션 추가 (자주 묻는 질문 3-5개)
- 답변 형식의 콘텐츠 구조화
- 검색 의도에 맞는 키워드 자연스럽게 포함

[GEO 개선 포인트]
- 콘텐츠 길이 확장 (최소 1500단어 이상 권장)
- 관련 섹션 추가로 깊이 있는 정보 제공
- 통계, 데이터, 인용 등 신뢰성 있는 정보 추가
- 이미지, 표, 그래프 등 시각적 요소 활용

[중요]
- 원본 콘텐츠의 핵심 내용은 변경하지 마세요
- 모든 변경 사항은 자연스럽고 읽기 쉽게 통합하세요
- 과도한 키워드 삽입은 피하세요
- 사용자 경험을 최우선으로 고려하세요

수정된 콘텐츠를 마크다운 형식으로 출력해주세요. 변경된 주요 부분은 간단히 설명해주세요:`;

  return prompt;
}

