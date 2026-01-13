/**
 * 블로그 감지 시스템 테스트
 * 
 * 다양한 블로그 플랫폼과 일반 사이트를 올바르게 감지하는지 테스트합니다.
 */

import {
  detectBlogPlatform,
  getBlogPlatformFromURL,
  getBlogPlatformFromHTML,
  getBlogPlatformName,
  type BlogPlatformType,
} from '../blog-detector';

describe('Blog Detector', () => {
  describe('getBlogPlatformFromURL', () => {
    it('네이버 블로그 URL을 올바르게 감지해야 함', () => {
      const url = 'https://blog.naver.com/example/123456789';
      const result = getBlogPlatformFromURL(url);
      
      expect(result).not.toBeNull();
      expect(result?.type).toBe('naver');
      expect(result?.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('티스토리 URL을 올바르게 감지해야 함', () => {
      const url = 'https://example.tistory.com/123';
      const result = getBlogPlatformFromURL(url);
      
      expect(result).not.toBeNull();
      expect(result?.type).toBe('tistory');
      expect(result?.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('브런치 URL을 올바르게 감지해야 함', () => {
      const url = 'https://brunch.co.kr/@user/123';
      const result = getBlogPlatformFromURL(url);
      
      expect(result).not.toBeNull();
      expect(result?.type).toBe('brunch');
      expect(result?.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('워드프레스 URL을 올바르게 감지해야 함', () => {
      const url = 'https://example.wordpress.com/post';
      const result = getBlogPlatformFromURL(url);
      
      expect(result).not.toBeNull();
      expect(result?.type).toBe('wordpress');
      expect(result?.confidence).toBeGreaterThanOrEqual(0.85);
    });

    it('Medium URL을 올바르게 감지해야 함', () => {
      const url = 'https://medium.com/@user/article';
      const result = getBlogPlatformFromURL(url);
      
      expect(result).not.toBeNull();
      expect(result?.type).toBe('medium');
      expect(result?.confidence).toBeGreaterThanOrEqual(0.85);
    });

    it('Velog URL을 올바르게 감지해야 함', () => {
      const url = 'https://velog.io/@user/post';
      const result = getBlogPlatformFromURL(url);
      
      expect(result).not.toBeNull();
      expect(result?.type).toBe('velog');
      expect(result?.confidence).toBeGreaterThanOrEqual(0.85);
    });

    it('일반 사이트 URL은 null을 반환해야 함', () => {
      const url = 'https://example.com/page';
      const result = getBlogPlatformFromURL(url);
      
      expect(result).toBeNull();
    });

    it('회사 사이트 URL은 null을 반환해야 함', () => {
      const url = 'https://company.co.kr/about';
      const result = getBlogPlatformFromURL(url);
      
      expect(result).toBeNull();
    });
  });

  describe('getBlogPlatformFromHTML', () => {
    it('WordPress Generator 메타 태그를 감지해야 함', () => {
      const html = '<meta name="generator" content="WordPress 6.0" />';
      const result = getBlogPlatformFromHTML(html);
      
      expect(result).not.toBeNull();
      expect(result?.type).toBe('wordpress');
      expect(result?.confidence).toBeGreaterThanOrEqual(0.7);
    });

    it('Tistory Generator 메타 태그를 감지해야 함', () => {
      const html = '<meta name="generator" content="Tistory" />';
      const result = getBlogPlatformFromHTML(html);
      
      expect(result).not.toBeNull();
      expect(result?.type).toBe('tistory');
      expect(result?.confidence).toBeGreaterThanOrEqual(0.7);
    });

    it('Naver 블로그 특정 패턴을 감지해야 함', () => {
      // blog.naver.com 패턴이 있는 경우
      const html = '<div><a href="https://blog.naver.com/example">네이버 블로그</a></div>';
      const result = getBlogPlatformFromHTML(html, 'https://blog.naver.com/example');
      
      expect(result).not.toBeNull();
      expect(result?.type).toBe('naver');
      expect(result?.confidence).toBeGreaterThanOrEqual(0.7);
    });

    it('watchshell.com과 같은 일반 쇼핑몰은 네이버 블로그로 감지되지 않아야 함', () => {
      // watchshell.com과 유사한 쇼핑몰 사이트 시나리오
      const html = `
        <html>
          <body>
            <h1>WatchShell - 시계 쇼핑몰</h1>
            <p>Rolex, Omega 등 다양한 시계를 판매합니다</p>
            <div>블로그 섹션</div>
            <a href="https://se.naver.com/search">네이버 검색</a>
          </body>
        </html>
      `;
      const result = getBlogPlatformFromHTML(html, 'https://watchshell.com/');
      
      // watchshell.com은 일반 사이트이므로 네이버 블로그로 감지되지 않아야 함
      expect(result).toBeNull();
    });

    it('단순히 "naver"와 "blog" 단어만으로는 네이버 블로그로 감지되지 않아야 함', () => {
      // whipped.co.kr과 유사한 쇼핑몰 사이트 시나리오
      const html = '<div class="naver-login">네이버 로그인</div><div>블로그 섹션</div>';
      const result = getBlogPlatformFromHTML(html, 'https://whipped.co.kr/');
      
      // 네이버 블로그 특정 패턴이 없으므로 null이어야 함
      expect(result).toBeNull();
    });

    it('일반 HTML은 null을 반환해야 함', () => {
      const html = '<html><body><h1>Hello World</h1></body></html>';
      const result = getBlogPlatformFromHTML(html);
      
      // 일반 HTML은 null을 반환하거나 낮은 신뢰도로 감지
      if (result) {
        expect(result.confidence).toBeLessThan(0.7);
      }
    });
  });

  describe('detectBlogPlatform', () => {
    it('네이버 블로그를 올바르게 감지해야 함', () => {
      const url = 'https://blog.naver.com/example/123';
      const html = '<html><body>네이버 블로그 콘텐츠</body></html>';
      const result = detectBlogPlatform(url, html);
      
      expect(result.isBlog).toBe(true);
      expect(result.platform.type).toBe('naver');
      expect(result.platform.confidence).toBeGreaterThanOrEqual(0.85);
    });

    it('티스토리를 올바르게 감지해야 함', () => {
      const url = 'https://example.tistory.com/123';
      const html = '<html><body>Tistory 콘텐츠</body></html>';
      const result = detectBlogPlatform(url, html);
      
      expect(result.isBlog).toBe(true);
      expect(result.platform.type).toBe('tistory');
      expect(result.platform.confidence).toBeGreaterThanOrEqual(0.85);
    });

    it('일반 사이트를 올바르게 감지해야 함', () => {
      const url = 'https://company.com/about';
      const html = '<html><body><h1>회사 소개</h1></body></html>';
      const result = detectBlogPlatform(url, html);
      
      expect(result.isBlog).toBe(false);
      expect(result.platform.type).toBe('none');
      expect(result.platform.confidence).toBeGreaterThanOrEqual(0.8);
    });

    it('URL과 HTML이 일치할 때 신뢰도가 향상되어야 함', () => {
      const url = 'https://example.wordpress.com/post';
      const html = '<meta name="generator" content="WordPress 6.0" />';
      const result = detectBlogPlatform(url, html);
      
      expect(result.isBlog).toBe(true);
      expect(result.platform.type).toBe('wordpress');
      // URL과 HTML이 일치하면 신뢰도가 더 높아야 함
      expect(result.platform.confidence).toBeGreaterThanOrEqual(0.85);
    });
  });

  describe('getBlogPlatformName', () => {
    const testCases: Array<{ type: BlogPlatformType; expected: string }> = [
      { type: 'naver', expected: '네이버 블로그' },
      { type: 'tistory', expected: '티스토리' },
      { type: 'brunch', expected: '브런치' },
      { type: 'wordpress', expected: '워드프레스' },
      { type: 'medium', expected: 'Medium' },
      { type: 'velog', expected: 'Velog' },
      { type: 'none', expected: '일반 사이트' },
    ];

    testCases.forEach(({ type, expected }) => {
      it(`${type} 플랫폼 이름을 올바르게 반환해야 함`, () => {
        const name = getBlogPlatformName(type);
        expect(name).toBe(expected);
      });
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
    not: {
      toBe: (expected: any) => {
        if (value === expected) {
          throw new Error(`Expected ${value} not to be ${expected}`);
        }
      },
      toBeNull: () => {
        if (value === null) {
          throw new Error(`Expected ${value} not to be null`);
        }
      },
    },
    toBeNull: () => {
      if (value !== null) {
        throw new Error(`Expected ${value} to be null`);
      }
    },
    toBeGreaterThanOrEqual: (expected: number) => {
      if (value < expected) {
        throw new Error(`Expected ${value} to be greater than or equal to ${expected}`);
      }
    },
    toBeLessThan: (expected: number) => {
      if (value >= expected) {
        throw new Error(`Expected ${value} to be less than ${expected}`);
      }
    },
  };
}
