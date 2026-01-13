/**
 * 강화된 점수 계산 모듈 테스트
 * 
 * 일반 사이트 전용 강화된 SEO, AEO, GEO 점수 계산이 올바르게 작동하는지 테스트합니다.
 */

import * as cheerio from 'cheerio';
import {
  calculateEnhancedSEOScore,
  calculateEnhancedAEOScore,
  calculateEnhancedGEOScore,
  normalizeScore,
  type TextContext,
} from '../enhanced-scoring';

describe('Enhanced Scoring', () => {
  describe('calculateEnhancedSEOScore', () => {
    it('기본 SEO 요소가 모두 있을 때 최소 100점 이상이어야 함', () => {
      const html = `
        <html>
          <head>
            <title>Test Page</title>
            <meta name="description" content="Test description" />
            <meta name="keywords" content="test, keywords" />
            <meta property="og:title" content="Test" />
            <meta property="og:description" content="Test description" />
            <meta property="og:image" content="https://example.com/image.jpg" />
            <meta property="og:url" content="https://example.com" />
            <link rel="canonical" href="https://example.com" />
            <script type="application/ld+json">{"@context":"https://schema.org"}</script>
          </head>
          <body>
            <h1>Main Title</h1>
            <h2>Subtitle</h2>
            <img src="test.jpg" alt="Test image" />
            <a href="/page">Internal link</a>
          </body>
        </html>
      `;
      const $ = cheerio.load(html);
      const score = calculateEnhancedSEOScore($);
      
      expect(score).toBeGreaterThanOrEqual(100);
      expect(score).toBeLessThanOrEqual(120);
    });

    it('추가 항목(사이트맵, breadcrumb 등)이 있으면 120점에 가까워야 함', () => {
      const html = `
        <html>
          <head>
            <title>Test Page</title>
            <meta name="description" content="Test description" />
            <meta name="robots" content="index, follow" />
            <meta property="og:title" content="Test" />
            <meta property="og:description" content="Test description" />
            <meta property="og:image" content="https://example.com/image.jpg" />
            <meta property="og:url" content="https://example.com" />
            <link rel="canonical" href="https://example.com" />
            <link rel="alternate" hreflang="ko" href="https://example.com/ko" />
            <link rel="alternate" hreflang="en" href="https://example.com/en" />
            <link rel="alternate" href="https://example.com/sitemap.xml" />
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": []
              }
            </script>
          </head>
          <body>
            <h1>Main Title</h1>
            <h2>Subtitle</h2>
            <img src="test.jpg" alt="Test image" />
            <a href="/page">Internal link</a>
          </body>
        </html>
      `;
      const $ = cheerio.load(html);
      const score = calculateEnhancedSEOScore($);
      
      expect(score).toBeGreaterThanOrEqual(110);
      expect(score).toBeLessThanOrEqual(120);
    });

    it('점수는 0-120 범위를 벗어나지 않아야 함', () => {
      const html = '<html><body></body></html>';
      const $ = cheerio.load(html);
      const score = calculateEnhancedSEOScore($);
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(120);
    });
  });

  describe('calculateEnhancedAEOScore', () => {
    const createTextContext = (wordCount: number): TextContext => {
      const words = Array(wordCount).fill('word');
      return {
        text: words.join(' '),
        words,
        wordCount,
      };
    };

    it('기본 AEO 요소가 있을 때 적절한 점수를 받아야 함', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "Article",
                "author": {
                  "@type": "Person",
                  "name": "Expert Author"
                }
              }
            </script>
          </head>
          <body>
            <h2>What is the question?</h2>
            <h3>Answer section</h3>
            <p>This is a detailed answer with enough content.</p>
            <p>More content here.</p>
            <p>Even more content.</p>
            <p>Additional content.</p>
            <div class="faq">
              <h3>FAQ Section</h3>
              <p>Frequently asked questions</p>
            </div>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
            <dl>
              <dt>Term</dt>
              <dd>Definition</dd>
            </dl>
            <time datetime="2024-01-01">2024-01-01</time>
            <abbr title="Abbreviation">ABBR</abbr>
            <p>Statistics show 50% improvement. "Citation" is important.</p>
          </body>
        </html>
      `;
      const $ = cheerio.load(html);
      const textContext = createTextContext(500);
      const score = calculateEnhancedAEOScore($, textContext);
      
      // 기본 요소들이 있으면 최소 70점 이상은 받아야 함
      expect(score).toBeGreaterThanOrEqual(70);
      expect(score).toBeLessThanOrEqual(130);
    });

    it('전문가 Q&A, 단계별 가이드 등 추가 항목이 있으면 130점에 가까워야 함', () => {
      const html = `
        <html>
          <head>
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
            <h2>FAQ</h2>
            <h3>Question 1?</h3>
            <p>Answer 1 with detailed explanation that is more than 50 characters long.</p>
            <ol>
              <li>Step 1 with detailed explanation that is more than 50 characters long.</li>
              <li>Step 2 with detailed explanation that is more than 50 characters long.</li>
              <li>Step 3 with detailed explanation that is more than 50 characters long.</li>
              <li>Step 4 with detailed explanation that is more than 50 characters long.</li>
              <li>Step 5 with detailed explanation that is more than 50 characters long.</li>
            </ol>
            <table>
              <tr>
                <th>비교</th>
                <th>Option A</th>
                <th>Option B</th>
              </tr>
            </table>
            <div class="case-study">Case Study Content</div>
          </body>
        </html>
      `;
      const $ = cheerio.load(html);
      const textContext = createTextContext(1000);
      const score = calculateEnhancedAEOScore($, textContext);
      
      // 추가 항목들이 있으면 기본 점수보다 높아야 함
      expect(score).toBeGreaterThanOrEqual(80);
      expect(score).toBeLessThanOrEqual(130);
    });

    it('점수는 0-130 범위를 벗어나지 않아야 함', () => {
      const html = '<html><body></body></html>';
      const $ = cheerio.load(html);
      const textContext = createTextContext(10);
      const score = calculateEnhancedAEOScore($, textContext);
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(130);
    });
  });

  describe('calculateEnhancedGEOScore', () => {
    const createTextContext = (wordCount: number): TextContext => {
      const words = Array(wordCount).fill('word');
      return {
        text: words.join(' '),
        words,
        wordCount,
      };
    };

    it('기본 GEO 요소가 있을 때 적절한 점수를 받아야 함', () => {
      const html = `
        <html>
          <head>
            <meta property="og:title" content="Test" />
            <meta name="twitter:card" content="summary" />
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "Article"
              }
            </script>
          </head>
          <body>
            <section>
              <article>
                <h2>Title</h2>
                <h3>Subtitle</h3>
                <ul>
                  <li>Item 1</li>
                  <li>Item 2</li>
                </ul>
                <img src="test1.jpg" />
                <img src="test2.jpg" />
                <img src="test3.jpg" />
                <time datetime="2024-01-01">2024-01-01</time>
              </article>
            </section>
          </body>
        </html>
      `;
      const $ = cheerio.load(html);
      const textContext = createTextContext(2000);
      const score = calculateEnhancedGEOScore($, textContext);
      
      // 기본 요소들이 있으면 최소 50점 이상은 받아야 함
      expect(score).toBeGreaterThanOrEqual(50);
      expect(score).toBeLessThanOrEqual(140);
    });

    it('추가 항목(비디오, 인포그래픽, 다국어 등)이 있으면 140점에 가까워야 함', () => {
      const html = `
        <html lang="ko">
          <head>
            <link rel="alternate" hreflang="ko" href="https://example.com/ko" />
            <link rel="alternate" hreflang="en" href="https://example.com/en" />
            <meta property="og:title" content="Test" />
            <meta name="twitter:card" content="summary" />
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "Article"
              }
            </script>
          </head>
          <body>
            <h2>Title</h2>
            <h3>Subtitle</h3>
            <ul>
              <li>Item</li>
            </ul>
            <img src="test1.jpg" />
            <img src="test2.jpg" />
            <img src="test3.jpg" />
            <img src="test4.jpg" />
            <img src="test5.jpg" />
            <iframe src="https://www.youtube.com/embed/test"></iframe>
            <table>
              <tr>
                <td>Data</td>
              </tr>
            </table>
            <canvas id="chart"></canvas>
            <time datetime="2024-01-01">2024-01-01</time>
            <p>정기 업데이트 주기: 매주</p>
          </body>
        </html>
      `;
      const $ = cheerio.load(html);
      const textContext = createTextContext(2500);
      const score = calculateEnhancedGEOScore($, textContext);
      
      // 추가 항목들이 있으면 기본 점수보다 높아야 함
      expect(score).toBeGreaterThanOrEqual(100);
      expect(score).toBeLessThanOrEqual(140);
    });

    it('점수는 0-140 범위를 벗어나지 않아야 함', () => {
      const html = '<html><body></body></html>';
      const $ = cheerio.load(html);
      const textContext = createTextContext(10);
      const score = calculateEnhancedGEOScore($, textContext);
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(140);
    });
  });

  describe('normalizeScore', () => {
    it('120점 만점을 100점 기준으로 정규화해야 함', () => {
      expect(normalizeScore(120, 120)).toBe(100);
      expect(normalizeScore(60, 120)).toBe(50);
      expect(normalizeScore(0, 120)).toBe(0);
    });

    it('130점 만점을 100점 기준으로 정규화해야 함', () => {
      expect(normalizeScore(130, 130)).toBe(100);
      expect(normalizeScore(65, 130)).toBe(50);
      expect(normalizeScore(0, 130)).toBe(0);
    });

    it('140점 만점을 100점 기준으로 정규화해야 함', () => {
      expect(normalizeScore(140, 140)).toBe(100);
      expect(normalizeScore(70, 140)).toBe(50);
      expect(normalizeScore(0, 140)).toBe(0);
    });

    it('반올림이 올바르게 작동해야 함', () => {
      expect(normalizeScore(61, 120)).toBe(51); // 50.83... → 51
      expect(normalizeScore(59, 120)).toBe(49); // 49.16... → 49
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
