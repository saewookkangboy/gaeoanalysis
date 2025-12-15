import * as cheerio from 'cheerio';
import { calculateAIOCitationScores, generateAIOCitationAnalysis, AIOCitationAnalysis } from './ai-citation-analyzer';
import { calculateAIVisibilityScore, generateAIVisibilityRecommendations } from './ai-visibility-calculator';
import { extractCitationSources, CitationExtractionResult, calculateDomainStatistics, DomainStatistics } from './citation-extractor';
import { SEO_GUIDELINES, getImprovementPriority, getContentWritingGuidelines } from './seo-guidelines';
import { withRetry } from './retry';
import { FRESHNESS_OPTIMIZATION, STATISTICS_QUOTATIONS_GUIDE, CONTENT_STRUCTURE_GUIDE } from './seo-guidelines-enhanced';

export interface AnalysisResult {
  aeoScore: number;
  geoScore: number;
  seoScore: number;
  overallScore: number;
  insights: Insight[];
  aioAnalysis?: AIOCitationAnalysis;
  aiVisibilityScore?: number;
  aiVisibilityRecommendations?: string[];
  citationSources?: CitationExtractionResult;
  domainStatistics?: DomainStatistics[];
  domainAuthorities?: DomainAuthority[];
  citationOpportunities?: CitationOpportunity[];
  qualityIssues?: QualityIssue[];
  improvementPriorities?: Array<{ 
    category: string; 
    priority: number; 
    reason: string;
    actionableTips?: Array<{ title: string; steps: string[]; expectedImpact: string }>;
  }>;
  contentGuidelines?: string[];
}

export interface Insight {
  severity: 'High' | 'Medium' | 'Low';
  category: string;
  message: string;
}

/**
 * URL 유효성 검사 및 플랫폼별 안내 메시지 생성
 */
function validateAndGetPlatformMessage(url: string): { isValid: boolean; message?: string } {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // 네이버 블로그 검증
    if (hostname.includes('blog.naver.com')) {
      // PostView.naver?blogId= 형식은 리스트 페이지
      if (urlObj.pathname === '/PostView.naver' && urlObj.searchParams.has('blogId') && !urlObj.searchParams.has('logNo')) {
        return {
          isValid: false,
          message: '네이버 블로그 리스트 페이지입니다. 분석하려면 특정 게시물 URL을 입력해주세요.\n\n올바른 형식: https://blog.naver.com/[블로그ID]/[게시물번호]\n예시: https://blog.naver.com/example/123456789'
        };
      }
      // blogId만 있고 logNo가 없는 경우
      if (urlObj.pathname.includes('/PostView.naver') && !urlObj.searchParams.has('logNo')) {
        return {
          isValid: false,
          message: '네이버 블로그 게시물 번호(logNo)가 필요합니다.\n\n올바른 형식: https://blog.naver.com/[블로그ID]/[게시물번호]\n또는 https://blog.naver.com/PostView.naver?blogId=[블로그ID]&logNo=[게시물번호]'
        };
      }
    }
    
    // 브런치 검증
    if (hostname.includes('brunch.co.kr')) {
      // 사용자 프로필 페이지 (특정 게시물이 아닌 경우)
      if (urlObj.pathname.match(/^\/@[\w-]+\/?$/) && !urlObj.pathname.match(/\/\d+$/)) {
        return {
          isValid: false,
          message: '브런치 사용자 프로필 페이지입니다. 분석하려면 특정 게시물 URL을 입력해주세요.\n\n올바른 형식: https://brunch.co.kr/@[사용자명]/[게시물번호]\n예시: https://brunch.co.kr/@example/123'
        };
      }
    }
    
    return { isValid: true };
  } catch {
    return { isValid: true }; // URL 파싱 실패는 다른 곳에서 처리
  }
}

export async function analyzeContent(url: string): Promise<AnalysisResult> {
  try {
    // URL 유효성 검사
    const validation = validateAndGetPlatformMessage(url);
    if (!validation.isValid && validation.message) {
      throw new Error(validation.message);
    }

    // URL fetch (재시도 로직 포함)
    const html = await withRetry(
      async () => {
        // 타임아웃을 위한 AbortController 생성 (동적 콘텐츠를 위해 15초로 증가)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15초 타임아웃

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
              'Referer': url, // 일부 사이트에서 Referer 필요
            },
            signal: controller.signal,
            redirect: 'follow', // 리다이렉트 따라가기
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            // 특정 상태 코드에 대한 더 나은 메시지
            if (response.status === 403) {
              throw new Error('접근이 거부되었습니다. 해당 사이트가 봇 접근을 차단하고 있을 수 있습니다.');
            }
            if (response.status === 404) {
              throw new Error('페이지를 찾을 수 없습니다. URL이 올바른지 확인해주세요.');
            }
            throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
          }

          const html = await response.text();
          
          // HTML이 비어있거나 너무 짧은 경우 (JavaScript로 동적 로드되는 경우)
          if (html.length < 500) {
            const urlObj = new URL(url);
            if (urlObj.hostname.includes('blog.naver.com') || urlObj.hostname.includes('brunch.co.kr')) {
              throw new Error('콘텐츠를 불러올 수 없습니다. 네이버 블로그와 브런치는 JavaScript로 동적 콘텐츠를 로드하므로, 서버에서 직접 분석이 어려울 수 있습니다.\n\n해결 방법:\n1. 게시물의 전체 URL을 확인해주세요 (특정 게시물 페이지)\n2. 게시물을 공개 상태로 설정해주세요\n3. 다른 플랫폼(티스토리, 워드프레스 등)을 사용해보세요');
            }
          }

          return html;
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

    // AI 모델별 인용 확률 계산
    const aioScores = calculateAIOCitationScores($, aeoScore, geoScore, seoScore);
    const aioAnalysis = generateAIOCitationAnalysis(aioScores);

    // AI Visibility 점수 계산
    const aiVisibilityScore = calculateAIVisibilityScore($, aioScores, aeoScore, geoScore, seoScore);
    
    // 구조화된 데이터 점수 계산 (추천사항 생성용)
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
      console.warn('⚠️ [Analyzer] 타겟 URL 파싱 실패:', error);
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

    // 인사이트 생성 (개선 우선순위에 사용)
    const insights = generateInsights($, aeoScore, geoScore, seoScore);

    // 개선 우선순위 및 콘텐츠 작성 가이드라인 생성 (insights 기반)
    const improvementPriorities = getImprovementPriority(aeoScore, geoScore, seoScore, insights);
    const contentGuidelines = getContentWritingGuidelines(aeoScore, geoScore, seoScore);

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
    };
  } catch (error) {
    // 더 상세한 에러 메시지 제공
    if (error instanceof Error) {
      // 플랫폼별 안내 메시지가 이미 포함된 경우 그대로 전달
      if (error.message.includes('네이버 블로그') || error.message.includes('브런치') || error.message.includes('해결 방법')) {
        throw error;
      }
      
      // 타임아웃 에러
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        const urlObj = new URL(url);
        if (urlObj.hostname.includes('blog.naver.com') || urlObj.hostname.includes('brunch.co.kr')) {
          throw new Error('요청 시간이 초과되었습니다. 네이버 블로그와 브런치는 JavaScript로 동적 콘텐츠를 로드하므로 분석이 어려울 수 있습니다.\n\n해결 방법:\n1. 특정 게시물의 전체 URL을 사용해주세요\n2. 게시물이 공개 상태인지 확인해주세요\n3. 잠시 후 다시 시도해주세요');
        }
        throw new Error('요청 시간이 초과되었습니다. 네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요.');
      }
      
      // 네트워크 에러
      if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        const urlObj = new URL(url);
        let platformMessage = '';
        if (urlObj.hostname.includes('blog.naver.com')) {
          platformMessage = '\n\n네이버 블로그의 경우:\n- 특정 게시물 URL을 사용해주세요 (리스트 페이지가 아닌)\n- 게시물이 공개 상태인지 확인해주세요';
        } else if (urlObj.hostname.includes('brunch.co.kr')) {
          platformMessage = '\n\n브런치의 경우:\n- 특정 게시물 URL을 사용해주세요 (프로필 페이지가 아닌)\n- 게시물이 공개 상태인지 확인해주세요';
        }
        throw new Error(`URL에 접근할 수 없습니다. URL이 올바른지 확인하거나, 해당 사이트가 접근을 차단하고 있을 수 있습니다.${platformMessage}`);
      }
      
      // 접근 거부 에러
      if (error.message.includes('접근이 거부') || error.message.includes('403')) {
        throw new Error('접근이 거부되었습니다. 해당 사이트가 봇 접근을 차단하고 있을 수 있습니다.\n\n해결 방법:\n1. 게시물이 공개 상태인지 확인해주세요\n2. 다른 플랫폼을 사용해보세요');
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
  const text = $('body').text();

  // 질문 형식의 콘텐츠 (20점) - 강화
  const hasQuestions = /[?？]/.test(text) || /\b(what|how|why|when|where|who|어떻게|왜|언제|어디서|누가)\b/i.test(text);
  checks.push({ weight: 20, passed: hasQuestions });

  // FAQ 섹션 (15점) - FAQPage 스키마 포함
  const hasFAQ = $('*:contains("FAQ"), *:contains("자주 묻는 질문"), [class*="faq"], [id*="faq"]').length > 0;
  const hasFAQSchema = $('script[type="application/ld+json"]').text().includes('FAQPage');
  checks.push({ weight: 15, passed: hasFAQ || hasFAQSchema });

  // 명확한 답변 구조 (20점) - H2→H3→bullets 구조 강조
  const hasH2 = $('h2').length > 0;
  const hasH3 = $('h3').length > 0;
  const hasList = $('ul, ol').length > 0;
  const hasParagraphs = $('p').length > 3;
  const hasH2H3Bullets = hasH2 && hasH3 && hasList; // H2→H3→bullets 구조 (40% more citations)
  checks.push({ weight: 20, passed: hasH2H3Bullets || (hasList && hasParagraphs) });

  // 키워드 밀도 (10점)
  const wordCount = text.split(/\s+/).length;
  checks.push({ weight: 10, passed: wordCount >= 300 });

  // 구조화된 답변 (15점)
  const hasDefinitionList = $('dl').length > 0;
  const hasTable = $('table').length > 0;
  checks.push({ weight: 15, passed: hasDefinitionList || hasTable });

  // 콘텐츠 신선도 표시 (10점) - 강화 (30일 이내 업데이트: 3.2x citations)
  const hasDate = $('time, [datetime], [class*="date"], [class*="updated"]').length > 0;
  const hasRecentYear = /(202[4-9]|최근|recent|updated|latest)/i.test(text);
  const isFresh = hasDate || hasRecentYear;
  checks.push({ weight: 10, passed: isFresh });

  // 전문 용어 설명 (10점)
  const hasAbbr = $('abbr, dfn').length > 0;
  checks.push({ weight: 10, passed: hasAbbr });

  // 통계 및 인용 추가 (+41% statistics, +28% quotations)
  const hasStatistics = /\d+%|\d+\.\d+%|통계|statistics|연구|study/i.test(text);
  const hasQuotations = /["'"]|인용|quotation|citation|출처/i.test(text);
  if (hasStatistics) score += 5; // 통계 포함 보너스
  if (hasQuotations) score += 3; // 인용 포함 보너스

  checks.forEach(check => {
    if (check.passed) score += check.weight;
  });

  return Math.min(100, Math.max(0, score));
}

function calculateGEOScore($: cheerio.CheerioAPI): number {
  let score = 0;
  const checks: { weight: number; passed: boolean }[] = [];
  const text = $('body').text();

  // 콘텐츠 길이 (20점) - ChatGPT 최적화: 1500-2500 words
  const wordCount = text.split(/\s+/).length;
  if (wordCount >= 2000) {
    score += 20; // 최적 (2000+ words)
  } else if (wordCount >= 1500) {
    score += 18; // 양호 (1500-1999 words)
  } else if (wordCount >= 1000) {
    score += 15; // 보통 (1000-1499 words)
  } else if (wordCount >= 500) {
    score += 10; // 최소 (500-999 words)
  }

  // 다중 미디어 (15점) - Gemini 최적화
  const images = $('img').length;
  const videos = $('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length;
  if (images >= 3 || videos > 0) {
    score += 15; // 최적
  } else if (images >= 1) {
    score += 10; // 양호
  }

  // 섹션 구조 (15점) - H2→H3→bullets 구조 강조
  const sections = $('section, article, [class*="section"], [class*="article"]').length;
  const hasH2 = $('h2').length > 0;
  const hasH3 = $('h3').length > 0;
  const hasBullets = $('ul, ol').length > 0;
  const hasH2H3Bullets = hasH2 && hasH3 && hasBullets; // 40% more citations
  if (hasH2H3Bullets) {
    score += 15; // 최적 구조
  } else if (sections > 0 || hasH2) {
    score += 10; // 기본 구조
  }

  // 키워드 다양성 (15점)
  const words = text.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  const diversity = uniqueWords.size / words.length;
  checks.push({ weight: 15, passed: diversity > 0.3 });

  // 콘텐츠 업데이트 표시 (10점) - 신선도 강화 (30일 이내: 3.2x citations)
  const hasUpdateDate = $('time, [datetime], [class*="date"], [class*="updated"]').length > 0;
  const hasRecentYear = /(202[4-9]|최근|recent|updated|latest)/i.test(text);
  if (hasUpdateDate && hasRecentYear) {
    score += 10; // 최신 정보 명시
  } else if (hasUpdateDate || hasRecentYear) {
    score += 7; // 부분적 표시
  }

  // 소셜 공유 메타 (10점) - Open Graph, Twitter Cards
  const ogTags = $('meta[property^="og:"]').length;
  const twitterTags = $('meta[name^="twitter:"]').length;
  if (ogTags >= 3 && twitterTags >= 2) {
    score += 10; // 완전한 설정
  } else if (ogTags > 0 || twitterTags > 0) {
    score += 6; // 부분적 설정
  }

  // 구조화된 데이터 (15점) - 다양한 스키마 타입
  const structuredData = $('script[type="application/ld+json"]').length;
  const structuredDataText = $('script[type="application/ld+json"]').text();
  const hasFAQSchema = structuredDataText.includes('FAQPage');
  const hasArticleSchema = structuredDataText.includes('"Article"') || structuredDataText.includes('"BlogPosting"');
  const hasHowToSchema = structuredDataText.includes('HowTo');
  if (structuredData > 0 && (hasFAQSchema || hasArticleSchema || hasHowToSchema)) {
    score += 15; // 최적 (FAQPage는 highest citation probability)
  } else if (structuredData > 0) {
    score += 10; // 기본 구조화된 데이터
  }

  // 음성 검색 최적화 보너스 (Speakable schema, Featured snippet)
  const hasSpeakable = structuredDataText.includes('Speakable');
  const hasFeaturedSnippet = $('h2').length > 0 && text.length < 200; // 짧은 답변 형식
  if (hasSpeakable || hasFeaturedSnippet) {
    score += 5; // 음성 검색 최적화 보너스
  }

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

