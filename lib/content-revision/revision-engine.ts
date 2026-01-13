import { GoogleGenerativeAI } from '@google/generative-ai';
import { AnalysisResult } from '@/lib/analyzer';
import { buildRevisionPrompt, RevisionRequest } from './prompt-builder';
import { withRetry } from '@/lib/retry';
import * as cheerio from 'cheerio';

export interface RevisionResult {
  revisedContent: string;
  revisedMarkdown: string;
  predictedScores?: {
    seo: number;
    aeo: number;
    geo: number;
    overall: number;
  };
  improvements: string[];
}

/**
 * 콘텐츠 수정 엔진
 */
export async function reviseContent(
  request: RevisionRequest,
  apiKey: string
): Promise<RevisionResult> {
  // 프롬프트 생성
  const prompt = buildRevisionPrompt(request);
  
  // Gemini API 호출
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash', // 최신 Flash 모델 사용
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
  });

  const revisedContent = await withRetry(
    async () => {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      if (!text || text.trim().length === 0) {
        throw new Error('수정된 콘텐츠를 받지 못했습니다.');
      }
      
      return text.trim();
    },
    {
      maxAttempts: 3,
      initialDelay: 1000,
      backoffMultiplier: 2,
    }
  );

  // 마크다운으로 변환 (HTML이 포함되어 있으면 유지)
  const revisedMarkdown = convertToMarkdown(revisedContent, request.originalContent);
  
  // 예상 점수 계산 (간단한 추정)
  const predictedScores = estimateScores(request.analysisResult, revisedMarkdown);
  
  // 개선 사항 추출
  const improvements = extractImprovements(request.analysisResult, revisedMarkdown);

  return {
    revisedContent,
    revisedMarkdown,
    predictedScores,
    improvements,
  };
}

/**
 * HTML을 마크다운으로 변환 (기본 태그는 유지)
 */
function convertToMarkdown(content: string, originalContent: string): string {
  // 이미 마크다운 형식이면 그대로 반환
  const htmlTags = content.match(/<[^>]+>/g);
  if (!content.includes('<') || !htmlTags || htmlTags.length < 5) {
    return content;
  }
  
  // HTML이 많이 포함되어 있으면 HTML 구조를 유지하면서 마크다운 요소 추가
  try {
    const $ = cheerio.load(content);
    
    // 기본 마크다운 변환
    $('h1').each((_, el) => {
      const text = $(el).text();
      $(el).replaceWith(`# ${text}\n\n`);
    });
    
    $('h2').each((_, el) => {
      const text = $(el).text();
      $(el).replaceWith(`## ${text}\n\n`);
    });
    
    $('h3').each((_, el) => {
      const text = $(el).text();
      $(el).replaceWith(`### ${text}\n\n`);
    });
    
    $('p').each((_, el) => {
      const text = $(el).text();
      if (text.trim()) {
        $(el).replaceWith(`${text}\n\n`);
      }
    });
    
    $('ul li').each((_, el) => {
      const text = $(el).text();
      $(el).replaceWith(`- ${text}\n`);
    });
    
    $('ol li').each((_, el) => {
      const text = $(el).text();
      $(el).replaceWith(`1. ${text}\n`);
    });
    
    const markdown = $.text();
    return markdown.replace(/\n{3,}/g, '\n\n').trim();
  } catch (error) {
    // 변환 실패 시 원본 반환
    console.warn('마크다운 변환 실패:', error);
    return content;
  }
}

/**
 * 예상 점수 계산 (간단한 추정)
 */
function estimateScores(
  originalAnalysis: AnalysisResult,
  revisedContent: string
): {
  seo: number;
  aeo: number;
  geo: number;
  overall: number;
} {
  const $ = cheerio.load(revisedContent);
  
  // SEO 점수 추정
  let seoImprovement = 0;
  if ($('h1').length >= 1) seoImprovement += 10;
  if ($('title').length > 0 || revisedContent.includes('<title>')) seoImprovement += 15;
  if ($('meta[name="description"]').length > 0 || revisedContent.includes('meta name="description"')) seoImprovement += 10;
  if ($('img[alt]').length > 0 || revisedContent.includes('alt=')) seoImprovement += 8;
  if (revisedContent.includes('application/ld+json') || revisedContent.includes('schema.org')) seoImprovement += 12;
  
  // AEO 점수 추정
  let aeoImprovement = 0;
  const questionMatches = revisedContent.match(/[?？]/g)?.length || 0;
  if (questionMatches > 3) aeoImprovement += 15;
  if (revisedContent.includes('FAQ') || revisedContent.includes('자주 묻는 질문')) aeoImprovement += 20;
  if (revisedContent.includes('답변') || revisedContent.includes('Q:') || revisedContent.includes('A:')) aeoImprovement += 10;
  
  // GEO 점수 추정
  let geoImprovement = 0;
  const wordCount = revisedContent.split(/\s+/).length;
  if (wordCount > 1500) geoImprovement += 15;
  if (wordCount > 2000) geoImprovement += 10;
  const headingCount = ($('h1, h2, h3').length);
  if (headingCount > 5) geoImprovement += 10;
  if (revisedContent.includes('![') || revisedContent.includes('<img')) geoImprovement += 8;
  
  // 점수 계산 (최대 100점 제한)
  const seoScore = Math.min(100, originalAnalysis.seoScore + seoImprovement);
  const aeoScore = Math.min(100, originalAnalysis.aeoScore + aeoImprovement);
  const geoScore = Math.min(100, originalAnalysis.geoScore + geoImprovement);
  const overallScore = Math.round((seoScore + aeoScore + geoScore) / 3);
  
  return {
    seo: seoScore,
    aeo: aeoScore,
    geo: geoScore,
    overall: overallScore,
  };
}

/**
 * 개선 사항 추출 (분석 결과 기반)
 */
function extractImprovements(
  originalAnalysis: AnalysisResult,
  revisedContent: string
): string[] {
  const improvements: string[] = [];
  const $ = cheerio.load(revisedContent);
  
  // SEO 개선 사항
  const h1Count = ($('h1').length + (revisedContent.match(/^#\s+/gm)?.length || 0));
  if (h1Count >= 1 && originalAnalysis.seoScore < 70) {
    improvements.push('H1 태그 추가/개선됨 - 검색 엔진 최적화');
  }
  if (revisedContent.includes('<title>') || revisedContent.includes('title') || revisedContent.match(/^#\s+/)) {
    improvements.push('제목 구조 개선됨 - SEO 점수 향상');
  }
  if (revisedContent.includes('meta name="description"') || revisedContent.includes('description') || revisedContent.includes('메타 설명')) {
    improvements.push('Meta Description 추가/개선됨');
  }
  
  // 이미지 alt 속성 확인
  const imgCount = ($('img').length + (revisedContent.match(/!\[/g)?.length || 0));
  const altCount = ($('img[alt]').length + (revisedContent.match(/!\[[^\]]+\]/g)?.length || 0));
  if (imgCount > 0 && altCount === imgCount) {
    improvements.push('모든 이미지에 alt 속성 추가됨');
  }
  
  // AEO 개선 사항
  if (revisedContent.includes('FAQ') || revisedContent.includes('자주 묻는 질문') || revisedContent.includes('질문과 답변')) {
    improvements.push('FAQ 섹션 추가됨 - AI 검색 엔진 최적화');
  }
  const questionCount = revisedContent.match(/[?？]/g)?.length || 0;
  if (questionCount > 3) {
    improvements.push(`질문 형식 콘텐츠 추가됨 (${questionCount}개 질문 발견)`);
  }
  
  // GEO 개선 사항
  const wordCount = revisedContent.split(/\s+/).length;
  if (wordCount > 1500) {
    improvements.push(`콘텐츠 길이 확장됨 (${wordCount}단어) - 깊이 있는 정보 제공`);
  }
  if (wordCount > 2000) {
    improvements.push('상세한 콘텐츠로 확장됨 - 전문성 강화');
  }
  
  // 구조화된 데이터 확인
  if (revisedContent.includes('schema.org') || revisedContent.includes('application/ld+json') || revisedContent.includes('구조화된 데이터')) {
    improvements.push('구조화된 데이터 추가됨 - 검색 결과 향상');
  }
  
  // 인용 및 출처 확인
  const citationCount = (revisedContent.match(/출처|인용|참고|reference/gi)?.length || 0);
  if (citationCount > 0) {
    improvements.push('신뢰성 있는 출처 및 인용 추가됨');
  }
  
  // 분석 결과 기반 개선 사항 추가
  if (originalAnalysis.insights) {
    const highPriorityInsights = originalAnalysis.insights
      .filter((insight) => insight.severity === 'High')
      .slice(0, 3);
    
    highPriorityInsights.forEach((insight) => {
      if (insight.category === 'SEO' && !improvements.some(i => i.includes('SEO'))) {
        improvements.push(`SEO 개선: ${insight.message.substring(0, 50)}...`);
      }
      if (insight.category === 'AEO' && !improvements.some(i => i.includes('AEO'))) {
        improvements.push(`AEO 개선: ${insight.message.substring(0, 50)}...`);
      }
      if (insight.category === 'GEO' && !improvements.some(i => i.includes('GEO'))) {
        improvements.push(`GEO 개선: ${insight.message.substring(0, 50)}...`);
      }
    });
  }
  
  return improvements.length > 0 ? improvements : ['콘텐츠가 분석 결과를 바탕으로 개선되었습니다'];
}

