/**
 * 블로그 플랫폼 감지 시스템
 * 
 * 일반 사이트와 블로그를 자동으로 구분하여 차별화된 분석을 제공합니다.
 * URL 패턴, HTML 메타데이터, 구조적 특징을 종합적으로 분석하여 블로그 플랫폼을 감지합니다.
 */

export type BlogPlatformType = 'naver' | 'tistory' | 'brunch' | 'wordpress' | 'medium' | 'velog' | 'none';

export interface BlogPlatform {
  type: BlogPlatformType;
  confidence: number; // 0-1 사이의 신뢰도
  indicators: string[]; // 감지 근거
}

export interface BlogDetectionResult {
  isBlog: boolean;
  platform: BlogPlatform;
  reason: string;
}

/**
 * URL 패턴 기반 블로그 플랫폼 감지
 */
export function getBlogPlatformFromURL(url: string): BlogPlatform | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname.toLowerCase();

    // 네이버 블로그
    if (hostname.includes('blog.naver.com')) {
      return {
        type: 'naver',
        confidence: 0.95,
        indicators: ['blog.naver.com 도메인'],
      };
    }

    // 티스토리
    if (hostname.includes('.tistory.com') || hostname === 'tistory.com') {
      return {
        type: 'tistory',
        confidence: 0.90,
        indicators: ['tistory.com 도메인'],
      };
    }

    // 브런치
    if (hostname.includes('brunch.co.kr')) {
      return {
        type: 'brunch',
        confidence: 0.90,
        indicators: ['brunch.co.kr 도메인'],
      };
    }

    // 워드프레스
    if (hostname.includes('.wordpress.com') || hostname.includes('.wp.com')) {
      return {
        type: 'wordpress',
        confidence: 0.85,
        indicators: ['wordpress.com 또는 wp.com 도메인'],
      };
    }

    // Medium
    if (hostname.includes('medium.com')) {
      return {
        type: 'medium',
        confidence: 0.85,
        indicators: ['medium.com 도메인'],
      };
    }

    // Velog
    if (hostname.includes('velog.io')) {
      return {
        type: 'velog',
        confidence: 0.85,
        indicators: ['velog.io 도메인'],
      };
    }

    return null;
  } catch (error) {
    console.warn('⚠️ [BlogDetector] URL 파싱 실패:', error);
    return null;
  }
}

/**
 * HTML 메타데이터 및 구조 기반 블로그 플랫폼 감지
 */
export function getBlogPlatformFromHTML(html: string): BlogPlatform | null {
  const htmlLower = html.toLowerCase();
  const indicators: string[] = [];
  let confidence = 0;
  let platformType: BlogPlatformType | null = null;

  // Generator 메타 태그 확인
  const generatorMatch = html.match(/<meta[^>]*name=["']generator["'][^>]*content=["']([^"']+)["']/i);
  if (generatorMatch) {
    const generator = generatorMatch[1].toLowerCase();
    indicators.push(`Generator: ${generator}`);

    if (generator.includes('wordpress')) {
      platformType = 'wordpress';
      confidence = 0.80;
    } else if (generator.includes('tistory')) {
      platformType = 'tistory';
      confidence = 0.80;
    }
  }

  // 특정 클래스/ID 패턴 확인
  if (htmlLower.includes('naver') && (htmlLower.includes('blog') || htmlLower.includes('postview'))) {
    if (!platformType || confidence < 0.70) {
      platformType = 'naver';
      confidence = Math.max(confidence, 0.70);
      indicators.push('Naver 블로그 클래스/ID 패턴');
    }
  }

  if (htmlLower.includes('tistory') && (htmlLower.includes('blog') || htmlLower.includes('post'))) {
    if (!platformType || confidence < 0.70) {
      platformType = 'tistory';
      confidence = Math.max(confidence, 0.70);
      indicators.push('Tistory 블로그 클래스/ID 패턴');
    }
  }

  if (htmlLower.includes('brunch') || htmlLower.includes('brunch.co.kr')) {
    if (!platformType || confidence < 0.70) {
      platformType = 'brunch';
      confidence = Math.max(confidence, 0.70);
      indicators.push('Brunch 클래스/ID 패턴');
    }
  }

  if (htmlLower.includes('wp-content') || htmlLower.includes('wordpress')) {
    if (!platformType || confidence < 0.70) {
      platformType = 'wordpress';
      confidence = Math.max(confidence, 0.70);
      indicators.push('WordPress 클래스/ID 패턴');
    }
  }

  if (htmlLower.includes('medium.com') || htmlLower.includes('medium-')) {
    if (!platformType || confidence < 0.70) {
      platformType = 'medium';
      confidence = Math.max(confidence, 0.70);
      indicators.push('Medium 클래스/ID 패턴');
    }
  }

  if (htmlLower.includes('velog') || htmlLower.includes('velog.io')) {
    if (!platformType || confidence < 0.70) {
      platformType = 'velog';
      confidence = Math.max(confidence, 0.70);
      indicators.push('Velog 클래스/ID 패턴');
    }
  }

  // 블로그 특성 확인 (보조 지표)
  const blogIndicators = [
    htmlLower.includes('blog'),
    htmlLower.includes('post'),
    htmlLower.includes('article'),
    htmlLower.includes('entry'),
    htmlLower.includes('archive'),
  ];

  const blogIndicatorCount = blogIndicators.filter(Boolean).length;
  if (blogIndicatorCount >= 3 && !platformType) {
    // 블로그 특성이 강하지만 특정 플랫폼을 식별하지 못한 경우
    // 일반 블로그로 분류하지 않고 null 반환 (일반 사이트일 가능성도 있음)
  }

  if (platformType) {
    return {
      type: platformType,
      confidence: Math.min(1, confidence),
      indicators,
    };
  }

  return null;
}

/**
 * URL과 HTML을 종합하여 블로그 플랫폼 감지
 * 
 * @param url 페이지 URL
 * @param html 페이지 HTML 내용
 * @returns 블로그 감지 결과
 */
export function detectBlogPlatform(url: string, html: string): BlogDetectionResult {
  // 1. URL 패턴 기반 감지 (가장 신뢰도 높음)
  const urlPlatform = getBlogPlatformFromURL(url);
  
  if (urlPlatform && urlPlatform.confidence >= 0.85) {
    return {
      isBlog: true,
      platform: urlPlatform,
      reason: `URL 패턴 기반 감지: ${urlPlatform.type} (신뢰도: ${(urlPlatform.confidence * 100).toFixed(0)}%)`,
    };
  }

  // 2. HTML 메타데이터 기반 감지
  const htmlPlatform = getBlogPlatformFromHTML(html);
  
  if (htmlPlatform && htmlPlatform.confidence >= 0.70) {
    // URL과 HTML 결과가 일치하는 경우 신뢰도 향상
    if (urlPlatform && urlPlatform.type === htmlPlatform.type) {
      htmlPlatform.confidence = Math.min(1, htmlPlatform.confidence + 0.10);
    }

    return {
      isBlog: true,
      platform: htmlPlatform,
      reason: `HTML 메타데이터 기반 감지: ${htmlPlatform.type} (신뢰도: ${(htmlPlatform.confidence * 100).toFixed(0)}%)`,
    };
  }

  // 3. URL만으로 감지된 경우 (신뢰도 낮음)
  if (urlPlatform && urlPlatform.confidence >= 0.70) {
    return {
      isBlog: true,
      platform: urlPlatform,
      reason: `URL 패턴 기반 감지 (낮은 신뢰도): ${urlPlatform.type} (신뢰도: ${(urlPlatform.confidence * 100).toFixed(0)}%)`,
    };
  }

  // 4. 블로그가 아닌 것으로 판단
  return {
    isBlog: false,
    platform: {
      type: 'none',
      confidence: 0.9,
      indicators: ['블로그 플랫폼 특성이 감지되지 않음'],
    },
    reason: '일반 사이트로 판단 (블로그 플랫폼 특성 없음)',
  };
}

/**
 * 블로그 플랫폼 타입을 문자열로 변환
 */
export function getBlogPlatformName(type: BlogPlatformType): string {
  const names: Record<BlogPlatformType, string> = {
    naver: '네이버 블로그',
    tistory: '티스토리',
    brunch: '브런치',
    wordpress: '워드프레스',
    medium: 'Medium',
    velog: 'Velog',
    none: '일반 사이트',
  };
  return names[type] || '알 수 없음';
}
