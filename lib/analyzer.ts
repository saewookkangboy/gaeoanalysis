import * as cheerio from 'cheerio';
import { calculateAIOCitationScores, generateAIOCitationAnalysis, AIOCitationAnalysis } from './ai-citation-analyzer';
import { calculateAIVisibilityScore, generateAIVisibilityRecommendations } from './ai-visibility-calculator';
import { extractCitationSources, CitationExtractionResult, calculateDomainStatistics, DomainStatistics } from './citation-extractor';
import { 
  calculateAllDomainAuthorities, 
  findCitationOpportunities, 
  detectQualityIssues
} from './citation-analyzer';
// Re-export types for Railway build compatibility
export type { 
  DomainAuthority, 
  CitationOpportunity, 
  QualityIssue 
} from './citation-analyzer';
import { SEO_GUIDELINES, getImprovementPriority, getContentWritingGuidelines } from './seo-guidelines';
import { withRetry } from './retry';
import { FRESHNESS_OPTIMIZATION, STATISTICS_QUOTATIONS_GUIDE, CONTENT_STRUCTURE_GUIDE } from './seo-guidelines-enhanced';
import { analyzeNaverBlogContent } from './naver-blog-analyzer';
import { detectBlogPlatform, getBlogPlatformName } from './blog-detector';
import { detectEcommercePage } from '@/lib/ecommerce-detector';
import { analyzeEcommerceProductPage } from '@/lib/ecommerce-product-analyzer';
import {
  calculateEnhancedSEOScore,
  calculateEnhancedAEOScore,
  calculateEnhancedGEOScore,
  normalizeScore,
  type TextContext as EnhancedTextContext,
} from './enhanced-scoring';
import {
  analyzeContentStructure,
  analyzeTrustSignals,
  analyzeInteractions,
  generateWebsiteInsights,
} from './content-depth-analyzer';

// Import types for use in this file
import type { DomainAuthority, CitationOpportunity, QualityIssue } from './citation-analyzer';

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
 * 공용 텍스트/단어 정보 캐시
 * - 같은 HTML에 대해 여러 번 body 텍스트를 계산하지 않도록 최적화
 */
interface TextContext {
  text: string;
  words: string[];
  wordCount: number;
}

function getTextContext($: cheerio.CheerioAPI): TextContext {
  const text = $('body').text();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  return { text, words, wordCount };
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

    // 블로그 플랫폼 감지는 HTML을 가져온 후 수행
    // (HTML이 필요하므로 여기서는 URL만 확인)

    // URL fetch (재시도 로직 포함, https 실패 시 http로 재시도)
    const html = await withRetry(
      async () => {
        // 타임아웃을 위한 AbortController 생성 (동적 콘텐츠를 위해 15초로 증가)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15초 타임아웃

        try {
          // 더 완전한 브라우저 헤더 설정
          const fetchUrl = async (targetUrl: string) => {
            const response = await fetch(targetUrl, {
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
                'Referer': targetUrl, // 일부 사이트에서 Referer 필요
              },
              signal: controller.signal,
              redirect: 'follow', // 리다이렉트 따라가기
            });
            return response;
          };

          let response = await fetchUrl(url);
          let lastError: Error | null = null;

          // https로 시도했지만 실패한 경우, http로 재시도
          if (!response.ok && url.startsWith('https://')) {
            const httpUrl = url.replace('https://', 'http://');
            console.log('⚠️ [Analyzer] HTTPS 접근 실패, HTTP로 재시도:', { 
              https: url, 
              http: httpUrl,
              status: response.status,
              statusText: response.statusText
            });
            try {
              response = await fetchUrl(httpUrl);
              console.log('✅ [Analyzer] HTTP 접근 성공:', { http: httpUrl, status: response.status });
            } catch (httpError) {
              // http도 실패하면 원본 에러 사용
              console.warn('⚠️ [Analyzer] HTTP 접근도 실패:', httpError);
              lastError = httpError instanceof Error ? httpError : new Error(String(httpError));
            }
          }

          // http로 시도했지만 실패한 경우, https로 재시도 (일부 사이트는 https만 지원)
          if (!response.ok && url.startsWith('http://') && !url.startsWith('https://')) {
            const httpsUrl = url.replace('http://', 'https://');
            console.log('⚠️ [Analyzer] HTTP 접근 실패, HTTPS로 재시도:', { 
              http: url, 
              https: httpsUrl,
              status: response.status,
              statusText: response.statusText
            });
            try {
              response = await fetchUrl(httpsUrl);
              console.log('✅ [Analyzer] HTTPS 접근 성공:', { https: httpsUrl, status: response.status });
            } catch (httpsError) {
              // https도 실패하면 원본 에러 사용
              console.warn('⚠️ [Analyzer] HTTPS 접근도 실패:', httpsError);
              lastError = httpsError instanceof Error ? httpsError : new Error(String(httpsError));
            }
          }

          clearTimeout(timeoutId);

          // 프리플라이트: Content-Type 검사 (HTML이 아닌 경우 조기 실패)
          const contentType = response.headers.get('content-type') || '';
          if (response.ok && contentType) {
            const isHtml =
              contentType.includes('text/html') ||
              contentType.includes('application/xhtml+xml');
            if (!isHtml) {
              throw new Error(
                `HTML 페이지가 아닙니다 (Content-Type: ${contentType}).\n\n해결 방법:\n1. 웹 페이지(HTML) URL을 입력했는지 확인해주세요\n2. PDF/이미지/문서 파일은 현재 지원하지 않습니다.`
              );
            }
          }

          if (!response.ok) {
            // 특정 상태 코드에 대한 더 나은 메시지
            if (response.status === 403) {
              throw new Error('접근이 거부되었습니다. 해당 사이트가 봇 접근을 차단하고 있을 수 있습니다.\n\n해결 방법:\n1. URL이 올바른지 확인해주세요\n2. 해당 사이트가 공개 접근을 허용하는지 확인해주세요\n3. 잠시 후 다시 시도해주세요');
            }
            if (response.status === 404) {
              throw new Error('페이지를 찾을 수 없습니다. URL이 올바른지 확인해주세요.\n\n해결 방법:\n1. URL의 철자와 경로를 확인해주세요\n2. 해당 페이지가 삭제되었거나 이동되었을 수 있습니다\n3. 사이트의 메인 페이지로 이동하여 올바른 URL을 찾아주세요');
            }
            if (response.status === 500 || response.status === 502 || response.status === 503) {
              throw new Error(`서버 오류가 발생했습니다 (${response.status}). 해당 사이트에 일시적인 문제가 있을 수 있습니다.\n\n해결 방법:\n1. 잠시 후 다시 시도해주세요\n2. 해당 사이트가 정상 작동하는지 확인해주세요`);
            }
            if (lastError) {
              throw lastError;
            }
            throw new Error(`URL 접근 실패: ${response.status} ${response.statusText}\n\n해결 방법:\n1. URL이 올바른지 확인해주세요\n2. 인터넷 연결을 확인해주세요\n3. 잠시 후 다시 시도해주세요`);
          }

          const html = await response.text();

          // HTML이 너무 큰 경우 (비정상적인 용량) - 보호 차원에서 제한
          if (html.length > 5_000_000) {
            throw new Error(
              '페이지 용량이 너무 커서 분석할 수 없습니다. (약 5MB 초과)\n\n해결 방법:\n1. 페이지를 섹션별로 나누어 분석해 주세요\n2. 불필요한 스크립트/콘텐츠를 줄여 페이지를 경량화해 주세요.'
            );
          }

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
    
    // 블로그 플랫폼 감지 (URL + HTML 종합 분석)
    const blogDetection = detectBlogPlatform(url, html);
    
    if (blogDetection.isBlog) {
      const platformName = getBlogPlatformName(blogDetection.platform.type);
      console.log(`📝 [Analyzer] ${platformName} 감지 - 전용 분석 모듈 사용`, {
        platform: blogDetection.platform.type,
        confidence: blogDetection.platform.confidence,
        reason: blogDetection.reason,
      });
      
      // 네이버 블로그인 경우 전용 분석 모듈 사용
      if (blogDetection.platform.type === 'naver') {
        console.log('✅ [Analyzer] 네이버 블로그 전용 분석 시작');
        const naverResult = await analyzeNaverBlogContent(html, url);
        
        // NaverBlogAnalysisResult를 AnalysisResult로 변환 (naverSpecific 제외)
        return {
          aeoScore: naverResult.aeoScore,
          geoScore: naverResult.geoScore,
          seoScore: naverResult.seoScore,
          overallScore: naverResult.overallScore,
          insights: naverResult.insights,
          aioAnalysis: naverResult.aioAnalysis,
          aiVisibilityScore: naverResult.aiVisibilityScore,
          aiVisibilityRecommendations: naverResult.aiVisibilityRecommendations,
          citationSources: naverResult.citationSources,
          domainStatistics: naverResult.domainStatistics,
          domainAuthorities: naverResult.domainAuthorities,
          citationOpportunities: naverResult.citationOpportunities,
          qualityIssues: naverResult.qualityIssues,
          improvementPriorities: naverResult.improvementPriorities,
          contentGuidelines: naverResult.contentGuidelines,
        };
      }
      
      // 향후 다른 블로그 플랫폼 지원 확장 가능
      // 현재는 네이버 블로그만 지원하므로, 다른 블로그는 일반 분석으로 진행
      console.log(`⚠️ [Analyzer] ${platformName}는 현재 네이버 블로그만 지원됩니다. 일반 분석으로 진행합니다.`);
    } else {
      console.log('✅ [Analyzer] 일반 사이트 감지 - 강화 분석 모듈 사용', {
        reason: blogDetection.reason,
      });
    }

    // 커머스 상품 페이지 감지
    const ecommerceDetection = detectEcommercePage(url, html);
    if (ecommerceDetection.isEcommerce) {
      console.log('🛒 [Analyzer] 커머스 상품 페이지 감지 - 전용 분석 모듈 사용', {
        platform: ecommerceDetection.detectedPlatform,
        confidence: ecommerceDetection.confidence,
        methods: ecommerceDetection.detectionMethods,
      });
      
      const ecommerceResult = await analyzeEcommerceProductPage(html, url);
      
      // EcommerceAnalysisResult를 AnalysisResult로 변환
      return {
        aeoScore: ecommerceResult.aeoScore,
        geoScore: ecommerceResult.geoScore,
        seoScore: ecommerceResult.seoScore,
        overallScore: ecommerceResult.overallScore,
        insights: ecommerceResult.insights,
        aioAnalysis: ecommerceResult.aioAnalysis,
        aiVisibilityScore: ecommerceResult.aiVisibilityScore,
        aiVisibilityRecommendations: ecommerceResult.aiVisibilityRecommendations,
        citationSources: ecommerceResult.citationSources,
        domainStatistics: ecommerceResult.domainStatistics,
        domainAuthorities: ecommerceResult.domainAuthorities,
        citationOpportunities: ecommerceResult.citationOpportunities,
        qualityIssues: ecommerceResult.qualityIssues,
        improvementPriorities: ecommerceResult.improvementPriorities,
        contentGuidelines: ecommerceResult.contentGuidelines,
      };
    }

    // HTML 파싱
    const $ = cheerio.load(html);

    // 공용 텍스트 컨텍스트 (여러 점수/인사이트에서 재사용)
    const textContext = getTextContext($);
    
    // 일반 사이트인지 확인 (블로그도 아니고 커머스도 아닌 경우)
    const isWebsite = !blogDetection.isBlog && !ecommerceDetection.isEcommerce;

    // === 1) 핵심 점수 계산 (필수 단계) ===
    let seoScore: number;
    let aeoScore: number;
    let geoScore: number;
    
    if (isWebsite) {
      // 일반 사이트: 강화된 점수 계산 사용
      console.log('📊 [Analyzer] 일반 사이트 강화 점수 계산 시작');
      const enhancedTextContext: EnhancedTextContext = {
        text: textContext.text,
        words: textContext.words,
        wordCount: textContext.wordCount,
      };
      
      const enhancedSEOScore = calculateEnhancedSEOScore($, url, { isWebsite: true });
      const enhancedAEOScore = calculateEnhancedAEOScore($, enhancedTextContext, { isWebsite: true });
      const enhancedGEOScore = calculateEnhancedGEOScore($, enhancedTextContext, { isWebsite: true });
      
      // 점수를 100점 기준으로 정규화 (기존 시스템과 호환)
      seoScore = normalizeScore(enhancedSEOScore, 120);
      aeoScore = normalizeScore(enhancedAEOScore, 130);
      geoScore = normalizeScore(enhancedGEOScore, 140);
      
      console.log('📊 [Analyzer] 강화 점수 계산 완료', {
        enhanced: { seo: enhancedSEOScore, aeo: enhancedAEOScore, geo: enhancedGEOScore },
        normalized: { seo: seoScore, aeo: aeoScore, geo: geoScore },
      });
    } else {
      // 블로그 또는 커머스: 기존 점수 계산 사용
      seoScore = calculateSEOScore($);
      aeoScore = calculateAEOScore($, textContext);
      geoScore = calculateGEOScore($, textContext);
    }

    const overallScore = Math.round((aeoScore + geoScore + seoScore) / 3);

    // 결과 객체를 점진적으로 구성 (Fail-soft 전략)
    const baseResult: AnalysisResult = {
      aeoScore,
      geoScore,
      seoScore,
      overallScore,
      insights: [],
    };

    // === 2) AIO / AI Visibility / 추천 (선택 단계) ===
    let aioAnalysis: AIOCitationAnalysis | undefined;
    let aiVisibilityScore: number | undefined;
    let aiVisibilityRecommendations: string[] | undefined;
    let contentGuidelines: string[] | undefined;
    let improvementPriorities:
      | Array<{
          category: string;
          priority: number;
          reason: string;
          actionableTips?: Array<{
            title: string;
            steps: string[];
            expectedImpact: string;
          }>;
        }>
      | undefined;

    try {
      // 일반 사이트인 경우 강화된 AIO 가중치 사용
      const aioScores = calculateAIOCitationScores($, aeoScore, geoScore, seoScore, undefined, isWebsite);
      aioAnalysis = generateAIOCitationAnalysis(aioScores);

      aiVisibilityScore = calculateAIVisibilityScore($, aioScores, aeoScore, geoScore, seoScore);

      const structuredDataText = $('script[type="application/ld+json"]').text();
      const hasStructuredData = $('script[type="application/ld+json"]').length > 0;
      const structuredDataScore = hasStructuredData
        ? structuredDataText.includes('FAQPage')
          ? 90
          : structuredDataText.includes('"Article"') || structuredDataText.includes('"BlogPosting"')
          ? 70
          : 50
        : 0;

      const qualityScore = Math.min(
        100,
        ((aeoScore + geoScore + seoScore) / 3) * 0.5 +
          (textContext.wordCount >= 2000
            ? 20
            : textContext.wordCount >= 1500
            ? 15
            : textContext.wordCount >= 1000
            ? 10
            : textContext.wordCount >= 500
            ? 5
            : 0) +
          (structuredDataText.includes('author') &&
          /자격|credential|전문가/i.test(textContext.text)
            ? 15
            : 0)
      );

      const hasDate = $('time, [datetime], [class*="date"]').length > 0;
      const hasRecentYear = /(202[4-9]|최근|recent|updated)/i.test(textContext.text);
      const freshnessScore =
        (hasDate ? 30 : 0) +
        (hasRecentYear ? 25 : 0) +
        (/업데이트|update/i.test(textContext.text) ? 20 : 0);

      aiVisibilityRecommendations = generateAIVisibilityRecommendations(
        aiVisibilityScore,
        aioScores,
        structuredDataScore,
        qualityScore,
        freshnessScore
      );

      // 인사이트 및 가이드라인 (이 단계에서 함께 생성)
      let insights = generateInsights($, aeoScore, geoScore, seoScore, textContext);
      
      // 일반 사이트인 경우 깊이 있는 콘텐츠 분석 추가
      if (isWebsite) {
        console.log('🔍 [Analyzer] 일반 사이트 깊이 있는 콘텐츠 분석 시작');
        try {
          const contentStructure = analyzeContentStructure($);
          const trustSignals = analyzeTrustSignals($, url);
          const interactions = analyzeInteractions($);
          
          // 일반 사이트 특화 인사이트 추가
          const websiteInsights = generateWebsiteInsights(contentStructure, trustSignals, interactions);
          insights = [...insights, ...websiteInsights];
          
          console.log('🔍 [Analyzer] 깊이 있는 콘텐츠 분석 완료', {
            structure: {
              hierarchyScore: contentStructure.hierarchy.hierarchyScore,
              sectionCount: contentStructure.sections.count,
              connectivity: contentStructure.sections.connectivity,
            },
            trust: {
              eaatOverall: trustSignals.eaat.overall,
              business: trustSignals.business,
              security: trustSignals.security,
            },
            interactions,
            additionalInsights: websiteInsights.length,
          });
        } catch (error) {
          console.warn('⚠️ [Analyzer] 깊이 있는 콘텐츠 분석 중 오류 (계속 진행):', error);
        }
      }
      
      baseResult.insights = insights;
      improvementPriorities = getImprovementPriority(aeoScore, geoScore, seoScore, insights);
      contentGuidelines = getContentWritingGuidelines(aeoScore, geoScore, seoScore);
    } catch (subError) {
      console.warn('⚠️ [Analyzer] AIO/AI Visibility/인사이트 계산 중 오류 (계속 진행):', subError);
      // 이 단계가 실패해도 나머지 분석은 계속 진행
    }

    // === 3) 인용/도메인/품질 이슈 (선택 단계) ===
    let citationSources: CitationExtractionResult | undefined;
    let domainStatistics: DomainStatistics[] | undefined;
    let domainAuthorities: DomainAuthority[] | undefined;
    let citationOpportunities: CitationOpportunity[] | undefined;
    let qualityIssues: QualityIssue[] | undefined;

    try {
      citationSources = extractCitationSources(html, url);

      let targetDomain = '';
      try {
        const targetUrlObj = new URL(url);
        targetDomain = targetUrlObj.hostname.replace('www.', '');
      } catch (error) {
        console.warn('⚠️ [Analyzer] 타겟 URL 파싱 실패:', error);
      }

      if (citationSources && citationSources.sources.length > 0) {
        domainStatistics = calculateDomainStatistics(citationSources.sources, targetDomain);
        domainAuthorities = calculateAllDomainAuthorities(citationSources.sources, domainStatistics);
        citationOpportunities = findCitationOpportunities(domainAuthorities, targetDomain);
        qualityIssues = detectQualityIssues(citationSources.sources);
      }
    } catch (subError) {
      console.warn('⚠️ [Analyzer] 인용/도메인/품질 이슈 계산 중 오류 (계속 진행):', subError);
      // 인용 관련 기능 실패 시 기본 점수/인사이트만 제공
    }

    return {
      ...baseResult,
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

function calculateAEOScore($: cheerio.CheerioAPI, textContext?: TextContext): number {
  let score = 0;
  const checks: { weight: number; passed: boolean }[] = [];
  const { text, wordCount } = textContext || getTextContext($);

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

function calculateGEOScore($: cheerio.CheerioAPI, textContext?: TextContext): number {
  let score = 0;
  const checks: { weight: number; passed: boolean }[] = [];
  const { text, wordCount } = textContext || getTextContext($);

  // 콘텐츠 길이 (20점) - ChatGPT 최적화: 1500-2500 words
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
  const words = (textContext?.words || text.split(/\s+/)).map(w => w.toLowerCase());
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

function generateInsights(
  $: cheerio.CheerioAPI,
  aeoScore: number,
  geoScore: number,
  seoScore: number,
  textContext?: TextContext
): Insight[] {
  const insights: Insight[] = [];
  const { text, wordCount } = textContext || getTextContext($);

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
    
    // 범용 블로그 이미지 개수 및 사이즈 체크
    const imageCount = images.length;
    if (imageCount < 2) {
      insights.push({
        severity: 'Medium',
        category: 'SEO',
        message: `이미지가 ${imageCount}개로 부족합니다. 최소 2개, 권장 3-5개 추가하세요. 본문 이미지는 800×600px 이상 권장입니다.`,
      });
    } else if (imageCount < 3) {
      insights.push({
        severity: 'Low',
        category: 'SEO',
        message: `이미지가 ${imageCount}개입니다. 권장 개수는 3-5개입니다. 본문 이미지는 800×600px 이상 권장입니다.`,
      });
    }
  }

  // AEO 인사이트
  if (aeoScore < 70) {
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

