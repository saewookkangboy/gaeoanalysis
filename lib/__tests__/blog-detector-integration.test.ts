/**
 * 블로그 감지 시스템 통합 테스트
 * 
 * analyzer.ts와의 통합이 올바르게 작동하는지 테스트합니다.
 */

import { detectBlogPlatform } from '../blog-detector';

describe('Blog Detector Integration', () => {
  it('실제 네이버 블로그 URL 패턴을 감지해야 함', () => {
    const testUrls = [
      'https://blog.naver.com/example/123456789',
      'https://blog.naver.com/PostView.naver?blogId=example&logNo=123',
      'http://blog.naver.com/test/456',
    ];

    testUrls.forEach(url => {
      const html = '<html><body>네이버 블로그 콘텐츠</body></html>';
      const result = detectBlogPlatform(url, html);
      
      expect(result.isBlog).toBe(true);
      expect(result.platform.type).toBe('naver');
      expect(result.platform.confidence).toBeGreaterThanOrEqual(0.85);
    });
  });

  it('실제 티스토리 URL 패턴을 감지해야 함', () => {
    const testUrls = [
      'https://example.tistory.com/123',
      'https://test.tistory.com/post/456',
      'http://blog.tistory.com/789',
    ];

    testUrls.forEach(url => {
      const html = '<html><body>Tistory 콘텐츠</body></html>';
      const result = detectBlogPlatform(url, html);
      
      expect(result.isBlog).toBe(true);
      expect(result.platform.type).toBe('tistory');
      expect(result.platform.confidence).toBeGreaterThanOrEqual(0.85);
    });
  });

  it('whipped.co.kr과 같은 쇼핑몰 사이트는 네이버 블로그로 감지되지 않아야 함', () => {
    const url = 'https://whipped.co.kr/';
    const html = `
      <html>
        <head>
          <title>WHIPPED - 쇼핑몰</title>
        </head>
        <body>
          <button>네이버 로그인</button>
          <div>블로그 섹션</div>
          <p>네이버 광고가 포함되어 있습니다</p>
        </body>
      </html>
    `;
    const result = detectBlogPlatform(url, html);
    
    // whipped.co.kr은 일반 사이트이므로 블로그로 감지되지 않아야 함
    expect(result.isBlog).toBe(false);
    expect(result.platform.type).toBe('none');
  });

  it('실제 일반 사이트 URL을 올바르게 감지해야 함', () => {
    const testUrls = [
      'https://example.com',
      'https://company.co.kr/about',
      'https://service.com/products',
      'https://news.com/article',
      'https://shop.com/item',
    ];

    testUrls.forEach(url => {
      const html = '<html><body><h1>일반 웹사이트 콘텐츠</h1></body></html>';
      const result = detectBlogPlatform(url, html);
      
      expect(result.isBlog).toBe(false);
      expect(result.platform.type).toBe('none');
    });
  });

  it('복합적인 HTML 메타데이터를 올바르게 처리해야 함', () => {
    const url = 'https://example.wordpress.com/post';
    const html = `
      <html>
        <head>
          <meta name="generator" content="WordPress 6.0" />
          <meta property="og:type" content="article" />
        </head>
        <body>
          <div class="wp-content">WordPress 콘텐츠</div>
        </body>
      </html>
    `;
    
    const result = detectBlogPlatform(url, html);
    
    expect(result.isBlog).toBe(true);
    expect(result.platform.type).toBe('wordpress');
    // URL과 HTML이 모두 일치하므로 높은 신뢰도
    expect(result.platform.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it('신뢰도가 낮은 경우에도 올바르게 처리해야 함', () => {
    const url = 'https://example.com/blog';
    const html = '<html><body><div class="blog-post">블로그 같은 콘텐츠</div></body></html>';
    
    const result = detectBlogPlatform(url, html);
    
    // 일반 도메인이지만 블로그 특성이 있는 경우
    // 일반 사이트로 판단해야 함 (신뢰도 낮은 블로그 감지는 무시)
    expect(result.isBlog).toBe(false);
    expect(result.platform.type).toBe('none');
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
  };
}
