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
 * 개선 사항 추출
 */
function extractImprovements(
  originalAnalysis: AnalysisResult,
  revisedContent: string
): string[] {
  const improvements: string[] = [];
  const $ = cheerio.load(revisedContent);
  
  // SEO 개선 사항
  if ($('h1').length >= 1 && originalAnalysis.seoScore < 70) {
    improvements.push('H1 태그 추가됨');
  }
  if (revisedContent.includes('<title>') || revisedContent.includes('title')) {
    improvements.push('Title 태그 추가/개선됨');
  }
  if (revisedContent.includes('meta name="description"') || revisedContent.includes('description')) {
    improvements.push('Meta Description 추가/개선됨');
  }
  
  // AEO 개선 사항
  if (revisedContent.includes('FAQ') || revisedContent.includes('자주 묻는 질문')) {
    improvements.push('FAQ 섹션 추가됨');
  }
  const questionCount = revisedContent.match(/[?？]/g)?.length || 0;
  if (questionCount > 3) {
    improvements.push('질문 형식 콘텐츠 추가됨');
  }
  
  // GEO 개선 사항
  const wordCount = revisedContent.split(/\s+/).length;
  if (wordCount > 1500) {
    improvements.push('콘텐츠 길이 확장됨');
  }
  
  return improvements.length > 0 ? improvements : ['콘텐츠가 개선되었습니다'];
}

