/**
 * 깊이 있는 콘텐츠 분석 모듈 테스트
 * 
 * 콘텐츠 구조, E-E-A-T 신호, 비즈니스 신뢰도, 상호작용 요소 분석이 올바르게 작동하는지 테스트합니다.
 */

import * as cheerio from 'cheerio';
import {
  analyzeContentStructure,
  analyzeTrustSignals,
  analyzeInteractions,
  generateWebsiteInsights,
} from '../content-depth-analyzer';
import type { Insight } from '../analyzer';

describe('Content Depth Analyzer', () => {
  describe('analyzeContentStructure', () => {
    it('올바른 계층 구조를 분석해야 함', () => {
      const html = `
        <html>
          <body>
            <h1>Main Title</h1>
            <h2>Section 1</h2>
            <h2>Section 2</h2>
            <h2>Section 3</h2>
            <h3>Subsection 1</h3>
            <h3>Subsection 2</h3>
            <h3>Subsection 3</h3>
            <h3>Subsection 4</h3>
            <h3>Subsection 5</h3>
            <h4>Detail</h4>
            <section>
              <p>Content here</p>
            </section>
            <a href="/page1">Internal link</a>
            <a href="/page2">Internal link 2</a>
            <a href="https://external.com">External link</a>
          </body>
        </html>
      `;
      const $ = cheerio.load(html);
      const result = analyzeContentStructure($);
      
      expect(result.hierarchy.h1Count).toBe(1);
      expect(result.hierarchy.h2Count).toBe(3);
      expect(result.hierarchy.h3Count).toBe(5);
      expect(result.hierarchy.h4Count).toBe(1);
      expect(result.hierarchy.hierarchyScore).toBeGreaterThanOrEqual(80);
      expect(result.sections.count).toBeGreaterThanOrEqual(1);
      expect(result.sections.connectivity).toBeGreaterThanOrEqual(0);
    });

    it('콘텐츠 타입을 올바르게 감지해야 함', () => {
      const html = `
        <html>
          <body>
            <h1>Guide Title</h1>
            <p>This is a tutorial guide on how to do something.</p>
            <p>Compare option A vs option B.</p>
            <div class="faq">FAQ Section</div>
          </body>
        </html>
      `;
      const $ = cheerio.load(html);
      const result = analyzeContentStructure($);
      
      expect(result.contentTypes.guide).toBe(true);
      expect(result.contentTypes.comparison).toBe(true);
      expect(result.contentTypes.faq).toBe(true);
    });
  });

  describe('analyzeTrustSignals', () => {
    it('E-E-A-T 신호를 올바르게 분석해야 함', () => {
      const html = `
        <html>
          <head>
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
            <p>Experience with actual use cases and test results.</p>
            <p>Research paper citation from pubmed.</p>
            <p>Award winning company.</p>
            <time datetime="2024-01-01">2024-01-01</time>
          </body>
        </html>
      `;
      const $ = cheerio.load(html);
      const url = 'https://example.com';
      const result = analyzeTrustSignals($, url);
      
      expect(result.eaat.experience).toBeGreaterThanOrEqual(50);
      expect(result.eaat.expertise).toBeGreaterThanOrEqual(50);
      expect(result.eaat.authoritativeness).toBeGreaterThanOrEqual(40);
      expect(result.eaat.trustworthiness).toBeGreaterThanOrEqual(30);
      expect(result.eaat.overall).toBeGreaterThanOrEqual(40);
    });

    it('비즈니스 신호를 올바르게 감지해야 함', () => {
      const html = `
        <html>
          <body>
            <p>회사 소개: 우리는 전문 기업입니다.</p>
            <p>연락처: 02-1234-5678, email@example.com</p>
            <p>주소: 서울시 강남구</p>
            <a href="/terms">이용약관</a>
            <a href="/privacy">개인정보처리방침</a>
            <p>ISO 9001 인증</p>
            <div class="review">고객 후기</div>
          </body>
        </html>
      `;
      const $ = cheerio.load(html);
      const url = 'https://example.com';
      const result = analyzeTrustSignals($, url);
      
      expect(result.business.companyInfo).toBe(true);
      expect(result.business.contactInfo).toBe(true);
      expect(result.business.legalPages).toBe(true);
      expect(result.business.certifications).toBe(true);
      expect(result.business.reviews).toBe(true);
    });

    it('보안 신호를 올바르게 감지해야 함', () => {
      const httpsUrl = 'https://example.com';
      const httpUrl = 'http://example.com';
      
      const html = `
        <html>
          <body>
            <div class="security-badge">Secure</div>
            <a href="/privacy">개인정보처리방침</a>
          </body>
        </html>
      `;
      const $ = cheerio.load(html);
      
      const httpsResult = analyzeTrustSignals($, httpsUrl);
      const httpResult = analyzeTrustSignals($, httpUrl);
      
      expect(httpsResult.security.hasSSL).toBe(true);
      expect(httpResult.security.hasSSL).toBe(false);
      expect(httpsResult.security.hasSecurityBadge).toBe(true);
      expect(httpsResult.security.hasPrivacyPolicy).toBe(true);
    });
  });

  describe('analyzeInteractions', () => {
    it('상호작용 요소를 올바르게 분석해야 함', () => {
      const html = `
        <html>
          <body>
            <form>
              <input type="text" />
            </form>
            <div class="calculator">Calculator</div>
            <div id="comment-section">Comments</div>
            <div class="social-share">Share</div>
            <div class="newsletter-subscribe">Subscribe</div>
          </body>
        </html>
      `;
      const $ = cheerio.load(html);
      const result = analyzeInteractions($);
      
      expect(result.forms).toBe(1);
      expect(result.calculators).toBeGreaterThanOrEqual(1);
      expect(result.comments).toBe(true);
      expect(result.socialShare).toBe(true);
      expect(result.subscription).toBe(true);
    });
  });

  describe('generateWebsiteInsights', () => {
    it('일반 사이트 특화 인사이트를 생성해야 함', () => {
      const contentStructure = {
        hierarchy: {
          h1Count: 0,
          h2Count: 1,
          h3Count: 2,
          h4Count: 0,
          hierarchyScore: 30,
        },
        sections: {
          count: 2,
          averageLength: 500,
          connectivity: 20,
        },
        contentTypes: {
          informational: true,
          guide: false,
          comparison: false,
          news: false,
          faq: false,
        },
      };

      const trustSignals = {
        eaat: {
          experience: 50,
          expertise: 40,
          authoritativeness: 30,
          trustworthiness: 60,
          overall: 45,
        },
        business: {
          companyInfo: false,
          contactInfo: false,
          legalPages: false,
          certifications: false,
          reviews: false,
        },
        security: {
          hasSSL: false,
          hasSecurityBadge: false,
          hasPrivacyPolicy: false,
        },
      };

      const interactions = {
        forms: 0,
        calculators: 0,
        comments: false,
        socialShare: false,
        subscription: false,
      };

      const insights = generateWebsiteInsights(contentStructure, trustSignals, interactions);
      
      expect(insights.length).toBeGreaterThanOrEqual(1);
      const hasStructure = insights.some((i: Insight) => i.category === '구조');
      const hasTrust = insights.some((i: Insight) => i.category === '신뢰도');
      const hasBusiness = insights.some((i: Insight) => i.category === '비즈니스');
      const hasSecurity = insights.some((i: Insight) => i.category === '보안');
      expect(hasStructure || hasTrust || hasBusiness || hasSecurity).toBe(true);
    });

    it('E-E-A-T 점수가 낮을 때 인사이트를 생성해야 함', () => {
      const contentStructure = {
        hierarchy: {
          h1Count: 1,
          h2Count: 5,
          h3Count: 10,
          h4Count: 5,
          hierarchyScore: 100,
        },
        sections: {
          count: 5,
          averageLength: 1000,
          connectivity: 80,
        },
        contentTypes: {
          informational: true,
          guide: true,
          comparison: false,
          news: false,
          faq: true,
        },
      };

      const trustSignals = {
        eaat: {
          experience: 30,
          expertise: 20,
          authoritativeness: 15,
          trustworthiness: 40,
          overall: 26,
        },
        business: {
          companyInfo: true,
          contactInfo: true,
          legalPages: true,
          certifications: true,
          reviews: true,
        },
        security: {
          hasSSL: true,
          hasSecurityBadge: true,
          hasPrivacyPolicy: true,
        },
      };

      const interactions = {
        forms: 2,
        calculators: 1,
        comments: true,
        socialShare: true,
        subscription: true,
      };

      const insights = generateWebsiteInsights(contentStructure, trustSignals, interactions);
      
      // E-E-A-T 점수가 낮으므로 관련 인사이트가 있어야 함
      const eaatInsights = insights.filter((i: any) => 
        i.category === '신뢰도' || 
        i.category === '전문성' || 
        i.category === '권위성'
      );
      expect(eaatInsights.length).toBeGreaterThanOrEqual(1);
    });
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
  const result: any = {
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
  
  return result;
}
