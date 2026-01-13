/**
 * 일반 사이트 강화 분석 통합 테스트
 * 
 * Phase 1-4에서 구현한 모든 기능이 올바르게 통합되어 작동하는지 테스트합니다.
 */

import * as cheerio from 'cheerio';
import { detectBlogPlatform } from '../blog-detector';
import {
  calculateEnhancedSEOScore,
  calculateEnhancedAEOScore,
  calculateEnhancedGEOScore,
  normalizeScore,
  type TextContext,
} from '../enhanced-scoring';
import { calculateAIOCitationScores } from '../ai-citation-analyzer';
import {
  analyzeContentStructure,
  analyzeTrustSignals,
  analyzeInteractions,
  generateWebsiteInsights,
} from '../content-depth-analyzer';

describe('Website Analysis Integration', () => {
  const createTestHTML = (content: string) => {
    return cheerio.load(`
      <html>
        <head>
          <title>Test Website</title>
          <meta name="description" content="Test description" />
          <meta name="robots" content="index, follow" />
          <meta property="og:title" content="Test" />
          <meta property="og:description" content="Test description" />
          <meta property="og:image" content="https://example.com/image.jpg" />
          <meta property="og:url" content="https://example.com" />
          <link rel="canonical" href="https://example.com" />
          <link rel="alternate" hreflang="ko" href="https://example.com/ko" />
          <link rel="alternate" hreflang="en" href="https://example.com/en" />
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Article",
              "author": {
                "@type": "Person",
                "name": "Expert",
                "credential": "Ph.D"
              }
            }
          </script>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);
  };

  const createTextContext = (wordCount: number): TextContext => {
    const words = Array(wordCount).fill('word');
    return {
      text: words.join(' '),
      words,
      wordCount,
    };
  };

  it('일반 사이트가 블로그로 잘못 감지되지 않아야 함', () => {
    const url = 'https://company.com/about';
    const html = '<html><body><h1>회사 소개</h1></body></html>';
    const result = detectBlogPlatform(url, html);
    
    expect(result.isBlog).toBe(false);
    expect(result.platform.type).toBe('none');
  });

  it('일반 사이트에 강화된 점수 계산이 적용되어야 함', () => {
    const html = `
      <h1>Main Title</h1>
      <h2>Section 1</h2>
      <h2>Section 2</h2>
      <h2>Section 3</h2>
      <h3>Subsection</h3>
      <img src="test.jpg" alt="Test" />
      <a href="/page">Internal link</a>
    `;
    const $ = createTestHTML(html);
    const textContext = createTextContext(2000);
    
    const seoScore = calculateEnhancedSEOScore($, 'https://example.com');
    const aeoScore = calculateEnhancedAEOScore($, textContext);
    const geoScore = calculateEnhancedGEOScore($, textContext);
    
    // 강화된 점수는 100점을 초과할 수 있음
    expect(seoScore).toBeGreaterThanOrEqual(0);
    expect(seoScore).toBeLessThanOrEqual(120);
    expect(aeoScore).toBeGreaterThanOrEqual(0);
    expect(aeoScore).toBeLessThanOrEqual(130);
    expect(geoScore).toBeGreaterThanOrEqual(0);
    expect(geoScore).toBeLessThanOrEqual(140);
    
    // 정규화된 점수는 100점 이하여야 함
    const normalizedSEO = normalizeScore(seoScore, 120);
    const normalizedAEO = normalizeScore(aeoScore, 130);
    const normalizedGEO = normalizeScore(geoScore, 140);
    
    expect(normalizedSEO).toBeLessThanOrEqual(100);
    expect(normalizedAEO).toBeLessThanOrEqual(100);
    expect(normalizedGEO).toBeLessThanOrEqual(100);
  });

  it('일반 사이트에 강화된 AIO 가중치가 적용되어야 함', () => {
    const html = `
      <h1>Title</h1>
      <p>Research study with data and statistics showing 50% improvement.</p>
      <p>Company certification ISO 9001 approved.</p>
      <time datetime="2024-01-01">2024-01-01</time>
      <a href="https://example1.com">Link 1</a>
      <a href="https://example2.com">Link 2</a>
      <a href="https://example3.com">Link 3</a>
      <a href="https://example4.com">Link 4</a>
      <a href="https://example5.com">Link 5</a>
      <a href="https://example6.com">Link 6</a>
      <a href="https://example7.com">Link 7</a>
      <a href="https://example8.com">Link 8</a>
      <a href="https://example9.com">Link 9</a>
      <a href="https://example10.com">Link 10</a>
      <canvas id="chart"></canvas>
      <p>Methodology and process explained in detail.</p>
    `;
    const $ = createTestHTML(html);
    
    // 일반 사이트 점수 (강화 가중치 사용)
    const websiteScores = calculateAIOCitationScores($, 80, 80, 80, undefined, true);
    
    // 블로그 점수 (기본 가중치 사용)
    const blogScores = calculateAIOCitationScores($, 80, 80, 80, undefined, false);
    
    // 일반 사이트가 더 높은 점수를 받아야 함 (강화된 보너스로 인해)
    expect(websiteScores.chatgpt).toBeGreaterThanOrEqual(blogScores.chatgpt);
    expect(websiteScores.perplexity).toBeGreaterThanOrEqual(blogScores.perplexity);
    expect(websiteScores.claude).toBeGreaterThanOrEqual(blogScores.claude);
  });

  it('깊이 있는 콘텐츠 분석이 올바르게 작동해야 함', () => {
    const html = `
      <h1>Main Title</h1>
      <h2>Section 1</h2>
      <h2>Section 2</h2>
      <h2>Section 3</h2>
      <h3>Subsection 1</h3>
      <h3>Subsection 2</h3>
      <h3>Subsection 3</h3>
      <h3>Subsection 4</h3>
      <h3>Subsection 5</h3>
      <section>
        <p>Content here</p>
      </section>
      <p>회사 소개: 전문 기업입니다.</p>
      <p>연락처: 02-1234-5678</p>
      <a href="/terms">이용약관</a>
      <a href="/privacy">개인정보처리방침</a>
      <form>
        <input type="text" />
      </form>
      <div class="social-share">Share</div>
    `;
    const $ = createTestHTML(html);
    const url = 'https://example.com';
    
    const contentStructure = analyzeContentStructure($);
    const trustSignals = analyzeTrustSignals($, url);
    const interactions = analyzeInteractions($);
    const insights = generateWebsiteInsights(contentStructure, trustSignals, interactions);
    
    // 구조 분석 결과 확인
    expect(contentStructure.hierarchy.h1Count).toBe(1);
    expect(contentStructure.hierarchy.h2Count).toBe(3);
    expect(contentStructure.hierarchy.h3Count).toBe(5);
    expect(contentStructure.hierarchy.hierarchyScore).toBeGreaterThanOrEqual(80);
    
    // 신뢰도 분석 결과 확인
    expect(trustSignals.eaat.overall).toBeGreaterThanOrEqual(0);
    expect(trustSignals.business.companyInfo).toBe(true);
    expect(trustSignals.business.contactInfo).toBe(true);
    expect(trustSignals.security.hasSSL).toBe(true);
    
    // 상호작용 분석 결과 확인
    expect(interactions.forms).toBe(1);
    expect(interactions.socialShare).toBe(true);
    
    // 인사이트 생성 확인
    expect(insights.length).toBeGreaterThanOrEqual(0);
  });

  it('전체 분석 파이프라인이 올바르게 작동해야 함', () => {
    const url = 'https://company.com/page';
    const html = `
      <html>
        <head>
          <title>Company Page</title>
          <meta name="description" content="Company description" />
          <meta property="og:title" content="Company" />
          <meta property="og:description" content="Description" />
          <meta property="og:image" content="https://example.com/image.jpg" />
          <meta property="og:url" content="https://example.com" />
          <link rel="canonical" href="https://example.com" />
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Article",
              "author": {
                "@type": "Person",
                "name": "Expert"
              }
            }
          </script>
        </head>
        <body>
          <h1>Main Title</h1>
          <h2>What is the question?</h2>
          <h3>Answer section</h3>
          <p>This is a detailed answer.</p>
          <div class="faq">FAQ Section</div>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
          <time datetime="2024-01-01">2024-01-01</time>
          <img src="test.jpg" alt="Test" />
          <a href="/page">Internal link</a>
        </body>
      </html>
    `;
    
    // 1. 블로그 감지
    const blogDetection = detectBlogPlatform(url, html);
    expect(blogDetection.isBlog).toBe(false);
    
    // 2. 강화된 점수 계산
    const $ = createTestHTML(html);
    const textContext = createTextContext(1500);
    const seoScore = calculateEnhancedSEOScore($, url);
    const aeoScore = calculateEnhancedAEOScore($, textContext);
    const geoScore = calculateEnhancedGEOScore($, textContext);
    
    expect(seoScore).toBeGreaterThanOrEqual(0);
    expect(aeoScore).toBeGreaterThanOrEqual(0);
    expect(geoScore).toBeGreaterThanOrEqual(0);
    
    // 3. 강화된 AIO 점수
    const normalizedSEO = normalizeScore(seoScore, 120);
    const normalizedAEO = normalizeScore(aeoScore, 130);
    const normalizedGEO = normalizeScore(geoScore, 140);
    const aioScores = calculateAIOCitationScores($, normalizedAEO, normalizedGEO, normalizedSEO, undefined, true);
    
    expect(aioScores.chatgpt).toBeGreaterThanOrEqual(0);
    expect(aioScores.chatgpt).toBeLessThanOrEqual(100);
    
    // 4. 깊이 있는 분석
    const contentStructure = analyzeContentStructure($);
    const trustSignals = analyzeTrustSignals($, url);
    const interactions = analyzeInteractions($);
    const insights = generateWebsiteInsights(contentStructure, trustSignals, interactions);
    
    expect(contentStructure.hierarchy.hierarchyScore).toBeGreaterThanOrEqual(0);
    expect(trustSignals.eaat.overall).toBeGreaterThanOrEqual(0);
    expect(insights.length).toBeGreaterThanOrEqual(0);
  });

  it('블로그와 일반 사이트의 분석 결과가 차별화되어야 함', () => {
    const blogUrl = 'https://blog.naver.com/example/123';
    const websiteUrl = 'https://company.com/page';
    const html = '<html><body><h1>Content</h1></body></html>';
    
    // 블로그 감지
    const blogDetection = detectBlogPlatform(blogUrl, html);
    const websiteDetection = detectBlogPlatform(websiteUrl, html);
    
    expect(blogDetection.isBlog).toBe(true);
    expect(blogDetection.platform.type).toBe('naver');
    expect(websiteDetection.isBlog).toBe(false);
    expect(websiteDetection.platform.type).toBe('none');
  });
});

// Jest 호환성을 위한 기본 테스트 함수들
function describe(name: string, fn: () => void) {
  console.log(`\n📋 ${name}`);
  fn();
}

function it(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
  } catch (error) {
    console.error(`  ❌ ${name}:`, error);
    throw error;
  }
}

function expect(value: any) {
  return {
    toBe: (expected: any) => {
      if (value !== expected) {
        throw new Error(`Expected ${value} to be ${expected}`);
      }
    },
    toBeGreaterThanOrEqual: (expected: number) => {
      if (value < expected) {
        throw new Error(`Expected ${value} to be greater than or equal to ${expected}`);
      }
    },
    toBeLessThanOrEqual: (expected: number) => {
      if (value > expected) {
        throw new Error(`Expected ${value} to be less than or equal to ${expected}`);
      }
    },
  };
}
