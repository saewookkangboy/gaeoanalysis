/**
 * 커머스 상품 페이지 전용 분석 모듈
 * 네이버 블로그 분석 모듈과 유사한 구조로 커머스 상품 페이지를 분석합니다.
 */

import * as cheerio from 'cheerio';
import { 
  calculateAIOCitationScores, 
  generateAIOCitationAnalysis, 
  AIOCitationAnalysis 
} from './ai-citation-analyzer';
import { DEFAULT_AIO_WEIGHTS } from './algorithm-defaults';
import { getResolvedAlgorithmWeights } from './algorithm-weights';
import { 
  calculateAIVisibilityScore, 
  generateAIVisibilityRecommendations 
} from './ai-visibility-calculator';
import { 
  extractCitationSources, 
  CitationExtractionResult, 
  calculateDomainStatistics, 
  DomainStatistics 
} from './citation-extractor';
import { 
  calculateAllDomainAuthorities, 
  findCitationOpportunities, 
  detectQualityIssues 
} from './citation-analyzer';
import { 
  SEO_GUIDELINES, 
  getImprovementPriority, 
  getContentWritingGuidelines 
} from './seo-guidelines';
import type { AnalysisResult, Insight } from './analyzer';
import type { DomainAuthority, CitationOpportunity, QualityIssue } from './citation-analyzer';
import { extractProductStructure, ProductPageStructure } from './product-structure-extractor';
import { 
  calculateEcommerceSEOScore,
  calculateEcommerceAEOScore,
  calculateEcommerceGEOScore,
  generateEcommerceInsights
} from './ecommerce-analyzer';
import { analyzeUX, UXAnalysis } from './ux-analyzer';

/**
 * 커머스 상품 페이지 특화 분석 결과 인터페이스
 */
export interface EcommerceAnalysisResult extends AnalysisResult {
  ecommerceSpecific?: {
    productStructure: ProductPageStructure;
    uxAnalysis: UXAnalysis;
    conversionOptimization: {
      hasPriceDisplay: boolean;
      hasBuyButton: boolean;
      hasStockInfo: boolean;
      hasShippingInfo: boolean;
      score: number;
    };
    seoOptimization: {
      hasProductSchema: boolean;
      hasReviewSchema: boolean;
      hasBreadcrumbSchema: boolean;
      score: number;
    };
    aiOptimization: {
      hasRichDescription: boolean;
      hasFAQ: boolean;
      hasStructuredData: boolean;
      score: number;
    };
  };
}

/**
 * 커머스 상품 페이지 분석
 */
export async function analyzeEcommerceProductPage(
  html: string, 
  url: string
): Promise<EcommerceAnalysisResult> {
  const $ = cheerio.load(html);
  
  // 상품 페이지 구조 추출
  const productStructure = extractProductStructure($, html);
  
  // 커머스 특화 점수 계산
  const seoScore = calculateEcommerceSEOScore($, productStructure);
  const aeoScore = calculateEcommerceAEOScore($, productStructure);
  const geoScore = calculateEcommerceGEOScore($, productStructure);
  
  // 종합 점수
  const overallScore = Math.round((aeoScore + geoScore + seoScore) / 3);
  
  // AI 모델별 인용 확률 계산
  const aioWeights = getResolvedAlgorithmWeights('aio', DEFAULT_AIO_WEIGHTS);
  const aioScores = calculateAIOCitationScores($, aeoScore, geoScore, seoScore, aioWeights);
  const aioAnalysis = generateAIOCitationAnalysis(aioScores);
  
  // AI Visibility 점수 계산
  const aiVisibilityScore = calculateAIVisibilityScore(
    $, 
    aioScores, 
    aeoScore, 
    geoScore, 
    seoScore
  );
  
  // 구조화된 데이터 점수 계산
  const structuredDataText = $('script[type="application/ld+json"]').text();
  const hasStructuredData = $('script[type="application/ld+json"]').length > 0;
  const structuredDataScore = hasStructuredData ? 
    (structuredDataText.includes('FAQPage') ? 90 :
     structuredDataText.includes('"Product"') ? 80 :
     structuredDataText.includes('"Article"') || structuredDataText.includes('"BlogPosting"') ? 70 :
     50) : 0;
  
  const text = $('body').text();
  const wordCount = text.split(/\s+/).length;
  const qualityScore = Math.min(100, 
    ((aeoScore + geoScore + seoScore) / 3) * 0.5 +
    (wordCount >= 2000 ? 20 : wordCount >= 1500 ? 15 : wordCount >= 1000 ? 10 : wordCount >= 500 ? 5 : 0) +
    (structuredDataText.includes('author') && /자격|credential|전문가/i.test(text) ? 15 : 0)
  );
  
  const hasDate = $('time, [datetime], [class*="date"]').length > 0;
  const hasRecentYear = /(202[4-9]|최근|recent|updated)/i.test(text);
  const freshnessScore = (hasDate ? 30 : 0) + (hasRecentYear ? 25 : 0) + 
                        (/업데이트|update/i.test(text) ? 20 : 0);
  
  const aiVisibilityRecommendations = generateAIVisibilityRecommendations(
    aiVisibilityScore,
    aioScores,
    structuredDataScore,
    qualityScore,
    freshnessScore
  );
  
  // 인용 소스 추출
  const citationSources = extractCitationSources(html, url);
  
  // 타겟 도메인 추출
  let targetDomain = '';
  try {
    const targetUrlObj = new URL(url);
    targetDomain = targetUrlObj.hostname.replace('www.', '');
  } catch (error) {
    console.warn('⚠️ [EcommerceAnalyzer] 타겟 URL 파싱 실패:', error);
  }
  
  // 도메인별 통계 계산
  const domainStatistics = calculateDomainStatistics(citationSources.sources, targetDomain);
  
  // 도메인 권위성 평가
  const domainAuthorities = calculateAllDomainAuthorities(
    citationSources.sources,
    domainStatistics
  );
  
  // 인용 획득 기회 발견
  const citationOpportunities = findCitationOpportunities(
    domainAuthorities,
    targetDomain
  );
  
  // 품질 관리: 이슈 감지
  const qualityIssues = detectQualityIssues(citationSources.sources);
  
  // 커머스 특화 인사이트 생성
  const insights = generateEcommerceInsights($, productStructure, seoScore, aeoScore, geoScore);
  
  // UI/UX 분석
  const uxAnalysis = analyzeUX($, productStructure, html);
  
  // 개선 우선순위 및 콘텐츠 작성 가이드라인 생성
  const improvementPriorities = getEcommerceImprovementPriority(
    aeoScore, 
    geoScore, 
    seoScore, 
    insights,
    productStructure
  );
  const contentGuidelines = getEcommerceContentGuidelines(
    aeoScore, 
    geoScore, 
    seoScore,
    productStructure
  );
  
  // 커머스 특화 최적화 점수 계산
  const conversionOptimization = {
    hasPriceDisplay: productStructure.pricing.hasPrice,
    hasBuyButton: productStructure.purchase.hasBuyButton,
    hasStockInfo: productStructure.purchase.stockStatus !== undefined,
    hasShippingInfo: /배송|shipping|delivery/i.test(text),
    score: calculateConversionScore(productStructure, text),
  };
  
  const seoOptimization = {
    hasProductSchema: productStructure.seo.hasProductSchema,
    hasReviewSchema: productStructure.reviews.hasRatingSchema,
    hasBreadcrumbSchema: productStructure.seo.hasBreadcrumb,
    score: calculateSEOOptimizationScore(productStructure),
  };
  
  const aiOptimization = {
    hasRichDescription: productStructure.productInfo.description.split(/\s+/).length >= 100,
    hasFAQ: productStructure.details.hasFAQ,
    hasStructuredData: productStructure.seo.hasProductSchema,
    score: calculateAIOptimizationScore(productStructure),
  };
  
  return {
    aeoScore,
    geoScore,
    seoScore,
    overallScore,
    insights,
    aioAnalysis,
    aiVisibilityScore,
    aiVisibilityRecommendations,
    citationSources,
    domainStatistics,
    domainAuthorities,
    citationOpportunities,
    qualityIssues,
    improvementPriorities,
    contentGuidelines,
    ecommerceSpecific: {
      productStructure,
      uxAnalysis,
      conversionOptimization,
      seoOptimization,
      aiOptimization,
    },
  };
}

/**
 * 전환 최적화 점수 계산
 */
function calculateConversionScore(
  structure: ProductPageStructure,
  text: string
): number {
  let score = 0;
  
  if (structure.pricing.hasPrice) score += 30;
  if (structure.purchase.hasBuyButton) score += 30;
  if (structure.purchase.hasCartButton) score += 20;
  if (structure.purchase.stockStatus !== undefined) score += 10;
  if (/배송|shipping|delivery/i.test(text)) score += 10;
  
  return Math.min(100, score);
}

/**
 * SEO 최적화 점수 계산
 */
function calculateSEOOptimizationScore(
  structure: ProductPageStructure
): number {
  let score = 0;
  
  if (structure.seo.hasProductSchema) score += 40;
  if (structure.reviews.hasRatingSchema) score += 30;
  if (structure.seo.hasBreadcrumb) score += 30;
  
  return Math.min(100, score);
}

/**
 * AI 최적화 점수 계산
 */
function calculateAIOptimizationScore(
  structure: ProductPageStructure
): number {
  let score = 0;
  
  const descriptionWordCount = structure.productInfo.description.split(/\s+/).length;
  if (descriptionWordCount >= 200) score += 40;
  else if (descriptionWordCount >= 100) score += 30;
  else if (descriptionWordCount >= 50) score += 20;
  
  if (structure.details.hasFAQ) score += 30;
  if (structure.seo.hasProductSchema) score += 30;
  
  return Math.min(100, score);
}

/**
 * 커머스 특화 개선 우선순위
 */
function getEcommerceImprovementPriority(
  aeoScore: number,
  geoScore: number,
  seoScore: number,
  insights?: Insight[],
  structure?: ProductPageStructure
): Array<{ 
  category: string; 
  priority: number; 
  reason: string;
  actionableTips?: Array<{ title: string; steps: string[]; expectedImpact: string }>;
}> {
  // 기본 개선 우선순위 가져오기
  const basePriorities = getImprovementPriority(aeoScore, geoScore, seoScore, insights);
  
  // 커머스 특화 팁 추가
  const ecommerceTips: Array<{ title: string; steps: string[]; expectedImpact: string }> = [];
  
  if (structure) {
    if (!structure.seo.hasProductSchema) {
      ecommerceTips.push({
        title: 'Schema.org Product 마크업 추가',
        steps: [
          'JSON-LD 형식으로 Product 스키마 추가',
          '상품명, 가격, 이미지, 브랜드 등 필수 정보 포함',
          'Google Shopping 등에 노출되기 위해 필수',
          '예시: <script type="application/ld+json">{"@context":"https://schema.org","@type":"Product",...}</script>',
        ],
        expectedImpact: 'SEO 점수 +20점, Google Shopping 노출 가능',
      });
    }
    
    if (!structure.pricing.hasPrice) {
      ecommerceTips.push({
        title: '가격 정보 추가',
        steps: [
          '상품 가격을 명확하게 표시',
          '할인가와 정가를 모두 표시 (할인율 계산)',
          'Schema.org에 price 속성 포함',
        ],
        expectedImpact: 'SEO 점수 +15점, 사용자 신뢰도 향상',
      });
    }
    
    if (structure.images.totalCount < 3) {
      ecommerceTips.push({
        title: `이미지 개수 증가 (현재 ${structure.images.totalCount}개)`,
        steps: [
          `최소 3개, 권장 5개 이상의 상품 이미지 추가`,
          '메인 이미지, 상세 이미지, 사용 예시 이미지 등',
          '모든 이미지에 Alt 텍스트 추가',
          '이미지 최적화 (WebP 포맷, 적절한 크기)',
        ],
        expectedImpact: 'SEO 점수 +10~15점, 전환율 향상',
      });
    }
    
    if (!structure.details.hasFAQ) {
      ecommerceTips.push({
        title: 'FAQ 섹션 추가',
        steps: [
          '자주 묻는 질문 5-10개 수집',
          'FAQPage 스키마 추가 (JSON-LD)',
          '질문과 답변을 구조화하여 표시',
        ],
        expectedImpact: 'AEO 점수 +20점, AI 인용 확률 증가',
      });
    }
  }
  
  if (ecommerceTips.length > 0) {
    basePriorities.push({
      category: '커머스 최적화',
      priority: seoScore < 70 ? 1 : 2,
      reason: '커머스 상품 페이지 특화 요소가 부족합니다',
      actionableTips: ecommerceTips,
    });
  }
  
  return basePriorities.sort((a, b) => a.priority - b.priority);
}

/**
 * 커머스 특화 콘텐츠 작성 가이드라인
 */
function getEcommerceContentGuidelines(
  aeoScore: number,
  geoScore: number,
  seoScore: number,
  structure?: ProductPageStructure
): string[] {
  const guidelines: string[] = [];
  
  // 기본 가이드라인
  const baseGuidelines = getContentWritingGuidelines(aeoScore, geoScore, seoScore);
  guidelines.push(...baseGuidelines);
  
  // 커머스 특화 가이드라인
  guidelines.push('✅ 커머스: Schema.org Product 마크업을 반드시 추가하세요 (Google Shopping 노출)');
  guidelines.push('✅ 커머스: 가격 정보를 명확하게 표시하세요 (정가, 할인가, 할인율)');
  guidelines.push('✅ 커머스: 상품 이미지를 최소 3개, 권장 5개 이상 추가하세요');
  guidelines.push('✅ 커머스: 모든 이미지에 Alt 텍스트를 추가하세요');
  guidelines.push('✅ 커머스: 구매 버튼을 명확하게 배치하세요');
  guidelines.push('✅ 커머스: 리뷰 및 평점 섹션을 추가하세요 (신뢰도 향상)');
  guidelines.push('✅ 커머스: FAQ 섹션을 추가하세요 (AI 검색 최적화)');
  guidelines.push('✅ 커머스: Breadcrumb을 추가하여 사용자 경험을 향상시키세요');
  guidelines.push('✅ 커머스: 상세 스펙 정보를 구조화하여 제공하세요');
  guidelines.push('✅ 커머스: 배송 정보, 반품 정책 등을 명확하게 표시하세요');
  
  if (structure) {
    if (structure.productInfo.description.split(/\s+/).length < 100) {
      guidelines.push('⚠️ 커머스: 상품 설명을 100단어 이상으로 확장하세요');
    }
    
    if (!structure.reviews.hasReviewSection) {
      guidelines.push('⚠️ 커머스: 리뷰 섹션을 추가하여 신뢰도를 높이세요');
    }
  }
  
  return guidelines;
}
