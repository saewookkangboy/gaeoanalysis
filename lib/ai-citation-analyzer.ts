import * as cheerio from 'cheerio';

export interface AIOCitationScores {
  chatgpt: number;
  perplexity: number;
  gemini: number;
  claude: number;
}

export interface AIOCitationAnalysis {
  scores: AIOCitationScores;
  insights: {
    model: 'chatgpt' | 'perplexity' | 'gemini' | 'claude';
    score: number;
    level: 'High' | 'Medium' | 'Low';
    recommendations: string[];
  }[];
}

/**
 * AI 모델별 인용 확률을 계산합니다.
 * 각 AI 모델의 특성을 반영한 가중치와 특화 지표를 사용합니다.
 */
export function calculateAIOCitationScores(
  $: cheerio.CheerioAPI,
  aeoScore: number,
  geoScore: number,
  seoScore: number
): AIOCitationScores {
  // 각 AI 모델별 특화 지표 계산
  const chatgptBonus = calculateChatGPTBonus($);
  const perplexityBonus = calculatePerplexityBonus($);
  const geminiBonus = calculateGeminiBonus($);
  const claudeBonus = calculateClaudeBonus($);

  // 기본 점수 계산 (가중치 기반)
  const chatgptBase = (seoScore * 0.4) + (aeoScore * 0.35) + (geoScore * 0.25);
  const perplexityBase = (geoScore * 0.45) + (seoScore * 0.30) + (aeoScore * 0.25);
  const geminiBase = (geoScore * 0.40) + (seoScore * 0.35) + (aeoScore * 0.25);
  const claudeBase = (aeoScore * 0.40) + (geoScore * 0.35) + (seoScore * 0.25);

  return {
    chatgpt: Math.min(100, Math.round(chatgptBase + chatgptBonus)),
    perplexity: Math.min(100, Math.round(perplexityBase + perplexityBonus)),
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

  // 구조화된 데이터 (JSON-LD) 존재 여부 (10점)
  const structuredData = $('script[type="application/ld+json"]').length;
  if (structuredData > 0) bonus += 10;

  // FAQ 섹션 품질 (8점)
  const faqElements = $('*:contains("FAQ"), *:contains("자주 묻는 질문"), [class*="faq"], [id*="faq"]').length;
  if (faqElements > 0) bonus += 8;

  // 단계별 가이드 구조 (7점)
  const hasOrderedList = $('ol').length > 0;
  const hasSteps = $('*:contains("단계"), *:contains("step")').length > 0;
  if (hasOrderedList && hasSteps) bonus += 7;

  // 전문 용어 정의 (5점)
  const hasDefinitions = $('dfn, abbr[title], *[class*="definition"]').length > 0;
  if (hasDefinitions) bonus += 5;

  return Math.min(30, bonus);
}

/**
 * Perplexity 인용 확률 보너스 계산
 * Perplexity는 최신 정보, 출처 링크, 날짜 정보를 선호합니다.
 */
function calculatePerplexityBonus($: cheerio.CheerioAPI): number {
  let bonus = 0;

  // 콘텐츠 업데이트 날짜 표시 (10점)
  const hasDate = $('time, [datetime], [class*="date"], [class*="updated"]').length > 0;
  if (hasDate) bonus += 10;

  // 최신 정보 표시 (2024-2025) (8점)
  const text = $('body').text();
  const hasRecentYear = /(202[4-9]|최근|recent|updated|latest)/i.test(text);
  if (hasRecentYear) bonus += 8;

  // 출처 링크 수 (7점)
  const externalLinks = $('a[href^="http"]').length;
  if (externalLinks >= 5) bonus += 7;
  else if (externalLinks >= 2) bonus += 4;

  // 검색 키워드 최적화 (5점)
  const metaKeywords = $('meta[name="keywords"]').attr('content');
  if (metaKeywords && metaKeywords.split(',').length >= 3) bonus += 5;

  return Math.min(30, bonus);
}

/**
 * Gemini 인용 확률 보너스 계산
 * Gemini는 미디어 콘텐츠, 표, 구조화된 데이터를 선호합니다.
 */
function calculateGeminiBonus($: cheerio.CheerioAPI): number {
  let bonus = 0;

  // 이미지와 비디오 포함 여부 (10점)
  const images = $('img').length;
  const videos = $('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length;
  if (images >= 3 || videos > 0) bonus += 10;
  else if (images >= 1) bonus += 5;

  // 표와 리스트 구조 (8점)
  const tables = $('table').length;
  const lists = $('ul, ol').length;
  if (tables > 0 && lists >= 2) bonus += 8;
  else if (tables > 0 || lists >= 2) bonus += 4;

  // 구조화된 데이터 (Schema.org) (7점)
  const structuredData = $('script[type="application/ld+json"]').length;
  if (structuredData > 0) bonus += 7;

  // 다국어 메타데이터 (5점)
  const langAttr = $('html').attr('lang');
  const hasMultiLang = $('meta[property="og:locale:alternate"]').length > 0;
  if (langAttr || hasMultiLang) bonus += 5;

  return Math.min(30, bonus);
}

/**
 * Claude 인용 확률 보너스 계산
 * Claude는 상세한 설명, 긴 형식의 콘텐츠, 포괄적인 정보를 선호합니다.
 */
function calculateClaudeBonus($: cheerio.CheerioAPI): number {
  let bonus = 0;

  // 콘텐츠 길이 (10점)
  const text = $('body').text();
  const wordCount = text.split(/\s+/).length;
  if (wordCount >= 2000) bonus += 10;
  else if (wordCount >= 1000) bonus += 6;
  else if (wordCount >= 500) bonus += 3;

  // 섹션 수 (8점)
  const sections = $('section, article, [class*="section"], [class*="article"]').length;
  if (sections >= 5) bonus += 8;
  else if (sections >= 3) bonus += 4;

  // 상세한 설명 (7점)
  const paragraphs = $('p').length;
  if (paragraphs >= 10) bonus += 7;
  else if (paragraphs >= 5) bonus += 4;

  // 참고 자료와 인용 출처 (5점)
  const citations = $('*:contains("참고"), *:contains("출처"), *:contains("reference"), [class*="citation"]').length;
  if (citations > 0) bonus += 5;

  return Math.min(30, bonus);
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
  // 모든 모델에 동일하게 2개씩 반환
  return [
    '구조화된 데이터(JSON-LD)를 추가하여 AI가 콘텐츠를 더 잘 이해할 수 있도록 하세요',
    'FAQ 섹션을 추가하여 사용자의 질문에 직접적으로 답변할 수 있는 콘텐츠를 제공하세요',
  ];
}

function getPerplexityRecommendations(score: number): string[] {
  // 모든 모델에 동일하게 2개씩 반환
  return [
    '콘텐츠 업데이트 날짜를 명시하여 최신 정보임을 명확히 하세요',
    '출처 링크와 참고 자료를 추가하여 신뢰성을 높이세요',
  ];
}

function getGeminiRecommendations(score: number): string[] {
  // 모든 모델에 동일하게 2개씩 반환
  return [
    '이미지와 비디오를 추가하여 시각적 정보를 풍부하게 하세요',
    '표와 리스트를 활용하여 정보를 구조화하고 가독성을 높이세요',
  ];
}

function getClaudeRecommendations(score: number): string[] {
  // 모든 모델에 동일하게 2개씩 반환
  return [
    '콘텐츠를 더 상세하고 포괄적으로 작성하여 깊이 있는 정보를 제공하세요',
    '섹션을 추가하여 구조를 명확히 하고 독자가 쉽게 이해할 수 있도록 하세요',
  ];
}

