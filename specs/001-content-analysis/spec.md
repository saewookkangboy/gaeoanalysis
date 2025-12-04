# 콘텐츠 분석 기능 명세서

## 📋 기본 정보

- **기능명**: 콘텐츠 분석 (Content Analysis)
- **목적**: 웹페이지 URL을 입력받아 AEO, GEO, SEO 점수를 계산하고, AI 모델별 인용 확률을 분석하여 콘텐츠 최적화 가이드를 제공
- **우선순위**: High
- **예상 소요 시간**: 이미 구현 완료
- **작성일**: 2025-01-04
- **작성자**: AI Assistant

---

## 👤 사용자 스토리

### 주요 사용자 스토리
```
As a 콘텐츠 마케터/작성자,
I want 웹페이지 URL을 입력하여 SEO/GEO/AEO 점수를 분석받고 싶다,
So that 내 콘텐츠가 AI 검색 엔진에서 더 잘 인용되도록 최적화할 수 있다.
```

### 추가 사용자 스토리
- **사용자 스토리 2**: AI 모델별 인용 확률을 확인하여 특정 AI 모델에 최적화된 콘텐츠를 작성하고 싶다
- **사용자 스토리 3**: 분석 결과를 기반으로 AI Agent와 대화하여 구체적인 개선 방안을 얻고 싶다
- **사용자 스토리 4**: 분석 이력을 저장하여 이전 분석 결과를 다시 확인하고 싶다

---

## 📝 기능 요구사항

### 기능적 요구사항 (Functional Requirements)

#### FR-1: URL 입력 및 검증
- **설명**: 사용자가 웹페이지 URL을 입력하고, 유효성 검증을 수행
- **우선순위**: High
- **수용 기준**:
  - [x] URL 형식 검증 (Zod 스키마)
  - [x] URL sanitization (XSS 방지)
  - [x] 플랫폼별 안내 메시지 (네이버 블로그, 브런치 등)

#### FR-2: HTML 가져오기 및 파싱
- **설명**: URL에서 HTML을 가져와 Cheerio로 파싱
- **우선순위**: High
- **수용 기준**:
  - [x] 재시도 로직 (Exponential Backoff)
  - [x] 타임아웃 설정 (15초)
  - [x] 브라우저 헤더 설정 (User-Agent 등)
  - [x] 리다이렉트 처리
  - [x] 에러 처리 (403, 404 등)

#### FR-3: SEO 점수 계산
- **설명**: 검색 엔진 최적화 점수 계산 (0-100점)
- **우선순위**: High
- **수용 기준**:
  - [x] H1 태그 존재 여부 (20점)
  - [x] Title 태그 최적화 (15점, 60자 이내)
  - [x] Meta description 최적화 (15점, 160자 이내)
  - [x] Alt 텍스트 비율 (10점, 80% 이상)
  - [x] 구조화된 데이터 (10점, JSON-LD)
  - [x] Open Graph 태그 (10점)
  - [x] Canonical URL (5점)
  - [x] 내부 링크 (5점)
  - [x] 헤딩 구조 (5점)
  - [x] 메타 키워드 (5점)

#### FR-4: AEO 점수 계산
- **설명**: Answer Engine Optimization 점수 계산 (0-100점)
- **우선순위**: High
- **수용 기준**:
  - [x] 질문 형식 콘텐츠 (20점)
  - [x] FAQ 섹션 또는 FAQPage 스키마 (15점)
  - [x] 명확한 답변 구조 - H2→H3→bullets (20점)
  - [x] 키워드 밀도 (10점, 300단어 이상)
  - [x] 구조화된 답변 (15점)
  - [x] 콘텐츠 신선도 (10점, 날짜 정보)
  - [x] 용어 설명 (5점)
  - [x] 통계 및 인용 (5점)

#### FR-5: GEO 점수 계산
- **설명**: Generative Engine Optimization 점수 계산 (0-100점)
- **우선순위**: High
- **수용 기준**:
  - [x] 콘텐츠 길이 (30점, 최소 1000단어)
  - [x] 다중 미디어 (20점, 이미지, 비디오)
  - [x] 섹션 구조 (20점, 명확한 섹션)
  - [x] 키워드 다양성 (15점)
  - [x] 헤딩 계층 (10점, H2, H3)
  - [x] 리스트 및 불릿 (5점)

#### FR-6: AI 모델별 인용 확률 계산
- **설명**: ChatGPT, Perplexity, Gemini, Claude 각 모델의 인용 확률 계산
- **우선순위**: High
- **수용 기준**:
  - [x] ChatGPT 인용 확률 계산
  - [x] Perplexity 인용 확률 계산 (신선도, H2→H3→bullets 구조 강조)
  - [x] Gemini 인용 확률 계산
  - [x] Claude 인용 확률 계산
  - [x] 모델별 맞춤형 개선 제안

#### FR-7: 종합 점수 계산
- **설명**: SEO, AEO, GEO 점수의 평균을 종합 점수로 계산
- **우선순위**: High
- **수용 기준**:
  - [x] 세 점수의 평균 계산
  - [x] 0-100 범위로 정규화

#### FR-8: 분석 결과 저장
- **설명**: 로그인 사용자의 분석 결과를 데이터베이스에 저장
- **우선순위**: Medium
- **수용 기준**:
  - [x] 분석 결과 저장 (트랜잭션)
  - [x] 중복 분석 감지 (24시간 내)
  - [x] 사용자별 분석 이력 관리

#### FR-9: 캐싱
- **설명**: 동일 URL 재분석 시 캐시된 결과 반환
- **우선순위**: Medium
- **수용 기준**:
  - [x] 메모리 기반 캐싱
  - [x] 24시간 TTL
  - [x] 캐시 키 생성 (URL 기반)

### 비기능적 요구사항 (Non-functional Requirements)

#### NFR-1: 성능
- **요구사항**: API 응답 시간 < 10초 (일반적인 경우)
- **측정 기준**: 
  - HTML 가져오기: < 5초
  - 파싱 및 점수 계산: < 2초
  - AI 분석 (선택적): < 3초
- **현재 상태**: ✅ 구현 완료

#### NFR-2: 보안
- **요구사항**: 
  - 모든 입력 검증 (Zod)
  - 레이트 리미팅 (IP당 1분에 10회, 사용자당 1시간에 50회)
  - XSS 방지 (URL sanitization)
- **현재 상태**: ✅ 구현 완료

#### NFR-3: 확장성
- **요구사항**: 
  - 새로운 점수 계산 항목 추가 용이
  - AI 모델 추가 용이
  - 알고리즘 버전 관리
- **현재 상태**: ✅ 구현 완료 (알고리즘 자동 학습 시스템)

#### NFR-4: 사용성
- **요구사항**: 
  - 직관적인 UI/UX
  - 반응형 디자인
  - 명확한 에러 메시지
- **현재 상태**: ✅ 구현 완료

### 제약사항 (Constraints)
- 네이버 블로그, 브런치는 JavaScript로 동적 콘텐츠를 로드하므로 서버에서 직접 분석이 어려울 수 있음
- 일부 사이트는 봇 접근을 차단할 수 있음 (403 에러)
- 캐시는 메모리 기반이므로 서버 재시작 시 초기화됨

---

## 🔌 인터페이스 정의

### API 엔드포인트

#### 엔드포인트: 콘텐츠 분석
- **메서드**: POST
- **경로**: `/api/analyze`
- **인증**: Optional (로그인 시 이력 저장)
- **요청 스키마**:
  ```typescript
  {
    url: string; // 유효한 URL 형식
  }
  ```
- **응답 스키마**:
  ```typescript
  {
    aeoScore: number; // 0-100
    geoScore: number; // 0-100
    seoScore: number; // 0-100
    overallScore: number; // 0-100 (세 점수의 평균)
    insights: Array<{
      category: 'seo' | 'aeo' | 'geo';
      message: string;
      priority: 'high' | 'medium' | 'low';
    }>;
    aioAnalysis: {
      scores: {
        chatgpt: number; // 0-100
        perplexity: number; // 0-100
        gemini: number; // 0-100
        claude: number; // 0-100
      };
      insights: Array<{
        model: 'chatgpt' | 'perplexity' | 'gemini' | 'claude';
        message: string;
        priority: 'high' | 'medium' | 'low';
      }>;
    };
    improvementPriorities: Array<{
      category: string;
      action: string;
      impact: 'high' | 'medium' | 'low';
    }>;
    contentGuidelines: Array<{
      title: string;
      description: string;
    }>;
    cached?: boolean; // 캐시된 결과인지 여부
    analysisId?: string; // 분석 ID (저장된 경우)
  }
  ```
- **에러 응답**:
  ```typescript
  {
    error: string; // 에러 코드
    message: string; // 에러 메시지
    statusCode: number; // HTTP 상태 코드
  }
  ```

### 데이터베이스 스키마

#### analyses 테이블
```sql
CREATE TABLE analyses (
  id TEXT PRIMARY KEY,
  user_id TEXT, -- users.id 참조 (NULL 가능, 비로그인 사용자)
  url TEXT NOT NULL,
  aeo_score INTEGER NOT NULL CHECK(aeo_score >= 0 AND aeo_score <= 100),
  geo_score INTEGER NOT NULL CHECK(geo_score >= 0 AND geo_score <= 100),
  seo_score INTEGER NOT NULL CHECK(seo_score >= 0 AND seo_score <= 100),
  overall_score REAL NOT NULL CHECK(overall_score >= 0 AND overall_score <= 100),
  insights TEXT NOT NULL, -- JSON 문자열
  chatgpt_score INTEGER,
  perplexity_score INTEGER,
  gemini_score INTEGER,
  claude_score INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 인덱스
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_created_at ON analyses(created_at);
CREATE INDEX idx_analyses_user_created ON analyses(user_id, created_at DESC);
CREATE INDEX idx_analyses_url_created ON analyses(url, created_at DESC);
```

### UI/UX 요구사항

#### 메인 페이지 컴포넌트
- **컴포넌트명**: `UrlInput`, `ScoreCard`, `InsightList`, `AIOCitationCards`
- **위치**: `app/page.tsx`, `components/`
- **기능**: 
  - URL 입력 및 분석 시작
  - 분석 결과 표시 (점수 카드, 인사이트 목록, AI 모델별 인용 확률)
  - 로딩 상태 표시
  - 에러 처리 및 재시도

#### 사용자 인터랙션
- **URL 입력**: 입력 필드에 URL 입력 후 "분석하기" 버튼 클릭
- **로딩 상태**: 분석 중 진행 상태 표시
- **결과 표시**: 점수 카드, 인사이트 목록, AI 모델별 인용 확률 카드 표시
- **에러 처리**: 에러 발생 시 명확한 메시지 및 재시도 버튼 제공

---

## ⚠️ 에러 처리

### 예상되는 에러 케이스

#### 에러 1: 유효하지 않은 URL
- **발생 조건**: URL 형식이 올바르지 않을 때
- **에러 코드**: `VALIDATION_ERROR`
- **에러 메시지**: "유효하지 않은 URL입니다."
- **처리 방법**: Zod 스키마 검증 실패 시 400 에러 반환

#### 에러 2: URL 접근 실패
- **발생 조건**: URL에 접근할 수 없을 때 (네트워크 오류, 404, 403 등)
- **에러 코드**: `FETCH_ERROR`
- **에러 메시지**: 상황별 맞춤 메시지 (예: "페이지를 찾을 수 없습니다", "접근이 거부되었습니다")
- **처리 방법**: 재시도 로직 (최대 3회, Exponential Backoff)

#### 에러 3: HTML 파싱 실패
- **발생 조건**: HTML 파싱 중 오류 발생
- **에러 코드**: `PARSING_ERROR`
- **에러 메시지**: "콘텐츠를 분석할 수 없습니다."
- **처리 방법**: 에러 로깅 및 사용자에게 친화적 메시지 제공

#### 에러 4: 레이트 리미트 초과
- **발생 조건**: 요청 횟수가 제한을 초과할 때
- **에러 코드**: `RATE_LIMIT_EXCEEDED`
- **에러 메시지**: "요청 횟수가 초과되었습니다. 잠시 후 다시 시도해주세요."
- **처리 방법**: 429 상태 코드 반환

#### 에러 5: 데이터베이스 오류
- **발생 조건**: 분석 결과 저장 중 오류 발생
- **에러 코드**: `DATABASE_ERROR`
- **에러 메시지**: "분석 결과를 저장할 수 없습니다."
- **처리 방법**: 에러 로깅, 분석 결과는 반환하되 저장 실패는 경고로 처리

### 재시도 로직
- **재시도 조건**: 네트워크 오류, 타임아웃, 5xx 서버 오류
- **최대 재시도 횟수**: 3회
- **재시도 전략**: Exponential Backoff (1초, 2초, 4초)

---

## 🧪 테스트 요구사항

### 단위 테스트
- [x] URL 검증 함수 테스트
- [x] SEO 점수 계산 함수 테스트
- [x] AEO 점수 계산 함수 테스트
- [x] GEO 점수 계산 함수 테스트
- [x] AI 모델별 인용 확률 계산 함수 테스트
- [x] 종합 점수 계산 함수 테스트

### 통합 테스트
- [x] API 엔드포인트 테스트 (성공 케이스)
- [x] API 엔드포인트 테스트 (에러 케이스)
- [x] 데이터베이스 저장 테스트
- [x] 캐싱 테스트

### E2E 테스트
- [ ] 전체 분석 플로우 테스트 (URL 입력 → 분석 → 결과 표시)
- [ ] 에러 처리 플로우 테스트
- [ ] 캐시 동작 테스트

### 수동 테스트 체크리스트
- [x] 정상적인 URL 분석 테스트
- [x] 유효하지 않은 URL 입력 테스트
- [x] 접근 불가능한 URL 테스트
- [x] 네이버 블로그 URL 테스트 (제한사항 확인)
- [x] 브런치 URL 테스트 (제한사항 확인)
- [x] 로그인 사용자 분석 저장 테스트
- [x] 비로그인 사용자 분석 테스트
- [x] 캐시 동작 테스트
- [x] 레이트 리미팅 테스트

---

## 📚 참고 자료

### 관련 문서
- [프로젝트 README](../README.md)
- [프로젝트 아키텍처](../ARCHITECTURE.md)
- [상세 기능 가이드](../FEATURES.md)
- [알고리즘 학습 시스템](../ALGORITHM_LEARNING_SYSTEM.md)

### 외부 리소스
- [Claude Skill SEO/GEO Optimizer](https://github.com/199-biotechnologies/claude-skill-seo-geo-optimizer)
- [Next.js 공식 문서](https://nextjs.org/docs)
- [Cheerio 공식 문서](https://cheerio.js.org/)

### 기존 기능과의 연관성
- **AI Agent**: 분석 결과를 기반으로 개선 방안 제시
- **분석 이력**: 분석 결과 저장 및 조회
- **알고리즘 자동 학습**: 분석 결과를 기반으로 알고리즘 가중치 자동 조정
- **Freemium 모델**: 플랜별 분석 횟수 제한

---

## ✅ 명세서 검증 체크리스트

- [x] 모든 사용자 스토리 명세됨
- [x] 모든 기능 요구사항 정의됨
- [x] 모든 에러 케이스 정의됨
- [x] API 인터페이스 명확함
- [x] 데이터베이스 스키마 명확함
- [x] UI/UX 요구사항 명확함
- [x] 테스트 요구사항 정의됨
- [x] 기존 기능과의 호환성 확인됨

---

**명세서 버전**: 1.0  
**최종 업데이트**: 2025-01-04  
**상태**: 구현 완료  
**다음 단계**: [Plan 작성](./plan.md) (선택사항 - 이미 구현 완료)

