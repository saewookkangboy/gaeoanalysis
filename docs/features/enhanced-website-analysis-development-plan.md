# 일반 사이트 강화 분석 개발 계획

## 📅 개발 일정

**총 개발 기간**: 7주 (약 1.75개월)

| Phase | 기간 | 주요 작업 | 담당 |
|-------|------|----------|------|
| Phase 1 | 1주 | 블로그 감지 시스템 구축 | Backend |
| Phase 2 | 2주 | 강화된 점수 계산 모듈 | Backend |
| Phase 3 | 1주 | AIO 가중치 강화 | Backend |
| Phase 4 | 2주 | 깊이 있는 콘텐츠 분석 | Backend |
| Phase 5 | 1주 | 통합 및 테스트 | Full-stack |

## 🔨 Phase 1: 블로그 감지 시스템 구축

### 목표
일반 사이트와 블로그를 자동으로 구분하는 시스템 구축

### 작업 상세

#### 1.1 `lib/blog-detector.ts` 생성

```typescript
// 파일 구조
export interface BlogPlatform {
  type: 'naver' | 'tistory' | 'brunch' | 'wordpress' | 'medium' | 'velog' | 'none';
  confidence: number; // 0-1 사이의 신뢰도
  indicators: string[]; // 감지 근거
}

export interface BlogDetectionResult {
  isBlog: boolean;
  platform: BlogPlatform;
  reason: string;
}

// 주요 함수
export function detectBlogPlatform(url: string, html: string): BlogDetectionResult
export function getBlogPlatformFromURL(url: string): BlogPlatform | null
export function getBlogPlatformFromHTML(html: string): BlogPlatform | null
```

**구현 내용**
- URL 패턴 매칭 (정규식 기반)
- HTML 메타데이터 분석 (generator 태그, 특정 클래스/ID)
- 신뢰도 점수 계산 (여러 지표 종합)

**블로그 플랫폼 감지 규칙**

| 플랫폼 | URL 패턴 | HTML 지표 | 신뢰도 가중치 |
|--------|----------|-----------|---------------|
| 네이버 | `blog.naver.com` | `naver` 클래스, 특정 스크립트 | 0.95 |
| 티스토리 | `*.tistory.com` | `tistory` 메타, 특정 구조 | 0.90 |
| 브런치 | `brunch.co.kr` | `brunch` 클래스, 특정 스크립트 | 0.90 |
| 워드프레스 | `*.wordpress.com`, `*.wp.com` | `wp-` 클래스, generator 태그 | 0.85 |
| Medium | `medium.com` | `medium` 클래스, 특정 구조 | 0.85 |
| Velog | `velog.io` | `velog` 클래스, 특정 스크립트 | 0.85 |

#### 1.2 `lib/analyzer.ts` 수정

```typescript
// 수정 전
const isNaverBlog = urlObj.hostname.includes('blog.naver.com');

// 수정 후
import { detectBlogPlatform } from './blog-detector';

const blogDetection = detectBlogPlatform(url, html);
const isBlog = blogDetection.isBlog;
const blogPlatform = blogDetection.platform;

if (isBlog) {
  // 기존 블로그 분석 로직
  if (blogPlatform.type === 'naver') {
    return await analyzeNaverBlogContent(html, url);
  }
  // 다른 블로그 플랫폼 처리 (향후 확장)
} else {
  // 일반 사이트 강화 분석
  return await analyzeWebsiteContent(html, url);
}
```

### 테스트 케이스

```typescript
// 테스트 URL 목록
const testCases = [
  { url: 'https://blog.naver.com/example/123', expected: 'naver' },
  { url: 'https://example.tistory.com/123', expected: 'tistory' },
  { url: 'https://brunch.co.kr/@user/123', expected: 'brunch' },
  { url: 'https://example.wordpress.com/post', expected: 'wordpress' },
  { url: 'https://medium.com/@user/article', expected: 'medium' },
  { url: 'https://velog.io/@user/post', expected: 'velog' },
  { url: 'https://example.com/page', expected: 'none' },
  { url: 'https://company.co.kr/about', expected: 'none' },
];
```

### 완료 기준
- ✅ 모든 주요 블로그 플랫폼 감지 가능
- ✅ 신뢰도 점수 0.8 이상 정확도
- ✅ 일반 사이트와 블로그 명확히 구분
- ✅ 단위 테스트 통과율 95% 이상

---

## 🎯 Phase 2: 강화된 점수 계산 모듈

### 목표
일반 사이트 전용 강화된 SEO/AEO/GEO 점수 계산 시스템 구축

### 작업 상세

#### 2.1 `lib/enhanced-scoring.ts` 생성

```typescript
// 파일 구조
export interface EnhancedScoringOptions {
  isWebsite: boolean; // 일반 사이트 여부
  strictMode: boolean; // 엄격한 기준 적용 여부
}

// 주요 함수
export function calculateEnhancedSEOScore(
  $: cheerio.CheerioAPI, 
  options?: EnhancedScoringOptions
): number

export function calculateEnhancedAEOScore(
  $: cheerio.CheerioAPI,
  textContext: TextContext,
  options?: EnhancedScoringOptions
): number

export function calculateEnhancedGEOScore(
  $: cheerio.CheerioAPI,
  textContext: TextContext,
  options?: EnhancedScoringOptions
): number
```

#### 2.2 SEO 점수 강화 (100점 → 120점)

**기존 항목 (100점)**
- H1 태그: 20점
- Title 태그: 15점
- Meta description: 15점
- Alt 텍스트: 10점
- 구조화된 데이터: 10점
- 메타 키워드: 5점
- Open Graph 태그: 10점
- Canonical URL: 5점
- 내부 링크: 5점
- 헤딩 구조: 5점

**추가 항목 (+20점)**
- 사이트맵 존재 (`sitemap.xml`): 5점
- robots.txt 존재: 3점
- Breadcrumb 구조 (구조화된 데이터 또는 HTML): 4점
- 다국어 메타데이터 (`hreflang` 태그): 3점
- Open Graph 완성도 (og:title, og:description, og:image, og:url 모두 존재): 5점

**구현 예시**
```typescript
function calculateEnhancedSEOScore($: cheerio.CheerioAPI): number {
  let score = 0;
  
  // 기존 항목 (100점)
  score += calculateBasicSEOScore($);
  
  // 추가 항목 (20점)
  if (hasSitemap($)) score += 5;
  if (hasRobotsTxt($)) score += 3;
  if (hasBreadcrumb($)) score += 4;
  if (hasHreflang($)) score += 3;
  if (hasCompleteOGTags($)) score += 5;
  
  return Math.min(120, Math.max(0, score));
}
```

#### 2.3 AEO 점수 강화 (100점 → 130점)

**기존 항목 (100점)**
- 질문 형식: 20점
- FAQ 섹션: 15점
- 답변 구조: 20점
- 키워드 밀도: 10점
- 구조화된 답변: 15점
- 콘텐츠 신선도: 10점
- 전문 용어 설명: 10점

**추가 항목 (+30점)**
- 전문가 Q&A 섹션 (작성자 정보와 함께): 10점
- 단계별 가이드 완성도 (5단계 이상, 각 단계 상세 설명): 8점
- 비교표/대안 제시 (표 형식 또는 구조화된 비교): 7점
- 사례 연구(Case Study) 포함: 5점

**구현 예시**
```typescript
function calculateEnhancedAEOScore($: cheerio.CheerioAPI, textContext: TextContext): number {
  let score = 0;
  
  // 기존 항목 (100점)
  score += calculateBasicAEOScore($, textContext);
  
  // 추가 항목 (30점)
  if (hasExpertQA($)) score += 10;
  if (hasDetailedStepByStepGuide($)) score += 8;
  if (hasComparisonTable($)) score += 7;
  if (hasCaseStudy($)) score += 5;
  
  return Math.min(130, Math.max(0, score));
}
```

#### 2.4 GEO 점수 강화 (100점 → 140점)

**기존 항목 (100점)**
- 콘텐츠 길이: 20점
- 다중 미디어: 15점
- 섹션 구조: 15점
- 키워드 다양성: 15점
- 콘텐츠 업데이트 표시: 10점
- 소셜 공유 메타: 10점
- 구조화된 데이터: 15점

**추가 항목 (+40점)**
- 포괄적 콘텐츠 깊이 (2000+ 단어): 10점
- 전문 데이터/통계 포함 (표, 차트, 그래프): 8점
- 인포그래픽/차트 포함: 7점
- 비디오 콘텐츠 (YouTube, Vimeo 등): 8점
- 다국어 콘텐츠 (2개 이상 언어): 4점
- 업데이트 주기 명시 (정기 업데이트 안내): 3점

**구현 예시**
```typescript
function calculateEnhancedGEOScore($: cheerio.CheerioAPI, textContext: TextContext): number {
  let score = 0;
  
  // 기존 항목 (100점)
  score += calculateBasicGEOScore($, textContext);
  
  // 추가 항목 (40점)
  if (textContext.wordCount >= 2000) score += 10;
  if (hasProfessionalData($)) score += 8;
  if (hasInfographic($)) score += 7;
  if (hasVideoContent($)) score += 8;
  if (hasMultilingualContent($)) score += 4;
  if (hasUpdateSchedule($)) score += 3;
  
  return Math.min(140, Math.max(0, score));
}
```

### 테스트 케이스

```typescript
// 다양한 일반 사이트 테스트
const testSites = [
  { url: 'https://company.com', expectedSEOMin: 80, expectedAEOMin: 75, expectedGEOMin: 80 },
  { url: 'https://service.com', expectedSEOMin: 85, expectedAEOMin: 80, expectedGEOMin: 85 },
  // ...
];
```

### 완료 기준
- ✅ SEO 점수 120점 만점 시스템 구현
- ✅ AEO 점수 130점 만점 시스템 구현
- ✅ GEO 점수 140점 만점 시스템 구현
- ✅ 기존 점수와의 호환성 유지 (100점 기준 정규화)
- ✅ 단위 테스트 통과율 95% 이상

---

## ⚖️ Phase 3: AIO 가중치 강화

### 목표
일반 사이트에 특화된 AIO 가중치 및 보너스 시스템 구축

### 작업 상세

#### 3.1 `lib/algorithm-defaults.ts` 수정

```typescript
// 기존 가중치 유지
export const DEFAULT_AIO_WEIGHTS: AIOWeights = { ... };

// 일반 사이트 강화 가중치 추가
export const ENHANCED_AIO_WEIGHTS: AIOWeights = {
  // ChatGPT 가중치 강화
  chatgpt_seo_weight: 0.35,      // 기존 0.30 → 0.35
  chatgpt_aeo_weight: 0.40,      // 기존 0.35 → 0.40
  chatgpt_geo_weight: 0.25,      // 기존 0.35 → 0.25
  
  // Perplexity 가중치 강화
  perplexity_geo_weight: 0.45,   // 기존 0.40 → 0.45
  perplexity_seo_weight: 0.30,   // 기존 0.35 → 0.30
  perplexity_aeo_weight: 0.25,   // 기존 0.25 → 0.25 (유지)
  
  // Claude 가중치 강화
  claude_aeo_weight: 0.45,       // 기존 0.40 → 0.45
  claude_geo_weight: 0.30,       // 기존 0.35 → 0.30
  claude_seo_weight: 0.25,       // 기존 0.25 → 0.25 (유지)
  
  // ... (나머지 모델 가중치)
};
```

#### 3.2 `lib/ai-citation-analyzer.ts` 수정

```typescript
// calculateAIOCitationScores 함수 수정
export function calculateAIOCitationScores(
  $: cheerio.CheerioAPI,
  aeoScore: number,
  geoScore: number,
  seoScore: number,
  weightOverrides?: AIOWeightOverrides,
  isWebsite?: boolean  // 일반 사이트 여부 추가
): AIOCitationScores {
  // 일반 사이트인 경우 강화 가중치 사용
  const weights = isWebsite 
    ? resolveAioWeights(ENHANCED_AIO_WEIGHTS, weightOverrides)
    : resolveAioWeights(DEFAULT_AIO_WEIGHTS, weightOverrides);
  
  // 보너스 계산도 일반 사이트에 맞게 강화
  const chatgptBonus = isWebsite 
    ? calculateEnhancedChatGPTBonus($)
    : calculateChatGPTBonus($);
  
  // ... (나머지 보너스 계산)
}
```

#### 3.3 보너스 계산 함수 강화

**ChatGPT 보너스 강화**
```typescript
function calculateEnhancedChatGPTBonus($: cheerio.CheerioAPI): number {
  let bonus = calculateChatGPTBonus($); // 기존 보너스
  
  // 추가 보너스
  const text = $('body').text();
  
  // 전문가 자격증명 강화 (+8점, 기존 +6점)
  const hasAuthor = $('script[type="application/ld+json"]').text().includes('author');
  const hasCredentials = /자격|credential|전문가|expert|박사|Ph\.D|인증|certification/i.test(text);
  if (hasAuthor && hasCredentials) bonus += 2; // 추가 +2점
  
  // 연구 기반 콘텐츠 (+7점, 신규)
  const hasResearch = /연구|research|study|논문|paper|journal/i.test(text);
  const hasData = /\d+%|\d+\.\d+%|통계|statistics|데이터|data/i.test(text);
  if (hasResearch && hasData) bonus += 7;
  
  // 비즈니스 인증 (+5점, 신규)
  const hasBusinessCert = /인증|certification|ISO|인정|승인|approved/i.test(text);
  const hasCompanyInfo = /회사|company|기업|corporation/i.test(text);
  if (hasBusinessCert && hasCompanyInfo) bonus += 5;
  
  return Math.min(50, bonus); // 최대 보너스 증가 (40점 → 50점)
}
```

**Perplexity 보너스 강화**
```typescript
function calculateEnhancedPerplexityBonus($: cheerio.CheerioAPI): number {
  let bonus = calculatePerplexityBonus($); // 기존 보너스
  
  // 최신 업데이트 강화 (+18점, 기존 +15점)
  const hasDate = $('time, [datetime], [class*="date"]').length > 0;
  const hasRecentYear = /(202[4-9]|최근|recent|updated|latest)/i.test($('body').text());
  if (hasDate && hasRecentYear) bonus += 3; // 추가 +3점
  
  // 출처 링크 강화 (+10점, 기존 +7점)
  const externalLinks = $('a[href^="http"]').length;
  if (externalLinks >= 10) bonus += 3; // 추가 +3점
  
  // 데이터/통계 포함 (+8점, 신규)
  const text = $('body').text();
  const hasStatistics = /\d+%|\d+\.\d+%|통계|statistics/i.test(text);
  const hasCharts = $('canvas, svg, [class*="chart"]').length > 0;
  if (hasStatistics && hasCharts) bonus += 8;
  
  return Math.min(50, bonus); // 최대 보너스 증가 (40점 → 50점)
}
```

**Claude 보너스 강화**
```typescript
function calculateEnhancedClaudeBonus($: cheerio.CheerioAPI): number {
  let bonus = calculateClaudeBonus($); // 기존 보너스
  
  const text = $('body').text();
  const wordCount = text.split(/\s+/).length;
  
  // 주요 출처 강화 (+15점, 기존 +12점)
  const hasPrimarySources = /pubmed|arxiv|doi|\.edu|\.gov|primary source|주요 출처/i.test(text);
  if (hasPrimarySources) bonus += 3; // 추가 +3점
  
  // 콘텐츠 길이 강화 (+12점, 기존 +10점)
  if (wordCount >= 3000) bonus += 2; // 추가 +2점
  
  // 방법론 명시 강화 (+10점, 기존 +8점)
  const hasMethodology = /방법론|methodology|방법|process|절차|프로세스/i.test(text);
  if (hasMethodology) bonus += 2; // 추가 +2점
  
  return Math.min(50, bonus); // 최대 보너스 증가 (40점 → 50점)
}
```

### 테스트 케이스

```typescript
// 일반 사이트와 블로그의 AIO 점수 비교 테스트
const testCases = [
  {
    url: 'https://company.com',
    isWebsite: true,
    expectedAIOImprovement: 10, // 일반 사이트는 10점 이상 향상 기대
  },
  {
    url: 'https://blog.naver.com/example/123',
    isWebsite: false,
    expectedAIOImprovement: 0, // 블로그는 기존 점수 유지
  },
];
```

### 완료 기준
- ✅ 일반 사이트 전용 AIO 가중치 시스템 구현
- ✅ 보너스 점수 계산 강화 완료
- ✅ AI 모델별 인용 확률 예측 정확도 향상
- ✅ 단위 테스트 통과율 95% 이상

---

## 🔬 Phase 4: 깊이 있는 콘텐츠 분석

### 목표
일반 사이트의 구조적 특성과 신뢰도 신호를 깊이 있게 분석하는 시스템 구축

### 작업 상세

#### 4.1 `lib/content-depth-analyzer.ts` 생성

```typescript
// 파일 구조
export interface ContentStructureAnalysis {
  hierarchy: {
    h1Count: number;
    h2Count: number;
    h3Count: number;
    h4Count: number;
    hierarchyScore: number; // 0-100
  };
  sections: {
    count: number;
    averageLength: number;
    connectivity: number; // 내부 링크 연결성
  };
  contentTypes: {
    informational: boolean;
    guide: boolean;
    comparison: boolean;
    news: boolean;
    faq: boolean;
  };
}

export interface TrustSignalsAnalysis {
  eaat: {
    experience: number; // 0-100
    expertise: number; // 0-100
    authoritativeness: number; // 0-100
    trustworthiness: number; // 0-100
    overall: number; // 0-100
  };
  business: {
    companyInfo: boolean;
    contactInfo: boolean;
    legalPages: boolean;
    certifications: boolean;
    reviews: boolean;
  };
  security: {
    hasSSL: boolean;
    hasSecurityBadge: boolean;
    hasPrivacyPolicy: boolean;
  };
}

export interface InteractionAnalysis {
  forms: number;
  calculators: number;
  comments: boolean;
  socialShare: boolean;
  subscription: boolean;
}

// 주요 함수
export function analyzeContentStructure($: cheerio.CheerioAPI): ContentStructureAnalysis
export function analyzeTrustSignals($: cheerio.CheerioAPI, url: string): TrustSignalsAnalysis
export function analyzeInteractions($: cheerio.CheerioAPI): InteractionAnalysis
```

#### 4.2 콘텐츠 구조 분석 구현

```typescript
function analyzeContentStructure($: cheerio.CheerioAPI): ContentStructureAnalysis {
  // 계층 구조 분석
  const h1Count = $('h1').length;
  const h2Count = $('h2').length;
  const h3Count = $('h3').length;
  const h4Count = $('h4').length;
  
  // 계층 구조 점수 계산
  let hierarchyScore = 0;
  if (h1Count === 1) hierarchyScore += 30; // H1은 1개만
  if (h2Count >= 3) hierarchyScore += 30; // H2는 3개 이상 권장
  if (h3Count >= 5) hierarchyScore += 20; // H3는 5개 이상 권장
  if (h4Count > 0) hierarchyScore += 20; // H4 사용 시 추가 점수
  
  // 섹션 분석
  const sections = $('section, article, [class*="section"]');
  const sectionCount = sections.length;
  const averageLength = calculateAverageSectionLength($, sections);
  const connectivity = calculateInternalLinkConnectivity($);
  
  // 콘텐츠 타입 분석
  const text = $('body').text();
  const contentTypes = {
    informational: /정보|information|소개|about/i.test(text),
    guide: /가이드|guide|튜토리얼|tutorial|방법|how/i.test(text),
    comparison: /비교|compare|vs|대안|alternative/i.test(text),
    news: /뉴스|news|업데이트|update|최신/i.test(text),
    faq: /FAQ|자주 묻는 질문|질문|question/i.test(text),
  };
  
  return {
    hierarchy: { h1Count, h2Count, h3Count, h4Count, hierarchyScore },
    sections: { count: sectionCount, averageLength, connectivity },
    contentTypes,
  };
}
```

#### 4.3 신뢰도 신호 분석 구현

```typescript
function analyzeTrustSignals($: cheerio.CheerioAPI, url: string): TrustSignalsAnalysis {
  const text = $('body').text();
  
  // E-E-A-T 분석
  const experience = analyzeExperience($, text);
  const expertise = analyzeExpertise($, text);
  const authoritativeness = analyzeAuthoritativeness($, text);
  const trustworthiness = analyzeTrustworthiness($, text);
  const eaatOverall = (experience + expertise + authoritativeness + trustworthiness) / 4;
  
  // 비즈니스 신호
  const business = {
    companyInfo: /회사|company|기업|corporation|회사 소개/i.test(text),
    contactInfo: /연락처|contact|전화|phone|이메일|email|주소|address/i.test(text),
    legalPages: hasLegalPages($, url),
    certifications: /인증|certification|ISO|수상|award/i.test(text),
    reviews: /후기|review|평점|rating|리뷰/i.test(text),
  };
  
  // 보안 신호
  const urlObj = new URL(url);
  const security = {
    hasSSL: urlObj.protocol === 'https:',
    hasSecurityBadge: $('[class*="security"], [class*="ssl"], [class*="trust"]').length > 0,
    hasPrivacyPolicy: hasPrivacyPolicy($, url),
  };
  
  return {
    eaat: {
      experience,
      expertise,
      authoritativeness,
      trustworthiness,
      overall: eaatOverall,
    },
    business,
    security,
  };
}

// E-E-A-T 세부 분석 함수들
function analyzeExperience($: cheerio.CheerioAPI, text: string): number {
  let score = 0;
  
  // 실제 경험 기반 콘텐츠 지표
  if (/경험|experience|실제|actual|사례|case/i.test(text)) score += 30;
  if (/사용|use|이용|utilize|적용|apply/i.test(text)) score += 20;
  if (/테스트|test|시험|trial|검증|verify/i.test(text)) score += 20;
  if (/결과|result|성과|outcome|효과|effect/i.test(text)) score += 20;
  if ($('[class*="testimonial"], [class*="review"]').length > 0) score += 10;
  
  return Math.min(100, score);
}

function analyzeExpertise($: cheerio.CheerioAPI, text: string): number {
  let score = 0;
  
  // 전문성 지표
  const hasAuthor = $('script[type="application/ld+json"]').text().includes('author') ||
                   $('[rel="author"], [class*="author"]').length > 0;
  if (hasAuthor) score += 30;
  
  if (/자격|credential|전문가|expert|박사|Ph\.D|인증|certification/i.test(text)) score += 25;
  if (/학위|degree|학력|education|경력|career|경험|experience/i.test(text)) score += 20;
  if (/연구|research|논문|paper|저널|journal/i.test(text)) score += 15;
  if ($('[class*="expert"], [class*="specialist"]').length > 0) score += 10;
  
  return Math.min(100, score);
}

function analyzeAuthoritativeness($: cheerio.CheerioAPI, text: string): number {
  let score = 0;
  
  // 권위성 지표
  if (/인용|citation|출처|source|참고|reference/i.test(text)) score += 25;
  if (/수상|award|인정|recognition|인증|certification/i.test(text)) score += 20;
  if (/언론|media|보도|press|기사|article/i.test(text)) score += 15;
  if ($('[class*="award"], [class*="certification"]').length > 0) score += 20;
  if ($('a[href*=".edu"], a[href*=".gov"]').length > 0) score += 20;
  
  return Math.min(100, score);
}

function analyzeTrustworthiness($: cheerio.CheerioAPI, text: string): number {
  let score = 0;
  
  // 신뢰성 지표
  const urlObj = new URL($('meta[property="og:url"]').attr('content') || window.location.href);
  if (urlObj.protocol === 'https:') score += 30;
  
  if (/개인정보처리방침|privacy policy|이용약관|terms/i.test(text)) score += 25;
  if (/투명|transparent|공개|open|명확|clear/i.test(text)) score += 15;
  if ($('[class*="trust"], [class*="security"]').length > 0) score += 15;
  if ($('time, [datetime]').length > 0) score += 15; // 최신성 표시
  
  return Math.min(100, score);
}
```

#### 4.4 상호작용 요소 분석 구현

```typescript
function analyzeInteractions($: cheerio.CheerioAPI): InteractionAnalysis {
  return {
    forms: $('form').length,
    calculators: $('[class*="calculator"], [class*="calc"]').length,
    comments: $('[class*="comment"], [id*="comment"]').length > 0,
    socialShare: $('[class*="share"], [class*="social"]').length > 0,
    subscription: $('[class*="subscribe"], [class*="newsletter"]').length > 0,
  };
}
```

#### 4.5 인사이트 생성 강화

```typescript
// lib/analyzer.ts의 generateInsights 함수 확장
function generateEnhancedInsights(
  $: cheerio.CheerioAPI,
  aeoScore: number,
  geoScore: number,
  seoScore: number,
  textContext: TextContext,
  contentAnalysis: ContentStructureAnalysis,
  trustAnalysis: TrustSignalsAnalysis
): Insight[] {
  const insights: Insight[] = [];
  
  // 기존 인사이트
  insights.push(...generateInsights($, aeoScore, geoScore, seoScore, textContext));
  
  // 일반 사이트 특화 인사이트
  if (trustAnalysis.eaat.overall < 70) {
    insights.push({
      severity: 'High',
      category: '신뢰도',
      message: 'E-E-A-T 신호가 부족합니다. 작성자 정보, 전문성 증명, 출처 명시를 강화하세요.',
    });
  }
  
  if (!trustAnalysis.business.companyInfo) {
    insights.push({
      severity: 'Medium',
      category: '비즈니스',
      message: '회사 정보가 없습니다. 회사 소개 페이지와 연락처 정보를 추가하세요.',
    });
  }
  
  if (contentAnalysis.hierarchy.hierarchyScore < 60) {
    insights.push({
      severity: 'Medium',
      category: '구조',
      message: '콘텐츠 계층 구조를 개선하세요. H1 1개, H2 3개 이상, H3 5개 이상을 권장합니다.',
    });
  }
  
  return insights;
}
```

### 테스트 케이스

```typescript
// 다양한 일반 사이트의 구조 및 신뢰도 분석 테스트
const testCases = [
  {
    url: 'https://company.com',
    expectedStructureScore: 70,
    expectedEATScore: 75,
    expectedTrustScore: 80,
  },
  // ...
];
```

### 완료 기준
- ✅ 콘텐츠 구조 분석 시스템 구현
- ✅ E-E-A-T 신호 분석 시스템 구현
- ✅ 비즈니스 신뢰도 분석 시스템 구현
- ✅ 일반 사이트 특화 인사이트 생성
- ✅ 단위 테스트 통과율 95% 이상

---

## 🔗 Phase 5: 통합 및 테스트

### 목표
모든 강화 모듈을 통합하고 전체 시스템 테스트 및 최적화

### 작업 상세

#### 5.1 `lib/website-analyzer.ts` 생성

```typescript
// 파일 구조
import { calculateEnhancedSEOScore, calculateEnhancedAEOScore, calculateEnhancedGEOScore } from './enhanced-scoring';
import { analyzeContentStructure, analyzeTrustSignals, analyzeInteractions } from './content-depth-analyzer';
import { calculateAIOCitationScores } from './ai-citation-analyzer';
import { calculateAIVisibilityScore } from './ai-visibility-calculator';

export async function analyzeWebsiteContent(
  html: string,
  url: string
): Promise<AnalysisResult> {
  const $ = cheerio.load(html);
  const textContext = getTextContext($);
  
  // 강화된 점수 계산
  const seoScore = calculateEnhancedSEOScore($);
  const aeoScore = calculateEnhancedAEOScore($, textContext);
  const geoScore = calculateEnhancedGEOScore($, textContext);
  
  // 점수 정규화 (100점 기준으로 변환)
  const normalizedSEOScore = Math.round((seoScore / 120) * 100);
  const normalizedAEOScore = Math.round((aeoScore / 130) * 100);
  const normalizedGEOScore = Math.round((geoScore / 140) * 100);
  
  const overallScore = Math.round((normalizedSEOScore + normalizedAEOScore + normalizedGEOScore) / 3);
  
  // 깊이 있는 콘텐츠 분석
  const contentStructure = analyzeContentStructure($);
  const trustSignals = analyzeTrustSignals($, url);
  const interactions = analyzeInteractions($);
  
  // AIO 점수 계산 (일반 사이트 강화 가중치 적용)
  const aioScores = calculateAIOCitationScores($, normalizedAEOScore, normalizedGEOScore, normalizedSEOScore, undefined, true);
  const aioAnalysis = generateAIOCitationAnalysis(aioScores);
  
  // AI Visibility 점수
  const aiVisibilityScore = calculateAIVisibilityScore($, aioScores, normalizedAEOScore, normalizedGEOScore, normalizedSEOScore);
  const aiVisibilityRecommendations = generateAIVisibilityRecommendations(/* ... */);
  
  // 강화된 인사이트 생성
  const insights = generateEnhancedInsights($, normalizedAEOScore, normalizedGEOScore, normalizedSEOScore, textContext, contentStructure, trustSignals);
  
  // 기타 분석 (인용, 도메인 등)
  // ...
  
  return {
    aeoScore: normalizedAEOScore,
    geoScore: normalizedGEOScore,
    seoScore: normalizedSEOScore,
    overallScore,
    insights,
    aioAnalysis,
    aiVisibilityScore,
    aiVisibilityRecommendations,
    // ... 기타 필드
  };
}
```

#### 5.2 `lib/analyzer.ts` 최종 수정

```typescript
export async function analyzeContent(url: string): Promise<AnalysisResult> {
  // ... (기존 URL 검증 및 HTML fetch 로직)
  
  // 블로그 플랫폼 감지
  const blogDetection = detectBlogPlatform(url, html);
  
  if (blogDetection.isBlog) {
    // 블로그 분석
    if (blogDetection.platform.type === 'naver') {
      return await analyzeNaverBlogContent(html, url);
    }
    // 향후 다른 블로그 플랫폼 지원 확장 가능
    console.log(`⚠️ [Analyzer] ${blogDetection.platform.type} 블로그는 현재 네이버 블로그만 지원됩니다.`);
  }
  
  // 일반 사이트 강화 분석
  console.log('✅ [Analyzer] 일반 사이트 강화 분석 시작');
  return await analyzeWebsiteContent(html, url);
}
```

#### 5.3 통합 테스트

**테스트 시나리오**

1. **블로그 감지 테스트**
   - 다양한 블로그 플랫폼 URL 테스트
   - 일반 사이트 URL 테스트
   - 감지 정확도 검증

2. **점수 계산 테스트**
   - 일반 사이트 점수 계산 정확도
   - 블로그와 일반 사이트 점수 차이 검증
   - 점수 정규화 검증

3. **AIO 점수 테스트**
   - 일반 사이트 AIO 점수 향상 검증
   - AI 모델별 인용 확률 예측 정확도

4. **콘텐츠 분석 테스트**
   - 구조 분석 정확도
   - 신뢰도 신호 분석 정확도
   - 인사이트 생성 품질

5. **성능 테스트**
   - 분석 시간 측정
   - 메모리 사용량 측정
   - 동시 요청 처리 테스트

**테스트 데이터셋**

```typescript
const testDataset = {
  blogs: [
    'https://blog.naver.com/example/123',
    'https://example.tistory.com/123',
    'https://brunch.co.kr/@user/123',
  ],
  websites: [
    'https://company.com',
    'https://service.com',
    'https://product.com',
    'https://news.com',
  ],
};
```

#### 5.4 성능 최적화

- 블로그 감지 결과 캐싱
- HTML 파싱 최적화
- 점수 계산 병렬 처리 (가능한 경우)
- 불필요한 DOM 조회 최소화

#### 5.5 문서화

- API 문서 업데이트
- 사용자 가이드 작성
- 개발자 가이드 작성

### 완료 기준
- ✅ 모든 모듈 통합 완료
- ✅ 통합 테스트 통과율 95% 이상
- ✅ 성능 기준 충족 (분석 시간 10초 이내)
- ✅ 문서화 완료
- ✅ 프로덕션 배포 준비 완료

---

## 📊 진행 상황 추적

### 체크리스트

#### Phase 1: 블로그 감지 시스템
- [ ] `lib/blog-detector.ts` 생성
- [ ] 주요 블로그 플랫폼 감지 로직 구현
- [ ] `lib/analyzer.ts` 통합
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 완료

#### Phase 2: 강화된 점수 계산
- [ ] `lib/enhanced-scoring.ts` 생성
- [ ] SEO 점수 강화 구현
- [ ] AEO 점수 강화 구현
- [ ] GEO 점수 강화 구현
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 완료

#### Phase 3: AIO 가중치 강화
- [ ] `lib/algorithm-defaults.ts` 수정
- [ ] 일반 사이트 가중치 추가
- [ ] 보너스 계산 강화
- [ ] `lib/ai-citation-analyzer.ts` 수정
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 완료

#### Phase 4: 깊이 있는 콘텐츠 분석
- [ ] `lib/content-depth-analyzer.ts` 생성
- [ ] 콘텐츠 구조 분석 구현
- [ ] 신뢰도 신호 분석 구현
- [ ] 상호작용 요소 분석 구현
- [ ] 인사이트 생성 강화
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 완료

#### Phase 5: 통합 및 테스트
- [ ] `lib/website-analyzer.ts` 생성
- [ ] 모든 모듈 통합
- [ ] 통합 테스트 완료
- [ ] 성능 최적화
- [ ] 문서화 완료
- [ ] 프로덕션 배포

---

## 🚀 배포 계획

### 단계별 배포

1. **Phase 1 배포** (1주차)
   - 블로그 감지 시스템만 먼저 배포
   - 기존 분석 로직 유지

2. **Phase 2-3 배포** (3-4주차)
   - 강화된 점수 계산 및 AIO 가중치 배포
   - 점수 정규화로 기존 결과와 호환성 유지

3. **Phase 4 배포** (6주차)
   - 깊이 있는 콘텐츠 분석 배포
   - 추가 인사이트 제공

4. **Phase 5 배포** (7주차)
   - 전체 시스템 통합 배포
   - 최종 최적화 및 문서화

### 롤백 계획

- 각 Phase별 기능 플래그 추가
- 문제 발생 시 즉시 롤백 가능
- 기존 분석 로직 백업 유지

---

## 📝 참고 사항

### 기술 스택
- TypeScript
- Cheerio (HTML 파싱)
- Node.js

### 의존성
- 기존 `lib/analyzer.ts` 모듈
- 기존 `lib/ai-citation-analyzer.ts` 모듈
- 기존 `lib/seo-guidelines.ts` 모듈

### 주의사항
- 기존 분석 결과와의 호환성 유지
- 점수 정규화를 통한 일관성 유지
- 성능 최적화 고려
- 에러 처리 및 예외 상황 대응
