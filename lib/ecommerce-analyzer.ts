/**
 * 커머스 특화 분석 모듈
 * 상품 페이지에 특화된 SEO, AEO, GEO 점수 계산 및 인사이트 생성
 */

import * as cheerio from 'cheerio';
import type { ProductPageStructure } from './product-structure-extractor';
import type { Insight } from './analyzer';

/**
 * 커머스 SEO 점수 계산
 */
export function calculateEcommerceSEOScore(
  $: cheerio.CheerioAPI, 
  structure: ProductPageStructure
): number {
  let score = 0;
  
  // 기본 SEO 요소 (30점)
  const h1Count = $('h1').length;
  if (h1Count === 1) score += 10;
  
  const title = $('title').text().trim();
  if (title.length > 0 && title.length <= 60) score += 10;
  
  const metaDesc = $('meta[name="description"]').attr('content') || '';
  if (metaDesc.length > 0 && metaDesc.length <= 160) score += 10;
  
  // 커머스 특화 SEO 요소 (70점)
  
  // 1. Product Schema (20점)
  if (structure.seo.hasProductSchema) score += 20;
  
  // 2. 가격 정보 (15점)
  if (structure.pricing.hasPrice) score += 15;
  
  // 3. 이미지 최적화 (15점)
  if (structure.images.totalCount >= 3) score += 10;
  if (structure.images.hasAltText) score += 5;
  
  // 4. 리뷰/평점 Schema (10점)
  if (structure.reviews.hasRatingSchema) score += 10;
  
  // 5. Breadcrumb (5점)
  if (structure.seo.hasBreadcrumb) score += 5;
  
  // 6. Open Graph (5점)
  if (structure.seo.hasOgTags) score += 5;
  
  return Math.min(100, score);
}

/**
 * 커머스 AEO 점수 계산
 */
export function calculateEcommerceAEOScore(
  $: cheerio.CheerioAPI,
  structure: ProductPageStructure
): number {
  let score = 0;
  
  // 1. 상품 설명 품질 (25점)
  const description = structure.productInfo.description;
  const wordCount = description.split(/\s+/).length;
  if (wordCount >= 300) score += 25;
  else if (wordCount >= 200) score += 20;
  else if (wordCount >= 100) score += 15;
  else if (wordCount >= 50) score += 10;
  
  // 2. FAQ 섹션 (20점)
  if (structure.details.hasFAQ) score += 20;
  
  // 3. 상세 스펙 정보 (15점)
  if (structure.details.hasSpecifications) score += 15;
  
  // 4. 질문 형식 콘텐츠 (15점)
  const bodyText = $('body').text();
  const hasQuestions = /[?？]/.test(bodyText) || 
                      /\b(어떻게|왜|언제|어디서|무엇|how|why|when|what|which)\b/i.test(bodyText);
  if (hasQuestions) score += 15;
  
  // 5. 구조화된 답변 (10점)
  const hasH2H3Bullets = $('h2').length > 0 && $('h3').length > 0 && $('ul, ol').length > 0;
  if (hasH2H3Bullets) score += 10;
  
  // 6. 리뷰 섹션 (10점)
  if (structure.reviews.hasReviewSection) score += 10;
  
  // 7. 신선도 표시 (5점)
  const hasDate = $('time, [datetime], [class*="date"]').length > 0;
  if (hasDate) score += 5;
  
  return Math.min(100, score);
}

/**
 * 커머스 GEO 점수 계산
 */
export function calculateEcommerceGEOScore(
  $: cheerio.CheerioAPI,
  structure: ProductPageStructure
): number {
  let score = 0;
  const text = $('body').text();
  const wordCount = text.split(/\s+/).length;
  
  // 1. 콘텐츠 길이 (20점)
  if (wordCount >= 2000) score += 20;
  else if (wordCount >= 1500) score += 18;
  else if (wordCount >= 1000) score += 15;
  else if (wordCount >= 500) score += 10;
  else if (wordCount >= 300) score += 5;
  
  // 2. 다중 미디어 (20점)
  if (structure.images.totalCount >= 5) score += 20;
  else if (structure.images.totalCount >= 3) score += 15;
  else if (structure.images.totalCount >= 1) score += 10;
  
  // 3. 구조화된 데이터 (20점)
  if (structure.seo.hasProductSchema) score += 20;
  
  // 4. 섹션 구조 (15점)
  const hasH2H3Bullets = $('h2').length > 0 && $('h3').length > 0 && $('ul, ol').length > 0;
  if (hasH2H3Bullets) score += 15;
  else if ($('h2').length > 0) score += 10;
  else if ($('section, article').length > 0) score += 5;
  
  // 5. 키워드 다양성 (10점)
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const uniqueWords = new Set(words);
  const diversity = words.length > 0 ? uniqueWords.size / words.length : 0;
  if (diversity > 0.3) score += 10;
  else if (diversity > 0.2) score += 5;
  
  // 6. Open Graph 완전성 (10점)
  if (structure.seo.hasOgTags) {
    const ogTitle = $('meta[property="og:title"]').attr('content');
    const ogDesc = $('meta[property="og:description"]').attr('content');
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogTitle && ogDesc && ogImage) score += 10;
    else if (ogTitle || ogDesc || ogImage) score += 5;
  }
  
  // 7. 신선도 (5점)
  const hasDate = $('time, [datetime], [class*="date"]').length > 0;
  if (hasDate) score += 5;
  
  return Math.min(100, score);
}

/**
 * 커머스 특화 인사이트 생성
 */
export function generateEcommerceInsights(
  $: cheerio.CheerioAPI,
  structure: ProductPageStructure,
  seoScore: number,
  aeoScore: number,
  geoScore: number
): Insight[] {
  const insights: Insight[] = [];
  
  // SEO 인사이트
  if (!structure.seo.hasProductSchema) {
    insights.push({
      severity: 'High',
      category: '커머스 SEO',
      message: 'Schema.org Product 마크업이 없습니다. Google Shopping 등에 노출되려면 필수입니다.',
    });
  }
  
  if (!structure.pricing.hasPrice) {
    insights.push({
      severity: 'High',
      category: '커머스 SEO',
      message: '가격 정보가 없습니다. 상품 페이지의 핵심 정보입니다.',
    });
  }
  
  if (structure.images.totalCount < 3) {
    insights.push({
      severity: 'Medium',
      category: '커머스 SEO',
      message: `이미지가 ${structure.images.totalCount}개로 부족합니다. 최소 3개 이상 권장합니다.`,
    });
  }
  
  if (!structure.images.hasAltText) {
    insights.push({
      severity: 'High',
      category: '커머스 SEO',
      message: '이미지에 Alt 텍스트가 부족합니다. SEO와 접근성을 위해 모든 이미지에 Alt 텍스트를 추가하세요.',
    });
  }
  
  if (!structure.seo.hasBreadcrumb) {
    insights.push({
      severity: 'Medium',
      category: '커머스 SEO',
      message: 'Breadcrumb(경로 표시)가 없습니다. 사용자 경험과 SEO에 도움이 됩니다.',
    });
  }
  
  // AEO 인사이트
  if (!structure.details.hasFAQ) {
    insights.push({
      severity: 'Medium',
      category: '커머스 AEO',
      message: 'FAQ 섹션을 추가하세요. "이 상품은 어떤가요?" 같은 질문에 AI가 답변할 수 있습니다.',
    });
  }
  
  const descriptionWordCount = structure.productInfo.description.split(/\s+/).length;
  if (descriptionWordCount < 100) {
    insights.push({
      severity: 'Medium',
      category: '커머스 AEO',
      message: `상품 설명이 ${descriptionWordCount}단어로 너무 짧습니다. 최소 100단어 이상 권장합니다.`,
    });
  }
  
  if (!structure.details.hasSpecifications) {
    insights.push({
      severity: 'Low',
      category: '커머스 AEO',
      message: '상세 스펙 정보를 추가하세요. AI 검색 엔진이 상품을 더 잘 이해할 수 있습니다.',
    });
  }
  
  // GEO 인사이트
  const bodyText = $('body').text();
  const wordCount = bodyText.split(/\s+/).length;
  
  if (wordCount < 500) {
    insights.push({
      severity: 'Medium',
      category: '커머스 GEO',
      message: `콘텐츠가 ${wordCount}단어로 부족합니다. 생성형 검색 엔진을 위해 500단어 이상 권장합니다.`,
    });
  }
  
  if (structure.images.totalCount < 3) {
    insights.push({
      severity: 'Medium',
      category: '커머스 GEO',
      message: `이미지가 ${structure.images.totalCount}개로 부족합니다. 최소 3-5개 이상 권장합니다.`,
    });
  }
  
  if (!structure.seo.hasProductSchema) {
    insights.push({
      severity: 'High',
      category: '커머스 GEO',
      message: 'Product Schema를 추가하세요. AI 검색 엔진이 상품 정보를 구조화하여 이해할 수 있습니다.',
    });
  }
  
  return insights;
}
