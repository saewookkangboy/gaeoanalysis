/**
 * 상품 페이지 구조 추출 모듈
 * 커머스 상품 페이지에서 상품 정보, 가격, 이미지, 구매 관련 요소 등을 추출합니다.
 */

import * as cheerio from 'cheerio';

export interface ProductPageStructure {
  // 기본 정보
  productInfo: {
    name: string;
    description: string;
    brand?: string;
    category?: string;
    sku?: string;
    productId?: string;
  };
  
  // 가격 정보
  pricing: {
    originalPrice?: number;
    salePrice?: number;
    discountRate?: number;
    currency: string;
    hasPrice: boolean;
  };
  
  // 이미지
  images: {
    mainImage?: string;
    galleryImages: string[];
    totalCount: number;
    hasAltText: boolean;
    imageQuality: 'high' | 'medium' | 'low';
  };
  
  // 구매 관련
  purchase: {
    hasBuyButton: boolean;
    hasCartButton: boolean;
    hasWishlist: boolean;
    stockStatus?: 'in-stock' | 'out-of-stock' | 'pre-order';
  };
  
  // 리뷰 및 평점
  reviews: {
    hasReviewSection: boolean;
    averageRating?: number;
    reviewCount?: number;
    hasRatingSchema: boolean;
  };
  
  // 상세 정보
  details: {
    hasSpecifications: boolean;
    hasDescription: boolean;
    hasFAQ: boolean;
    hasRelatedProducts: boolean;
    hasShippingInfo: boolean;
    hasReturnPolicy: boolean;
  };
  
  // SEO 요소
  seo: {
    hasProductSchema: boolean;
    hasBreadcrumb: boolean;
    hasCanonical: boolean;
    hasOgTags: boolean;
  };
}

/**
 * 상품 페이지 구조 추출
 */
export function extractProductStructure($: cheerio.CheerioAPI, html: string): ProductPageStructure {
  // 1. 상품명 추출
  const productName = 
    $('h1').first().text().trim() ||
    $('[class*="product-name"], [class*="item-name"], [class*="prd-name"]').first().text().trim() ||
    $('meta[property="og:title"]').attr('content')?.trim() ||
    $('title').text().trim() ||
    '';
  
  // 2. 상품 설명 추출
  const description = 
    $('meta[name="description"]').attr('content')?.trim() ||
    $('meta[property="og:description"]').attr('content')?.trim() ||
    $('[class*="product-description"], [class*="item-description"]').first().text().trim() ||
    '';
  
  // 3. 브랜드 추출
  const brand = extractBrand($, html);
  
  // 4. 카테고리 추출
  const category = extractCategory($, html);
  
  // 5. 가격 정보 추출
  const pricing = extractPricing($);
  
  // 6. 이미지 추출
  const images = extractImages($);
  
  // 7. 구매 관련 요소 추출
  const purchase = extractPurchaseElements($);
  
  // 8. 리뷰 및 평점 추출
  const reviews = extractReviews($, html);
  
  // 9. 상세 정보 추출
  const details = extractDetails($);
  
  // 10. SEO 요소 추출
  const seo = extractSEOElements($, html);
  
  return {
    productInfo: {
      name: productName,
      description,
      brand,
      category,
    },
    pricing,
    images,
    purchase,
    reviews,
    details,
    seo,
  };
}

/**
 * 브랜드 추출
 */
function extractBrand($: cheerio.CheerioAPI, html: string): string | undefined {
  // Schema.org에서 추출
  const schemaMatch = html.match(/"brand"\s*:\s*"([^"]+)"/i);
  if (schemaMatch) {
    return schemaMatch[1];
  }
  
  // 메타 태그에서 추출
  const brandMeta = $('meta[property="product:brand"], meta[name="brand"]').attr('content');
  if (brandMeta) {
    return brandMeta;
  }
  
  // 클래스/ID 패턴에서 추출
  const brandElement = $('[class*="brand"], [id*="brand"]').first();
  if (brandElement.length > 0) {
    return brandElement.text().trim() || undefined;
  }
  
  return undefined;
}

/**
 * 카테고리 추출
 */
function extractCategory($: cheerio.CheerioAPI, html: string): string | undefined {
  // Breadcrumb에서 추출
  const breadcrumbItems = $('[itemtype*="BreadcrumbList"] [itemprop="name"]');
  if (breadcrumbItems.length > 1) {
    // 마지막 항목은 상품명이므로 그 전 항목이 카테고리
    return breadcrumbItems.eq(breadcrumbItems.length - 2).text().trim() || undefined;
  }
  
  // 메타 태그에서 추출
  const categoryMeta = $('meta[property="product:category"], meta[name="category"]').attr('content');
  if (categoryMeta) {
    return categoryMeta;
  }
  
  // 클래스/ID 패턴에서 추출
  const categoryElement = $('[class*="category"], [id*="category"]').first();
  if (categoryElement.length > 0) {
    return categoryElement.text().trim() || undefined;
  }
  
  return undefined;
}

/**
 * 가격 정보 추출 (강화 버전)
 * 실제 커머스 사이트 패턴을 반영하여 소비자가/판매가를 정확히 구분
 */
function extractPricing($: cheerio.CheerioAPI): ProductPageStructure['pricing'] {
  const bodyText = $('body').text();
  
  let salePrice: number | undefined;
  let originalPrice: number | undefined;
  
  // 1. Schema.org에서 가격 추출 (가장 정확)
  const schemaPrice = $('[itemprop="price"]').attr('content');
  const schemaPriceCurrency = $('[itemprop="priceCurrency"]').attr('content');
  if (schemaPrice) {
    const price = parseFloat(schemaPrice.replace(/[^\d.]/g, ''));
    if (price && price > 0) {
      salePrice = Math.round(price);
    }
  }
  
  // 2. 취소선이 있는 가격 (소비자가/정가)
  const strikethroughPrices = $('s, strike, del, [style*="text-decoration:line-through"], [style*="text-decoration: line-through"]')
    .map((_, el) => {
      const text = $(el).text();
      const match = text.match(/([\d,]+)\s*(원|₩|$)/);
      if (match) {
        const numStr = match[1].replace(/,/g, '');
        const price = parseInt(numStr, 10);
        if (price > 100 && price < 100000000) {
          return price;
        }
      }
      return null;
    })
    .get()
    .filter((price): price is number => price !== null);
  
  if (strikethroughPrices.length > 0) {
    // 가장 높은 가격이 정가일 가능성이 높음
    originalPrice = Math.max(...strikethroughPrices);
  }
  
  // 3. "소비자가", "정가" 텍스트가 있는 가격
  const consumerPriceMatch = bodyText.match(/(?:소비자가|정가|원가)[\s:]*([\d,]+)\s*(?:원|₩)/i);
  if (consumerPriceMatch) {
    const price = parseInt(consumerPriceMatch[1].replace(/,/g, ''), 10);
    if (price > 100 && price < 100000000) {
      originalPrice = price;
    }
  }
  
  // 4. "판매가", "할인가", "특가" 텍스트가 있는 가격
  const salePriceMatch = bodyText.match(/(?:판매가|할인가|특가|현재가)[\s:]*([\d,]+)\s*(?:원|₩)/i);
  if (salePriceMatch) {
    const price = parseInt(salePriceMatch[1].replace(/,/g, ''), 10);
    if (price > 100 && price < 100000000) {
      salePrice = price;
    }
  }
  
  // 5. 강조된 가격 (bold, strong, 큰 글씨 등) - 판매가일 가능성
  if (!salePrice) {
    const emphasizedPrices = $('strong, b, [class*="price"], [class*="sale"], [class*="discount"]')
      .filter((_, el) => {
        const text = $(el).text().trim();
        return /^[\d,]+\s*(원|₩)?$/.test(text);
      })
      .map((_, el) => {
        const text = $(el).text();
        const match = text.match(/([\d,]+)/);
        if (match) {
          const price = parseInt(match[1].replace(/,/g, ''), 10);
          if (price > 100 && price < 100000000) {
            return price;
          }
        }
        return null;
      })
      .get()
      .filter((price): price is number => price !== null);
    
    if (emphasizedPrices.length > 0) {
      // 가장 낮은 가격이 판매가일 가능성
      salePrice = Math.min(...emphasizedPrices);
    }
  }
  
  // 6. 일반 가격 패턴 (마지막 수단)
  if (!salePrice || !originalPrice) {
    const pricePattern = /([\d,]+)\s*(원|₩)/g;
    const allPrices: number[] = [];
    let match;
    
    while ((match = pricePattern.exec(bodyText)) !== null) {
      const price = parseInt(match[1].replace(/,/g, ''), 10);
      if (price > 100 && price < 100000000) {
        allPrices.push(price);
      }
    }
    
    const uniquePrices = [...new Set(allPrices)].sort((a, b) => a - b);
    
    if (!salePrice && uniquePrices.length > 0) {
      salePrice = uniquePrices[0]; // 가장 낮은 가격
    }
    
    if (!originalPrice && uniquePrices.length > 1) {
      originalPrice = uniquePrices[uniquePrices.length - 1]; // 가장 높은 가격
    }
  }
  
  // 할인율 계산
  let discountRate: number | undefined;
  if (originalPrice && salePrice && originalPrice > salePrice) {
    discountRate = Math.round(((originalPrice - salePrice) / originalPrice) * 100);
  }
  
  return {
    originalPrice,
    salePrice,
    discountRate,
    currency: schemaPriceCurrency || 'KRW',
    hasPrice: !!salePrice,
  };
}

/**
 * 이미지 추출
 */
function extractImages($: cheerio.CheerioAPI): ProductPageStructure['images'] {
  // 메인 이미지
  const mainImage = 
    $('meta[property="og:image"]').attr('content') ||
    $('[class*="product-image"], [class*="main-image"], [class*="prd-image"] img').first().attr('src') ||
    $('[class*="product-image"], [class*="main-image"], [class*="prd-image"]').first().attr('src') ||
    '';
  
  // 갤러리 이미지
  const galleryImages = $('[class*="gallery"] img, [class*="thumbnail"] img, [class*="product-image"] img')
    .map((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src') || '';
      return src;
    })
    .get()
    .filter((src): src is string => Boolean(src) && src !== mainImage);
  
  // 중복 제거
  const uniqueGalleryImages = [...new Set(galleryImages)];
  
  // Alt 텍스트 확인
  const allImages = $('img');
  const imagesWithAlt = allImages.filter((_, el) => !!$(el).attr('alt')).length;
  const hasAltText = allImages.length === 0 || imagesWithAlt / allImages.length >= 0.8;
  
  // 이미지 품질 평가 (간단한 휴리스틱)
  const totalImages = uniqueGalleryImages.length + (mainImage ? 1 : 0);
  let imageQuality: 'high' | 'medium' | 'low' = 'medium';
  if (totalImages >= 5 && hasAltText) {
    imageQuality = 'high';
  } else if (totalImages < 2) {
    imageQuality = 'low';
  }
  
  return {
    mainImage: mainImage || undefined,
    galleryImages: uniqueGalleryImages,
    totalCount: totalImages,
    hasAltText,
    imageQuality,
  };
}

/**
 * 구매 관련 요소 추출
 */
function extractPurchaseElements($: cheerio.CheerioAPI): ProductPageStructure['purchase'] {
  const bodyText = $('body').text().toLowerCase();
  
  // 구매 버튼 감지
  const buyButtons = $('button, a').filter((_, el) => {
    const text = $(el).text().toLowerCase();
    const className = $(el).attr('class')?.toLowerCase() || '';
    const id = $(el).attr('id')?.toLowerCase() || '';
    
    return /구매|바로구매|구매하기|buy|purchase/i.test(text) ||
           /buy|purchase/i.test(className) ||
           /buy|purchase/i.test(id);
  });
  
  const hasBuyButton = buyButtons.length > 0;
  
  // 장바구니 버튼 감지
  const cartButtons = $('button, a').filter((_, el) => {
    const text = $(el).text().toLowerCase();
    const className = $(el).attr('class')?.toLowerCase() || '';
    const id = $(el).attr('id')?.toLowerCase() || '';
    
    return /장바구니|담기|cart|add to cart/i.test(text) ||
           /cart|add.*cart/i.test(className) ||
           /cart/i.test(id);
  });
  
  const hasCartButton = cartButtons.length > 0;
  
  // 위시리스트 감지
  const wishlistButtons = $('button, a').filter((_, el) => {
    const text = $(el).text().toLowerCase();
    const className = $(el).attr('class')?.toLowerCase() || '';
    
    return /찜|위시|wishlist|like|heart/i.test(text) ||
           /wishlist|wish|like/i.test(className);
  });
  
  const hasWishlist = wishlistButtons.length > 0;
  
  // 재고 상태 감지
  let stockStatus: 'in-stock' | 'out-of-stock' | 'pre-order' | undefined;
  if (/품절|재고없음|out of stock|sold out/i.test(bodyText)) {
    stockStatus = 'out-of-stock';
  } else if (/예약|pre-order|preorder/i.test(bodyText)) {
    stockStatus = 'pre-order';
  } else if (/구매|장바구니|담기/i.test(bodyText)) {
    stockStatus = 'in-stock';
  }
  
  return {
    hasBuyButton,
    hasCartButton,
    hasWishlist,
    stockStatus,
  };
}

/**
 * 리뷰 및 평점 추출 (강화 버전)
 * 실제 커머스 사이트 패턴을 반영하여 리뷰 개수와 평점을 정확히 추출
 */
function extractReviews($: cheerio.CheerioAPI, html: string): ProductPageStructure['reviews'] {
  // 리뷰 섹션 감지
  const reviewSection = $('[class*="review"], [class*="rating"], [id*="review"], [id*="rating"]');
  const hasReviewSection = reviewSection.length > 0;
  
  // 평점 추출
  let averageRating: number | undefined;
  
  // 1. Schema.org AggregateRating에서 추출 (가장 정확)
  if (html.includes('"@type":"AggregateRating"') || html.includes('itemtype*="AggregateRating"')) {
    const ratingMatch = html.match(/"ratingValue"\s*:\s*"?([\d.]+)"?/i);
    if (ratingMatch) {
      const rating = parseFloat(ratingMatch[1]);
      if (!isNaN(rating) && rating >= 0 && rating <= 5) {
        averageRating = rating;
      }
    }
  }
  
  // 2. 메타 태그에서 추출
  if (!averageRating) {
    const ratingMeta = $('meta[property="product:rating"], meta[name="rating"], meta[property="og:rating"]').attr('content');
    if (ratingMeta) {
      const rating = parseFloat(ratingMeta);
      if (!isNaN(rating) && rating >= 0 && rating <= 5) {
        averageRating = rating;
      }
    }
  }
  
  // 3. 텍스트에서 추출 (예: "4.5점", "별점 4.5", "평점 4.5" 등)
  if (!averageRating) {
    const bodyText = $('body').text();
    const ratingPatterns = [
      /(?:평점|별점|rating|점수)[\s:]*(\d\.?\d*)\s*(?:점|star|out of 5)?/i,
      /(\d\.?\d*)\s*(?:점|star|rating)\s*(?:만점|out of 5)?/i,
      /★\s*(\d\.?\d*)/,
      /(\d\.?\d*)\s*★/,
    ];
    
    for (const pattern of ratingPatterns) {
      const match = bodyText.match(pattern);
      if (match) {
        const rating = parseFloat(match[1]);
        if (!isNaN(rating) && rating >= 0 && rating <= 5) {
          averageRating = rating;
          break;
        }
      }
    }
  }
  
  // 리뷰 개수 추출
  let reviewCount: number | undefined;
  
  // 1. Schema.org에서 추출
  const reviewCountMatch = html.match(/"reviewCount"\s*:\s*"?(\d+)"?/i);
  if (reviewCountMatch) {
    reviewCount = parseInt(reviewCountMatch[1], 10);
  }
  
  // 2. "리뷰 보기 952", "리뷰 952개", "952 리뷰" 등 패턴
  if (!reviewCount) {
    const bodyText = $('body').text();
    const reviewPatterns = [
      /리뷰\s*(?:보기|보기하기)?\s*(\d+)/i,
      /(\d+)\s*(?:개|건)?\s*(?:리뷰|review)/i,
      /리뷰\s*(\d+)\s*(?:개|건)/i,
      /review\s*(\d+)/i,
    ];
    
    for (const pattern of reviewPatterns) {
      const match = bodyText.match(pattern);
      if (match) {
        const count = parseInt(match[1], 10);
        if (count > 0 && count < 1000000) { // 합리적인 범위
          reviewCount = count;
          break;
        }
      }
    }
  }
  
  // 3. 리뷰 섹션 내에서 숫자 추출
  if (!reviewCount && reviewSection.length > 0) {
    const reviewText = reviewSection.text();
    const numbers = reviewText.match(/\d+/g);
    if (numbers) {
      // 가장 큰 숫자가 리뷰 개수일 가능성
      const counts = numbers.map(n => parseInt(n, 10)).filter(n => n > 0 && n < 1000000);
      if (counts.length > 0) {
        reviewCount = Math.max(...counts);
      }
    }
  }
  
  return {
    hasReviewSection,
    averageRating,
    reviewCount,
    hasRatingSchema: html.includes('"@type":"AggregateRating"') || 
                    $('[itemtype*="AggregateRating"]').length > 0,
  };
}

/**
 * 상세 정보 추출 (강화 버전)
 */
function extractDetails($: cheerio.CheerioAPI): ProductPageStructure['details'] {
  const bodyText = $('body').text().toLowerCase();
  
  return {
    hasSpecifications: $('[class*="spec"], [class*="specification"], [class*="detail-spec"], [class*="product-spec"]').length > 0 ||
                      /제품사양|상품사양|스펙|specification/i.test(bodyText),
    hasDescription: $('[class*="description"], [class*="detail"], [class*="product-detail"], [class*="product-info"]').length > 0 ||
                    /상품설명|제품설명|상세설명|description/i.test(bodyText),
    hasFAQ: $('[class*="faq"], [id*="faq"], [class*="question"], [class*="qna"]').length > 0 ||
            /자주묻는질문|faq|질문과답변|qna/i.test(bodyText),
    hasRelatedProducts: $('[class*="related"], [class*="recommend"], [class*="similar"], [class*="also-bought"]').length > 0 ||
                        /관련상품|추천상품|비슷한상품|연관상품/i.test(bodyText),
    hasShippingInfo: $('[class*="shipping"], [class*="delivery"], [class*="배송"]').length > 0 ||
                     /배송정보|배송안내|배송비|shipping|delivery/i.test(bodyText),
    hasReturnPolicy: $('[class*="return"], [class*="refund"], [class*="exchange"], [class*="반품"]').length > 0 ||
                     /반품정책|교환정책|환불정책|return policy|refund policy/i.test(bodyText),
  };
}

/**
 * SEO 요소 추출
 */
function extractSEOElements($: cheerio.CheerioAPI, html: string): ProductPageStructure['seo'] {
  return {
    hasProductSchema: html.includes('"@type":"Product"') || 
                     $('[itemtype*="Product"]').length > 0,
    hasBreadcrumb: $('[itemtype*="BreadcrumbList"]').length > 0 ||
                   $('[class*="breadcrumb"]').length > 0,
    hasCanonical: $('link[rel="canonical"]').length > 0,
    hasOgTags: $('meta[property^="og:"]').length >= 3,
  };
}
