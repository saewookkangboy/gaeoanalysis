/**
 * UI/UX 분석 모듈
 * 상품 페이지의 접근성, 사용성, 성능, 정보 구조, 신뢰성을 분석합니다.
 */

import * as cheerio from 'cheerio';
import type { ProductPageStructure } from './product-structure-extractor';

export interface UXAnalysis {
  // 접근성
  accessibility: {
    hasAltText: boolean;
    hasAriaLabels: boolean;
    colorContrast: 'good' | 'medium' | 'poor';
    keyboardNavigation: boolean;
    score: number; // 0-100
  };
  
  // 사용성
  usability: {
    hasClearCTA: boolean; // Call-to-Action
    hasSearchFunction: boolean;
    hasFilterOptions: boolean;
    hasSortOptions: boolean;
    mobileResponsive: boolean;
    score: number; // 0-100
  };
  
  // 성능
  performance: {
    imageOptimization: 'good' | 'medium' | 'poor';
    hasLazyLoading: boolean;
    scriptOptimization: 'good' | 'medium' | 'poor';
    score: number; // 0-100
  };
  
  // 정보 구조
  informationArchitecture: {
    hasBreadcrumb: boolean;
    hasCategoryNavigation: boolean;
    hasRelatedProducts: boolean;
    hasProductComparison: boolean;
    score: number; // 0-100
  };
  
  // 신뢰성
  trustworthiness: {
    hasReviews: boolean;
    hasRatings: boolean;
    hasSecurityBadges: boolean;
    hasReturnPolicy: boolean;
    hasCustomerService: boolean;
    score: number; // 0-100
  };
  
  overallUXScore: number; // 0-100
}

/**
 * UI/UX 분석
 */
export function analyzeUX(
  $: cheerio.CheerioAPI,
  structure: ProductPageStructure,
  html: string
): UXAnalysis {
  // 접근성 분석
  const accessibility = analyzeAccessibility($, structure);
  
  // 사용성 분석
  const usability = analyzeUsability($, structure, html);
  
  // 성능 분석
  const performance = analyzePerformance($, structure, html);
  
  // 정보 구조 분석
  const informationArchitecture = analyzeInformationArchitecture($, structure);
  
  // 신뢰성 분석
  const trustworthiness = analyzeTrustworthiness($, structure);
  
  // 종합 점수 계산
  const overallUXScore = Math.round(
    (accessibility.score * 0.2 +
     usability.score * 0.3 +
     performance.score * 0.2 +
     informationArchitecture.score * 0.15 +
     trustworthiness.score * 0.15)
  );
  
  return {
    accessibility,
    usability,
    performance,
    informationArchitecture,
    trustworthiness,
    overallUXScore,
  };
}

/**
 * 접근성 분석
 */
function analyzeAccessibility(
  $: cheerio.CheerioAPI,
  structure: ProductPageStructure
): UXAnalysis['accessibility'] {
  const images = $('img');
  const imagesWithAlt = images.filter((_, el) => !!$(el).attr('alt')).length;
  const hasAltText = images.length === 0 || imagesWithAlt / images.length >= 0.8;
  
  const hasAriaLabels = $('[aria-label], [aria-labelledby], [aria-describedby]').length > 0;
  
  // 색상 대비는 실제 렌더링이 필요하므로 기본값 설정
  const colorContrast: 'good' | 'medium' | 'poor' = 'medium';
  
  // 키보드 네비게이션은 JavaScript 테스트가 필요하므로 기본값 설정
  const keyboardNavigation = true;
  
  let score = 0;
  if (hasAltText) score += 40;
  if (hasAriaLabels) score += 30;
  if (colorContrast === 'good') score += 20;
  if (keyboardNavigation) score += 10;
  
  return {
    hasAltText,
    hasAriaLabels,
    colorContrast,
    keyboardNavigation,
    score: Math.min(100, score),
  };
}

/**
 * 사용성 분석
 */
function analyzeUsability(
  $: cheerio.CheerioAPI,
  structure: ProductPageStructure,
  html: string
): UXAnalysis['usability'] {
  const hasClearCTA = structure.purchase.hasBuyButton || structure.purchase.hasCartButton;
  
  const hasSearchFunction = $('[class*="search"], [id*="search"], input[type="search"]').length > 0;
  
  // 상품 페이지에서는 필터/정렬은 일반적으로 없음
  const hasFilterOptions = false;
  const hasSortOptions = false;
  
  // 모바일 반응형은 viewport 메타 태그로 확인
  const mobileResponsive = 
    $('meta[name="viewport"]').length > 0 ||
    html.includes('viewport') ||
    $('[class*="mobile"], [class*="responsive"]').length > 0;
  
  let score = 0;
  if (hasClearCTA) score += 40;
  if (hasSearchFunction) score += 20;
  if (mobileResponsive) score += 30;
  if (hasFilterOptions) score += 5;
  if (hasSortOptions) score += 5;
  
  return {
    hasClearCTA,
    hasSearchFunction,
    hasFilterOptions,
    hasSortOptions,
    mobileResponsive,
    score: Math.min(100, score),
  };
}

/**
 * 성능 분석
 */
function analyzePerformance(
  $: cheerio.CheerioAPI,
  structure: ProductPageStructure,
  html: string
): UXAnalysis['performance'] {
  // Lazy Loading 확인
  const hasLazyLoading = 
    html.includes('loading="lazy"') || 
    html.includes('data-lazy') ||
    $('img[loading="lazy"]').length > 0 ||
    $('[data-src]').length > 0;
  
  // 이미지 최적화 평가
  let imageOptimization: 'good' | 'medium' | 'poor' = 'medium';
  if (structure.images.totalCount >= 3 && structure.images.hasAltText && hasLazyLoading) {
    imageOptimization = 'good';
  } else if (structure.images.totalCount < 2) {
    imageOptimization = 'poor';
  }
  
  // 스크립트 최적화는 실제 분석이 복잡하므로 기본값
  const scriptOptimization: 'good' | 'medium' | 'poor' = 'medium';
  
  let score = 0;
  if (imageOptimization === 'good') score += 50;
  else if (imageOptimization === 'medium') score += 30;
  else score += 10;
  
  if (hasLazyLoading) score += 30;
  else score += 10;
  
  if (scriptOptimization === 'good') score += 20;
  else if (scriptOptimization === 'medium') score += 10;
  
  return {
    imageOptimization,
    hasLazyLoading,
    scriptOptimization,
    score: Math.min(100, score),
  };
}

/**
 * 정보 구조 분석
 */
function analyzeInformationArchitecture(
  $: cheerio.CheerioAPI,
  structure: ProductPageStructure
): UXAnalysis['informationArchitecture'] {
  const hasBreadcrumb = structure.seo.hasBreadcrumb;
  const hasRelatedProducts = structure.details.hasRelatedProducts;
  
  // 카테고리 네비게이션은 상품 페이지에서는 일반적으로 없음
  const hasCategoryNavigation = false;
  
  // 상품 비교 기능 확인
  const hasProductComparison = 
    $('[class*="compare"], [class*="comparison"]').length > 0 ||
    /비교|compare/i.test($('body').text());
  
  let score = 0;
  if (hasBreadcrumb) score += 30;
  if (hasRelatedProducts) score += 30;
  if (hasCategoryNavigation) score += 20;
  if (hasProductComparison) score += 20;
  
  return {
    hasBreadcrumb,
    hasCategoryNavigation,
    hasRelatedProducts,
    hasProductComparison,
    score: Math.min(100, score),
  };
}

/**
 * 신뢰성 분석
 */
function analyzeTrustworthiness(
  $: cheerio.CheerioAPI,
  structure: ProductPageStructure
): UXAnalysis['trustworthiness'] {
  const hasReviews = structure.reviews.hasReviewSection;
  const hasRatings = structure.reviews.averageRating !== undefined;
  
  const bodyText = $('body').text();
  const hasSecurityBadges = 
    /SSL|보안|안전|인증|인증서|secure/i.test(bodyText) ||
    $('[class*="security"], [class*="certificate"], [class*="ssl"]').length > 0;
  
  const hasReturnPolicy = 
    /반품|교환|환불|정책|return|refund/i.test(bodyText) ||
    $('[class*="return"], [class*="refund"], [class*="policy"]').length > 0;
  
  const hasCustomerService = 
    /고객센터|문의|상담|CS|customer service|support/i.test(bodyText) ||
    $('[class*="customer"], [class*="service"], [class*="support"]').length > 0;
  
  let score = 0;
  if (hasReviews) score += 25;
  if (hasRatings) score += 25;
  if (hasSecurityBadges) score += 20;
  if (hasReturnPolicy) score += 15;
  if (hasCustomerService) score += 15;
  
  return {
    hasReviews,
    hasRatings,
    hasSecurityBadges,
    hasReturnPolicy,
    hasCustomerService,
    score: Math.min(100, score),
  };
}
