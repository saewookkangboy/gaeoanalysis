# 커머스 사이트 상품 페이지 자동 분석 설계서

## 개요

커머스 사이트의 단일 상품 페이지 분석 요청 시, 다음을 자동으로 인식하여 분석하는 시스템을 설계합니다:

1. **상세 페이지의 구성** 자동 인식
2. **AIO, GEO, AI SEO** 분석 (커머스 특화)
3. **UI/UX 분석**

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    사용자 분석 요청                           │
│              (커머스 상품 페이지 URL)                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Page Type Detection Module                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 1. URL 패턴 분석                                        │  │
│  │    - /product/, /item/, /goods/, /shop/ 등             │  │
│  │    - 쿼리 파라미터: ?productId=, ?itemNo= 등          │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 2. HTML 구조 분석                                      │  │
│  │    - Schema.org Product 마크업                        │  │
│  │    - Open Graph product 타입                          │  │
│  │    - 커머스 특화 클래스/ID 패턴                        │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 3. 콘텐츠 패턴 분석                                     │  │
│  │    - 가격 정보 (₩, 원, $ 등)                          │  │
│  │    - 구매 버튼 (장바구니, 바로구매 등)                  │  │
│  │    - 상품 이미지 갤러리                                │  │
│  │    - 리뷰/평점 섹션                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌───────────────┐          ┌──────────────────┐
│ 일반 페이지    │          │ 커머스 상품 페이지│
│ 분석 모듈      │          │ 전용 분석 모듈    │
└───────────────┘          └────────┬─────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │  E-commerce Product Analyzer  │
                    └───────────┬───────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ 1. 페이지 구성 │    │ 2. AIO/GEO/SEO│    │ 3. UI/UX 분석 │
│    분석        │    │    분석        │    │               │
└───────────────┘    └───────────────┘    └───────────────┘
```

## 1. 페이지 타입 자동 인식

### 1.1 URL 패턴 기반 감지

```typescript
interface EcommerceDetectionResult {
  isEcommerce: boolean;
  confidence: number; // 0-100
  detectedPlatform?: string; // 'coupang', '11st', 'gmarket', 'general' 등
  productId?: string;
  detectionMethods: string[]; // 감지에 사용된 방법들
}

function detectEcommercePage(url: string, html: string): EcommerceDetectionResult {
  const detectionMethods: string[] = [];
  let confidence = 0;
  
  // 1. URL 패턴 분석
  const urlPatterns = [
    { pattern: /\/product[s]?\/|\/item[s]?\/|\/goods\/|\/shop\//i, score: 20 },
    { pattern: /[?&](productId|itemId|goodsId|itemNo|productNo)=/i, score: 15 },
    { pattern: /\/p\/|\/pd\/|\/prd\//i, score: 10 },
  ];
  
  for (const { pattern, score } of urlPatterns) {
    if (pattern.test(url)) {
      confidence += score;
      detectionMethods.push('url-pattern');
    }
  }
  
  // 2. Schema.org Product 마크업
  if (html.includes('"@type":"Product"') || html.includes('itemtype="Product"')) {
    confidence += 30;
    detectionMethods.push('schema-product');
  }
  
  // 3. Open Graph product 타입
  if (html.includes('og:type" content="product"') || 
      html.includes('property="og:type" content="product"')) {
    confidence += 25;
    detectionMethods.push('og-product');
  }
  
  // 4. 커머스 특화 HTML 요소
  const ecommerceSelectors = [
    { selector: '[class*="product"]', score: 5 },
    { selector: '[class*="item"]', score: 5 },
    { selector: '[class*="price"]', score: 10 },
    { selector: '[class*="cart"]', score: 10 },
    { selector: '[class*="buy"]', score: 10 },
    { selector: '[class*="purchase"]', score: 10 },
    { selector: '[id*="product"]', score: 5 },
    { selector: '[id*="item"]', score: 5 },
  ];
  
  // 5. 가격 정보 패턴
  const pricePatterns = [
    /₩[\d,]+|원[\d,]+|\$[\d,]+|[\d,]+원|[\d,]+₩/,
    /price|가격|판매가|정가|할인가/i,
  ];
  
  // 6. 구매 버튼 패턴
  const buyButtonPatterns = [
    /장바구니|바로구매|구매하기|구매|담기|cart|buy|purchase/i,
  ];
  
  return {
    isEcommerce: confidence >= 50,
    confidence: Math.min(100, confidence),
    detectionMethods,
  };
}
```

### 1.2 플랫폼별 특화 감지

```typescript
function detectEcommercePlatform(url: string, html: string): string | null {
  const hostname = new URL(url).hostname.toLowerCase();
  
  // 주요 커머스 플랫폼 감지
  const platforms = {
    'coupang': ['coupang.com', 'coupang.co.kr'],
    '11st': ['11st.co.kr', '11street.co.kr'],
    'gmarket': ['gmarket.co.kr'],
    'auction': ['auction.co.kr'],
    'interpark': ['shopping.interpark.com'],
    'lotte': ['lotteon.com', 'lottemall.com'],
    'ssg': ['ssg.com'],
    'wemakeprice': ['wemakeprice.com'],
  };
  
  for (const [platform, domains] of Object.entries(platforms)) {
    if (domains.some(domain => hostname.includes(domain))) {
      return platform;
    }
  }
  
  return 'general';
}
```

## 2. 상품 페이지 구성 요소 추출

### 2.1 상품 정보 구조

```typescript
interface ProductPageStructure {
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
  };
  
  // SEO 요소
  seo: {
    hasProductSchema: boolean;
    hasBreadcrumb: boolean;
    hasCanonical: boolean;
    hasOgTags: boolean;
  };
}
```

### 2.2 구성 요소 추출 로직

```typescript
function extractProductStructure($: cheerio.CheerioAPI, html: string): ProductPageStructure {
  // 1. 상품명 추출
  const productName = 
    $('h1').first().text().trim() ||
    $('[class*="product-name"], [class*="item-name"]').first().text().trim() ||
    $('meta[property="og:title"]').attr('content') || '';
  
  // 2. 가격 정보 추출
  const priceText = $('[class*="price"], [class*="cost"], [id*="price"]').text();
  const priceMatch = priceText.match(/[\d,]+/);
  const salePrice = priceMatch ? parseInt(priceMatch[0].replace(/,/g, ''), 10) : undefined;
  
  // 3. 이미지 추출
  const mainImage = 
    $('meta[property="og:image"]').attr('content') ||
    $('[class*="product-image"], [class*="main-image"] img').first().attr('src') || '';
  
  const galleryImages = $('[class*="gallery"] img, [class*="thumbnail"] img')
    .map((_, el) => $(el).attr('src'))
    .get()
    .filter(Boolean);
  
  // 4. 구매 버튼 감지
  const buyButtonText = $('button, a').filter((_, el) => {
    const text = $(el).text().toLowerCase();
    return /구매|장바구니|담기|buy|cart|purchase/i.test(text);
  });
  
  // 5. 리뷰 섹션 감지
  const reviewSection = $('[class*="review"], [class*="rating"], [id*="review"]');
  const averageRating = extractRating($);
  const reviewCount = extractReviewCount($);
  
  // 6. Schema.org Product 마크업 확인
  const hasProductSchema = html.includes('"@type":"Product"') || 
                          $('[itemtype*="Product"]').length > 0;
  
  return {
    productInfo: {
      name: productName,
      description: $('meta[name="description"]').attr('content') || '',
      brand: extractBrand($),
      category: extractCategory($),
    },
    pricing: {
      salePrice,
      currency: 'KRW',
      hasPrice: !!salePrice,
    },
    images: {
      mainImage,
      galleryImages,
      totalCount: galleryImages.length + (mainImage ? 1 : 0),
      hasAltText: checkImageAltText($),
    },
    purchase: {
      hasBuyButton: buyButtonText.length > 0,
      hasCartButton: /장바구니|cart/i.test(buyButtonText.text()),
    },
    reviews: {
      hasReviewSection: reviewSection.length > 0,
      averageRating,
      reviewCount,
      hasRatingSchema: html.includes('"@type":"AggregateRating"'),
    },
    details: {
      hasSpecifications: $('[class*="spec"], [class*="specification"]').length > 0,
      hasDescription: $('[class*="description"], [class*="detail"]').length > 0,
      hasFAQ: $('[class*="faq"]').length > 0,
    },
    seo: {
      hasProductSchema,
      hasBreadcrumb: $('[itemtype*="BreadcrumbList"]').length > 0,
      hasCanonical: $('link[rel="canonical"]').length > 0,
      hasOgTags: $('meta[property^="og:"]').length >= 3,
    },
  };
}
```

## 3. 커머스 특화 AIO/GEO/AI SEO 분석

### 3.1 커머스 SEO 점수 계산

```typescript
function calculateEcommerceSEOScore(
  $: cheerio.CheerioAPI, 
  structure: ProductPageStructure
): number {
  let score = 0;
  
  // 기본 SEO 요소 (30점)
  const h1Count = $('h1').length;
  if (h1Count === 1) score += 10;
  
  const title = $('title').text().trim();
  if (title.length > 0 && title.length <= 60) score += 10;
  
  const metaDesc = $('meta[name="description"]').attr('content') || '';
  if (metaDesc.length > 0 && metaDesc.length <= 160) score += 10;
  
  // 커머스 특화 SEO 요소 (70점)
  
  // 1. Product Schema (20점)
  if (structure.seo.hasProductSchema) score += 20;
  
  // 2. 가격 정보 (15점)
  if (structure.pricing.hasPrice) score += 15;
  
  // 3. 이미지 최적화 (15점)
  if (structure.images.totalCount >= 3) score += 10;
  if (structure.images.hasAltText) score += 5;
  
  // 4. 리뷰/평점 Schema (10점)
  if (structure.reviews.hasRatingSchema) score += 10;
  
  // 5. Breadcrumb (5점)
  if (structure.seo.hasBreadcrumb) score += 5;
  
  // 6. Open Graph (5점)
  if (structure.seo.hasOgTags) score += 5;
  
  return Math.min(100, score);
}
```

### 3.2 커머스 AEO 점수 계산

```typescript
function calculateEcommerceAEOScore(
  $: cheerio.CheerioAPI,
  structure: ProductPageStructure
): number {
  let score = 0;
  
  // 1. 상품 설명 품질 (25점)
  const description = structure.productInfo.description;
  const wordCount = description.split(/\s+/).length;
  if (wordCount >= 300) score += 25;
  else if (wordCount >= 200) score += 20;
  else if (wordCount >= 100) score += 15;
  
  // 2. FAQ 섹션 (20점)
  if (structure.details.hasFAQ) score += 20;
  
  // 3. 상세 스펙 정보 (15점)
  if (structure.details.hasSpecifications) score += 15;
  
  // 4. 질문 형식 콘텐츠 (15점)
  const hasQuestions = /[?？]/.test($('body').text()) || 
                      /\b(어떻게|왜|언제|어디서|무엇|how|why|when|what)\b/i.test($('body').text());
  if (hasQuestions) score += 15;
  
  // 5. 구조화된 답변 (10점)
  const hasH2H3Bullets = $('h2').length > 0 && $('h3').length > 0 && $('ul, ol').length > 0;
  if (hasH2H3Bullets) score += 10;
  
  // 6. 리뷰 섹션 (10점)
  if (structure.reviews.hasReviewSection) score += 10;
  
  // 7. 신선도 표시 (5점)
  const hasDate = $('time, [datetime], [class*="date"]').length > 0;
  if (hasDate) score += 5;
  
  return Math.min(100, score);
}
```

### 3.3 커머스 GEO 점수 계산

```typescript
function calculateEcommerceGEOScore(
  $: cheerio.CheerioAPI,
  structure: ProductPageStructure
): number {
  let score = 0;
  const text = $('body').text();
  const wordCount = text.split(/\s+/).length;
  
  // 1. 콘텐츠 길이 (20점)
  if (wordCount >= 2000) score += 20;
  else if (wordCount >= 1500) score += 18;
  else if (wordCount >= 1000) score += 15;
  else if (wordCount >= 500) score += 10;
  
  // 2. 다중 미디어 (20점)
  if (structure.images.totalCount >= 5) score += 20;
  else if (structure.images.totalCount >= 3) score += 15;
  else if (structure.images.totalCount >= 1) score += 10;
  
  // 3. 구조화된 데이터 (20점)
  if (structure.seo.hasProductSchema) score += 20;
  
  // 4. 섹션 구조 (15점)
  const hasH2H3Bullets = $('h2').length > 0 && $('h3').length > 0 && $('ul, ol').length > 0;
  if (hasH2H3Bullets) score += 15;
  else if ($('h2').length > 0) score += 10;
  
  // 5. 키워드 다양성 (10점)
  const words = text.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  const diversity = uniqueWords.size / words.length;
  if (diversity > 0.3) score += 10;
  
  // 6. Open Graph 완전성 (10점)
  if (structure.seo.hasOgTags) {
    const ogTitle = $('meta[property="og:title"]').attr('content');
    const ogDesc = $('meta[property="og:description"]').attr('content');
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogTitle && ogDesc && ogImage) score += 10;
  }
  
  // 7. 신선도 (5점)
  const hasDate = $('time, [datetime], [class*="date"]').length > 0;
  if (hasDate) score += 5;
  
  return Math.min(100, score);
}
```

## 4. UI/UX 분석

### 4.1 UI/UX 평가 항목

```typescript
interface UXAnalysis {
  // 접근성
  accessibility: {
    hasAltText: boolean;
    hasAriaLabels: boolean;
    colorContrast: 'good' | 'medium' | 'poor';
    keyboardNavigation: boolean;
    score: number; // 0-100
  };
  
  // 사용성
  usability: {
    hasClearCTA: boolean; // Call-to-Action
    hasSearchFunction: boolean;
    hasFilterOptions: boolean;
    hasSortOptions: boolean;
    mobileResponsive: boolean;
    score: number; // 0-100
  };
  
  // 성능
  performance: {
    imageOptimization: 'good' | 'medium' | 'poor';
    hasLazyLoading: boolean;
    scriptOptimization: 'good' | 'medium' | 'poor';
    score: number; // 0-100
  };
  
  // 정보 구조
  informationArchitecture: {
    hasBreadcrumb: boolean;
    hasCategoryNavigation: boolean;
    hasRelatedProducts: boolean;
    hasProductComparison: boolean;
    score: number; // 0-100
  };
  
  // 신뢰성
  trustworthiness: {
    hasReviews: boolean;
    hasRatings: boolean;
    hasSecurityBadges: boolean;
    hasReturnPolicy: boolean;
    hasCustomerService: boolean;
    score: number; // 0-100
  };
  
  overallUXScore: number; // 0-100
}
```

### 4.2 UI/UX 분석 로직

```typescript
function analyzeUX(
  $: cheerio.CheerioAPI,
  structure: ProductPageStructure,
  html: string
): UXAnalysis {
  // 접근성 분석
  const images = $('img');
  const imagesWithAlt = images.filter((_, el) => !!$(el).attr('alt')).length;
  const hasAltText = images.length === 0 || imagesWithAlt / images.length >= 0.8;
  
  const hasAriaLabels = $('[aria-label], [aria-labelledby]').length > 0;
  
  // 사용성 분석
  const hasClearCTA = structure.purchase.hasBuyButton || structure.purchase.hasCartButton;
  const hasSearchFunction = $('[class*="search"], [id*="search"], input[type="search"]').length > 0;
  
  // 성능 분석
  const hasLazyLoading = html.includes('loading="lazy"') || 
                         html.includes('data-lazy') ||
                         $('img[loading="lazy"]').length > 0;
  
  // 정보 구조
  const hasBreadcrumb = structure.seo.hasBreadcrumb;
  const hasRelatedProducts = structure.details.hasRelatedProducts;
  
  // 신뢰성
  const hasReviews = structure.reviews.hasReviewSection;
  const hasRatings = structure.reviews.averageRating !== undefined;
  const hasSecurityBadges = /SSL|보안|안전|인증/i.test($('body').text());
  const hasReturnPolicy = /반품|교환|환불|정책/i.test($('body').text());
  const hasCustomerService = /고객센터|문의|상담|CS/i.test($('body').text());
  
  // 점수 계산
  const accessibilityScore = calculateAccessibilityScore(hasAltText, hasAriaLabels);
  const usabilityScore = calculateUsabilityScore(hasClearCTA, hasSearchFunction);
  const performanceScore = calculatePerformanceScore(hasLazyLoading, structure.images);
  const iaScore = calculateIAScore(hasBreadcrumb, hasRelatedProducts);
  const trustScore = calculateTrustScore(hasReviews, hasRatings, hasSecurityBadges, 
                                        hasReturnPolicy, hasCustomerService);
  
  const overallUXScore = Math.round(
    (accessibilityScore * 0.2 +
     usabilityScore * 0.3 +
     performanceScore * 0.2 +
     iaScore * 0.15 +
     trustScore * 0.15)
  );
  
  return {
    accessibility: {
      hasAltText,
      hasAriaLabels,
      colorContrast: 'good', // 실제로는 이미지 분석 필요
      keyboardNavigation: true, // 실제로는 JavaScript 테스트 필요
      score: accessibilityScore,
    },
    usability: {
      hasClearCTA,
      hasSearchFunction,
      hasFilterOptions: false, // 상품 페이지에서는 일반적으로 없음
      hasSortOptions: false,
      mobileResponsive: true, // 실제로는 viewport 메타 태그 확인 필요
      score: usabilityScore,
    },
    performance: {
      imageOptimization: structure.images.totalCount >= 3 ? 'good' : 'medium',
      hasLazyLoading,
      scriptOptimization: 'medium', // 실제로는 스크립트 분석 필요
      score: performanceScore,
    },
    informationArchitecture: {
      hasBreadcrumb,
      hasCategoryNavigation: false,
      hasRelatedProducts,
      hasProductComparison: false,
      score: iaScore,
    },
    trustworthiness: {
      hasReviews,
      hasRatings,
      hasSecurityBadges,
      hasReturnPolicy,
      hasCustomerService,
      score: trustScore,
    },
    overallUXScore,
  };
}
```

## 5. 통합 분석 결과

### 5.1 결과 인터페이스

```typescript
interface EcommerceAnalysisResult extends AnalysisResult {
  pageType: 'ecommerce-product';
  productStructure: ProductPageStructure;
  uxAnalysis: UXAnalysis;
  ecommerceSpecific: {
    conversionOptimization: {
      hasPriceDisplay: boolean;
      hasBuyButton: boolean;
      hasStockInfo: boolean;
      hasShippingInfo: boolean;
      score: number;
    };
    seoOptimization: {
      hasProductSchema: boolean;
      hasReviewSchema: boolean;
      hasBreadcrumbSchema: boolean;
      score: number;
    };
    aiOptimization: {
      hasRichDescription: boolean;
      hasFAQ: boolean;
      hasStructuredData: boolean;
      score: number;
    };
  };
}
```

### 5.2 인사이트 생성

```typescript
function generateEcommerceInsights(
  structure: ProductPageStructure,
  uxAnalysis: UXAnalysis,
  seoScore: number,
  aeoScore: number,
  geoScore: number
): Insight[] {
  const insights: Insight[] = [];
  
  // SEO 인사이트
  if (!structure.seo.hasProductSchema) {
    insights.push({
      severity: 'High',
      category: '커머스 SEO',
      message: 'Schema.org Product 마크업이 없습니다. Google Shopping 등에 노출되려면 필수입니다.',
    });
  }
  
  if (!structure.pricing.hasPrice) {
    insights.push({
      severity: 'High',
      category: '커머스 SEO',
      message: '가격 정보가 없습니다. 상품 페이지의 핵심 정보입니다.',
    });
  }
  
  // AEO 인사이트
  if (!structure.details.hasFAQ) {
    insights.push({
      severity: 'Medium',
      category: '커머스 AEO',
      message: 'FAQ 섹션을 추가하세요. "이 상품은 어떤가요?" 같은 질문에 AI가 답변할 수 있습니다.',
    });
  }
  
  // GEO 인사이트
  if (structure.images.totalCount < 3) {
    insights.push({
      severity: 'Medium',
      category: '커머스 GEO',
      message: `이미지가 ${structure.images.totalCount}개로 부족합니다. 최소 3-5개 이상 권장합니다.`,
    });
  }
  
  // UX 인사이트
  if (!structure.purchase.hasBuyButton) {
    insights.push({
      severity: 'High',
      category: 'UI/UX',
      message: '구매 버튼이 없습니다. 전환율에 직접적인 영향을 미칩니다.',
    });
  }
  
  if (!structure.reviews.hasReviewSection) {
    insights.push({
      severity: 'Medium',
      category: 'UI/UX',
      message: '리뷰 섹션이 없습니다. 신뢰성과 전환율 향상을 위해 추가하세요.',
    });
  }
  
  return insights;
}
```

## 6. 구현 계획

### 6.1 파일 구조

```
lib/
  ├── ecommerce-detector.ts          # 커머스 페이지 감지
  ├── ecommerce-analyzer.ts          # 커머스 전용 분석 모듈
  ├── product-structure-extractor.ts  # 상품 페이지 구조 추출
  └── ux-analyzer.ts                 # UI/UX 분석

app/api/analyze/
  └── route.ts                       # 기존 분석 API에 통합
```

### 6.2 통합 단계

1. **Phase 1: 감지 모듈 구현**
   - `ecommerce-detector.ts` 구현
   - URL 패턴 및 HTML 구조 기반 감지

2. **Phase 2: 구조 추출 모듈 구현**
   - `product-structure-extractor.ts` 구현
   - 상품 정보, 가격, 이미지, 리뷰 등 추출

3. **Phase 3: 분석 모듈 구현**
   - `ecommerce-analyzer.ts` 구현
   - 커머스 특화 SEO/AEO/GEO 점수 계산

4. **Phase 4: UX 분석 모듈 구현**
   - `ux-analyzer.ts` 구현
   - 접근성, 사용성, 성능, 신뢰성 분석

5. **Phase 5: 통합 및 테스트**
   - `analyzer.ts`에 통합
   - 다양한 커머스 플랫폼 테스트

## 7. 예상 결과

### 7.1 분석 결과 예시

```json
{
  "pageType": "ecommerce-product",
  "aeoScore": 75,
  "geoScore": 80,
  "seoScore": 85,
  "overallScore": 80,
  "productStructure": {
    "productInfo": {
      "name": "삼성 갤럭시 S24 울트라",
      "description": "최신 스마트폰...",
      "brand": "Samsung"
    },
    "pricing": {
      "salePrice": 1290000,
      "hasPrice": true
    },
    "images": {
      "totalCount": 8,
      "hasAltText": true
    }
  },
  "uxAnalysis": {
    "overallUXScore": 82,
    "accessibility": { "score": 85 },
    "usability": { "score": 90 },
    "trustworthiness": { "score": 88 }
  },
  "insights": [
    {
      "severity": "High",
      "category": "커머스 SEO",
      "message": "Schema.org Product 마크업을 추가하세요."
    }
  ]
}
```

## 8. 참고사항

- 네이버 블로그 분석 모듈(`naver-blog-analyzer.ts`)과 유사한 구조로 구현
- 기존 `analyzer.ts`의 `analyzeContent()` 함수에 통합
- 플랫폼별 특화 분석은 선택적으로 확장 가능
- UI/UX 분석은 점진적으로 고도화 가능 (실제 렌더링 테스트 등)
