import { AIOCitationScores } from './ai-citation-analyzer';
import * as cheerio from 'cheerio';

/**
 * AI Visibility 점수 계산
 * 
 * AI Visibility는 콘텐츠가 AI 검색 엔진에서 얼마나 잘 발견되고 인용될 수 있는지를 종합적으로 평가하는 점수입니다.
 * 
 * 계산 기준:
 * 1. AI 모델별 인용 확률의 평균 (40%)
 * 2. 구조화된 데이터 및 메타데이터 품질 (25%)
 * 3. 콘텐츠 품질 및 신뢰도 신호 (20%)
 * 4. 최신성 및 업데이트 빈도 (15%)
 */
export function calculateAIVisibilityScore(
  $: cheerio.CheerioAPI,
  aioScores: AIOCitationScores,
  aeoScore: number,
  geoScore: number,
  seoScore: number
): number {
  // 1. AI 모델별 인용 확률의 평균 (40%)
  const averageAIO = (
    aioScores.chatgpt +
    aioScores.perplexity +
    aioScores.grok +
    aioScores.gemini +
    aioScores.claude
  ) / 5;
  const aioComponent = averageAIO * 0.4;

  // 2. 구조화된 데이터 및 메타데이터 품질 (25%)
  const structuredDataScore = calculateStructuredDataScore($);
  const structuredComponent = structuredDataScore * 0.25;

  // 3. 콘텐츠 품질 및 신뢰도 신호 (20%)
  const qualityScore = calculateQualityScore($, aeoScore, geoScore, seoScore);
  const qualityComponent = qualityScore * 0.20;

  // 4. 최신성 및 업데이트 빈도 (15%)
  const freshnessScore = calculateFreshnessScore($);
  const freshnessComponent = freshnessScore * 0.15;

  // 종합 점수 계산
  const totalScore = Math.round(
    aioComponent +
    structuredComponent +
    qualityComponent +
    freshnessComponent
  );

  return Math.min(100, Math.max(0, totalScore));
}

/**
 * 구조화된 데이터 및 메타데이터 품질 점수 (0-100)
 */
function calculateStructuredDataScore($: cheerio.CheerioAPI): number {
  let score = 0;
  const structuredDataText = $('script[type="application/ld+json"]').text();

  // JSON-LD 스키마 존재 여부 (30점)
  const hasStructuredData = $('script[type="application/ld+json"]').length > 0;
  if (hasStructuredData) {
    score += 30;

    // FAQPage 스키마 (최고 우선순위) (20점)
    if (structuredDataText.includes('FAQPage')) {
      score += 20;
    }

    // Article/BlogPosting 스키마 (15점)
    if (structuredDataText.includes('"Article"') || structuredDataText.includes('"BlogPosting"')) {
      score += 15;
    }

    // Organization/LocalBusiness 스키마 (10점)
    if (structuredDataText.includes('Organization') || structuredDataText.includes('LocalBusiness')) {
      score += 10;
    }

    // Person/Author 스키마 (10점)
    if (structuredDataText.includes('Person') || structuredDataText.includes('author')) {
      score += 10;
    }
  }

  // Open Graph 메타데이터 (5점)
  const hasOG = $('meta[property^="og:"]').length > 0;
  if (hasOG) score += 5;

  return Math.min(100, score);
}

/**
 * 콘텐츠 품질 및 신뢰도 신호 점수 (0-100)
 */
function calculateQualityScore(
  $: cheerio.CheerioAPI,
  aeoScore: number,
  geoScore: number,
  seoScore: number
): number {
  // 기본 점수: AEO/GEO/SEO의 평균 (50점)
  const baseScore = (aeoScore + geoScore + seoScore) / 3;
  let score = baseScore * 0.5;

  const text = $('body').text();
  const wordCount = text.split(/\s+/).length;

  // 콘텐츠 길이 (20점)
  if (wordCount >= 2000) score += 20;
  else if (wordCount >= 1500) score += 15;
  else if (wordCount >= 1000) score += 10;
  else if (wordCount >= 500) score += 5;

  // E-E-A-T 신호 (15점)
  const hasAuthor = $('script[type="application/ld+json"]').text().includes('author') ||
                    $('[rel="author"], [class*="author"], [id*="author"]').length > 0;
  const hasCredentials = /자격|credential|전문가|expert|박사|Ph\.D|인증|certification/i.test(text);
  const hasDate = $('time, [datetime], [class*="date"]').length > 0;
  
  if (hasAuthor && hasCredentials && hasDate) score += 15;
  else if (hasAuthor && (hasCredentials || hasDate)) score += 10;
  else if (hasAuthor || hasCredentials || hasDate) score += 5;

  // 출처 및 인용 (10점)
  const hasCitations = /참고|출처|reference|citation|인용|source/i.test(text);
  const hasPrimarySources = /pubmed|arxiv|doi|\.edu|\.gov|primary source|주요 출처/i.test(text);
  if (hasPrimarySources) score += 10;
  else if (hasCitations) score += 5;

  // 전문 용어 및 정의 (5점)
  const hasDefinitions = $('dfn, abbr[title], *[class*="definition"]').length > 0;
  if (hasDefinitions) score += 5;

  return Math.min(100, score);
}

/**
 * 최신성 및 업데이트 빈도 점수 (0-100)
 */
function calculateFreshnessScore($: cheerio.CheerioAPI): number {
  let score = 0;
  const text = $('body').text();

  // 날짜 정보 존재 여부 (30점)
  const hasDate = $('time, [datetime], [class*="date"], [class*="updated"]').length > 0;
  if (hasDate) {
    score += 30;

    // 최신 연도 언급 (2024-2025) (25점)
    const hasRecentYear = /(202[4-9]|최근|recent|updated|latest|최신)/i.test(text);
    if (hasRecentYear) {
      score += 25;
    }
  }

  // 업데이트 빈도 표시 (20점)
  const hasUpdateFrequency = /업데이트|update|최신|fresh|갱신/i.test(text);
  if (hasUpdateFrequency) score += 20;

  // 최신 정보 표시 (15점)
  const hasLatestInfo = /최신|latest|new|새로운|recent/i.test(text);
  if (hasLatestInfo) score += 15;

  // 시간 정보 (10점)
  const hasTimeInfo = /\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}\/\d{1,2}\/\d{4}/.test(text);
  if (hasTimeInfo) score += 10;

  return Math.min(100, score);
}

/**
 * AI Visibility 개선 가이드 생성
 */
export function generateAIVisibilityRecommendations(
  visibilityScore: number,
  aioScores: AIOCitationScores,
  structuredDataScore: number,
  qualityScore: number,
  freshnessScore: number
): string[] {
  const recommendations: string[] = [];

  if (visibilityScore >= 80) {
    recommendations.push('✅ AI Visibility 점수가 우수합니다! 현재 콘텐츠는 AI 검색 엔진에서 잘 발견될 가능성이 높습니다.');
    recommendations.push('💡 더 높은 점수를 위해: 정기적인 콘텐츠 업데이트와 최신 정보 추가를 유지하세요.');
  } else if (visibilityScore >= 60) {
    recommendations.push('📊 AI Visibility 점수가 양호합니다. 몇 가지 개선으로 더 높은 점수를 달성할 수 있습니다.');
    
    if (structuredDataScore < 70) {
      recommendations.push('🔧 구조화된 데이터(JSON-LD)를 추가하여 AI가 콘텐츠를 더 잘 이해할 수 있도록 하세요.');
    }
    
    if (freshnessScore < 60) {
      recommendations.push('📅 콘텐츠에 최신 날짜 정보를 추가하고 정기적으로 업데이트하세요.');
    }
  } else {
    recommendations.push('⚠️ AI Visibility 점수를 개선할 필요가 있습니다.');
    
    if (structuredDataScore < 50) {
      recommendations.push('🔧 FAQPage 또는 Article 스키마를 추가하여 구조화된 데이터를 제공하세요.');
    }
    
    if (qualityScore < 50) {
      recommendations.push('📝 콘텐츠 길이를 늘리고(1500자 이상), 작성자 정보와 전문성을 표시하세요.');
    }
    
    if (freshnessScore < 50) {
      recommendations.push('📅 콘텐츠에 최신 날짜를 명시하고, 정기적인 업데이트를 수행하세요.');
    }
    
    // AIO 점수 기반 추천
    const avgAIO =
      (aioScores.chatgpt +
        aioScores.perplexity +
        aioScores.grok +
        aioScores.gemini +
        aioScores.claude) /
      5;
    if (avgAIO < 60) {
      recommendations.push('🤖 AI 모델별 인용 확률을 높이기 위해 AIO 분석 결과의 추천사항을 참고하세요.');
    }
  }

  return recommendations;
}
