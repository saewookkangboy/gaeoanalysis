import * as cheerio from 'cheerio';
import { DEFAULT_AIO_WEIGHTS, ENHANCED_AIO_WEIGHTS, type AIOWeights } from './algorithm-defaults';

export interface AIOCitationScores {
  chatgpt: number;
  perplexity: number;
  grok: number;
  gemini: number;
  claude: number;
}

export interface AIOCitationAnalysis {
  scores: AIOCitationScores;
  insights: {
    model: 'chatgpt' | 'perplexity' | 'grok' | 'gemini' | 'claude';
    score: number;
    level: 'High' | 'Medium' | 'Low';
    recommendations: string[];
  }[];
}

export type AIOWeightOverrides = Partial<AIOWeights>;

function mergeAioWeights(overrides?: AIOWeightOverrides): AIOWeights {
  const merged: AIOWeights = { ...DEFAULT_AIO_WEIGHTS };
  if (!overrides) {
    return merged;
  }

  for (const [key, value] of Object.entries(overrides)) {
    // Validate key exists in default weights and value is non-negative
    if (key in DEFAULT_AIO_WEIGHTS && typeof value === 'number' && Number.isFinite(value) && value >= 0) {
      (merged as Record<string, number>)[key] = value;
    } else if (key in DEFAULT_AIO_WEIGHTS && typeof value === 'number') {
      console.warn(`Invalid weight value for ${key}: ${value}. Must be non-negative and finite.`);
    }
  }

  return merged;
}

function normalizeWeightGroup(weights: AIOWeights, keys: Array<keyof AIOWeights>): void {
  const total = keys.reduce((sum, key) => sum + weights[key], 0);
  // Use type assertion to bypass readonly constraint (Railway build fix)
  // Cast to Record<string, number> to allow mutation
  const mutableWeights = weights as unknown as Record<string, number>;
  
  if (total <= 0) {
    // Set equal weights if total is invalid
    const equalWeight = 1 / keys.length;
    for (const key of keys) {
      mutableWeights[key as string] = equalWeight;
    }
    return;
  }

  // Normalize weights
  for (const key of keys) {
    mutableWeights[key as string] = weights[key] / total;
  }
}

function resolveAioWeights(overrides?: AIOWeightOverrides): AIOWeights {
  const weights = mergeAioWeights(overrides);
  normalizeWeightGroup(weights, ['chatgpt_seo_weight', 'chatgpt_aeo_weight', 'chatgpt_geo_weight']);
  normalizeWeightGroup(weights, ['perplexity_geo_weight', 'perplexity_seo_weight', 'perplexity_aeo_weight']);
  normalizeWeightGroup(weights, ['grok_geo_weight', 'grok_seo_weight', 'grok_aeo_weight']);
  normalizeWeightGroup(weights, ['gemini_geo_weight', 'gemini_seo_weight', 'gemini_aeo_weight']);
  normalizeWeightGroup(weights, ['claude_aeo_weight', 'claude_geo_weight', 'claude_seo_weight']);
  return weights;
}

/**
 * AI 모델별 인용 확률을 계산합니다.
 * 각 AI 모델의 특성을 반영한 가중치와 특화 지표를 사용합니다.
 * 
 * @param $ Cheerio API 인스턴스
 * @param aeoScore AEO 점수
  // 일반 사이트인 경우 강화 가중치 사용
  const baseWeights = isWebsite ? ENHANCED_AIO_WEIGHTS as AIOWeights : DEFAULT_AIO_WEIGHTS;
  // Apply overrides with validation
  const mergedWeights: AIOWeights = { ...baseWeights };
  if (weightOverrides) {
    for (const [key, value] of Object.entries(weightOverrides)) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        (mergedWeights as Record<string, number>)[key] = value;
      }
    }
  }
  const weights = resolveAioWeights(mergedWeights);
  $: cheerio.CheerioAPI,
  aeoScore: number,
  geoScore: number,
  seoScore: number,
  weightOverrides?: AIOWeightOverrides,
  isWebsite?: boolean
): AIOCitationScores {
  // 일반 사이트인 경우 강화 가중치 사용
  const baseWeights = isWebsite ? (ENHANCED_AIO_WEIGHTS as unknown as AIOWeights) : DEFAULT_AIO_WEIGHTS;
  const mergedWeights: AIOWeights = weightOverrides 
    ? { ...baseWeights, ...weightOverrides } as AIOWeights
    : baseWeights;
  const weights = resolveAioWeights(mergedWeights);

  // 각 AI 모델별 특화 지표 계산 (일반 사이트인 경우 강화된 보너스)
  const chatgptBonus = isWebsite ? calculateEnhancedChatGPTBonus($) : calculateChatGPTBonus($);
  const perplexityBonus = isWebsite ? calculateEnhancedPerplexityBonus($) : calculatePerplexityBonus($);
  const grokBonus = calculateGrokBonus($); // Grok은 유지
  const geminiBonus = calculateGeminiBonus($); // Gemini는 유지
  const claudeBonus = isWebsite ? calculateEnhancedClaudeBonus($) : calculateClaudeBonus($);

  // 기본 점수 계산 (가중치 기반)
  const chatgptBase =
    (seoScore * weights.chatgpt_seo_weight) +
    (aeoScore * weights.chatgpt_aeo_weight) +
    (geoScore * weights.chatgpt_geo_weight);
  const perplexityBase =
    (geoScore * weights.perplexity_geo_weight) +
    (seoScore * weights.perplexity_seo_weight) +
    (aeoScore * weights.perplexity_aeo_weight);
  const grokBase =
    (geoScore * weights.grok_geo_weight) +
    (seoScore * weights.grok_seo_weight) +
    (aeoScore * weights.grok_aeo_weight);
  const geminiBase =
    (geoScore * weights.gemini_geo_weight) +
    (seoScore * weights.gemini_seo_weight) +
    (aeoScore * weights.gemini_aeo_weight);
  const claudeBase =
    (aeoScore * weights.claude_aeo_weight) +
    (geoScore * weights.claude_geo_weight) +
    (seoScore * weights.claude_seo_weight);

  return {
    chatgpt: Math.min(100, Math.round(chatgptBase + chatgptBonus)),
    perplexity: Math.min(100, Math.round(perplexityBase + perplexityBonus)),
    grok: Math.min(100, Math.round(grokBase + grokBonus)),
    gemini: Math.min(100, Math.round(geminiBase + geminiBonus)),
    claude: Math.min(100, Math.round(claudeBase + claudeBonus)),
  };
}

/**
 * ChatGPT 인용 확률 보너스 계산
 * ChatGPT는 구조화된 데이터, FAQ, 단계별 가이드를 선호합니다.
 */
function calculateChatGPTBonus($: cheerio.CheerioAPI): number {
  let bonus = 0;
  const structuredDataText = $('script[type="application/ld+json"]').text();

  // FAQPage 스키마 (Highest AI citation probability) (12점)
  const hasFAQSchema = structuredDataText.includes('FAQPage');
  if (hasFAQSchema) bonus += 12;

  // 구조화된 데이터 (JSON-LD) 존재 여부 (10점)
  const structuredData = $('script[type="application/ld+json"]').length;
  if (structuredData > 0) bonus += 10;

  // Article 스키마 with E-E-A-T signals (credentials, dates) (8점)
  const hasArticleSchema = structuredDataText.includes('"Article"') || structuredDataText.includes('"BlogPosting"');
  const hasAuthorCredentials = structuredDataText.includes('author') && structuredDataText.includes('credential');
  if (hasArticleSchema && hasAuthorCredentials) bonus += 8;

  // FAQ 섹션 품질 (8점)
  const faqElements = $('*:contains("FAQ"), *:contains("자주 묻는 질문"), [class*="faq"], [id*="faq"]').length;
  if (faqElements > 0) bonus += 8;

  // 단계별 가이드 구조 (7점)
  const hasOrderedList = $('ol').length > 0;
  const hasSteps = $('*:contains("단계"), *:contains("step")').length > 0;
  if (hasOrderedList && hasSteps) bonus += 7;

  // Authority and credentials (+40% citation boost) (6점)
  const hasAuthor = structuredDataText.includes('Person') || structuredDataText.includes('author');
  const text = $('body').text();
  const hasCredentials = /자격|credential|전문가|expert|박사|Ph\.D/i.test(text);
  if (hasAuthor && hasCredentials) bonus += 6;

  // Primary source citations (PubMed, arXiv) (5점)
  const hasPrimarySources = /pubmed|arxiv|doi|\.edu|\.gov/i.test(text);
  if (hasPrimarySources) bonus += 5;

  // 전문 용어 정의 (5점)
  const hasDefinitions = $('dfn, abbr[title], *[class*="definition"]').length > 0;
  if (hasDefinitions) bonus += 5;

  // 1500-2500 words comprehensive coverage (3점)
  const wordCount = text.split(/\s+/).length;
  if (wordCount >= 1500 && wordCount <= 2500) bonus += 3;

  return Math.min(40, bonus); // 최대 보너스 증가 (40점)
}

/**
 * Perplexity 인용 확률 보너스 계산
 * Perplexity는 최신 정보, 출처 링크, 날짜 정보를 선호합니다.
 */
function calculatePerplexityBonus($: cheerio.CheerioAPI): number {
  let bonus = 0;
  const text = $('body').text();

  // 콘텐츠 업데이트 날짜 표시 (30일 이내: 3.2x citations) (15점)
  const hasDate = $('time, [datetime], [class*="date"], [class*="updated"]').length > 0;
  const hasRecentYear = /(202[4-9]|최근|recent|updated|latest)/i.test(text);
  if (hasDate && hasRecentYear) bonus += 15; // 최신 정보 명시
  else if (hasDate || hasRecentYear) bonus += 10;

  // H2→H3→bullets structure (40% more citations) (12점)
  const hasH2 = $('h2').length > 0;
  const hasH3 = $('h3').length > 0;
  const hasBullets = $('ul, ol').length > 0;
  if (hasH2 && hasH3 && hasBullets) bonus += 12;

  // Inline citations with [1], [2] format (10점)
  const hasInlineCitations = /\[\d+\]|\[1\]|\[2\]|인용|citation/i.test(text);
  if (hasInlineCitations) bonus += 10;

  // 출처 링크 수 (7점)
  const externalLinks = $('a[href^="http"]').length;
  if (externalLinks >= 5) bonus += 7;
  else if (externalLinks >= 2) bonus += 4;

  // Update frequency indicators (2-3 days aggressive, 90 days minimum) (5점)
  const hasUpdateFrequency = /업데이트|update|최신|fresh/i.test(text);
  if (hasUpdateFrequency) bonus += 5;

  // 검색 키워드 최적화 (5점)
  const metaKeywords = $('meta[name="keywords"]').attr('content');
  if (metaKeywords && metaKeywords.split(',').length >= 3) bonus += 5;

  return Math.min(40, bonus); // 최대 보너스 증가 (40점)
}

/**
 * Grok 인용 확률 보너스 계산
 * Grok은 최신성, 출처 명시, 빠른 요약 정보를 선호합니다.
 */
function calculateGrokBonus($: cheerio.CheerioAPI): number {
  let bonus = 0;
  const text = $('body').text();

  // 최신 정보 및 시간성 (15점)
  const hasDate = $('time, [datetime], [class*="date"], [class*="updated"]').length > 0;
  const hasRecentYear = /(202[4-9]|최근|recent|updated|latest|breaking)/i.test(text);
  if (hasDate && hasRecentYear) bonus += 15;
  else if (hasDate || hasRecentYear) bonus += 10;

  // 출처 링크 및 인용 (10점)
  const hasCitations = /참고|출처|reference|citation|source|근거/i.test(text);
  const hasPrimarySources = /pubmed|arxiv|doi|\.edu|\.gov|whitepaper|official/i.test(text);
  if (hasPrimarySources) bonus += 10;
  else if (hasCitations) bonus += 6;

  // 요약 또는 핵심 정리 (6점)
  const hasSummary = /요약|핵심|정리|TL;DR|tl;dr|summary/i.test(text);
  if (hasSummary) bonus += 6;

  // 소셜/공유 메타데이터 (6점)
  const ogTags = $('meta[property^="og:"]').length;
  const twitterTags = $('meta[name^="twitter:"]').length;
  if (twitterTags >= 2) bonus += 6;
  else if (ogTags >= 3) bonus += 4;

  // 짧은 핵심 답변 블록 (3점) - Check for summary/TL;DR sections with concise content
  const summarySection = $('*:contains("TL;DR"), *:contains("요약"), [class*="summary"]').first();
  const hasConciseSummary = summarySection.length > 0 && summarySection.text().length < 300;
  if (hasConciseSummary) bonus += 3;

  return Math.min(40, bonus);
}

/**
 * Gemini 인용 확률 보너스 계산
 * Gemini는 미디어 콘텐츠, 표, 구조화된 데이터를 선호합니다.
 */
function calculateGeminiBonus($: cheerio.CheerioAPI): number {
  let bonus = 0;
  const structuredDataText = $('script[type="application/ld+json"]').text();

  // Google Business Profile integration (12점)
  const hasLocalBusiness = structuredDataText.includes('LocalBusiness');
  const hasOrganization = structuredDataText.includes('Organization');
  if (hasLocalBusiness || hasOrganization) bonus += 12;

  // 이미지와 비디오 포함 여부 (10점)
  const images = $('img').length;
  const videos = $('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length;
  if (images >= 3 || videos > 0) bonus += 10;
  else if (images >= 1) bonus += 5;

  // User reviews and testimonials (10점)
  const text = $('body').text();
  const hasReviews = /리뷰|review|평점|rating|추천|testimonial/i.test(text);
  if (hasReviews) bonus += 10;

  // Local citations (NAP consistency) (8점)
  const hasNAP = /주소|address|전화|phone|telephone|위치|location/i.test(text);
  if (hasNAP) bonus += 8;

  // 표와 리스트 구조 (8점)
  const tables = $('table').length;
  const lists = $('ul, ol').length;
  if (tables > 0 && lists >= 2) bonus += 8;
  else if (tables > 0 || lists >= 2) bonus += 4;

  // 구조화된 데이터 (Schema.org) (7점)
  const structuredData = $('script[type="application/ld+json"]').length;
  if (structuredData > 0) bonus += 7;

  // Traditional authority signals (5점)
  const hasAuthority = /전문가|expert|권위|authority|인증|certification/i.test(text);
  if (hasAuthority) bonus += 5;

  // 다국어 메타데이터 (5점)
  const langAttr = $('html').attr('lang');
  const hasMultiLang = $('meta[property="og:locale:alternate"]').length > 0;
  if (langAttr || hasMultiLang) bonus += 5;

  return Math.min(40, bonus); // 최대 보너스 증가 (40점)
}

/**
 * Claude 인용 확률 보너스 계산
 * Claude는 상세한 설명, 긴 형식의 콘텐츠, 포괄적인 정보를 선호합니다.
 */
function calculateClaudeBonus($: cheerio.CheerioAPI): number {
  let bonus = 0;
  const text = $('body').text();

  // Primary sources only (91.2% attribution accuracy) (12점)
  const hasPrimarySources = /pubmed|arxiv|doi|\.edu|\.gov|primary source|주요 출처/i.test(text);
  if (hasPrimarySources) bonus += 12;

  // 5-8 citations with publisher and year (10점)
  const citations = $('*:contains("참고"), *:contains("출처"), *:contains("reference"), [class*="citation"]').length;
  const hasPublisherYear = /\d{4}|publisher|출판사|연도/i.test(text);
  if (citations >= 5 && hasPublisherYear) bonus += 10;
  else if (citations >= 3) bonus += 6;

  // 콘텐츠 길이 (10점) - 상세한 설명 선호
  const wordCount = text.split(/\s+/).length;
  if (wordCount >= 2000) bonus += 10;
  else if (wordCount >= 1000) bonus += 6;
  else if (wordCount >= 500) bonus += 3;

  // Transparent methodology (8점)
  const hasMethodology = /방법론|methodology|방법|process|절차/i.test(text);
  if (hasMethodology) bonus += 8;

  // Acknowledged limitations (7점)
  const hasLimitations = /한계|limitation|제한|주의|주의사항/i.test(text);
  if (hasLimitations) bonus += 7;

  // 섹션 수 (8점)
  const sections = $('section, article, [class*="section"], [class*="article"]').length;
  if (sections >= 5) bonus += 8;
  else if (sections >= 3) bonus += 4;

  // 상세한 설명 (7점)
  const paragraphs = $('p').length;
  if (paragraphs >= 10) bonus += 7;
  else if (paragraphs >= 5) bonus += 4;

  return Math.min(40, bonus); // 최대 보너스 증가 (40점)
}

/**
 * 강화된 ChatGPT 인용 확률 보너스 계산 (일반 사이트용)
 * 일반 사이트의 전문성, 신뢰도, 구조적 완성도를 더 강하게 반영합니다.
 */
function calculateEnhancedChatGPTBonus($: cheerio.CheerioAPI): number {
  let bonus = calculateChatGPTBonus($); // 기존 보너스

  const text = $('body').text();
  const structuredDataText = $('script[type="application/ld+json"]').text();

  // 전문가 자격증명 강화 (+8점, 기존 +6점에서 추가 +2점)
  const hasAuthor = structuredDataText.includes('Person') || structuredDataText.includes('author');
  const hasCredentials = /자격|credential|전문가|expert|박사|Ph\.D|인증|certification/i.test(text);
  if (hasAuthor && hasCredentials) bonus += 2; // 추가 +2점

  // 연구 기반 콘텐츠 (+7점, 신규)
  const hasResearch = /연구|research|study|논문|paper|journal/i.test(text);
  const hasData = /\d+%|\d+\.\d+%|통계|statistics|데이터|data/i.test(text);
  if (hasResearch && hasData) bonus += 7;

  // 비즈니스 인증 (+5점, 신규)
  const hasBusinessCert = /인증|certification|ISO|인정|승인|approved/i.test(text);
  const hasCompanyInfo = /회사|company|기업|corporation/i.test(text);
  if (hasBusinessCert && hasCompanyInfo) bonus += 5;

  return Math.min(50, bonus); // 최대 보너스 증가 (40점 → 50점)
}

/**
 * 강화된 Perplexity 인용 확률 보너스 계산 (일반 사이트용)
 * 일반 사이트의 최신성, 출처 품질, 데이터 신뢰도를 더 강하게 반영합니다.
 */
function calculateEnhancedPerplexityBonus($: cheerio.CheerioAPI): number {
  let bonus = calculatePerplexityBonus($); // 기존 보너스

  const text = $('body').text();

  // 최신 업데이트 강화 (+18점, 기존 +15점에서 추가 +3점)
  const hasDate = $('time, [datetime], [class*="date"], [class*="updated"]').length > 0;
  const hasRecentYear = /(202[4-9]|최근|recent|updated|latest)/i.test(text);
  if (hasDate && hasRecentYear) bonus += 3; // 추가 +3점

  // 출처 링크 강화 (+10점, 기존 +7점에서 추가 +3점)
  const externalLinks = $('a[href^="http"]').length;
  if (externalLinks >= 10) bonus += 3; // 추가 +3점

  // 데이터/통계 포함 (+8점, 신규)
  const hasStatistics = /\d+%|\d+\.\d+%|통계|statistics/i.test(text);
  const hasCharts = $('canvas, svg, [class*="chart"]').length > 0;
  if (hasStatistics && hasCharts) bonus += 8;

  return Math.min(50, bonus); // 최대 보너스 증가 (40점 → 50점)
}

/**
 * 강화된 Claude 인용 확률 보너스 계산 (일반 사이트용)
 * 일반 사이트의 포괄성, 출처 품질, 방법론 투명성을 더 강하게 반영합니다.
 */
function calculateEnhancedClaudeBonus($: cheerio.CheerioAPI): number {
  let bonus = calculateClaudeBonus($); // 기존 보너스

  const text = $('body').text();
  const wordCount = text.split(/\s+/).length;

  // 주요 출처 강화 (+15점, 기존 +12점에서 추가 +3점)
  const hasPrimarySources = /pubmed|arxiv|doi|\.edu|\.gov|primary source|주요 출처/i.test(text);
  if (hasPrimarySources) bonus += 3; // 추가 +3점

  // 콘텐츠 길이 강화 (+12점, 기존 +10점에서 추가 +2점)
  if (wordCount >= 3000) bonus += 2; // 추가 +2점

  // 방법론 명시 강화 (+10점, 기존 +8점에서 추가 +2점)
  const hasMethodology = /방법론|methodology|방법|process|절차|프로세스/i.test(text);
  if (hasMethodology) bonus += 2; // 추가 +2점

  return Math.min(50, bonus); // 최대 보너스 증가 (40점 → 50점)
}

/**
 * AI 모델별 인용 확률 분석 및 가이드 생성
 */
export function generateAIOCitationAnalysis(scores: AIOCitationScores): AIOCitationAnalysis {
  const insights = [
    {
      model: 'chatgpt' as const,
      score: scores.chatgpt,
      level: getScoreLevel(scores.chatgpt),
      recommendations: getChatGPTRecommendations(scores.chatgpt),
    },
    {
      model: 'perplexity' as const,
      score: scores.perplexity,
      level: getScoreLevel(scores.perplexity),
      recommendations: getPerplexityRecommendations(scores.perplexity),
    },
    {
      model: 'grok' as const,
      score: scores.grok,
      level: getScoreLevel(scores.grok),
      recommendations: getGrokRecommendations(scores.grok),
    },
    {
      model: 'gemini' as const,
      score: scores.gemini,
      level: getScoreLevel(scores.gemini),
      recommendations: getGeminiRecommendations(scores.gemini),
    },
    {
      model: 'claude' as const,
      score: scores.claude,
      level: getScoreLevel(scores.claude),
      recommendations: getClaudeRecommendations(scores.claude),
    },
  ];

  return { scores, insights };
}

function getScoreLevel(score: number): 'High' | 'Medium' | 'Low' {
  if (score >= 80) return 'High';
  if (score >= 60) return 'Medium';
  return 'Low';
}

function getChatGPTRecommendations(score: number): string[] {
  if (score >= 80) {
    return [
      'FAQPage 스키마를 추가하여 AI 인용 확률을 최대화하세요 (Highest citation probability)',
      '작성자 자격 증명을 Article 스키마에 포함하세요 (+40% citation boost)',
    ];
  } else if (score >= 60) {
    return [
      'FAQPage 스키마를 추가하여 AI 인용 확률을 높이세요',
      '1500-2500자 포괄적인 콘텐츠로 확장하세요',
      '주요 출처 인용 (PubMed, arXiv 등)을 추가하세요',
    ];
  }
  return [
    'FAQPage 스키마를 추가하여 AI 인용 확률을 최대화하세요 (Highest citation probability)',
    '작성자 자격 증명 및 전문성을 표시하세요 (+40% citation boost)',
    '1500-2500자 포괄적인 콘텐츠를 작성하세요',
    '주요 출처 인용 (PubMed, arXiv 등)을 포함하세요',
  ];
}

function getPerplexityRecommendations(score: number): string[] {
  if (score >= 80) {
    return [
      '30일 이내 정기적인 업데이트를 유지하세요 (3.2x citations)',
      'H2→H3→bullets 구조를 유지하세요 (40% more citations)',
    ];
  } else if (score >= 60) {
    return [
      '콘텐츠를 30일 이내에 업데이트하세요 (3.2x citations)',
      'H2→H3→bullets 구조로 재구성하세요 (40% more citations)',
      '인라인 인용 형식 [1], [2]를 사용하세요',
    ];
  }
  return [
    '콘텐츠를 30일 이내에 업데이트하세요 (3.2x citations when fresh)',
    'H2→H3→bullets 구조로 재구성하세요 (40% more citations)',
    '인라인 인용 형식 [1], [2]를 사용하세요',
    '업데이트 주기를 2-3일(공격적) 또는 90일(최소)로 설정하세요',
  ];
}

function getGrokRecommendations(score: number): string[] {
  if (score >= 80) {
    return [
      '최신 업데이트 날짜와 시간 정보를 유지하세요',
      '핵심 요약(TL;DR) 섹션을 유지하세요',
    ];
  } else if (score >= 60) {
    return [
      '콘텐츠에 최신 날짜 및 시간 정보를 명시하세요',
      '출처 링크와 참고 자료를 추가하세요',
      '요약 또는 핵심 정리 섹션을 추가하세요',
    ];
  }
  return [
    '콘텐츠에 최신 날짜 및 시간 정보를 명시하세요',
    '출처 링크와 참고 자료를 추가하세요',
    '요약 또는 핵심 정리(TL;DR) 섹션을 추가하세요',
    'Open Graph/Twitter 메타데이터를 설정하여 공유 품질을 높이세요',
  ];
}

function getGeminiRecommendations(score: number): string[] {
  if (score >= 80) {
    return [
      'Google Business Profile을 통합하세요',
      '사용자 리뷰 및 추천을 포함하세요',
    ];
  } else if (score >= 60) {
    return [
      '이미지와 비디오를 추가하여 시각적 정보를 풍부하게 하세요',
      '로컬 인용(NAP: Name, Address, Phone)을 일관되게 유지하세요',
      '사용자 리뷰 및 추천을 포함하세요',
    ];
  }
  return [
    'Google Business Profile을 통합하세요',
    '로컬 인용(NAP: Name, Address, Phone)을 일관되게 유지하세요',
    '사용자 리뷰 및 추천을 포함하세요',
    '이미지와 비디오를 추가하여 시각적 정보를 풍부하게 하세요',
    '표와 리스트를 활용하여 정보를 구조화하고 가독성을 높이세요',
  ];
}

function getClaudeRecommendations(score: number): string[] {
  if (score >= 80) {
    return [
      '주요 출처만 사용하여 91.2% 정확한 출처 표시를 유지하세요',
      '5-8개 인용에 출판사 및 연도를 포함하세요',
    ];
  } else if (score >= 60) {
    return [
      '주요 출처(Primary sources)만 사용하세요 (91.2% attribution accuracy)',
      '5-8개 인용에 출판사 및 연도를 포함하세요',
      '투명한 방법론을 설명하세요',
    ];
  }
  return [
    '주요 출처(Primary sources)만 사용하세요 (91.2% attribution accuracy)',
    '5-8개 인용에 출판사 및 연도를 포함하세요',
    '투명한 방법론을 설명하고 인정된 한계점을 명시하세요',
    '2000자 이상의 상세하고 포괄적인 콘텐츠를 작성하세요',
  ];
}
