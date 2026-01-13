import { AnalysisResult } from '@/lib/analyzer';
import { getBlogPlatformFromURL } from '@/lib/blog-detector';
import * as cheerio from 'cheerio';

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

  // 원문에서 텍스트와 구조 추출
  const { textContent, structure } = extractTextAndStructure(originalContent);
  
  // 네이버 블로그 또는 iframe 구조인 경우 특별 처리
  if (isNaverBlog || hasIframe) {
    const prompt = `당신은 SEO/AEO/GEO 전문 콘텐츠 편집자입니다.
현재 분석된 웹페이지는 ${isNaverBlog ? '네이버 블로그' : 'iframe 구조'}로 되어 있어 실제 콘텐츠가 iframe 내부에 있습니다.
**원문의 구조와 배열을 그대로 유지하면서**, 텍스트만 SEO/AEO/GEO 기준에 맞춰 개선해야 합니다.

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

[원문 콘텐츠 구조]
${structure}

[원문 텍스트 내용]
${textContent.substring(0, 15000)}${textContent.length > 15000 ? '...' : ''}

[출력 형식 요구사항]
**원문의 구조와 배열을 정확히 유지하면서**, 텍스트만 개선된 버전을 제공해주세요.

출력 형식:
1. 원문의 제목, 소제목, 문단 구조를 그대로 유지
2. 각 섹션의 순서와 배열을 동일하게 유지
3. 텍스트만 SEO/AEO/GEO 기준에 맞춰 개선
4. HTML 태그나 마크다운 문법 없이 **순수 텍스트**로 출력
5. 블로그 플랫폼에 바로 붙여넣을 수 있는 형태로 제공

[개선 지침]
- 원문의 톤과 스타일 유지
- 핵심 메시지와 의미 변경 금지
- 자연스러운 문장 흐름 유지
- 키워드 과도 삽입 금지
- 사용자 경험 최우선

[개선 포인트]
${Object.entries(improvementsByCategory)
  .filter(([_, items]) => items.length > 0)
  .map(([category, items]) => `\n${category}:\n${items.slice(0, 5).join('\n')}`)
  .join('\n')}

**중요**: 
- HTML 코드나 마크다운 문법을 사용하지 마세요
- 원문 구조를 그대로 유지하세요
- 순수 텍스트만 출력하세요
- 블로그 에디터에 바로 붙여넣을 수 있는 형태로 제공하세요`;

    return prompt;
  }

  // 일반 웹사이트의 경우도 텍스트 중심으로 개선
  const prompt = `당신은 SEO/AEO/GEO 전문 콘텐츠 편집자입니다. 
다음 웹페이지 콘텐츠를 분석 결과를 바탕으로 개선하여 수정해주세요.

[원문 콘텐츠 구조]
${structure}

[원문 텍스트 내용]
${textContent.substring(0, 15000)}${textContent.length > 15000 ? '...' : ''}

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
**원문의 구조와 배열을 정확히 유지하면서**, 텍스트만 개선된 버전을 제공해주세요.

출력 형식:
1. 원문의 제목, 소제목, 문단 구조를 그대로 유지
2. 각 섹션의 순서와 배열을 동일하게 유지
3. 텍스트만 SEO/AEO/GEO 기준에 맞춰 개선
4. HTML 태그나 마크다운 문법 없이 **순수 텍스트**로 출력
5. 웹사이트나 블로그 플랫폼에 바로 붙여넣을 수 있는 형태로 제공

[개선 지침]
- 원문의 톤과 스타일 유지
- 핵심 메시지와 의미 변경 금지
- 자연스러운 문장 흐름 유지
- 키워드 과도 삽입 금지
- 사용자 경험 최우선

[개선 포인트]
${Object.entries(improvementsByCategory)
  .filter(([_, items]) => items.length > 0)
  .map(([category, items]) => `\n${category}:\n${items.slice(0, 5).join('\n')}`)
  .join('\n')}

**중요**: 
- HTML 코드나 마크다운 문법을 사용하지 마세요
- 원문 구조를 그대로 유지하세요
- 순수 텍스트만 출력하세요
- 플랫폼에 바로 붙여넣을 수 있는 형태로 제공하세요`;

  return prompt;
}

/**
 * 원문에서 텍스트와 구조 추출
 */
function extractTextAndStructure(html: string): { textContent: string; structure: string } {
  try {
    const $ = cheerio.load(html);
    
    // 불필요한 태그 제거
    $('script, style, nav, footer, header, aside, .ad, .advertisement').remove();
    
    // 구조 정보 추출
    const structure: string[] = [];
    const headings: Array<{ level: number; text: string }> = [];
    
    // 제목 구조 추출
    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
      const tagName = el.tagName.toLowerCase();
      const level = parseInt(tagName.charAt(1));
      const text = $(el).text().trim();
      if (text) {
        headings.push({ level, text });
        structure.push(`${'  '.repeat(level - 1)}${tagName.toUpperCase()}: ${text}`);
      }
    });
    
    // 본문 텍스트 추출 (구조 유지)
    const textContent = extractTextWithStructure($);
    
    const structureText = structure.length > 0 
      ? `문서 구조:\n${structure.join('\n')}\n\n총 ${headings.length}개의 제목 구조가 있습니다.`
      : '제목 구조가 명확하지 않습니다. 문단 중심으로 구조를 유지해주세요.';
    
    return {
      textContent,
      structure: structureText,
    };
  } catch (error) {
    console.warn('구조 추출 실패:', error);
    // 실패 시 간단한 텍스트 추출
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return {
      textContent: text,
      structure: '구조 추출 실패. 원문 텍스트를 기반으로 구조를 유지해주세요.',
    };
  }
}

/**
 * 구조를 유지하면서 텍스트 추출
 */
function extractTextWithStructure($: cheerio.CheerioAPI): string {
  const body = $('body');
  if (body.length === 0) {
    return $.text();
  }
  
  const textParts: string[] = [];
  
  // 본문 영역 찾기
  const mainContent = body.find('main, article, .content, #content, .post-content, .entry-content').first();
  const contentArea = mainContent.length > 0 ? mainContent : body;
  
  // 구조를 유지하면서 텍스트 추출
  contentArea.contents().each((_, node) => {
    if (node.type === 'text') {
      const text = $(node).text().trim();
      if (text) {
        textParts.push(text);
      }
    } else if (node.type === 'tag') {
      const tagName = node.tagName.toLowerCase();
      const $el = $(node);
      const text = $el.text().trim();
      
      if (text) {
        // 제목 태그
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
          textParts.push(`\n\n${text}\n`);
        }
        // 문단
        else if (tagName === 'p') {
          textParts.push(`\n${text}\n`);
        }
        // 리스트
        else if (['ul', 'ol'].includes(tagName)) {
          $el.find('li').each((_, li) => {
            const liText = $(li).text().trim();
            if (liText) {
              textParts.push(`\n- ${liText}`);
            }
          });
        }
        // 기타
        else {
          textParts.push(text);
        }
      }
    }
  });
  
  return textParts.join(' ').replace(/\n{3,}/g, '\n\n').trim();
}

