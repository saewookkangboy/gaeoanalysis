/**
 * 커머스 사이트 상품 페이지 자동 감지 모듈
 * URL 패턴, HTML 구조, 콘텐츠 패턴을 분석하여 커머스 상품 페이지를 자동으로 감지합니다.
 * 
 * Railway 빌드 호환성을 위해 유지
 */

import * as cheerio from 'cheerio';

export interface EcommerceDetectionResult {
  isEcommerce: boolean;
  confidence: number; // 0-100
  detectedPlatform?: string; // 'coupang', '11st', 'gmarket', 'general' 등
  productId?: string;
  detectionMethods: string[]; // 감지에 사용된 방법들
}

/**
 * 커머스 페이지 감지
 */
export function detectEcommercePage(url: string, html: string): EcommerceDetectionResult {
  const detectionMethods: string[] = [];
  let confidence = 0;
  let productId: string | undefined;
  
  // 1. URL 패턴 분석
  const urlPatterns = [
    { pattern: /\/product[s]?\/|\/item[s]?\/|\/goods\/|\/shop\//i, score: 20, method: 'url-pattern-product' },
    { pattern: /[?&](productId|itemId|goodsId|itemNo|productNo|prdId|prdNo)=([^&]+)/i, score: 15, method: 'url-pattern-param' },
    { pattern: /\/p\/|\/pd\/|\/prd\//i, score: 10, method: 'url-pattern-short' },
  ];
  
  for (const { pattern, score, method } of urlPatterns) {
    const match = pattern.exec(url);
    if (match) {
      confidence += score;
      detectionMethods.push(method);
      
      // productId 추출
      if (match[2] && !productId) {
        productId = match[2];
      }
    }
  }
  
  // 2. Schema.org Product 마크업
  if (html.includes('"@type":"Product"') || 
      html.includes('itemtype="Product"') ||
      html.includes('"@type": "Product"')) {
    confidence += 30;
    detectionMethods.push('schema-product');
  }
  
  // 3. Open Graph product 타입
  if (html.includes('og:type" content="product"') || 
      html.includes('property="og:type" content="product"') ||
      html.includes('"og:type":"product"')) {
    confidence += 25;
    detectionMethods.push('og-product');
  }
  
  // 4. 커머스 특화 HTML 요소 (Cheerio로 분석)
  const $ = cheerio.load(html);
  
  const ecommerceSelectors = [
    { selector: '[class*="product"]', score: 5, method: 'class-product' },
    { selector: '[class*="item"]', score: 5, method: 'class-item' },
    { selector: '[class*="price"]', score: 10, method: 'class-price' },
    { selector: '[class*="cart"]', score: 10, method: 'class-cart' },
    { selector: '[class*="buy"]', score: 10, method: 'class-buy' },
    { selector: '[class*="purchase"]', score: 10, method: 'class-purchase' },
    { selector: '[id*="product"]', score: 5, method: 'id-product' },
    { selector: '[id*="item"]', score: 5, method: 'id-item' },
  ];
  
  for (const { selector, score, method } of ecommerceSelectors) {
    if ($(selector).length > 0) {
      confidence += score;
      if (!detectionMethods.includes(method)) {
        detectionMethods.push(method);
      }
    }
  }
  
  // 5. 가격 정보 패턴
  const bodyText = $('body').text();
  const pricePatterns = [
    /₩[\d,]+|원[\d,]+|\$[\d,]+|[\d,]+원|[\d,]+₩|[\d,]+,\d{3}/,
    /price|가격|판매가|정가|할인가|특가/i,
  ];
  
  let hasPricePattern = false;
  for (const pattern of pricePatterns) {
    if (pattern.test(bodyText)) {
      hasPricePattern = true;
      break;
    }
  }
  
  if (hasPricePattern) {
    confidence += 15;
    detectionMethods.push('price-pattern');
  }
  
  // 6. 구매 버튼 패턴
  const buyButtonText = $('button, a').filter((_, el) => {
    const text = $(el).text().toLowerCase();
    return /구매|장바구니|담기|바로구매|구매하기|cart|buy|purchase|add to cart/i.test(text);
  });
  
  if (buyButtonText.length > 0) {
    confidence += 15;
    detectionMethods.push('buy-button');
  }
  
  // 플랫폼별 특화 감지
  const detectedPlatform = detectEcommercePlatform(url, html);
  
  return {
    isEcommerce: confidence >= 50,
    confidence: Math.min(100, confidence),
    detectedPlatform: detectedPlatform ?? undefined,
    productId: productId ?? undefined,
    detectionMethods,
  };
}

/**
 * 플랫폼별 특화 감지
 */
function detectEcommercePlatform(url: string, html: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // 주요 커머스 플랫폼 감지
    const platforms: Record<string, string[]> = {
      'coupang': ['coupang.com', 'coupang.co.kr'],
      '11st': ['11st.co.kr', '11street.co.kr'],
      'gmarket': ['gmarket.co.kr'],
      'auction': ['auction.co.kr'],
      'interpark': ['shopping.interpark.com', 'shopping.interpark.co.kr'],
      'lotte': ['lotteon.com', 'lottemall.com'],
      'ssg': ['ssg.com', 'emart.ssg.com'],
      'wemakeprice': ['wemakeprice.com'],
      'tmon': ['tmon.co.kr'],
      'naver-shopping': ['shopping.naver.com'],
    };
    
    for (const [platform, domains] of Object.entries(platforms)) {
      if (domains.some(domain => hostname.includes(domain))) {
        return platform;
      }
    }
    
    return 'general';
  } catch {
    return 'general';
  }
}
