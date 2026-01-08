# LLM Pulse Prompt Tracking 기능 분석 및 접목 방안

## 📋 목차
1. [LLM Pulse 주요 기능 분석](#llm-pulse-주요-기능-분석)
2. [주요 기능 구현에 필요한 기술 스펙](#주요-기능-구현에-필요한-기술-스펙)
3. [현재 서비스에 접목할 수 있는 요소](#현재-서비스에-접목할-수-있는-요소)
4. [구현 우선순위 및 로드맵](#구현-우선순위-및-로드맵)

---

## LLM Pulse 주요 기능 분석

### 1. Prompt Tracking (프롬프트 추적)

#### 핵심 기능
- **실제 AI 플랫폼 실행**: ChatGPT, Perplexity, Gemini, Claude 등 실제 AI 플랫폼에서 프롬프트를 실행
- **자동 모니터링**: 정기적으로 (일일/주간/커스텀) 프롬프트를 실행하여 응답 추적
- **응답 캡처**: 전체 응답 텍스트, 인용 URL, 브랜드 언급, 감정 분석 등 포괄적 데이터 수집
- **다중 플랫폼 지원**: 여러 AI 모델에서 동일 프롬프트 실행 및 비교

#### 작동 방식
1. 사용자가 추적할 프롬프트 등록 (예: "최고의 SEO 도구는?")
2. 시스템이 정기적으로 각 AI 플랫폼에서 프롬프트 실행
3. 응답 데이터 수집 및 분석
4. 대시보드에서 결과 시각화 및 추적

### 2. Citation Sources Analysis (인용 소스 분석) ⭐

#### 핵심 기능
- **Source Tracking (소스 추적)**: AI 응답에서 인용된 모든 웹사이트, 아티클, 도메인 자동 식별 및 카탈로그화
- **인용 위치 추적 (Citation Position)**: 각 인용이 응답의 어느 위치에 나타나는지 추적 (1st, 2nd, 3rd 등)
  - **첫 번째 위치의 중요성**: 첫 번째 인용은 더 많은 클릭과 신뢰를 가져오며, 브랜드를 해당 주제의 권위 있는 소스로 확립
- **Domain Analysis (도메인 분석)**: 
  - 가장 자주 인용되는 도메인 식별
  - 도메인 권위성 평가 (Domain Authority)
  - AI 응답에서의 신뢰도 평가
- **Quality Control (품질 관리)**: 
  - 오래된 소스 감지 (Outdated sources)
  - 부정확한 정보 소스 식별 (Inaccurate sources)
  - 브랜드에 대한 부정적 소스 감지 (Negative sources)
- **Opportunity Discovery (기회 발견)**: 
  - 높은 권위를 가진 도메인 중 아직 사용자를 인용하지 않은 도메인 식별
  - 인용 획득 전략 수립을 위한 타겟 도메인 제시
- **Competitive Intelligence (경쟁 정보)**: 
  - 경쟁사가 인용되는 소스 분석
  - 경쟁사의 인용 우위 이해
  - 경쟁사가 인용되지만 사용자는 인용되지 않는 고가치 도메인 식별
- **Content Strategy (콘텐츠 전략)**: 
  - 어떤 유형의 콘텐츠가 인용되는지 분석
  - 인용 가능한 콘텐츠 형식 및 주제 파악
  - 콘텐츠 전략 최적화 제안

#### 작동 방식
1. **자동 인용 추출**: AI 응답에서 모든 인용 URL 자동 식별 및 카탈로그화
2. **분류 및 분석**: 
   - 사용자 도메인 vs 경쟁사 vs 제3자 참조로 분류
   - 인용 위치 기록 (1st, 2nd, 3rd 등)
   - 도메인별 인용 빈도 계산
3. **패턴 분석**: 
   - 인용 빈도, 도메인 권위, 콘텐츠 품질, 시간에 따른 트렌드 분석
4. **액션 가능한 인사이트**: 
   - 더 나은 콘텐츠 생성
   - 인용 도메인과의 관계 구축
   - 인용 프로필 개선 전략

#### 주요 사용 사례
- **PR 전략**: AI가 신뢰하는 출판물 파악 및 고인용 도메인에 대한 PR 우선순위 설정
- **콘텐츠 기획**: AI 모델이 가장 인용할 가능성이 높은 형식 및 주제의 콘텐츠 생성
- **평판 보호**: 더 많은 AI 응답에 영향을 미치기 전에 부정적이거나 부정확한 소스 식별 및 대응
- **SEO & AEO 전략**: 전통적인 검색 순위와 AI 인용을 모두 구동하는 소스에 최적화

#### 인용 위치의 중요성
- **첫 번째 위치 인용**: 사용자가 경쟁사보다 먼저 콘텐츠를 보게 되며, 더 많은 클릭과 브랜드를 해당 주제의 권위 있는 소스로 확립
- **위치별 클릭률**: 일반적으로 첫 번째 인용이 가장 높은 클릭률을 보임
- **신뢰도**: 응답 상단에 인용된 소스는 더 신뢰할 수 있는 것으로 인식됨

#### AI가 일반적으로 인용하는 소스 유형
- 주요 출판물 (Major publications)
- 공식 문서 (Official documentation)
- 업계 리포트 (Industry reports)
- 잘 구축된 블로그 (Well-established blogs)
- 높은 E-E-A-T 신호를 가진 페이지 (Experience, Expertise, Authoritativeness, Trustworthiness)

### 3. Brand Visibility (브랜드 가시성)

#### 핵심 기능
- **브랜드 언급 감지**: AI 응답에서 브랜드명, 제품명 자동 감지
- **가시성 점수**: 브랜드가 얼마나 자주, 어떤 맥락에서 언급되는지 측정
- **경쟁사 비교**: 경쟁 브랜드와의 가시성 비교
- **트렌드 분석**: 시간에 따른 브랜드 가시성 변화 추적

### 4. Sentiment Tracking (감정 분석)

#### 핵심 기능
- **감정 점수**: 긍정/중립/부정 감정 분석
- **감정 변화 추적**: 시간에 따른 감정 변화 모니터링
- **이슈 감지**: 부정적 감정 급증 시 알림

### 5. Real-Time Monitoring (실시간 모니터링)

#### 핵심 기능
- **자동 실행**: 스케줄링된 프롬프트 자동 실행
- **변화 감지**: 응답 내용의 변화 자동 감지
- **알림 시스템**: 중요한 변화 발생 시 즉시 알림

### 6. Historical Data (히스토리 데이터)

#### 핵심 기능
- **시계열 데이터**: 시간에 따른 응답 변화 추적
- **트렌드 분석**: 장기적인 트렌드 파악
- **비교 분석**: 과거와 현재 응답 비교

### 7. Analytics & Reporting (분석 및 리포팅)

#### 핵심 기능
- **종합 대시보드**: 모든 추적 데이터를 한눈에 볼 수 있는 대시보드
- **커스텀 리포트**: 특정 기간, 특정 프롬프트에 대한 리포트 생성
- **경쟁 분석**: 경쟁사와의 비교 리포트
- **최적화 기회 식별**: 개선이 필요한 영역 자동 식별

---

## 주요 기능 구현에 필요한 기술 스펙

### 1. AI 플랫폼 통합

#### 기술 스택
```typescript
// 필요한 기술
- Puppeteer / Playwright: 브라우저 자동화 (실제 AI 플랫폼 접근)
- Selenium: 대안 브라우저 자동화 도구
- API 통합: 가능한 경우 공식 API 사용 (ChatGPT API, Claude API 등)
```

#### 구현 요구사항
- **브라우저 자동화**: 실제 사용자처럼 AI 플랫폼에 접근
- **세션 관리**: 로그인 상태 유지 및 쿠키 관리
- **Rate Limiting 처리**: AI 플랫폼의 요청 제한 처리
- **에러 핸들링**: 타임아웃, 차단, 캡차 등 예외 상황 처리
- **프록시/로테이션**: IP 차단 방지를 위한 프록시 시스템

#### 기술적 도전 과제
1. **캡차 우회**: reCAPTCHA, hCaptcha 등 자동화 감지 우회
2. **동적 콘텐츠 로딩**: JavaScript 기반 동적 로딩 대기
3. **세션 유지**: 장기간 세션 유지 및 갱신
4. **비용 관리**: API 사용량 및 비용 모니터링

### 2. 데이터 수집 및 파싱

#### 기술 스택
```typescript
// 데이터 수집
- Cheerio: HTML 파싱 (이미 사용 중)
- Puppeteer: 동적 콘텐츠 추출
- Natural Language Processing: 텍스트 분석
```

#### 구현 요구사항
- **응답 텍스트 추출**: AI 응답의 전체 텍스트 추출
- **인용 URL 파싱**: 응답 내 링크 및 인용 추출
- **구조화된 데이터 저장**: 데이터베이스에 체계적으로 저장
- **중복 제거**: 동일 응답 중복 저장 방지

### 3. 브랜드 감지 및 분석

#### 기술 스택
```typescript
// NLP 및 분석
- Natural: 자연어 처리 라이브러리
- Sentiment: 감정 분석 라이브러리
- 정규표현식: 패턴 매칭
```

#### 구현 요구사항
- **엔티티 인식**: 브랜드명, 제품명 자동 인식
- **동의어 처리**: 다양한 브랜드명 변형 처리
- **컨텍스트 분석**: 브랜드가 언급된 맥락 분석
- **경쟁사 비교**: 여러 브랜드 동시 추적 및 비교

### 4. 스케줄링 시스템

#### 기술 스택
```typescript
// 스케줄링
- node-cron: Node.js 크론 작업
- Bull / BullMQ: Redis 기반 작업 큐
- Agenda: MongoDB 기반 작업 스케줄러
```

#### 구현 요구사항
- **유연한 스케줄링**: 일일/주간/월간/커스텀 주기 설정
- **작업 큐 관리**: 우선순위 기반 작업 처리
- **재시도 로직**: 실패한 작업 자동 재시도
- **모니터링**: 작업 실행 상태 모니터링

### 5. 알림 시스템

#### 기술 스택
```typescript
// 알림
- Nodemailer: 이메일 알림
- Webhook: 외부 시스템 연동
- WebSocket: 실시간 알림
- Push Notifications: 브라우저 푸시 알림
```

#### 구현 요구사항
- **다중 채널**: 이메일, 웹훅, 인앱 알림 지원
- **알림 규칙**: 사용자 정의 알림 조건
- **알림 집계**: 중복 알림 방지 및 집계

### 6. 데이터베이스 스키마

#### 필요한 테이블
```sql
-- 프롬프트 추적
CREATE TABLE prompt_tracking (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  prompt_text TEXT NOT NULL,
  schedule_frequency TEXT, -- 'daily', 'weekly', 'monthly', 'custom'
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 프롬프트 실행 결과
CREATE TABLE prompt_executions (
  id INTEGER PRIMARY KEY,
  prompt_tracking_id INTEGER,
  ai_platform TEXT NOT NULL, -- 'chatgpt', 'perplexity', 'gemini', 'claude'
  response_text TEXT,
  execution_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  execution_status TEXT, -- 'success', 'failed', 'timeout'
  FOREIGN KEY (prompt_tracking_id) REFERENCES prompt_tracking(id)
);

-- 인용 소스 (강화된 스키마)
CREATE TABLE citations (
  id INTEGER PRIMARY KEY,
  execution_id INTEGER,
  url TEXT NOT NULL,
  citation_position INTEGER NOT NULL, -- 응답 내 위치 (1st, 2nd, 3rd 등)
  domain TEXT NOT NULL,
  domain_authority INTEGER, -- 도메인 권위 점수 (0-100)
  is_target_url BOOLEAN DEFAULT 0, -- 추적 중인 URL인지
  is_competitor BOOLEAN DEFAULT 0, -- 경쟁사 URL인지
  is_negative BOOLEAN DEFAULT 0, -- 부정적 소스인지
  is_outdated BOOLEAN DEFAULT 0, -- 오래된 소스인지
  citation_context TEXT, -- 인용된 맥락
  citation_frequency INTEGER DEFAULT 1, -- 인용 빈도
  eeat_score REAL, -- E-E-A-T 점수 (0-1)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (execution_id) REFERENCES prompt_executions(id)
);

-- 도메인 분석
CREATE TABLE domain_analysis (
  id INTEGER PRIMARY KEY,
  domain TEXT UNIQUE NOT NULL,
  total_citations INTEGER DEFAULT 0,
  average_position REAL, -- 평균 인용 위치
  domain_authority INTEGER,
  citation_trend TEXT, -- 'increasing', 'decreasing', 'stable'
  is_high_authority BOOLEAN DEFAULT 0,
  is_opportunity BOOLEAN DEFAULT 0, -- 인용 기회 도메인인지
  last_analyzed DATETIME,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 경쟁사 인용 비교
CREATE TABLE competitor_citations (
  id INTEGER PRIMARY KEY,
  target_url TEXT NOT NULL,
  competitor_url TEXT NOT NULL,
  citation_count INTEGER DEFAULT 0,
  competitor_citation_count INTEGER DEFAULT 0,
  gap INTEGER, -- 인용 빈도 차이
  high_value_domains TEXT, -- 경쟁사가 인용되지만 타겟은 아닌 고가치 도메인
  analysis_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 브랜드 언급
CREATE TABLE brand_mentions (
  id INTEGER PRIMARY KEY,
  execution_id INTEGER,
  brand_name TEXT NOT NULL,
  mention_context TEXT,
  sentiment_score REAL, -- -1 to 1
  mention_position INTEGER,
  FOREIGN KEY (execution_id) REFERENCES prompt_executions(id)
);

-- 감정 분석
CREATE TABLE sentiment_analysis (
  id INTEGER PRIMARY KEY,
  execution_id INTEGER,
  overall_sentiment TEXT, -- 'positive', 'neutral', 'negative'
  sentiment_score REAL,
  confidence REAL,
  FOREIGN KEY (execution_id) REFERENCES prompt_executions(id)
);
```

### 7. 대시보드 및 시각화

#### 기술 스택
```typescript
// 시각화 (이미 사용 중)
- Chart.js / react-chartjs-2: 차트 라이브러리
- Recharts: React 차트 라이브러리
- D3.js: 고급 시각화 (선택적)
```

#### 구현 요구사항
- **실시간 업데이트**: 새로운 실행 결과 즉시 반영
- **인터랙티브 차트**: 필터링, 줌, 드릴다운 기능
- **비교 뷰**: 여러 프롬프트, 여러 플랫폼 동시 비교
- **트렌드 분석**: 시계열 차트 및 트렌드 라인

---

## 현재 서비스에 접목할 수 있는 요소

### 🎯 즉시 접목 가능한 요소 (High Priority)

#### 1. 실제 AI 플랫폼 프롬프트 실행 및 추적

**현재 상태:**
- AI 모델별 인용 확률을 **시뮬레이션**으로 계산
- 실제 AI 플랫폼에서의 응답을 확인하지 않음

**개선 방안:**
```typescript
// 새로운 기능: 실제 AI 플랫폼 프롬프트 실행
interface PromptTracking {
  // 사용자가 추적할 프롬프트 등록
  prompt: string; // 예: "최고의 SEO 분석 도구는?"
  targetUrl: string; // 분석한 콘텐츠 URL
  aiPlatforms: ('chatgpt' | 'perplexity' | 'gemini' | 'claude')[];
  schedule: 'daily' | 'weekly' | 'monthly';
}

// 실행 결과 저장
interface PromptExecution {
  promptTrackingId: number;
  platform: string;
  response: string;
  citations: Citation[];
  brandMentions: BrandMention[];
  sentiment: SentimentAnalysis;
  executedAt: Date;
}
```

**접목 방법:**
1. **프롬프트 추적 기능 추가**
   - 분석 결과 페이지에 "이 콘텐츠에 대한 AI 응답 추적하기" 버튼 추가
   - 사용자가 추적할 프롬프트 등록 (예: "이 블로그 포스트의 주요 내용은?")
   - 정기적으로 실제 AI 플랫폼에서 실행

2. **실제 인용 확인**
   - 현재는 시뮬레이션으로 인용 확률 계산
   - 실제 AI 응답에서 콘텐츠가 인용되었는지 확인
   - 인용 위치 및 맥락 추적

3. **브랜드 가시성 추적**
   - 사용자의 블로그/웹사이트가 AI 응답에서 언급되는지 추적
   - 경쟁사와의 가시성 비교
   - 시간에 따른 가시성 변화 모니터링

**기술 구현:**
```typescript
// lib/prompt-tracker.ts
import puppeteer from 'puppeteer';

export async function executePromptOnPlatform(
  platform: 'chatgpt' | 'perplexity' | 'gemini' | 'claude',
  prompt: string
): Promise<PromptExecutionResult> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // 플랫폼별 접근 로직
    switch (platform) {
      case 'chatgpt':
        return await executeOnChatGPT(page, prompt);
      case 'perplexity':
        return await executeOnPerplexity(page, prompt);
      case 'gemini':
        return await executeOnGemini(page, prompt);
      case 'claude':
        return await executeOnClaude(page, prompt);
    }
  } finally {
    await browser.close();
  }
}

async function executeOnPerplexity(
  page: Page,
  prompt: string
): Promise<PromptExecutionResult> {
  await page.goto('https://www.perplexity.ai/');
  await page.type('textarea[placeholder*="Ask"]', prompt);
  await page.keyboard.press('Enter');
  
  // 응답 대기
  await page.waitForSelector('.prose', { timeout: 30000 });
  
  // 응답 텍스트 추출
  const responseText = await page.evaluate(() => {
    return document.querySelector('.prose')?.textContent || '';
  });
  
  // 인용 URL 추출
  const citations = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href^="http"]'));
    return links.map(link => ({
      url: link.getAttribute('href'),
      text: link.textContent?.trim()
    }));
  });
  
  return {
    response: responseText,
    citations,
    executedAt: new Date()
  };
}
```

#### 2. 인용 소스 분석 강화 ⭐ (Citation Sources Analysis)

**현재 상태:**
- AI 모델별 인용 확률을 **시뮬레이션**으로 계산
- 실제 인용된 URL 추적 없음
- 인용 위치, 도메인 권위성, 품질 평가 없음

**개선 방안:**
```typescript
// 강화된 인용 소스 분석
interface CitationSourcesAnalysis {
  // 기본 인용 정보
  url: string;
  domain: string;
  citationPosition: number; // 1st, 2nd, 3rd 등 (매우 중요!)
  citationContext: string; // 인용된 맥락
  
  // 도메인 분석
  domainAuthority: number; // 0-100
  citationFrequency: number; // 얼마나 자주 인용되는지
  averagePosition: number; // 평균 인용 위치
  
  // 분류
  isTargetUrl: boolean; // 추적 중인 URL인지
  isCompetitor: boolean; // 경쟁사 URL인지
  isThirdParty: boolean; // 제3자 참조인지
  
  // 품질 평가
  isNegative: boolean; // 부정적 소스인지
  isOutdated: boolean; // 오래된 소스인지
  isInaccurate: boolean; // 부정확한 소스인지
  eeatScore: number; // E-E-A-T 점수 (0-1)
  
  // 기회 발견
  isOpportunity: boolean; // 높은 권위 도메인 중 미인용 도메인인지
  opportunityScore: number; // 인용 획득 가능성 점수
  
  // 경쟁 분석
  competitorCitations: CompetitorCitation[];
  gap: number; // 경쟁사와의 인용 빈도 차이
  highValueDomains: string[]; // 경쟁사가 인용되지만 타겟은 아닌 도메인
}

interface CompetitorCitation {
  competitorUrl: string;
  citationCount: number;
  averagePosition: number;
  topDomains: string[]; // 경쟁사가 가장 많이 인용되는 도메인
}
```

**접목 방법:**

1. **Source Tracking (소스 추적)**
   - AI 응답에서 인용된 모든 URL 자동 추출
   - 사용자의 콘텐츠 URL이 인용되었는지 확인
   - 인용 위치 정확히 기록 (1st, 2nd, 3rd 등)
   - 인용 맥락(context) 추출 및 저장

2. **Domain Analysis (도메인 분석)**
   - 도메인별 인용 빈도 집계
   - 도메인 권위성 점수 계산 (Domain Authority)
   - 평균 인용 위치 계산
   - 인용 트렌드 분석 (증가/감소/안정)

3. **Quality Control (품질 관리)**
   - **오래된 소스 감지**: 콘텐츠 업데이트 날짜 확인
   - **부정확한 소스 식별**: 신뢰할 수 없는 출처 감지
   - **부정적 소스 감지**: 브랜드에 대한 부정적 언급 포함 소스 식별
   - **E-E-A-T 평가**: Experience, Expertise, Authoritativeness, Trustworthiness 점수 계산

4. **Opportunity Discovery (기회 발견)**
   - 높은 권위를 가진 도메인 목록 생성
   - 사용자가 아직 인용되지 않은 고권위 도메인 식별
   - 인용 획득 가능성 점수 계산
   - PR 및 콘텐츠 전략 제안

5. **Competitive Intelligence (경쟁 정보)**
   - 경쟁사 URL 등록 및 추적
   - 경쟁사가 인용되는 소스 분석
   - 경쟁사가 인용되지만 사용자는 아닌 고가치 도메인 식별
   - 인용 빈도 차이(gap) 계산 및 개선 제안

6. **Content Strategy (콘텐츠 전략)**
   - 어떤 유형의 콘텐츠가 가장 많이 인용되는지 분석
   - 인용 가능한 콘텐츠 형식 및 주제 파악
   - 콘텐츠 최적화 제안 생성

**기술 구현:**
```typescript
// lib/citation-analyzer.ts
export interface CitationExtractionResult {
  citations: Citation[];
  domainAnalysis: DomainAnalysis;
  opportunities: Opportunity[];
  competitorComparison: CompetitorComparison;
}

export async function analyzeCitations(
  executionId: number,
  responseText: string,
  targetUrl: string,
  competitorUrls: string[]
): Promise<CitationExtractionResult> {
  // 1. 인용 URL 추출
  const citations = extractCitations(responseText);
  
  // 2. 인용 위치 계산
  const positionedCitations = calculateCitationPositions(citations, responseText);
  
  // 3. 도메인 분석
  const domainAnalysis = await analyzeDomains(positionedCitations);
  
  // 4. 품질 평가
  const qualityChecked = await checkCitationQuality(positionedCitations);
  
  // 5. 기회 발견
  const opportunities = await findOpportunities(domainAnalysis, targetUrl);
  
  // 6. 경쟁사 비교
  const competitorComparison = await compareCompetitors(
    positionedCitations,
    targetUrl,
    competitorUrls
  );
  
  return {
    citations: qualityChecked,
    domainAnalysis,
    opportunities,
    competitorComparison
  };
}

// 인용 위치 계산 (매우 중요!)
function calculateCitationPositions(
  citations: Citation[],
  responseText: string
): PositionedCitation[] {
  // 응답 텍스트에서 각 인용의 첫 번째 등장 위치 찾기
  return citations.map((citation, index) => {
    const position = responseText.indexOf(citation.url);
    const relativePosition = calculateRelativePosition(position, responseText.length);
    
    return {
      ...citation,
      position: index + 1, // 1st, 2nd, 3rd 등
      relativePosition, // 0-1 사이 값
      isFirst: index === 0 // 첫 번째 인용인지
    };
  });
}

// 도메인 권위성 평가
async function analyzeDomains(
  citations: PositionedCitation[]
): Promise<DomainAnalysis> {
  const domainMap = new Map<string, DomainStats>();
  
  for (const citation of citations) {
    const domain = extractDomain(citation.url);
    const stats = domainMap.get(domain) || {
      domain,
      totalCitations: 0,
      positions: [],
      averagePosition: 0
    };
    
    stats.totalCitations++;
    stats.positions.push(citation.position);
    domainMap.set(domain, stats);
  }
  
  // 평균 위치 계산
  for (const [domain, stats] of domainMap) {
    stats.averagePosition = 
      stats.positions.reduce((a, b) => a + b, 0) / stats.positions.length;
    
    // 도메인 권위성 점수 계산 (외부 API 또는 내부 알고리즘)
    stats.domainAuthority = await calculateDomainAuthority(domain);
  }
  
  return Array.from(domainMap.values());
}

// 기회 발견
async function findOpportunities(
  domainAnalysis: DomainAnalysis[],
  targetUrl: string
): Promise<Opportunity[]> {
  const targetDomain = extractDomain(targetUrl);
  const opportunities: Opportunity[] = [];
  
  // 높은 권위 도메인 중 타겟이 인용되지 않은 도메인 찾기
  for (const domain of domainAnalysis) {
    if (
      domain.domainAuthority >= 70 && // 높은 권위
      domain.domain !== targetDomain && // 타겟 도메인이 아님
      !isTargetCited(domain.domain, targetUrl) // 타겟이 인용되지 않음
    ) {
      opportunities.push({
        domain: domain.domain,
        authority: domain.domainAuthority,
        citationFrequency: domain.totalCitations,
        opportunityScore: calculateOpportunityScore(domain),
        recommendations: generateRecommendations(domain)
      });
    }
  }
  
  return opportunities.sort((a, b) => b.opportunityScore - a.opportunityScore);
}
```

**UI/UX 개선:**
```typescript
// components/CitationSourcesDashboard.tsx
// 인용 소스 분석 전용 대시보드 컴포넌트

interface CitationSourcesDashboardProps {
  analysis: CitationSourcesAnalysis;
  targetUrl: string;
  competitorUrls: string[];
}

export default function CitationSourcesDashboard({
  analysis,
  targetUrl,
  competitorUrls
}: CitationSourcesDashboardProps) {
  return (
    <div className="space-y-6">
      {/* 인용 위치 시각화 */}
      <CitationPositionChart citations={analysis.citations} />
      
      {/* 도메인 분석 */}
      <DomainAnalysisTable domains={analysis.domainAnalysis} />
      
      {/* 품질 관리 알림 */}
      <QualityAlerts 
        negativeSources={analysis.citations.filter(c => c.isNegative)}
        outdatedSources={analysis.citations.filter(c => c.isOutdated)}
      />
      
      {/* 기회 발견 */}
      <OpportunityList opportunities={analysis.opportunities} />
      
      {/* 경쟁사 비교 */}
      <CompetitorComparison 
        comparison={analysis.competitorComparison}
        competitorUrls={competitorUrls}
      />
    </div>
  );
}
```

#### 3. 브랜드 가시성 모니터링

**현재 상태:**
- 브랜드 가시성 추적 기능 없음

**개선 방안:**
```typescript
// 브랜드 가시성 모니터링
interface BrandVisibility {
  brandName: string;
  domain: string;
  mentionCount: number;
  mentionTrend: TrendData[]; // 시간에 따른 언급 추이
  sentiment: SentimentData;
  competitorComparison: CompetitorData[];
  visibilityScore: number; // 0-100
}
```

**접목 방법:**
1. **자동 브랜드 감지**
   - 사용자 블로그/웹사이트 도메인 기반 브랜드명 추출
   - AI 응답에서 브랜드명 자동 감지
   - 다양한 변형 처리 (예: "GAEO Analysis", "GAEO", "gaeo-analysis")

2. **가시성 대시보드**
   - 브랜드가 언급된 프롬프트 목록
   - 언급 빈도 및 트렌드 차트
   - 경쟁사와의 비교

3. **알림 시스템**
   - 브랜드 언급 시 알림
   - 부정적 언급 감지 시 즉시 알림
   - 가시성 급증/급감 시 알림

### 🔄 단계적 접목 가능한 요소 (Medium Priority)

#### 4. 감정 분석 (Sentiment Tracking)

**접목 방법:**
```typescript
// 감정 분석 통합
import { SentimentAnalyzer } from 'natural';

interface SentimentTracking {
  executionId: number;
  overallSentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number; // -1 to 1
  brandSentiment?: BrandSentiment; // 브랜드별 감정
  trend: SentimentTrend[]; // 시간에 따른 감정 변화
}
```

**구현 단계:**
1. Phase 1: 기본 감정 분석 (긍정/중립/부정)
2. Phase 2: 브랜드별 감정 분석
3. Phase 3: 감정 트렌드 분석 및 알림

#### 5. 히스토리 데이터 및 트렌드 분석

**접목 방법:**
```typescript
// 트렌드 분석
interface TrendAnalysis {
  promptId: number;
  metric: 'citation_count' | 'brand_mention' | 'sentiment_score';
  timeRange: DateRange;
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercentage: number;
  dataPoints: TrendDataPoint[];
}
```

**구현 단계:**
1. Phase 1: 기본 시계열 데이터 저장
2. Phase 2: 트렌드 차트 시각화
3. Phase 3: 예측 분석 (선택적)

#### 6. 경쟁사 분석

**접목 방법:**
```typescript
// 경쟁사 분석
interface CompetitorAnalysis {
  competitorUrl: string;
  citationCount: number;
  citationFrequency: number; // 프롬프트당 평균 인용 횟수
  averagePosition: number; // 평균 인용 위치
  sentiment: SentimentData;
  comparison: {
    targetUrl: string;
    gap: number; // 인용 빈도 차이
    recommendations: string[]; // 개선 제안
  };
}
```

**구현 단계:**
1. Phase 1: 경쟁사 URL 등록 및 추적
2. Phase 2: 경쟁사 비교 대시보드
3. Phase 3: 자동 개선 제안

### 💡 장기적 접목 가능한 요소 (Low Priority)

#### 7. 자동 프롬프트 생성

**접목 방법:**
- 분석한 콘텐츠를 기반으로 추적할 프롬프트 자동 생성
- 예: "이 블로그 포스트의 주요 내용은?", "이 주제에 대한 최고의 가이드는?"

#### 8. AI 응답 품질 평가

**접목 방법:**
- AI 응답의 정확성, 관련성, 유용성 평가
- 사용자 피드백과 결합하여 품질 점수 계산

#### 9. 최적화 제안 자동화

**접목 방법:**
- 실제 인용 데이터를 기반으로 콘텐츠 최적화 제안
- A/B 테스트 결과와 결합하여 검증된 제안 제공

---

## 구현 우선순위 및 로드맵

### Phase 1: 기본 프롬프트 추적 (1-2개월)

**목표:** 실제 AI 플랫폼에서 프롬프트 실행 및 기본 추적

**구현 항목:**
1. ✅ 프롬프트 등록 UI
2. ✅ Puppeteer 기반 AI 플랫폼 접근
3. ✅ 응답 데이터 수집 및 저장
4. ✅ 기본 대시보드 (응답 히스토리)

**기술 스택:**
- Puppeteer: 브라우저 자동화
- node-cron: 스케줄링
- 기존 데이터베이스 스키마 확장

**예상 작업량:**
- 백엔드: 3-4주
- 프론트엔드: 2주
- 테스트: 1주

### Phase 2: 인용 소스 분석 강화 (2-3주) ⭐

**목표:** LLM Pulse 수준의 고급 인용 소스 분석 구현

**구현 항목:**
1. ✅ 인용 URL 추출 및 위치 추적 (1st, 2nd, 3rd 등)
2. ✅ 도메인 분석 (권위성, 인용 빈도, 평균 위치)
3. ✅ 품질 관리 (오래된/부정확한/부정적 소스 감지)
4. ✅ 기회 발견 (고권위 미인용 도메인 식별)
5. ✅ 경쟁사 비교 (경쟁사 인용 분석 및 gap 계산)
6. ✅ 콘텐츠 전략 제안 (인용 가능한 콘텐츠 형식 분석)
7. ✅ 인용 소스 분석 대시보드

**기술 스택:**
- Cheerio: HTML 파싱 (이미 사용 중)
- 정규표현식: 패턴 매칭
- Natural: NLP (선택적)
- 외부 API: 도메인 권위성 평가 (선택적, Moz, Ahrefs 등)

**상세 작업 분해:**

**Week 1: 기본 인용 추출 및 위치 추적**
- 인용 URL 추출 로직 구현
- 인용 위치 계산 알고리즘
- 데이터베이스 스키마 확장
- 기본 API 엔드포인트

**Week 2: 도메인 분석 및 품질 관리**
- 도메인 권위성 평가 시스템
- 품질 체크 로직 (오래된/부정확한/부정적 소스)
- E-E-A-T 점수 계산
- 도메인 분석 API

**Week 3: 기회 발견 및 경쟁사 분석**
- 기회 발견 알고리즘
- 경쟁사 비교 로직
- 콘텐츠 전략 제안 생성
- 대시보드 UI 구현

**예상 작업량:**
- 백엔드: 2-3주
- 프론트엔드: 1-2주
- 테스트: 1주

### Phase 3: 감정 분석 및 알림 (1개월)

**목표:** 감정 분석 및 알림 시스템 구축

**구현 항목:**
1. ✅ 감정 분석 통합
2. ✅ 알림 시스템 (이메일, 웹훅)
3. ✅ 알림 규칙 설정 UI
4. ✅ 감정 트렌드 차트

**기술 스택:**
- Natural Sentiment: 감정 분석
- Nodemailer: 이메일 알림
- WebSocket: 실시간 알림 (선택적)

**예상 작업량:**
- 백엔드: 2주
- 프론트엔드: 1주
- 테스트: 1주

### Phase 4: 고급 분석 및 리포트 (1-2개월)

**목표:** 트렌드 분석, 경쟁사 분석, 리포트 생성

**구현 항목:**
1. ✅ 트렌드 분석 대시보드
2. ✅ 경쟁사 비교 기능
3. ✅ 커스텀 리포트 생성
4. ✅ 최적화 제안 자동화

**기술 스택:**
- Chart.js: 고급 차트 (이미 사용 중)
- 통계 라이브러리: 트렌드 계산

**예상 작업량:**
- 백엔드: 3주
- 프론트엔드: 2주
- 테스트: 1주

---

## 기술적 고려사항 및 제약사항

### 1. AI 플랫폼 접근 제한

**문제:**
- 대부분의 AI 플랫폼이 자동화를 차단
- 캡차, Rate Limiting, IP 차단 등

**해결 방안:**
- 공식 API 우선 사용 (가능한 경우)
- 브라우저 자동화 시 인간처럼 행동 (랜덤 딜레이, 마우스 움직임)
- 프록시 로테이션
- 사용자 동의 하에 수동 실행 옵션 제공

### 2. 비용 관리

**문제:**
- 브라우저 자동화는 리소스 집약적
- 대량 실행 시 서버 비용 증가

**해결 방안:**
- 플랜별 실행 빈도 제한
- 캐싱 활용 (동일 프롬프트 중복 실행 방지)
- 배치 처리로 효율화
- 사용자별 할당량 관리

### 3. 데이터 저장 및 관리

**문제:**
- 대량의 응답 데이터 저장 필요
- 장기 보관 시 스토리지 비용 증가

**해결 방안:**
- 데이터 보관 정책 (예: 1년 이상 데이터는 아카이브)
- 압축 저장
- 중요 데이터만 상세 저장
- 사용자별 저장 한도 설정

### 4. 법적 및 윤리적 고려사항

**문제:**
- AI 플랫폼의 이용약관 위반 가능성
- 데이터 수집의 법적 문제

**해결 방안:**
- 이용약관 철저히 검토
- 공개된 정보만 수집
- 사용자 동의 명시
- 데이터 보호 정책 준수

---

## 결론 및 권장사항

### 즉시 시작 가능한 작업

1. **인용 소스 분석 강화** (Phase 2) ⭐ **최우선 추천**
   - **가장 높은 가치**: LLM Pulse의 핵심 차별화 기능
   - **현재 서비스와 완벽한 통합**: 기존 AI 모델별 인용 확률 시뮬레이션을 실제 데이터로 보완
   - **즉시 활용 가능**: 프롬프트 추적 없이도 기존 분석 결과에 적용 가능
   - **명확한 ROI**: 인용 위치, 도메인 분석, 기회 발견 등 실용적 인사이트 제공
   - **기술적 난이도**: 중간 (프롬프트 추적보다 낮음)

2. **프롬프트 추적 기본 기능** (Phase 1)
   - 인용 소스 분석의 데이터 소스
   - 사용자 가치가 명확함
   - 기술적 난이도 중간-높음 (브라우저 자동화 필요)

### 단계적 접근 권장

1. **MVP 먼저**: 기본 프롬프트 추적만으로 시작
2. **사용자 피드백 수집**: 실제 사용 패턴 파악
3. **점진적 확장**: 필요에 따라 기능 추가

### 기술 스택 권장사항

- **브라우저 자동화**: Puppeteer (Playwright 대안 가능)
- **스케줄링**: node-cron (간단한 경우) 또는 Bull (복잡한 경우)
- **감정 분석**: Natural Sentiment (간단한 경우) 또는 더 고급 라이브러리
- **알림**: Nodemailer (이메일) + Webhook (외부 연동)

### 비즈니스 모델 통합

#### 프롬프트 추적
- **Free 플랜**: 월 5개 프롬프트 추적, 주간 실행
- **Pro 플랜**: 무제한 프롬프트, 일일 실행, 고급 분석
- **Business 플랜**: 실시간 모니터링, 경쟁사 분석, 커스텀 리포트

#### 인용 소스 분석
- **Free 플랜**: 기본 인용 추출, 도메인 분석 (제한적)
- **Pro 플랜**: 전체 인용 분석, 품질 관리, 기회 발견, 경쟁사 비교
- **Business 플랜**: 고급 경쟁 분석, 커스텀 리포트, API 액세스

### 추가 권장사항

#### 인용 소스 분석을 먼저 구현하는 이유

1. **독립적 가치**: 프롬프트 추적 없이도 기존 분석 결과에 적용 가능
   - 사용자가 분석한 콘텐츠 URL을 기반으로 수동 프롬프트 실행 결과 입력 가능
   - 또는 외부에서 수집한 AI 응답 데이터를 업로드하여 분석 가능

2. **빠른 시장 진입**: 
   - 프롬프트 추적은 기술적 복잡도가 높음 (브라우저 자동화, 캡차 등)
   - 인용 소스 분석은 상대적으로 구현이 간단하고 즉시 가치 제공

3. **점진적 확장**:
   - Phase 2 (인용 소스 분석) 완료 후
   - Phase 1 (프롬프트 추적)을 통해 자동화된 데이터 수집 추가

4. **사용자 피드백 수집**:
   - 먼저 인용 소스 분석 기능을 출시하여 사용자 반응 확인
   - 실제 사용 패턴을 바탕으로 프롬프트 추적 기능 설계

---

## Citation Sources Analysis 핵심 요약

### 왜 중요한가?

1. **인용 위치의 중요성**
   - 첫 번째 위치 인용은 더 많은 클릭과 신뢰를 가져옴
   - 브랜드를 해당 주제의 권위 있는 소스로 확립
   - 사용자가 경쟁사보다 먼저 콘텐츠를 보게 됨

2. **도메인 권위성 분석**
   - AI가 신뢰하는 도메인 파악
   - 높은 권위 도메인과의 관계 구축 전략 수립
   - PR 및 콘텐츠 전략의 우선순위 설정

3. **품질 관리**
   - 부정적, 오래된, 부정확한 소스 조기 감지
   - 평판 보호 및 대응 전략 수립
   - 콘텐츠 품질 개선 기회 식별

4. **경쟁 우위**
   - 경쟁사가 인용되는 소스 분석
   - 경쟁사가 인용되지만 사용자는 아닌 고가치 도메인 식별
   - 명확한 개선 목표 설정

5. **콘텐츠 전략 최적화**
   - 어떤 유형의 콘텐츠가 인용되는지 데이터 기반 파악
   - 인용 가능한 콘텐츠 형식 및 주제 식별
   - 검증된 콘텐츠 전략 수립

### 구현 우선순위 재조정 권장

**기존 계획:**
1. Phase 1: 프롬프트 추적
2. Phase 2: 인용 소스 분석

**권장 계획:**
1. **Phase 1: 인용 소스 분석** (2-3주) ⭐
   - 독립적으로 가치 제공
   - 기존 분석 결과에 즉시 적용 가능
   - 기술적 난이도 중간
   - 명확한 ROI

2. **Phase 2: 프롬프트 추적** (1-2개월)
   - 인용 소스 분석의 자동화된 데이터 소스
   - 사용자 피드백 기반으로 설계
   - 기술적 난이도 높음

### 핵심 기능 체크리스트

#### 필수 기능 (MVP)
- [ ] 인용 URL 추출
- [ ] 인용 위치 추적 (1st, 2nd, 3rd)
- [ ] 도메인별 인용 빈도 집계
- [ ] 타겟 URL 인용 여부 확인

#### 고급 기능 (Pro)
- [ ] 도메인 권위성 평가
- [ ] 품질 관리 (오래된/부정확한/부정적 소스)
- [ ] 기회 발견 (고권위 미인용 도메인)
- [ ] 경쟁사 비교
- [ ] E-E-A-T 점수 계산

#### 프리미엄 기능 (Business)
- [ ] 실시간 모니터링
- [ ] 커스텀 리포트 생성
- [ ] API 액세스
- [ ] 예측 분석

---

**작성일:** 2025-01-15  
**최종 업데이트:** 2025-01-15 (Citation Sources Analysis 추가)  
**작성자:** AI Assistant  
**상태:** 분석 완료, 구현 준비  
**참고:** [LLM Pulse Citation Sources Analysis](https://llmpulse.ai/features/citation-sources-analysis)

