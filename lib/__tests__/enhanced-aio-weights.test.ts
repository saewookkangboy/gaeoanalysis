/**
 * 강화된 AIO 가중치 테스트
 * 
 * 일반 사이트에 특화된 AIO 가중치가 올바르게 적용되는지 테스트합니다.
 */

import * as cheerio from 'cheerio';
import { calculateAIOCitationScores } from '../ai-citation-analyzer';
import { ENHANCED_AIO_WEIGHTS, DEFAULT_AIO_WEIGHTS } from '../algorithm-defaults';

describe('Enhanced AIO Weights', () => {
  const createTestHTML = (content: string) => {
    return cheerio.load(`
      <html>
        <head>
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Article",
              "author": {
                "@type": "Person",
                "name": "Expert Author",
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

  it('일반 사이트인 경우 강화된 가중치가 적용되어야 함', () => {
    const html = `
      <h1>Title</h1>
      <h2>Question?</h2>
      <p>Answer with detailed explanation.</p>
      <time datetime="2024-01-01">2024-01-01</time>
      <p>Research study shows 50% improvement. Data from statistics.</p>
      <p>Company certification ISO 9001 approved.</p>
      <a href="https://example.com">External link</a>
      <a href="https://example2.com">External link 2</a>
      <a href="https://example3.com">External link 3</a>
      <a href="https://example4.com">External link 4</a>
      <a href="https://example5.com">External link 5</a>
      <a href="https://example6.com">External link 6</a>
      <a href="https://example7.com">External link 7</a>
      <a href="https://example8.com">External link 8</a>
      <a href="https://example9.com">External link 9</a>
      <a href="https://example10.com">External link 10</a>
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

  it('강화된 ChatGPT 보너스가 올바르게 계산되어야 함', () => {
    const html = `
      <h1>Title</h1>
      <p>Research study with data and statistics showing 50% improvement.</p>
      <p>Company certification ISO 9001 approved by authorized body.</p>
    `;
    const $ = createTestHTML(html);
    
    const scores = calculateAIOCitationScores($, 80, 80, 80, undefined, true);
    
    // ChatGPT 점수가 적절한 범위에 있어야 함
    expect(scores.chatgpt).toBeGreaterThanOrEqual(0);
    expect(scores.chatgpt).toBeLessThanOrEqual(100);
  });

  it('강화된 Perplexity 보너스가 올바르게 계산되어야 함', () => {
    const html = `
      <h1>Title</h1>
      <time datetime="2024-01-01">2024-01-01</time>
      <p>Updated in 2024 with latest information.</p>
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
      <p>Statistics show 50% improvement.</p>
    `;
    const $ = createTestHTML(html);
    
    const scores = calculateAIOCitationScores($, 80, 80, 80, undefined, true);
    
    // Perplexity 점수가 적절한 범위에 있어야 함
    expect(scores.perplexity).toBeGreaterThanOrEqual(0);
    expect(scores.perplexity).toBeLessThanOrEqual(100);
  });

  it('강화된 Claude 보너스가 올바르게 계산되어야 함', () => {
    const longText = Array(3000).fill('word').join(' ');
    const html = `
      <h1>Title</h1>
      <p>${longText}</p>
      <p>Primary source from pubmed and arxiv research papers.</p>
      <p>Methodology and process explained in transparent detail.</p>
    `;
    const $ = createTestHTML(html);
    
    const scores = calculateAIOCitationScores($, 80, 80, 80, undefined, true);
    
    // Claude 점수가 적절한 범위에 있어야 함
    expect(scores.claude).toBeGreaterThanOrEqual(0);
    expect(scores.claude).toBeLessThanOrEqual(100);
  });

  it('ENHANCED_AIO_WEIGHTS가 올바르게 정의되어야 함', () => {
    // ChatGPT 가중치 확인
    expect(ENHANCED_AIO_WEIGHTS.chatgpt_aeo_weight).toBeGreaterThanOrEqual(DEFAULT_AIO_WEIGHTS.chatgpt_aeo_weight);
    
    // Claude 가중치 확인
    expect(ENHANCED_AIO_WEIGHTS.claude_aeo_weight).toBeGreaterThanOrEqual(DEFAULT_AIO_WEIGHTS.claude_aeo_weight);
    
    // 모든 가중치의 합이 각 모델별로 1.0에 가까워야 함 (정규화 전)
    const chatgptSum = ENHANCED_AIO_WEIGHTS.chatgpt_seo_weight + 
                       ENHANCED_AIO_WEIGHTS.chatgpt_aeo_weight + 
                       ENHANCED_AIO_WEIGHTS.chatgpt_geo_weight;
    expect(chatgptSum).toBeCloseTo(1.0, 1);
    
    const claudeSum = ENHANCED_AIO_WEIGHTS.claude_aeo_weight + 
                      ENHANCED_AIO_WEIGHTS.claude_geo_weight + 
                      ENHANCED_AIO_WEIGHTS.claude_seo_weight;
    expect(claudeSum).toBeCloseTo(1.0, 1);
  });

  it('모든 AI 모델 점수가 0-100 범위를 벗어나지 않아야 함', () => {
    const html = '<html><body><h1>Test</h1></body></html>';
    const $ = createTestHTML(html);
    
    const scores = calculateAIOCitationScores($, 50, 50, 50, undefined, true);
    
    expect(scores.chatgpt).toBeGreaterThanOrEqual(0);
    expect(scores.chatgpt).toBeLessThanOrEqual(100);
    expect(scores.perplexity).toBeGreaterThanOrEqual(0);
    expect(scores.perplexity).toBeLessThanOrEqual(100);
    expect(scores.grok).toBeGreaterThanOrEqual(0);
    expect(scores.grok).toBeLessThanOrEqual(100);
    expect(scores.gemini).toBeGreaterThanOrEqual(0);
    expect(scores.gemini).toBeLessThanOrEqual(100);
    expect(scores.claude).toBeGreaterThanOrEqual(0);
    expect(scores.claude).toBeLessThanOrEqual(100);
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
    toBeCloseTo: (expected: number, precision: number = 2) => {
      const diff = Math.abs(value - expected);
      if (diff > Math.pow(10, -precision)) {
        throw new Error(`Expected ${value} to be close to ${expected} (within ${Math.pow(10, -precision)})`);
      }
    },
  };
}
