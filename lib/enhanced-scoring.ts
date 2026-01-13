/**
 * 일반 사이트 전용 강화된 점수 계산 모듈
 * 
 * 일반 사이트(블로그 제외)에 대해 더 엄격하고 포괄적인 분석 기준을 적용합니다.
 * SEO, AEO, GEO 점수를 강화하여 일반 사이트의 특성을 더 정확히 반영합니다.
 */

import * as cheerio from 'cheerio';

export interface TextContext {
  text: string;
  words: string[];
  wordCount: number;
}

export interface EnhancedScoringOptions {
  isWebsite: boolean; // 일반 사이트 여부
  strictMode?: boolean; // 엄격한 기준 적용 여부 (기본값: false)
}

/**
 * 강화된 SEO 점수 계산 (100점 → 120점)
 * 
 * 일반 사이트에 특화된 추가 항목:
 * - 사이트맵 존재 (5점)
 * - robots.txt 존재 (3점)
 * - Breadcrumb 구조 (4점)
 * - 다국어 메타데이터 (3점)
 * - Open Graph 완성도 (5점)
 */
export function calculateEnhancedSEOScore(
  $: cheerio.CheerioAPI,
  url?: string,
  options?: EnhancedScoringOptions
): number {
  let score = 0;
  const checks: { weight: number; passed: boolean }[] = [];

  // === 기존 항목 (100점) ===
  
  // H1 태그 (20점)
  const h1Count = $('h1').length;
  checks.push({ weight: 20, passed: h1Count === 1 });

  // Title 태그 (15점)
  const title = $('title').text().trim();
  checks.push({ weight: 15, passed: title.length > 0 && title.length <= 60 });

  // Meta description (15점)
  const metaDesc = $('meta[name="description"]').attr('content') || '';
  checks.push({ weight: 15, passed: metaDesc.length > 0 && metaDesc.length <= 160 });

  // Alt 텍스트 (10점)
  const images = $('img');
  const imagesWithAlt = images.filter((_, el) => !!$(el).attr('alt')).length;
  const altRatio = images.length > 0 ? imagesWithAlt / images.length : 1;
  checks.push({ weight: 10, passed: altRatio >= 0.8 });

  // 구조화된 데이터 (10점)
  const structuredData = $('script[type="application/ld+json"]').length;
  checks.push({ weight: 10, passed: structuredData > 0 });

  // 메타 키워드 (5점)
  const metaKeywords = $('meta[name="keywords"]').attr('content');
  checks.push({ weight: 5, passed: !!metaKeywords });

  // Open Graph 태그 (10점)
  const ogTitle = $('meta[property="og:title"]').attr('content');
  checks.push({ weight: 10, passed: !!ogTitle });

  // Canonical URL (5점)
  const canonical = $('link[rel="canonical"]').attr('href');
  checks.push({ weight: 5, passed: !!canonical });

  // 내부 링크 (5점)
  const internalLinks = $('a[href^="/"], a[href^="./"]').length;
  checks.push({ weight: 5, passed: internalLinks > 0 });

  // 헤딩 구조 (5점)
  const hasH2 = $('h2').length > 0;
  checks.push({ weight: 5, passed: hasH2 });

  // === 추가 항목 (20점) ===
  
  // 사이트맵 존재 (5점)
  // robots.txt나 HTML에서 sitemap 링크 확인
  const hasSitemapLink = $('a[href*="sitemap"], link[href*="sitemap"]').length > 0;
  const robotsTxtLink = $('link[rel="alternate"][type="application/rss+xml"]').length > 0;
  // URL 기반으로 sitemap.xml 존재 추정 (실제 확인은 불가하지만 일반적인 패턴 확인)
  const hasSitemap = hasSitemapLink || robotsTxtLink;
  checks.push({ weight: 5, passed: hasSitemap });

  // robots.txt 존재 (3점)
  // robots.txt는 HTML에서 직접 확인 불가, 메타 태그나 링크로 추정
  const hasRobotsMeta = $('meta[name="robots"]').length > 0;
  checks.push({ weight: 3, passed: hasRobotsMeta });

  // Breadcrumb 구조 (4점)
  // 구조화된 데이터 또는 HTML 구조로 확인
  const structuredDataText = $('script[type="application/ld+json"]').text();
  const hasBreadcrumbSchema = structuredDataText.includes('BreadcrumbList');
  const hasBreadcrumbHTML = $('[class*="breadcrumb"], [id*="breadcrumb"], nav[aria-label*="breadcrumb"]').length > 0;
  checks.push({ weight: 4, passed: hasBreadcrumbSchema || hasBreadcrumbHTML });

  // 다국어 메타데이터 (3점)
  const hasHreflang = $('link[rel="alternate"][hreflang]').length > 0;
  const hasLangAttr = $('html[lang]').length > 0;
  checks.push({ weight: 3, passed: hasHreflang || hasLangAttr });

  // Open Graph 완성도 (5점)
  // og:title, og:description, og:image, og:url 모두 존재해야 함
  const ogTitleComplete = $('meta[property="og:title"]').attr('content');
  const ogDescComplete = $('meta[property="og:description"]').attr('content');
  const ogImageComplete = $('meta[property="og:image"]').attr('content');
  const ogUrlComplete = $('meta[property="og:url"]').attr('content');
  const hasCompleteOG = !!(ogTitleComplete && ogDescComplete && ogImageComplete && ogUrlComplete);
  checks.push({ weight: 5, passed: hasCompleteOG });

  // 점수 계산
  checks.forEach(check => {
    if (check.passed) score += check.weight;
  });

  return Math.min(120, Math.max(0, score));
}

/**
 * 강화된 AEO 점수 계산 (100점 → 130점)
 * 
 * 일반 사이트에 특화된 추가 항목:
 * - 전문가 Q&A 섹션 (10점)
 * - 단계별 가이드 완성도 (8점)
 * - 비교표/대안 제시 (7점)
 * - 사례 연구(Case Study) 포함 (5점)
 */
export function calculateEnhancedAEOScore(
  $: cheerio.CheerioAPI,
  textContext: TextContext,
  options?: EnhancedScoringOptions
): number {
  let score = 0;
  const checks: { weight: number; passed: boolean }[] = [];
  const { text, wordCount } = textContext;

  // === 기존 항목 (100점) ===
  
  // 질문 형식의 콘텐츠 (20점)
  const hasQuestions = /[?？]/.test(text) || /\b(what|how|why|when|where|who|어떻게|왜|언제|어디서|누가)\b/i.test(text);
  checks.push({ weight: 20, passed: hasQuestions });

  // FAQ 섹션 (15점)
  const hasFAQ = $('*:contains("FAQ"), *:contains("자주 묻는 질문"), [class*="faq"], [id*="faq"]').length > 0;
  const hasFAQSchema = $('script[type="application/ld+json"]').text().includes('FAQPage');
  checks.push({ weight: 15, passed: hasFAQ || hasFAQSchema });

  // 명확한 답변 구조 (20점)
  const hasH2 = $('h2').length > 0;
  const hasH3 = $('h3').length > 0;
  const hasList = $('ul, ol').length > 0;
  const hasParagraphs = $('p').length > 3;
  const hasH2H3Bullets = hasH2 && hasH3 && hasList;
  checks.push({ weight: 20, passed: hasH2H3Bullets || (hasList && hasParagraphs) });

  // 키워드 밀도 (10점)
  checks.push({ weight: 10, passed: wordCount >= 300 });

  // 구조화된 답변 (15점)
  const hasDefinitionList = $('dl').length > 0;
  const hasTable = $('table').length > 0;
  checks.push({ weight: 15, passed: hasDefinitionList || hasTable });

  // 콘텐츠 신선도 표시 (10점)
  const hasDate = $('time, [datetime], [class*="date"], [class*="updated"]').length > 0;
  const hasRecentYear = /(202[4-9]|최근|recent|updated|latest)/i.test(text);
  const isFresh = hasDate || hasRecentYear;
  checks.push({ weight: 10, passed: isFresh });

  // 전문 용어 설명 (10점)
  const hasAbbr = $('abbr, dfn').length > 0;
  checks.push({ weight: 10, passed: hasAbbr });

  // 통계 및 인용 보너스
  const hasStatistics = /\d+%|\d+\.\d+%|통계|statistics|연구|study/i.test(text);
  const hasQuotations = /["'"]|인용|quotation|citation|출처/i.test(text);
  if (hasStatistics) score += 5;
  if (hasQuotations) score += 3;

  // === 추가 항목 (30점) ===
  
  // 전문가 Q&A 섹션 (10점)
  // 작성자 정보와 함께 Q&A가 있는 경우
  const hasAuthor = $('script[type="application/ld+json"]').text().includes('author') ||
                   $('[rel="author"], [class*="author"], [id*="author"]').length > 0;
  const hasExpertQA = (hasFAQ || hasQuestions) && hasAuthor;
  checks.push({ weight: 10, passed: hasExpertQA });

  // 단계별 가이드 완성도 (8점)
  // 5단계 이상, 각 단계에 상세 설명이 있는 경우
  const orderedLists = $('ol').length;
  const hasStepKeywords = /(단계|step|절차|process|방법|how to)/i.test(text);
  const hasDetailedSteps = orderedLists >= 1 && hasStepKeywords;
  // 각 단계에 설명이 있는지 확인 (li 내부에 p 태그 또는 텍스트가 충분한 경우)
  const stepLists = $('ol li');
  let detailedStepCount = 0;
  stepLists.each((_, el) => {
    const stepText = $(el).text().trim();
    if (stepText.length > 50) detailedStepCount++; // 각 단계에 50자 이상 설명
  });
  const hasDetailedStepByStepGuide = hasDetailedSteps && detailedStepCount >= 5;
  checks.push({ weight: 8, passed: hasDetailedStepByStepGuide });

  // 비교표/대안 제시 (7점)
  // 표 형식 또는 구조화된 비교 콘텐츠
  const hasComparisonTable = $('table').length > 0 && 
                             (/\b(vs|versus|비교|compare|대안|alternative|차이|difference)/i.test(text) ||
                              $('table th:contains("비교"), table th:contains("vs"), table th:contains("compare")').length > 0);
  const hasComparisonList = /\b(vs|versus|비교|compare|대안|alternative)\b/i.test(text) && 
                            ($('ul, ol').length >= 2 || $('dl').length > 0);
  checks.push({ weight: 7, passed: hasComparisonTable || hasComparisonList });

  // 사례 연구(Case Study) 포함 (5점)
  const hasCaseStudy = /(사례|case study|케이스|성공 사례|success story|사례 연구)/i.test(text) ||
                      $('[class*="case"], [class*="study"], [id*="case"]').length > 0;
  checks.push({ weight: 5, passed: hasCaseStudy });

  // 점수 계산
  checks.forEach(check => {
    if (check.passed) score += check.weight;
  });

  return Math.min(130, Math.max(0, score));
}

/**
 * 강화된 GEO 점수 계산 (100점 → 140점)
 * 
 * 일반 사이트에 특화된 추가 항목:
 * - 포괄적 콘텐츠 깊이 (2000+ 단어): 10점
 * - 전문 데이터/통계 포함: 8점
 * - 인포그래픽/차트: 7점
 * - 비디오 콘텐츠: 8점
 * - 다국어 콘텐츠: 4점
 * - 업데이트 주기 명시: 3점
 */
export function calculateEnhancedGEOScore(
  $: cheerio.CheerioAPI,
  textContext: TextContext,
  options?: EnhancedScoringOptions
): number {
  let score = 0;
  const checks: { weight: number; passed: boolean }[] = [];
  const { text, wordCount } = textContext;

  // === 기존 항목 (100점) ===
  
  // 콘텐츠 길이 (20점)
  if (wordCount >= 2000) {
    score += 20;
  } else if (wordCount >= 1500) {
    score += 18;
  } else if (wordCount >= 1000) {
    score += 15;
  } else if (wordCount >= 500) {
    score += 10;
  }

  // 다중 미디어 (15점)
  const images = $('img').length;
  const videos = $('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length;
  if (images >= 3 || videos > 0) {
    score += 15;
  } else if (images >= 1) {
    score += 10;
  }

  // 섹션 구조 (15점)
  const sections = $('section, article, [class*="section"], [class*="article"]').length;
  const hasH2 = $('h2').length > 0;
  const hasH3 = $('h3').length > 0;
  const hasBullets = $('ul, ol').length > 0;
  const hasH2H3Bullets = hasH2 && hasH3 && hasBullets;
  if (hasH2H3Bullets) {
    score += 15;
  } else if (sections > 0 || hasH2) {
    score += 10;
  }

  // 키워드 다양성 (15점)
  const words = textContext.words.map(w => w.toLowerCase());
  const uniqueWords = new Set(words);
  const diversity = uniqueWords.size / words.length;
  checks.push({ weight: 15, passed: diversity > 0.3 });

  // 콘텐츠 업데이트 표시 (10점)
  const hasUpdateDate = $('time, [datetime], [class*="date"], [class*="updated"]').length > 0;
  const hasRecentYear = /(202[4-9]|최근|recent|updated|latest)/i.test(text);
  if (hasUpdateDate && hasRecentYear) {
    score += 10;
  } else if (hasUpdateDate || hasRecentYear) {
    score += 7;
  }

  // 소셜 공유 메타 (10점)
  const ogTags = $('meta[property^="og:"]').length;
  const twitterTags = $('meta[name^="twitter:"]').length;
  if (ogTags >= 3 && twitterTags >= 2) {
    score += 10;
  } else if (ogTags > 0 || twitterTags > 0) {
    score += 6;
  }

  // 구조화된 데이터 (15점)
  const structuredData = $('script[type="application/ld+json"]').length;
  const structuredDataText = $('script[type="application/ld+json"]').text();
  const hasFAQSchema = structuredDataText.includes('FAQPage');
  const hasArticleSchema = structuredDataText.includes('"Article"') || structuredDataText.includes('"BlogPosting"');
  const hasHowToSchema = structuredDataText.includes('HowTo');
  if (structuredData > 0 && (hasFAQSchema || hasArticleSchema || hasHowToSchema)) {
    score += 15;
  } else if (structuredData > 0) {
    score += 10;
  }

  // 음성 검색 최적화 보너스 (5점)
  const hasSpeakable = structuredDataText.includes('Speakable');
  const hasFeaturedSnippet = $('h2').length > 0 && text.length < 200;
  if (hasSpeakable || hasFeaturedSnippet) {
    score += 5;
  }

  // === 추가 항목 (40점) ===
  
  // 포괄적 콘텐츠 깊이 (2000+ 단어): 10점
  if (wordCount >= 2000) {
    score += 10;
  } else if (wordCount >= 1500) {
    score += 7; // 부분 점수
  }

  // 전문 데이터/통계 포함 (8점)
  // 표, 차트, 그래프 등이 있는 경우
  const hasTable = $('table').length > 0;
  const hasCharts = $('canvas, svg, [class*="chart"], [id*="chart"]').length > 0;
  const hasStatistics = /\d+%|\d+\.\d+%|통계|statistics|데이터|data|연구|research/i.test(text);
  const hasProfessionalData = (hasTable || hasCharts) && hasStatistics;
  checks.push({ weight: 8, passed: hasProfessionalData });

  // 인포그래픽/차트 (7점)
  // 이미지가 많고 구조화된 데이터가 있는 경우
  const hasInfographic = images >= 5 && (hasCharts || hasTable);
  const hasInfographicClass = $('[class*="infographic"], [class*="infographic"]').length > 0;
  checks.push({ weight: 7, passed: hasInfographic || hasInfographicClass });

  // 비디오 콘텐츠 (8점)
  // YouTube, Vimeo 등 비디오가 포함된 경우
  const hasVideo = videos > 0 || 
                  $('iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="dailymotion"]').length > 0;
  checks.push({ weight: 8, passed: hasVideo });

  // 다국어 콘텐츠 (4점)
  // 2개 이상의 언어 지원
  const hreflangLinks = $('link[rel="alternate"][hreflang]').length;
  const hasMultilingual = hreflangLinks >= 2 || 
                         $('html[lang], [lang]').length >= 2 ||
                         /(한국어|korean|english|영어|japanese|일본어|chinese|중국어)/i.test(text);
  checks.push({ weight: 4, passed: hasMultilingual });

  // 업데이트 주기 명시 (3점)
  // 정기 업데이트 안내가 있는 경우
  const hasUpdateSchedule = /(정기|regular|주기|schedule|업데이트|update|갱신|refresh)/i.test(text) &&
                           (/(주|week|월|month|일|day)/i.test(text) || hasUpdateDate);
  checks.push({ weight: 3, passed: hasUpdateSchedule });

  // 점수 계산
  checks.forEach(check => {
    if (check.passed) score += check.weight;
  });

  return Math.min(140, Math.max(0, score));
}

/**
 * 점수를 100점 기준으로 정규화
 * 강화된 점수를 기존 시스템과 호환되도록 변환
 */
export function normalizeScore(enhancedScore: number, maxScore: number): number {
  return Math.round((enhancedScore / maxScore) * 100);
}
