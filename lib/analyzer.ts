import * as cheerio from 'cheerio';
import { calculateAIOCitationScores, generateAIOCitationAnalysis, AIOCitationAnalysis } from './ai-citation-analyzer';
import { SEO_GUIDELINES, getImprovementPriority, getContentWritingGuidelines } from './seo-guidelines';
import { withRetry } from './retry';

export interface AnalysisResult {
  aeoScore: number;
  geoScore: number;
  seoScore: number;
  overallScore: number;
  insights: Insight[];
  aioAnalysis?: AIOCitationAnalysis;
  improvementPriorities?: Array<{ category: string; priority: number; reason: string }>;
  contentGuidelines?: string[];
}

export interface Insight {
  severity: 'High' | 'Medium' | 'Low';
  category: string;
  message: string;
}

export async function analyzeContent(url: string): Promise<AnalysisResult> {
  try {
    // URL fetch (재시도 로직 포함)
    const html = await withRetry(
      async () => {
        // 타임아웃을 위한 AbortController 생성
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃

        try {
          // 더 완전한 브라우저 헤더 설정
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
              'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
              'Accept-Encoding': 'gzip, deflate, br',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1',
              'Sec-Fetch-Dest': 'document',
              'Sec-Fetch-Mode': 'navigate',
              'Sec-Fetch-Site': 'none',
              'Cache-Control': 'max-age=0',
            },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
          }

          return await response.text();
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      },
      {
        maxAttempts: 3,
        initialDelay: 1000,
        backoffMultiplier: 2,
      }
    );
    
    // HTML 파싱
    const $ = cheerio.load(html);

    // SEO 점수 계산
    const seoScore = calculateSEOScore($);
    
    // AEO 점수 계산
    const aeoScore = calculateAEOScore($);
    
    // GEO 점수 계산
    const geoScore = calculateGEOScore($);

    // 종합 점수
    const overallScore = Math.round((aeoScore + geoScore + seoScore) / 3);

    // 인사이트 생성
    const insights = generateInsights($, aeoScore, geoScore, seoScore);

    // AI 모델별 인용 확률 계산
    const aioScores = calculateAIOCitationScores($, aeoScore, geoScore, seoScore);
    const aioAnalysis = generateAIOCitationAnalysis(aioScores);

    // 개선 우선순위 및 콘텐츠 작성 가이드라인 생성
    const improvementPriorities = getImprovementPriority(aeoScore, geoScore, seoScore);
    const contentGuidelines = getContentWritingGuidelines(aeoScore, geoScore, seoScore);

    return {
      aeoScore,
      geoScore,
      seoScore,
      overallScore,
      insights,
      aioAnalysis,
      improvementPriorities,
      contentGuidelines,
    };
  } catch (error) {
    // 더 상세한 에러 메시지 제공
    if (error instanceof Error) {
      // 타임아웃 에러
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        throw new Error('요청 시간이 초과되었습니다. 네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요.');
      }
      // 네트워크 에러
      if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        throw new Error('URL에 접근할 수 없습니다. URL이 올바른지 확인하거나, 해당 사이트가 접근을 차단하고 있을 수 있습니다.');
      }
      // 기타 에러
      throw new Error(`분석 실패: ${error.message}`);
    }
    throw new Error('알 수 없는 오류가 발생했습니다.');
  }
}

function calculateSEOScore($: cheerio.CheerioAPI): number {
  let score = 0;
  const checks: { weight: number; passed: boolean }[] = [];

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

  checks.forEach(check => {
    if (check.passed) score += check.weight;
  });

  return Math.min(100, Math.max(0, score));
}

function calculateAEOScore($: cheerio.CheerioAPI): number {
  let score = 0;
  const checks: { weight: number; passed: boolean }[] = [];

  // 질문 형식의 콘텐츠 (20점)
  const text = $('body').text();
  const hasQuestions = /[?？]/.test(text) || /\b(what|how|why|when|where|who)\b/i.test(text);
  checks.push({ weight: 20, passed: hasQuestions });

  // FAQ 섹션 (15점)
  const hasFAQ = $('*:contains("FAQ"), *:contains("자주 묻는 질문"), [class*="faq"], [id*="faq"]').length > 0;
  checks.push({ weight: 15, passed: hasFAQ });

  // 명확한 답변 구조 (20점)
  const hasList = $('ul, ol').length > 0;
  const hasParagraphs = $('p').length > 3;
  checks.push({ weight: 20, passed: hasList && hasParagraphs });

  // 키워드 밀도 (10점)
  const wordCount = text.split(/\s+/).length;
  checks.push({ weight: 10, passed: wordCount >= 300 });

  // 구조화된 답변 (15점)
  const hasDefinitionList = $('dl').length > 0;
  const hasTable = $('table').length > 0;
  checks.push({ weight: 15, passed: hasDefinitionList || hasTable });

  // 콘텐츠 신선도 표시 (10점)
  const hasDate = /(202[4-9]|최근|recent|updated)/i.test(text);
  checks.push({ weight: 10, passed: hasDate });

  // 전문 용어 설명 (10점)
  const hasAbbr = $('abbr, dfn').length > 0;
  checks.push({ weight: 10, passed: hasAbbr });

  checks.forEach(check => {
    if (check.passed) score += check.weight;
  });

  return Math.min(100, Math.max(0, score));
}

function calculateGEOScore($: cheerio.CheerioAPI): number {
  let score = 0;
  const checks: { weight: number; passed: boolean }[] = [];

  // 콘텐츠 길이 (20점)
  const text = $('body').text();
  const wordCount = text.split(/\s+/).length;
  checks.push({ weight: 20, passed: wordCount >= 500 });

  // 다중 미디어 (15점)
  const hasImages = $('img').length > 0;
  const hasVideos = $('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length > 0;
  checks.push({ weight: 15, passed: hasImages || hasVideos });

  // 섹션 구조 (15점)
  const sections = $('section, article, [class*="section"], [class*="article"]').length;
  checks.push({ weight: 15, passed: sections > 0 });

  // 키워드 다양성 (15점)
  const words = text.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  const diversity = uniqueWords.size / words.length;
  checks.push({ weight: 15, passed: diversity > 0.3 });

  // 콘텐츠 업데이트 표시 (10점)
  const hasUpdateDate = $('time, [datetime], [class*="date"], [class*="updated"]').length > 0;
  checks.push({ weight: 10, passed: hasUpdateDate });

  // 소셜 공유 메타 (10점)
  const hasSocialMeta = $('meta[property^="og:"], meta[name^="twitter:"]').length > 0;
  checks.push({ weight: 10, passed: hasSocialMeta });

  // 구조화된 데이터 (15점)
  const structuredData = $('script[type="application/ld+json"]').length;
  checks.push({ weight: 15, passed: structuredData > 0 });

  checks.forEach(check => {
    if (check.passed) score += check.weight;
  });

  return Math.min(100, Math.max(0, score));
}

function generateInsights($: cheerio.CheerioAPI, aeoScore: number, geoScore: number, seoScore: number): Insight[] {
  const insights: Insight[] = [];
  const text = $('body').text();
  const wordCount = text.split(/\s+/).length;

  // SEO 인사이트 (강화)
  if (seoScore < 70) {
    const h1Count = $('h1').length;
    if (h1Count === 0) {
      insights.push({
        severity: 'High',
        category: 'SEO',
        message: 'H1 태그가 없습니다. 페이지에 단일 H1 태그를 추가하세요.',
      });
    } else if (h1Count > 1) {
      insights.push({
        severity: 'Medium',
        category: 'SEO',
        message: `H1 태그가 ${h1Count}개 있습니다. 하나만 사용하는 것이 좋습니다.`,
      });
    }

    const title = $('title').text().trim();
    if (!title) {
      insights.push({
        severity: 'High',
        category: 'SEO',
        message: 'Title 태그가 없습니다. 검색 엔진 최적화를 위해 Title을 추가하세요.',
      });
    } else if (title.length > 60) {
      insights.push({
        severity: 'Medium',
        category: 'SEO',
        message: `Title이 ${title.length}자로 너무 깁니다. 60자 이하로 줄이세요.`,
      });
    }

    const metaDesc = $('meta[name="description"]').attr('content') || '';
    if (!metaDesc) {
      insights.push({
        severity: 'High',
        category: 'SEO',
        message: 'Meta description이 없습니다. 검색 결과에 표시될 설명을 추가하세요.',
      });
    }

    const images = $('img');
    const imagesWithoutAlt = images.filter((_, el) => !$(el).attr('alt')).length;
    if (imagesWithoutAlt > 0) {
      insights.push({
        severity: imagesWithoutAlt === images.length ? 'High' : 'Medium',
        category: 'SEO',
        message: `${imagesWithoutAlt}개의 이미지에 Alt 텍스트가 없습니다. 접근성과 SEO를 위해 추가하세요.`,
      });
    }
  }

  // AEO 인사이트
  if (aeoScore < 70) {
    const text = $('body').text();
    const hasQuestions = /[?？]/.test(text);
    if (!hasQuestions) {
      insights.push({
        severity: 'Medium',
        category: 'AEO',
        message: '질문 형식의 콘텐츠가 부족합니다. 사용자가 묻는 질문을 포함하세요.',
      });
    }

    const hasFAQ = $('*:contains("FAQ"), *:contains("자주 묻는 질문")').length === 0;
    if (hasFAQ) {
      insights.push({
        severity: 'Low',
        category: 'AEO',
        message: 'FAQ 섹션을 추가하면 AI 검색 엔진에서 더 잘 인용됩니다.',
      });
    }

    const wordCount = text.split(/\s+/).length;
    if (wordCount < 300) {
      insights.push({
        severity: 'Medium',
        category: 'AEO',
        message: `콘텐츠가 너무 짧습니다 (${wordCount}단어). 최소 300단어 이상 권장합니다.`,
      });
    }
  }

  // GEO 인사이트
  if (geoScore < 70) {
    const text = $('body').text();
    const wordCount = text.split(/\s+/).length;
    if (wordCount < 500) {
      insights.push({
        severity: 'Medium',
        category: 'GEO',
        message: `콘텐츠 길이가 부족합니다 (${wordCount}단어). 생성형 검색 엔진을 위해 500단어 이상 권장합니다.`,
      });
    }

    const hasImages = $('img').length === 0;
    if (hasImages) {
      insights.push({
        severity: 'Low',
        category: 'GEO',
        message: '이미지나 비디오를 추가하면 콘텐츠의 품질이 향상됩니다.',
      });
    }

    const structuredData = $('script[type="application/ld+json"]').length;
    if (structuredData === 0) {
      insights.push({
        severity: 'Medium',
        category: 'GEO',
        message: '구조화된 데이터(JSON-LD)를 추가하면 AI 검색 엔진이 콘텐츠를 더 잘 이해합니다.',
      });
    }

    // Open Graph 태그 확인
    const ogTags = $('meta[property^="og:"]').length;
    if (ogTags < 3) {
      insights.push({
        severity: 'Medium',
        category: 'GEO',
        message: 'Open Graph 태그가 부족합니다. 소셜 미디어 공유 최적화를 위해 추가하세요.',
      });
    }
  }

  // AIO (통합 최적화) 인사이트 추가
  const structuredData = $('script[type="application/ld+json"]').length;
  const hasFAQ = $('*:contains("FAQ"), *:contains("자주 묻는 질문"), [class*="faq"], [id*="faq"]').length > 0;
  const hasRecentDate = /(202[4-9]|최근|recent|updated)/i.test(text);
  const hasImages = $('img').length > 0;
  const hasVideos = $('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length > 0;

  if (structuredData === 0) {
    insights.push({
      severity: 'High',
      category: 'AIO',
      message: '구조화된 데이터(JSON-LD)가 없습니다. 모든 AI 모델이 콘텐츠를 이해하기 위해 필수입니다.',
    });
  }

  if (!hasFAQ && (aeoScore < 80 || geoScore < 80)) {
    insights.push({
      severity: 'Medium',
      category: 'AIO',
      message: 'FAQ 섹션을 추가하면 ChatGPT, Perplexity 등 여러 AI 모델에서 더 잘 인용됩니다.',
    });
  }

  if (!hasRecentDate && wordCount > 500) {
    insights.push({
      severity: 'Low',
      category: 'AIO',
      message: '콘텐츠 업데이트 날짜를 명시하면 Perplexity 같은 실시간 정보 중심 AI에서 더 잘 인용됩니다.',
    });
  }

  if (!hasImages && !hasVideos && geoScore < 80) {
    insights.push({
      severity: 'Medium',
      category: 'AIO',
      message: '이미지나 비디오를 추가하면 Gemini 등 미디어 중심 AI 모델에서 더 잘 인용됩니다.',
    });
  }

  // 점수가 모두 높으면 긍정적 피드백
  if (aeoScore >= 80 && geoScore >= 80 && seoScore >= 80) {
    insights.push({
      severity: 'Low',
      category: '종합',
      message: '훌륭합니다! 콘텐츠가 AI 검색 엔진에 최적화되어 있습니다.',
    });
  }

  return insights;
}

