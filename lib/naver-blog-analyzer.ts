/**
 * 네이버 블로그 전용 분석 모듈
 * 2025년 최신 네이버 블로그 SEO 기술 반영
 * 
 * 주요 개선 사항:
 * - 네이버 블로그 특화 콘텐츠 구조 분석
 * - 네이버 검색 알고리즘 최적화 요소 강화
 * - AI 검색 엔진 인용 확률 향상
 * - 분석 결과의 다양성 및 정확성 개선
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
import { 
  FRESHNESS_OPTIMIZATION, 
  STATISTICS_QUOTATIONS_GUIDE, 
  CONTENT_STRUCTURE_GUIDE,
  PLATFORM_STRATEGIES 
} from './seo-guidelines-enhanced';
import type { AnalysisResult, Insight } from './analyzer';
import type { DomainAuthority, CitationOpportunity, QualityIssue } from './citation-analyzer';

/**
 * 네이버 블로그 특화 분석 결과 인터페이스
 */
export interface NaverBlogAnalysisResult extends AnalysisResult {
  naverSpecific: {
    blogStructure: {
      hasCategory: boolean;
      hasTag: boolean;
      hasSeries: boolean;
      hasRelatedPosts: boolean;
    };
    contentOptimization: {
      hasTableOfContents: boolean;
      hasImageGallery: boolean;
      hasVideo: boolean;
      hasPoll: boolean;
      hasCommentSection: boolean;
    };
    imageAnalysis: ImageAnalysis;
    seoElements: {
      hasNaverMeta: boolean;
      hasOgTags: boolean;
      hasCanonical: boolean;
      hasBreadcrumb: boolean;
    };
    engagement: {
      viewCount: number;
      likeCount: number;
      commentCount: number;
      shareCount: number;
    };
  };
}

/**
 * 네이버 블로그 콘텐츠 분석
 */
export async function analyzeNaverBlogContent(
  html: string, 
  url: string,
  variationSeed?: number
): Promise<NaverBlogAnalysisResult> {
  const $ = cheerio.load(html);
  
  // 네이버 블로그 특화 요소 추출
  const naverSpecific = extractNaverBlogSpecifics($);
  
  // 강화된 SEO 점수 계산 (네이버 블로그 특화)
  const seoScore = calculateNaverBlogSEOScore($);
  
  // 강화된 AEO 점수 계산
  const aeoScore = calculateNaverBlogAEOScore($);
  
  // 강화된 GEO 점수 계산
  const geoScore = calculateNaverBlogGEOScore($);
  
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
    console.warn('⚠️ [NaverBlogAnalyzer] 타겟 URL 파싱 실패:', error);
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
  
  // 네이버 블로그 특화 인사이트 생성 (다양성 확보)
  // URL 기반으로 결정적인 시드 생성 (서버리스 환경에서도 안전)
  const seed = variationSeed ?? Math.abs(url.split('').reduce((a, b) => a + b.charCodeAt(0), 0) % 10);
  const insights = generateNaverBlogInsights(
    $, 
    aeoScore, 
    geoScore, 
    seoScore, 
    naverSpecific,
    seed
  );
  
  // 개선 우선순위 및 콘텐츠 작성 가이드라인 생성
  const improvementPriorities = getNaverBlogImprovementPriority(
    aeoScore, 
    geoScore, 
    seoScore, 
    insights,
    naverSpecific
  );
  const contentGuidelines = getNaverBlogContentGuidelines(
    aeoScore, 
    geoScore, 
    seoScore,
    naverSpecific
  );
  
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
    naverSpecific,
  };
}

/**
 * 이미지 분석 결과 인터페이스
 */
interface ImageAnalysis {
  totalCount: number;
  imagesWithAlt: number;
  imagesWithOptimalSize: number;
  recommendedCount: {
    minimum: number;
    optimal: number;
    maximum: number;
  };
  recommendedSizes: {
    thumbnail: { width: number; height: number };
    content: { width: number; height: number };
    ogImage: { width: number; height: number };
  };
  issues: Array<{
    type: 'count' | 'size' | 'alt' | 'format';
    severity: 'High' | 'Medium' | 'Low';
    message: string;
  }>;
}

/**
 * 네이버 블로그 이미지 권장사항
 */
const NAVER_BLOG_IMAGE_GUIDELINES = {
  recommendedCount: {
    minimum: 3,
    optimal: 5,
    maximum: 10,
  },
  recommendedSizes: {
    thumbnail: { width: 400, height: 300 },
    content: { width: 1200, height: 800 },
    ogImage: { width: 1200, height: 630 },
  },
  minContentWidth: 800,
  maxFileSize: 500 * 1024, // 500KB
};

/**
 * 범용 블로그 이미지 권장사항
 */
const GENERAL_BLOG_IMAGE_GUIDELINES = {
  recommendedCount: {
    minimum: 2,
    optimal: 3,
    maximum: 5,
  },
  recommendedSizes: {
    thumbnail: { width: 300, height: 200 },
    content: { width: 800, height: 600 },
    ogImage: { width: 1200, height: 630 },
  },
  minContentWidth: 600,
  maxFileSize: 1024 * 1024, // 1MB
};

/**
 * 이미지 분석 함수
 */
function analyzeImages($: cheerio.CheerioAPI, isNaverBlog: boolean = false): ImageAnalysis {
  const images = $('img');
  const totalCount = images.length;
  const imagesWithAlt = images.filter((_, el) => !!$(el).attr('alt')).length;
  
  const guidelines = isNaverBlog ? NAVER_BLOG_IMAGE_GUIDELINES : GENERAL_BLOG_IMAGE_GUIDELINES;
  
  // 이미지 사이즈 분석 (width, height 속성 또는 style에서 추출)
  let imagesWithOptimalSize = 0;
  const issues: ImageAnalysis['issues'] = [];
  
  images.each((_, el) => {
    const $img = $(el);
    const width = parseInt($img.attr('width') || $img.css('width') || '0', 10);
    const height = parseInt($img.attr('height') || $img.css('height') || '0', 10);
    const src = $img.attr('src') || '';
    
    // 이미지 사이즈 체크
    if (width >= guidelines.minContentWidth || height >= guidelines.minContentWidth) {
      imagesWithOptimalSize++;
    } else if (width > 0 && width < guidelines.minContentWidth) {
      issues.push({
        type: 'size',
        severity: 'Medium',
        message: `이미지 너비가 ${width}px로 권장 최소 너비(${guidelines.minContentWidth}px)보다 작습니다.`,
      });
    }
    
    // Alt 텍스트 체크
    if (!$img.attr('alt')) {
      issues.push({
        type: 'alt',
        severity: 'High',
        message: 'Alt 텍스트가 없는 이미지가 있습니다.',
      });
    }
  });
  
  // 이미지 개수 체크
  if (totalCount < guidelines.recommendedCount.minimum) {
    issues.push({
      type: 'count',
      severity: 'High',
      message: `이미지가 ${totalCount}개로 권장 최소 개수(${guidelines.recommendedCount.minimum}개)보다 적습니다.`,
    });
  } else if (totalCount > guidelines.recommendedCount.maximum) {
    issues.push({
      type: 'count',
      severity: 'Low',
      message: `이미지가 ${totalCount}개로 권장 최대 개수(${guidelines.recommendedCount.maximum}개)보다 많습니다.`,
    });
  }
  
  return {
    totalCount,
    imagesWithAlt,
    imagesWithOptimalSize,
    recommendedCount: guidelines.recommendedCount,
    recommendedSizes: guidelines.recommendedSizes,
    issues,
  };
}

/**
 * 네이버 블로그 특화 요소 추출
 */
function extractNaverBlogSpecifics($: cheerio.CheerioAPI) {
  // 블로그 구조 분석
  const hasCategory = $('[class*="category"], [class*="Category"], [id*="category"]').length > 0 ||
                      $('a[href*="category"]').length > 0;
  const hasTag = $('[class*="tag"], [class*="Tag"], [id*="tag"]').length > 0 ||
                 $('a[href*="tag"]').length > 0 ||
                 $('meta[name="keywords"]').length > 0;
  const hasSeries = $('[class*="series"], [class*="Series"], [class*="연재"]').length > 0;
  const hasRelatedPosts = $('[class*="related"], [class*="Related"], [class*="관련글"]').length > 0;
  
  // 콘텐츠 최적화 요소
  const hasTableOfContents = $('[class*="toc"], [class*="TOC"], [class*="목차"]').length > 0 ||
                             $('[id*="toc"], [id*="TOC"]').length > 0;
  const hasImageGallery = $('[class*="gallery"], [class*="Gallery"]').length > 0 ||
                          $('img').length >= 3;
  const hasVideo = $('video, iframe[src*="youtube"], iframe[src*="naver"], iframe[src*="tv.naver"]').length > 0;
  const hasPoll = $('[class*="poll"], [class*="Poll"], [class*="투표"]').length > 0;
  const hasCommentSection = $('[class*="comment"], [class*="Comment"], [class*="댓글"]').length > 0 ||
                            $('[id*="comment"], [id*="Comment"]').length > 0;
  
  // 이미지 분석
  const imageAnalysis = analyzeImages($, true);
  
  // SEO 요소
  const hasNaverMeta = $('meta[property^="naver:"], meta[name^="naver"]').length > 0;
  const hasOgTags = $('meta[property^="og:"]').length >= 3;
  const hasCanonical = $('link[rel="canonical"]').length > 0;
  const hasBreadcrumb = $('[class*="breadcrumb"], [class*="Breadcrumb"], [itemtype*="BreadcrumbList"]').length > 0;
  
  // 참여도 지표 추출 (가능한 경우)
  const viewCount = extractNumber($('[class*="view"], [class*="View"], [class*="조회"]').text());
  const likeCount = extractNumber($('[class*="like"], [class*="Like"], [class*="좋아요"]').text());
  const commentCount = extractNumber($('[class*="comment"], [class*="Comment"], [class*="댓글"]').text());
  const shareCount = extractNumber($('[class*="share"], [class*="Share"], [class*="공유"]').text());
  
  return {
    blogStructure: {
      hasCategory,
      hasTag,
      hasSeries,
      hasRelatedPosts,
    },
    contentOptimization: {
      hasTableOfContents,
      hasImageGallery,
      hasVideo,
      hasPoll,
      hasCommentSection,
    },
    imageAnalysis,
    seoElements: {
      hasNaverMeta,
      hasOgTags,
      hasCanonical,
      hasBreadcrumb,
    },
    engagement: {
      viewCount,
      likeCount,
      commentCount,
      shareCount,
    },
  };
}

/**
 * 숫자 추출 헬퍼 함수
 */
function extractNumber(text: string): number {
  const match = text.match(/[\d,]+/);
  if (match) {
    return parseInt(match[0].replace(/,/g, ''), 10) || 0;
  }
  return 0;
}

/**
 * 네이버 블로그 특화 SEO 점수 계산 (2025년 최신 기준)
 */
function calculateNaverBlogSEOScore($: cheerio.CheerioAPI): number {
  let score = 0;
  const checks: { weight: number; passed: boolean }[] = [];
  
  // 기본 SEO 요소 (기존 로직 유지)
  const h1Count = $('h1').length;
  checks.push({ weight: 20, passed: h1Count === 1 });
  
  const title = $('title').text().trim();
  checks.push({ weight: 15, passed: title.length > 0 && title.length <= 60 });
  
  const metaDesc = $('meta[name="description"]').attr('content') || '';
  checks.push({ weight: 15, passed: metaDesc.length > 0 && metaDesc.length <= 160 });
  
  const images = $('img');
  const imagesWithAlt = images.filter((_, el) => !!$(el).attr('alt')).length;
  const altRatio = images.length > 0 ? imagesWithAlt / images.length : 1;
  checks.push({ weight: 10, passed: altRatio >= 0.8 });
  
  const structuredData = $('script[type="application/ld+json"]').length;
  checks.push({ weight: 10, passed: structuredData > 0 });
  
  // 네이버 블로그 특화 SEO 요소 (2025년 최신 기준)
  
  // 네이버 메타 태그 (5점)
  const hasNaverMeta = $('meta[property^="naver:"], meta[name^="naver"]').length > 0;
  checks.push({ weight: 5, passed: hasNaverMeta });
  
  // Open Graph 태그 강화 (10점 → 15점)
  const ogTitle = $('meta[property="og:title"]').attr('content');
  const ogDesc = $('meta[property="og:description"]').attr('content');
  const ogImage = $('meta[property="og:image"]').attr('content');
  const ogUrl = $('meta[property="og:url"]').attr('content');
  const hasCompleteOg = !!(ogTitle && ogDesc && ogImage && ogUrl);
  checks.push({ weight: 15, passed: hasCompleteOg });
  
  // Canonical URL (5점)
  const canonical = $('link[rel="canonical"]').attr('href');
  checks.push({ weight: 5, passed: !!canonical });
  
  // 내부 링크 (네이버 블로그 내 연결) (5점)
  const internalLinks = $('a[href*="blog.naver.com"]').length;
  checks.push({ weight: 5, passed: internalLinks > 0 });
  
  // 헤딩 구조 (H2→H3→bullets) (10점) - 2025년 중요도 증가
  const hasH2 = $('h2').length > 0;
  const hasH3 = $('h3').length > 0;
  const hasBullets = $('ul, ol').length > 0;
  const hasH2H3Bullets = hasH2 && hasH3 && hasBullets;
  checks.push({ weight: 10, passed: hasH2H3Bullets });
  
  // 카테고리 및 태그 (5점) - 네이버 블로그 특화
  const hasCategory = $('[class*="category"], a[href*="category"]').length > 0;
  const hasTag = $('[class*="tag"], a[href*="tag"], meta[name="keywords"]').length > 0;
  checks.push({ weight: 5, passed: hasCategory || hasTag });
  
  // 목차 (Table of Contents) (5점) - 2025년 중요도 증가
  const hasTOC = $('[class*="toc"], [id*="toc"]').length > 0;
  checks.push({ weight: 5, passed: hasTOC });
  
  checks.forEach(check => {
    if (check.passed) score += check.weight;
  });
  
  return Math.min(100, Math.max(0, score));
}

/**
 * 네이버 블로그 특화 AEO 점수 계산
 */
function calculateNaverBlogAEOScore($: cheerio.CheerioAPI): number {
  let score = 0;
  const checks: { weight: number; passed: boolean }[] = [];
  const text = $('body').text();
  
  // 기본 AEO 요소
  const hasQuestions = /[?？]/.test(text) || /\b(what|how|why|when|where|who|어떻게|왜|언제|어디서|누가)\b/i.test(text);
  checks.push({ weight: 20, passed: hasQuestions });
  
  const hasFAQ = $('*:contains("FAQ"), *:contains("자주 묻는 질문"), [class*="faq"], [id*="faq"]').length > 0;
  const hasFAQSchema = $('script[type="application/ld+json"]').text().includes('FAQPage');
  checks.push({ weight: 15, passed: hasFAQ || hasFAQSchema });
  
  // H2→H3→bullets 구조 강화 (20점 → 25점)
  const hasH2 = $('h2').length > 0;
  const hasH3 = $('h3').length > 0;
  const hasList = $('ul, ol').length > 0;
  const hasParagraphs = $('p').length > 3;
  const hasH2H3Bullets = hasH2 && hasH3 && hasList;
  checks.push({ weight: 25, passed: hasH2H3Bullets || (hasList && hasParagraphs) });
  
  const wordCount = text.split(/\s+/).length;
  checks.push({ weight: 10, passed: wordCount >= 300 });
  
  const hasDefinitionList = $('dl').length > 0;
  const hasTable = $('table').length > 0;
  checks.push({ weight: 15, passed: hasDefinitionList || hasTable });
  
  // 신선도 강화 (10점 → 15점)
  const hasDate = $('time, [datetime], [class*="date"], [class*="updated"]').length > 0;
  const hasRecentYear = /(202[4-9]|최근|recent|updated|latest)/i.test(text);
  const isFresh = hasDate || hasRecentYear;
  checks.push({ weight: 15, passed: isFresh });
  
  const hasAbbr = $('abbr, dfn').length > 0;
  checks.push({ weight: 10, passed: hasAbbr });
  
  // 통계 및 인용 보너스 (네이버 블로그 특화)
  const hasStatistics = /\d+%|\d+\.\d+%|통계|statistics|연구|study/i.test(text);
  const hasQuotations = /["'"]|인용|quotation|citation|출처/i.test(text);
  if (hasStatistics) score += 5;
  if (hasQuotations) score += 3;
  
  // 네이버 블로그 특화: 댓글 섹션 (5점)
  const hasCommentSection = $('[class*="comment"], [id*="comment"]').length > 0;
  if (hasCommentSection) score += 5;
  
  checks.forEach(check => {
    if (check.passed) score += check.weight;
  });
  
  return Math.min(100, Math.max(0, score));
}

/**
 * 네이버 블로그 특화 GEO 점수 계산
 */
function calculateNaverBlogGEOScore($: cheerio.CheerioAPI): number {
  let score = 0;
  const checks: { weight: number; passed: boolean }[] = [];
  const text = $('body').text();
  
  // 콘텐츠 길이 (20점)
  const wordCount = text.split(/\s+/).length;
  if (wordCount >= 2000) {
    score += 20;
  } else if (wordCount >= 1500) {
    score += 18;
  } else if (wordCount >= 1000) {
    score += 15;
  } else if (wordCount >= 500) {
    score += 10;
  }
  
  // 다중 미디어 (15점 → 20점) - 네이버 블로그 특화
  const images = $('img').length;
  const videos = $('video, iframe[src*="youtube"], iframe[src*="naver"], iframe[src*="tv.naver"]').length;
  if (images >= 5 || videos > 0) {
    score += 20; // 네이버 블로그는 이미지가 많을수록 좋음
  } else if (images >= 3) {
    score += 15;
  } else if (images >= 1) {
    score += 10;
  }
  
  // 섹션 구조 (15점 → 20점)
  const sections = $('section, article, [class*="section"], [class*="article"]').length;
  const hasH2 = $('h2').length > 0;
  const hasH3 = $('h3').length > 0;
  const hasBullets = $('ul, ol').length > 0;
  const hasH2H3Bullets = hasH2 && hasH3 && hasBullets;
  if (hasH2H3Bullets) {
    score += 20;
  } else if (sections > 0 || hasH2) {
    score += 10;
  }
  
  // 키워드 다양성 (15점)
  const words = text.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  const diversity = uniqueWords.size / words.length;
  checks.push({ weight: 15, passed: diversity > 0.3 });
  
  // 신선도 강화 (10점 → 15점)
  const hasUpdateDate = $('time, [datetime], [class*="date"], [class*="updated"]').length > 0;
  const hasRecentYear = /(202[4-9]|최근|recent|updated|latest)/i.test(text);
  if (hasUpdateDate && hasRecentYear) {
    score += 15;
  } else if (hasUpdateDate || hasRecentYear) {
    score += 7;
  }
  
  // 소셜 공유 메타 (10점 → 15점)
  const ogTags = $('meta[property^="og:"]').length;
  const twitterTags = $('meta[name^="twitter:"]').length;
  if (ogTags >= 4 && twitterTags >= 2) {
    score += 15;
  } else if (ogTags >= 3 || twitterTags >= 2) {
    score += 10;
  } else if (ogTags > 0 || twitterTags > 0) {
    score += 6;
  }
  
  // 구조화된 데이터 (15점 → 20점)
  const structuredData = $('script[type="application/ld+json"]').length;
  const structuredDataText = $('script[type="application/ld+json"]').text();
  const hasFAQSchema = structuredDataText.includes('FAQPage');
  const hasArticleSchema = structuredDataText.includes('"Article"') || structuredDataText.includes('"BlogPosting"');
  const hasHowToSchema = structuredDataText.includes('HowTo');
  if (structuredData > 0 && (hasFAQSchema || hasArticleSchema || hasHowToSchema)) {
    score += 20;
  } else if (structuredData > 0) {
    score += 10;
  }
  
  // 음성 검색 최적화 (5점)
  const hasSpeakable = structuredDataText.includes('Speakable');
  const hasFeaturedSnippet = $('h2').length > 0 && text.length < 200;
  if (hasSpeakable || hasFeaturedSnippet) {
    score += 5;
  }
  
  // 네이버 블로그 특화: 관련글 링크 (5점)
  const hasRelatedPosts = $('[class*="related"], [class*="관련글"]').length > 0;
  if (hasRelatedPosts) {
    score += 5;
  }
  
  checks.forEach(check => {
    if (check.passed) score += check.weight;
  });
  
  return Math.min(100, Math.max(0, score));
}

/**
 * 네이버 블로그 특화 인사이트 생성 (다양성 확보)
 * @param variationSeed 분석 결과 다양성을 위한 시드 값
 */
function generateNaverBlogInsights(
  $: cheerio.CheerioAPI, 
  aeoScore: number, 
  geoScore: number, 
  seoScore: number,
  naverSpecific: ReturnType<typeof extractNaverBlogSpecifics>,
  variationSeed: number = 0
): Insight[] {
  const insights: Insight[] = [];
  const text = $('body').text();
  const wordCount = text.split(/\s+/).length;
  
  // 기본 인사이트 (기존 로직)
  // SEO 인사이트
  if (seoScore < 70) {
    const h1Count = $('h1').length;
    if (h1Count === 0) {
      insights.push({
        severity: 'High',
        category: 'SEO',
        message: 'H1 태그가 없습니다. 네이버 블로그에서도 H1 태그는 필수입니다.',
      });
    }
    
    const title = $('title').text().trim();
    if (!title || title.length > 60) {
      insights.push({
        severity: 'High',
        category: 'SEO',
        message: 'Title 태그를 50-60자로 최적화하세요. 네이버 검색 결과에 표시됩니다.',
      });
    }
    
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    if (!metaDesc) {
      insights.push({
        severity: 'High',
        category: 'SEO',
        message: 'Meta description을 추가하세요. 네이버 검색 결과 스니펫에 표시됩니다.',
      });
    }
  }
  
  // 네이버 블로그 특화 인사이트 (다양성 확보를 위해 variationSeed 기반으로 순서 변경)
  const naverInsights: Insight[] = [];
  
  if (!naverSpecific.seoElements.hasOgTags) {
    naverInsights.push({
      severity: 'High',
      category: '네이버 블로그 SEO',
      message: 'Open Graph 태그를 추가하세요. 네이버 카페, 밴드 등에서 공유 시 미리보기가 표시됩니다.',
    });
  }
  
  if (!naverSpecific.contentOptimization.hasTableOfContents && wordCount > 1000) {
    naverInsights.push({
      severity: 'Medium',
      category: '네이버 블로그 최적화',
      message: '목차(Table of Contents)를 추가하세요. 긴 콘텐츠의 가독성과 SEO에 도움이 됩니다.',
    });
  }
  
  if (!naverSpecific.blogStructure.hasTag) {
    naverInsights.push({
      severity: 'Medium',
      category: '네이버 블로그 최적화',
      message: '태그를 추가하세요. 네이버 블로그 검색에서 노출 확률이 높아집니다.',
    });
  }
  
  if (!naverSpecific.blogStructure.hasCategory) {
    naverInsights.push({
      severity: 'Low',
      category: '네이버 블로그 최적화',
      message: '카테고리를 설정하세요. 블로그 구조화와 사용자 경험에 도움이 됩니다.',
    });
  }
  
  // 이미지 분석 기반 인사이트
  if (naverSpecific.imageAnalysis) {
    const imgAnalysis = naverSpecific.imageAnalysis;
    
    if (imgAnalysis.totalCount < imgAnalysis.recommendedCount.minimum) {
      naverInsights.push({
        severity: 'High',
        category: '네이버 블로그 이미지',
        message: `이미지가 ${imgAnalysis.totalCount}개로 부족합니다. 최소 ${imgAnalysis.recommendedCount.minimum}개, 권장 ${imgAnalysis.recommendedCount.optimal}개 이상 추가하세요.`,
      });
    } else if (imgAnalysis.totalCount < imgAnalysis.recommendedCount.optimal) {
      naverInsights.push({
        severity: 'Medium',
        category: '네이버 블로그 이미지',
        message: `이미지가 ${imgAnalysis.totalCount}개입니다. 권장 개수는 ${imgAnalysis.recommendedCount.optimal}개 이상입니다.`,
      });
    }
    
    if (imgAnalysis.imagesWithOptimalSize < imgAnalysis.totalCount * 0.5) {
      naverInsights.push({
        severity: 'Medium',
        category: '네이버 블로그 이미지',
        message: `이미지 사이즈가 최적화되지 않았습니다. 본문 이미지는 최소 ${imgAnalysis.recommendedSizes.content.width}×${imgAnalysis.recommendedSizes.content.height}px 권장입니다.`,
      });
    }
    
    if (imgAnalysis.imagesWithAlt < imgAnalysis.totalCount) {
      const missingAltCount = imgAnalysis.totalCount - imgAnalysis.imagesWithAlt;
      naverInsights.push({
        severity: 'High',
        category: '네이버 블로그 이미지',
        message: `${missingAltCount}개의 이미지에 Alt 텍스트가 없습니다. SEO와 접근성을 위해 모든 이미지에 Alt 텍스트를 추가하세요.`,
      });
    }
  } else if (!naverSpecific.contentOptimization.hasImageGallery && $('img').length < 3) {
    naverInsights.push({
      severity: 'Medium',
      category: '네이버 블로그 최적화',
      message: '이미지를 3개 이상 추가하세요. 네이버 블로그는 이미지가 많은 콘텐츠를 선호합니다.',
    });
  }
  
  // 추가 네이버 블로그 특화 인사이트 (다양성 확보)
  if (variationSeed % 3 === 0 && !naverSpecific.seoElements.hasCanonical) {
    naverInsights.push({
      severity: 'Medium',
      category: '네이버 블로그 SEO',
      message: 'Canonical URL을 설정하세요. 중복 콘텐츠 문제를 방지하고 검색 순위에 도움이 됩니다.',
    });
  }
  
  if (variationSeed % 3 === 1 && !naverSpecific.seoElements.hasBreadcrumb) {
    naverInsights.push({
      severity: 'Low',
      category: '네이버 블로그 SEO',
      message: 'Breadcrumb(경로 표시)를 추가하세요. 사용자 경험과 SEO에 도움이 됩니다.',
    });
  }
  
  if (variationSeed % 3 === 2 && !naverSpecific.contentOptimization.hasVideo) {
    naverInsights.push({
      severity: 'Low',
      category: '네이버 블로그 최적화',
      message: '비디오 콘텐츠를 추가하세요. 네이버 TV와 연동하여 노출 확률이 높아집니다.',
    });
  }
  
  // variationSeed에 따라 인사이트 순서 변경 (다양성 확보)
  const shuffledInsights = [...naverInsights];
  for (let i = shuffledInsights.length - 1; i > 0; i--) {
    const j = (variationSeed + i) % (i + 1);
    [shuffledInsights[i], shuffledInsights[j]] = [shuffledInsights[j], shuffledInsights[i]];
  }
  insights.push(...shuffledInsights);
  
  // AEO 인사이트
  if (aeoScore < 70) {
    if (!naverSpecific.contentOptimization.hasCommentSection) {
      insights.push({
        severity: 'Low',
        category: 'AEO',
        message: '댓글 기능을 활성화하세요. 사용자 질문과 답변이 AI 검색에 도움이 됩니다.',
      });
    }
  }
  
  // GEO 인사이트
  if (geoScore < 70) {
    if (!naverSpecific.blogStructure.hasRelatedPosts) {
      insights.push({
        severity: 'Medium',
        category: 'GEO',
        message: '관련글 링크를 추가하세요. 콘텐츠 간 연결성이 향상됩니다.',
      });
    }
  }
  
  // 2025년 최신 기술 반영 인사이트
  const structuredData = $('script[type="application/ld+json"]').length;
  if (structuredData === 0) {
    insights.push({
      severity: 'High',
      category: '2025년 SEO',
      message: '구조화된 데이터(JSON-LD)를 추가하세요. 2025년 AI 검색 엔진에서 필수입니다.',
    });
  }
  
  const hasFAQSchema = $('script[type="application/ld+json"]').text().includes('FAQPage');
  if (!hasFAQSchema && aeoScore < 80) {
    insights.push({
      severity: 'High',
      category: '2025년 AEO',
      message: 'FAQPage 스키마를 추가하세요. 2025년 연구에 따르면 가장 높은 AI 인용 확률을 보입니다.',
    });
  }
  
  const hasH2H3Bullets = $('h2').length > 0 && $('h3').length > 0 && $('ul, ol').length > 0;
  if (!hasH2H3Bullets) {
    insights.push({
      severity: 'Medium',
      category: '2025년 최적화',
      message: 'H2→H3→bullets 구조를 사용하세요. Perplexity 등에서 40% 더 많은 인용을 받습니다.',
    });
  }
  
  return insights;
}

/**
 * 네이버 블로그 특화 개선 우선순위
 */
function getNaverBlogImprovementPriority(
  aeoScore: number,
  geoScore: number,
  seoScore: number,
  insights?: Insight[],
  naverSpecific?: ReturnType<typeof extractNaverBlogSpecifics>
): Array<{ 
  category: string; 
  priority: number; 
  reason: string;
  actionableTips?: Array<{ title: string; steps: string[]; expectedImpact: string }>;
}> {
  // 기본 개선 우선순위 가져오기
  const basePriorities = getImprovementPriority(aeoScore, geoScore, seoScore, insights);
  
  // 네이버 블로그 특화 팁 추가
  const naverTips: Array<{ title: string; steps: string[]; expectedImpact: string }> = [];
  
  if (naverSpecific) {
    if (!naverSpecific.seoElements.hasOgTags) {
      naverTips.push({
        title: 'Open Graph 태그 추가 (네이버 공유 최적화)',
        steps: [
          'HTML <head> 섹션에 Open Graph 메타 태그 추가',
          '<meta property="og:title" content="게시물 제목">',
          '<meta property="og:description" content="게시물 설명 (150-160자)">',
          '<meta property="og:image" content="대표 이미지 URL (1200×630px 권장)">',
          '<meta property="og:url" content="게시물 URL">',
          '네이버 카페, 밴드 등에서 공유 시 미리보기 표시',
        ],
        expectedImpact: 'SEO 점수 +10~15점, 소셜 공유 클릭률 증가',
      });
    }
    
    if (!naverSpecific.contentOptimization.hasTableOfContents) {
      naverTips.push({
        title: '목차(Table of Contents) 추가',
        steps: [
          '긴 콘텐츠(1000자 이상)의 경우 목차 추가',
          'H2, H3 태그를 기반으로 자동 목차 생성',
          '목차는 콘텐츠 상단에 배치',
          '각 목차 항목에 앵커 링크 추가',
          '예시: <div class="toc"><h2>목차</h2><ul><li><a href="#section1">섹션 1</a></li></ul></div>',
        ],
        expectedImpact: '사용자 경험 향상, 체류 시간 증가, SEO 점수 +5~8점',
      });
    }
    
    if (!naverSpecific.blogStructure.hasTag) {
      naverTips.push({
        title: '태그 추가 (네이버 블로그 검색 최적화)',
        steps: [
          '게시물 작성 시 관련 태그 3-5개 추가',
          '태그는 콘텐츠의 주요 키워드와 관련어 사용',
          '네이버 블로그 태그 기능 활용',
          '메타 키워드 태그도 함께 추가: <meta name="keywords" content="태그1, 태그2, 태그3">',
        ],
        expectedImpact: '네이버 블로그 검색 노출 증가, SEO 점수 +5~10점',
      });
    }
    
    // 이미지 최적화 팁
    if (naverSpecific.imageAnalysis) {
      const imgAnalysis = naverSpecific.imageAnalysis;
      
      if (imgAnalysis.totalCount < imgAnalysis.recommendedCount.optimal) {
        naverTips.push({
          title: `이미지 개수 및 사이즈 최적화 (현재 ${imgAnalysis.totalCount}개)`,
          steps: [
            `현재 이미지가 ${imgAnalysis.totalCount}개로 권장 개수(${imgAnalysis.recommendedCount.optimal}개)보다 적습니다`,
            `본문 이미지: ${imgAnalysis.recommendedSizes.content.width}×${imgAnalysis.recommendedSizes.content.height}px 권장 (최소 ${imgAnalysis.recommendedSizes.content.width}px 너비)`,
            `썸네일 이미지: ${imgAnalysis.recommendedSizes.thumbnail.width}×${imgAnalysis.recommendedSizes.thumbnail.height}px`,
            `Open Graph 이미지: ${imgAnalysis.recommendedSizes.ogImage.width}×${imgAnalysis.recommendedSizes.ogImage.height}px (카페/밴드 공유용)`,
            `이미지 파일 크기: 각 이미지 500KB 이하 권장 (로딩 속도 최적화)`,
            `이미지 포맷: JPG(사진), PNG(투명 배경), WebP(최신 브라우저)`,
            `모든 이미지에 Alt 텍스트 추가 (SEO 및 접근성)`,
            `이미지 개수: 최소 ${imgAnalysis.recommendedCount.minimum}개, 권장 ${imgAnalysis.recommendedCount.optimal}개, 최대 ${imgAnalysis.recommendedCount.maximum}개`,
          ],
          expectedImpact: 'SEO 점수 +10~15점, 사용자 경험 향상, 네이버 검색 노출 증가',
        });
      }
      
      if (imgAnalysis.imagesWithAlt < imgAnalysis.totalCount) {
        naverTips.push({
          title: `이미지 Alt 텍스트 추가 (${imgAnalysis.totalCount - imgAnalysis.imagesWithAlt}개 누락)`,
          steps: [
            `현재 ${imgAnalysis.totalCount - imgAnalysis.imagesWithAlt}개의 이미지에 Alt 텍스트가 없습니다`,
            '모든 <img> 태그에 alt 속성 추가',
            '예시: <img src="photo.jpg" alt="2024년 봄 꽃 사진">',
            'Alt 텍스트는 이미지의 내용을 정확하게 설명해야 합니다',
            '장식용 이미지는 alt="" (빈 문자열)로 설정 가능',
            'SEO와 접근성(스크린 리더) 모두에 중요합니다',
          ],
          expectedImpact: 'SEO 점수 +5~10점, 접근성 향상',
        });
      }
    }
  }
  
  // 네이버 블로그 특화 우선순위 항목 추가
  if (naverTips.length > 0) {
    basePriorities.push({
      category: '네이버 블로그 최적화',
      priority: seoScore < 70 ? 1 : 2,
      reason: '네이버 블로그 특화 SEO 요소가 부족합니다',
      actionableTips: naverTips,
    });
  }
  
  // 2025년 최신 기술 팁 추가
  const modernTips: Array<{ title: string; steps: string[]; expectedImpact: string }> = [];
  
  modernTips.push({
    title: 'FAQPage 스키마 추가 (2025년 필수)',
    steps: [
      'FAQPage JSON-LD 스키마 추가',
      '자주 묻는 질문 5-10개 수집',
      '각 질문과 답변을 구조화',
      'schema.org/FAQPage 형식 사용',
      'Google 검색 결과에 FAQ 리치 스니펫 표시 가능',
    ],
    expectedImpact: 'AEO 점수 +15~20점, AI 인용 확률 최대 증가',
  });
  
  modernTips.push({
    title: 'H2→H3→bullets 구조 적용 (2025년 최적화)',
    steps: [
      'H2로 주요 섹션 구분 (최소 3-5개)',
      '각 H2 아래에 H3로 하위 섹션 구분',
      'H3 아래에 불릿 포인트로 핵심 정보 정리',
      '논리적 계층 구조 유지',
      'Perplexity 등에서 40% 더 많은 인용',
    ],
    expectedImpact: 'AEO 점수 +10~15점, AI 인용 확률 40% 증가',
  });
  
  basePriorities.push({
    category: '2025년 최신 SEO 기술',
    priority: 1,
    reason: '2025년 AI 검색 엔진 최적화 필수 요소',
    actionableTips: modernTips,
  });
  
  return basePriorities.sort((a, b) => a.priority - b.priority);
}

/**
 * 네이버 블로그 특화 콘텐츠 작성 가이드라인
 */
function getNaverBlogContentGuidelines(
  aeoScore: number,
  geoScore: number,
  seoScore: number,
  naverSpecific?: ReturnType<typeof extractNaverBlogSpecifics>
): string[] {
  const guidelines: string[] = [];
  
  // 기본 가이드라인
  const baseGuidelines = getContentWritingGuidelines(aeoScore, geoScore, seoScore);
  guidelines.push(...baseGuidelines);
  
  // 네이버 블로그 특화 가이드라인
  guidelines.push('✅ 네이버 블로그: Open Graph 태그를 반드시 추가하세요 (카페/밴드 공유 최적화)');
  guidelines.push('✅ 네이버 블로그: 태그를 3-5개 추가하여 검색 노출을 높이세요');
  guidelines.push('✅ 네이버 블로그: 카테고리를 설정하여 블로그 구조를 명확히 하세요');
  
  // 이미지 가이드라인 (네이버 블로그 특화)
  if (naverSpecific?.imageAnalysis) {
    const imgAnalysis = naverSpecific.imageAnalysis;
    guidelines.push(`✅ 네이버 블로그: 이미지 ${imgAnalysis.recommendedCount.optimal}개 이상 추가 (최소 ${imgAnalysis.recommendedCount.minimum}개, 최대 ${imgAnalysis.recommendedCount.maximum}개)`);
    guidelines.push(`✅ 네이버 블로그: 본문 이미지 사이즈 ${imgAnalysis.recommendedSizes.content.width}×${imgAnalysis.recommendedSizes.content.height}px 권장 (최소 ${imgAnalysis.recommendedSizes.content.width}px 너비)`);
    guidelines.push(`✅ 네이버 블로그: Open Graph 이미지 ${imgAnalysis.recommendedSizes.ogImage.width}×${imgAnalysis.recommendedSizes.ogImage.height}px 설정 (카페/밴드 공유용)`);
    guidelines.push('✅ 네이버 블로그: 이미지 파일 크기 각 500KB 이하 권장 (로딩 속도 최적화)');
    guidelines.push('✅ 네이버 블로그: 모든 이미지에 Alt 텍스트 추가 (SEO 및 접근성)');
  } else {
    guidelines.push('✅ 네이버 블로그: 이미지를 3개 이상 추가하세요 (네이버는 이미지 중심 콘텐츠 선호)');
  }
  
  guidelines.push('✅ 네이버 블로그: 목차를 추가하여 긴 콘텐츠의 가독성을 높이세요');
  guidelines.push('✅ 네이버 블로그: 관련글 링크를 추가하여 콘텐츠 간 연결성을 강화하세요');
  guidelines.push('✅ 네이버 블로그: 댓글 기능을 활성화하여 사용자 참여를 유도하세요');
  
  // 2025년 최신 기술 가이드라인
  guidelines.push('✅ 2025년 필수: FAQPage 스키마를 추가하세요 (가장 높은 AI 인용 확률)');
  guidelines.push('✅ 2025년 필수: H2→H3→bullets 구조를 사용하세요 (40% 더 많은 인용)');
  guidelines.push('✅ 2025년 필수: 30일 이내 콘텐츠 업데이트 (Perplexity에서 3.2배 인용 증가)');
  guidelines.push('✅ 2025년 필수: 통계 데이터와 인용을 포함하세요 (+41% 통계, +28% 인용 개선)');
  guidelines.push('✅ 2025년 필수: 구조화된 데이터(JSON-LD)를 반드시 포함하세요');
  
  return guidelines;
}
