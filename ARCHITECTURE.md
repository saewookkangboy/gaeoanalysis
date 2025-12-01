# GAEO Analysis - 서비스 및 기능 구조 문서

## 📋 목차

1. [서비스 개요](#서비스-개요)
2. [시스템 아키텍처](#시스템-아키텍처)
3. [주요 기능](#주요-기능)
4. [프로젝트 구조](#프로젝트-구조)
5. [API 엔드포인트](#api-엔드포인트)
6. [데이터베이스 구조](#데이터베이스-구조)
7. [컴포넌트 구조](#컴포넌트-구조)
8. [라이브러리 및 유틸리티](#라이브러리-및-유틸리티)
9. [인증 및 보안](#인증-및-보안)
10. [배포 및 인프라](#배포-및-인프라)

---

## 서비스 개요

**GAEO Analysis by allrounder**는 생성형 AI 검색 환경(GEO/AEO)에 최적화된 콘텐츠 분석 및 개선 가이드를 제공하는 웹 애플리케이션입니다.

### 핵심 가치

- **AI 검색 최적화**: ChatGPT, Perplexity, Gemini, Claude 등 다양한 AI 모델에서 콘텐츠가 인용될 확률 분석
- **종합 점수 평가**: AEO, GEO, SEO 점수를 통합하여 콘텐츠 품질 평가
- **실시간 개선 가이드**: AI Agent를 통한 대화형 개선 방안 제시
- **사용자 중심 설계**: 다크 모드, 반응형 디자인, 직관적인 UI/UX

---

## 시스템 아키텍처

### 기술 스택

#### 프론트엔드
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: React Hooks, Context API
- **Charts**: Chart.js (react-chartjs-2)
- **Markdown**: React Markdown (rehype-highlight, remark-gfm)

#### 백엔드
- **Runtime**: Node.js (Next.js Server Components)
- **API**: Next.js Route Handlers
- **HTML Parsing**: Cheerio
- **AI Integration**: Google Gemini API 2.5 Flash
- **Authentication**: NextAuth.js + Firebase Auth

#### 데이터베이스
- **Primary DB**: SQLite (better-sqlite3)
- **Auth Provider**: Firebase Authentication
- **Storage**: Local Storage (클라이언트 캐싱)

#### 인프라
- **Hosting**: Vercel
- **Analytics**: Vercel Analytics
- **Database Location**: 
  - 로컬: `./data/gaeo.db`
  - Vercel: `/tmp/gaeo.db` (임시 파일 시스템)

### 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────┐
│                    클라이언트 (브라우저)                    │
├─────────────────────────────────────────────────────────┤
│  Next.js App Router (React Components)                  │
│  ├── Pages (page.tsx)                                   │
│  ├── Components (재사용 가능한 UI 컴포넌트)                │
│  └── Client-side State (React Hooks, Context)           │
└─────────────────┬───────────────────────────────────────┘
                  │ HTTP/HTTPS
┌─────────────────▼───────────────────────────────────────┐
│              Next.js Server (Vercel)                    │
├─────────────────────────────────────────────────────────┤
│  API Routes (Route Handlers)                            │
│  ├── /api/analyze    - 콘텐츠 분석                       │
│  ├── /api/chat       - AI 챗봇                          │
│  ├── /api/history    - 분석 이력                         │
│  └── /api/auth       - 인증                              │
│                                                          │
│  Server Utilities                                       │
│  ├── Rate Limiting   - API 보호                         │
│  ├── Caching         - 성능 최적화                      │
│  ├── Error Handling  - 에러 처리                        │
│  └── Security Headers - 보안 헤더                       │
└─────────────────┬───────────────────────────────────────┘
                  │
    ┌─────────────┼─────────────┬──────────────┐
    │             │             │              │
┌───▼───┐   ┌─────▼─────┐  ┌────▼────┐  ┌─────▼─────┐
│SQLite │   │  Gemini   │  │Firebase │  │  External │
│  DB   │   │    API    │  │   Auth  │  │    URLs   │
└───────┘   └───────────┘  └─────────┘  └───────────┘
```

---

## 주요 기능

### 1. 콘텐츠 분석 (Content Analysis)

**기능 설명**: URL을 입력하면 웹페이지의 HTML을 분석하여 AEO, GEO, SEO 점수를 계산합니다.

**주요 분석 항목**:
- **SEO 점수**: 
  - H1 태그 존재 여부
  - Title 태그 (길이, 키워드 포함)
  - Meta description (길이, 품질)
  - Alt 텍스트 (이미지 접근성)
  - 구조화된 데이터 (JSON-LD)
  - 내부/외부 링크 구조

- **AEO 점수**:
  - 질문 형식 콘텐츠 존재 여부
  - FAQ 섹션 존재
  - 명확한 답변 구조
  - 단계별 가이드 형식
  - 전문 용어 정의

- **GEO 점수**:
  - 콘텐츠 길이 (최소 2000자 권장)
  - 섹션 구조화 (H2, H3 태그)
  - 다양한 미디어 (이미지, 비디오)
  - 키워드 다양성
  - 최신 정보 표시

**처리 흐름**:
```
URL 입력 → HTML 가져오기 (재시도 로직) → Cheerio 파싱 → 
점수 계산 → AI 분석 (Gemini) → 결과 반환
```

### 2. AI Agent (챗봇)

**기능 설명**: 분석 결과를 기반으로 Google Gemini API를 사용하여 개선 방안에 대한 질문에 답변합니다.

**주요 기능**:
- 마크다운 형식 답변 렌더링
- 코드 블록 하이라이팅 (Highlight.js)
- 답변 복사 기능
- 동적 추천 질문 생성 (맥락 학습)
- 대화 이력 저장 및 불러오기
- 실시간 로딩 상태 표시

**API 엔드포인트**: `/api/chat`

### 3. AI 모델별 인용 확률 (AIO Analysis)

**기능 설명**: ChatGPT, Perplexity, Gemini, Claude 각 AI 모델의 특성을 반영하여 콘텐츠가 각 모델에서 인용될 확률을 계산합니다.

**계산 방식**:
- 각 모델의 특성에 맞는 가중치 적용
- 콘텐츠 요소별 점수 계산
- 모델별 맞춤형 개선 제안 제공

**API 엔드포인트**: `/api/analyze` (AIO 분석 포함)

### 4. 분석 이력 관리

**기능 설명**: 로그인한 사용자의 최근 분석 기록을 저장하고 조회할 수 있습니다.

**주요 기능**:
- 최근 10개 분석 기록 저장
- 중복 분석 자동 감지 (24시간 내)
- 분석 결과 상세 조회
- URL 히스토리 관리

**API 엔드포인트**: `/api/history`

### 5. 사용자 인증 및 개인화

**기능 설명**: Firebase Authentication을 사용하여 사용자 인증을 처리하고, 사용자별 블로그 URL을 저장합니다.

**주요 기능**:
- 이메일/비밀번호 회원가입
- 로그인/로그아웃
- 블로그 URL 저장 및 자동 분석
- 세션 관리 (NextAuth.js)

**API 엔드포인트**:
- `/api/register` - 회원가입
- `/api/auth/[...nextauth]` - 인증 처리
- `/api/user/blog-url` - 블로그 URL 관리

---

## 프로젝트 구조

```
gaeo-analysis/
├── app/                          # Next.js App Router
│   ├── api/                      # API 라우트 (Route Handlers)
│   │   ├── analyze/              # 콘텐츠 분석 API
│   │   │   └── route.ts
│   │   ├── auth/                 # 인증 API
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   ├── chat/                 # AI 챗봇 API
│   │   │   ├── route.ts          # 메인 챗봇 API
│   │   │   ├── suggestions/     # 추천 질문 생성
│   │   │   ├── save/             # 대화 저장
│   │   │   └── history/           # 대화 이력 조회
│   │   ├── health/               # 헬스 체크 API
│   │   ├── history/              # 분석 이력 API
│   │   ├── register/             # 회원가입 API
│   │   └── user/                 # 사용자 정보 API
│   │       └── blog-url/
│   ├── about/                    # 서비스 소개 페이지
│   ├── history/                  # 분석 이력 페이지
│   ├── login/                    # 로그인 페이지
│   ├── register/                 # 회원가입 페이지
│   ├── layout.tsx                # 루트 레이아웃
│   ├── page.tsx                  # 메인 대시보드
│   └── globals.css               # 전역 스타일
│
├── components/                   # React 컴포넌트
│   ├── Navigation.tsx            # 네비게이션 바
│   ├── ScoreCard.tsx             # 점수 카드
│   ├── ScoreChart.tsx            # 점수 차트 (숨김 처리됨)
│   ├── InsightList.tsx           # 개선 가이드 목록
│   ├── AIAgent.tsx               # AI 챗봇 컴포넌트
│   ├── AIOCitationCards.tsx      # AI 모델별 인용 확률 카드
│   ├── AIOModal.tsx              # AI 모델 상세 정보 모달
│   ├── ContentGuidelines.tsx     # 콘텐츠 작성 가이드라인
│   ├── CopyButton.tsx            # 복사 버튼
│   ├── ErrorBoundary.tsx         # 에러 경계
│   ├── ProgressBar.tsx           # 진행 상태 바
│   ├── SkeletonLoader.tsx        # 스켈레톤 로더
│   ├── ShareButton.tsx           # 공유 버튼
│   ├── ThemeProvider.tsx         # 테마 관리
│   ├── ThemeToggle.tsx           # 테마 전환 버튼
│   ├── Toast.tsx                 # 토스트 알림
│   ├── UrlInput.tsx              # URL 입력 컴포넌트
│   ├── SessionProvider.tsx       # 세션 프로바이더
│   └── ChatBot.tsx               # 챗봇 UI
│
├── lib/                          # 라이브러리 및 유틸리티
│   ├── db.ts                     # SQLite 데이터베이스 설정
│   ├── db-helpers.ts             # 데이터베이스 헬퍼 함수
│   ├── migrations.ts             # 데이터베이스 마이그레이션
│   ├── analyzer.ts               # 콘텐츠 분석 로직
│   ├── ai-citation-analyzer.ts  # AI 인용 확률 분석
│   ├── ai-agent-prompt.ts        # AI Agent 프롬프트
│   ├── api-utils.ts              # API 유틸리티 (에러 처리, 검증)
│   ├── auth.ts                   # NextAuth 설정
│   ├── cache.ts                  # 메모리 캐시
│   ├── rate-limiter.ts           # 레이트 리미터
│   ├── retry.ts                  # 재시도 로직
│   ├── fetch-with-retry.ts       # 재시도가 포함된 fetch
│   ├── headers.ts                # 보안 헤더 유틸리티
│   ├── firebase.ts               # Firebase 설정
│   ├── seo-guidelines.ts         # SEO 가이드라인
│   └── storage.ts                # 로컬 스토리지 유틸리티
│
├── scripts/                      # 유틸리티 스크립트
│   ├── migrate-db.ts             # 데이터베이스 마이그레이션
│   ├── optimize-db.ts            # 데이터베이스 최적화
│   ├── backup-db.sh              # 데이터베이스 백업
│   ├── restore-db.sh             # 데이터베이스 복원
│   ├── cleanup-dev.sh            # 개발 서버 정리
│   ├── check-port.js             # 포트 확인
│   └── auto-push.sh              # 자동 Git 푸시
│
├── types/                        # TypeScript 타입 정의
│   └── next-auth.d.ts            # NextAuth 타입 확장
│
├── public/                       # 정적 파일
│   └── *.svg                     # 아이콘 파일
│
├── data/                         # 데이터베이스 파일 (로컬)
│   ├── gaeo.db                   # SQLite 데이터베이스
│   ├── gaeo.db-shm               # 공유 메모리 파일
│   └── gaeo.db-wal               # WAL 파일
│
├── next.config.ts                # Next.js 설정
├── vercel.json                   # Vercel 배포 설정
├── package.json                  # 프로젝트 의존성
├── tsconfig.json                 # TypeScript 설정
└── README.md                     # 프로젝트 문서
```

---

## API 엔드포인트

### 1. 콘텐츠 분석 API

**엔드포인트**: `POST /api/analyze`

**기능**: URL을 입력받아 콘텐츠를 분석하고 AEO, GEO, SEO 점수를 계산합니다.

**요청**:
```json
{
  "url": "https://example.com"
}
```

**응답**:
```json
{
  "aeoScore": 75,
  "geoScore": 80,
  "seoScore": 85,
  "overallScore": 80,
  "insights": [...],
  "aioAnalysis": {
    "scores": {
      "chatgpt": 72,
      "perplexity": 78,
      "gemini": 75,
      "claude": 70
    },
    "insights": [...]
  },
  "improvementPriorities": [...],
  "contentGuidelines": [...]
}
```

**보안**:
- 레이트 리미팅: IP당 1분에 10회, 사용자당 1시간에 50회
- 입력 검증: Zod 스키마 검증
- URL Sanitization: XSS 방지
- 캐싱: 24시간 캐시

### 2. AI 챗봇 API

**엔드포인트**: `POST /api/chat`

**기능**: 분석 결과를 기반으로 AI Agent와 대화합니다.

**요청**:
```json
{
  "message": "SEO 점수를 어떻게 개선할 수 있나요?",
  "analysisId": "uuid",
  "conversationId": "uuid (optional)"
}
```

**응답**:
```json
{
  "response": "마크다운 형식의 답변...",
  "conversationId": "uuid"
}
```

**보안**:
- 레이트 리미팅: 사용자당 1분에 20회
- 입력 검증: Zod 스키마 검증
- 메시지 Sanitization: XSS 방지

### 3. 추천 질문 생성 API

**엔드포인트**: `POST /api/chat/suggestions`

**기능**: 대화 맥락을 기반으로 추천 질문을 생성합니다.

**요청**:
```json
{
  "analysisId": "uuid",
  "conversationId": "uuid",
  "previousQuestions": ["질문1", "질문2"]
}
```

**응답**:
```json
{
  "suggestions": ["추천 질문1", "추천 질문2", "추천 질문3"]
}
```

### 4. 분석 이력 API

**엔드포인트**: `GET /api/history`

**기능**: 로그인한 사용자의 최근 분석 기록을 조회합니다.

**응답**:
```json
{
  "analyses": [
    {
      "id": "uuid",
      "url": "https://example.com",
      "overallScore": 80,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 5. 헬스 체크 API

**엔드포인트**: `GET /api/health`

**기능**: 서비스 상태를 확인합니다.

**응답**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "database": {
      "connected": true,
      "stats": {...}
    },
    "gemini": {
      "available": true
    },
    "cache": {
      "stats": {...}
    }
  },
  "system": {
    "memory": {...},
    "uptime": 12345
  }
}
```

### 6. 회원가입 API

**엔드포인트**: `POST /api/register`

**기능**: 새 사용자를 등록합니다.

**요청**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "blogUrl": "https://blog.example.com (optional)"
}
```

### 7. 사용자 블로그 URL API

**엔드포인트**: 
- `GET /api/user/blog-url` - 블로그 URL 조회
- `PUT /api/user/blog-url` - 블로그 URL 업데이트

---

## 데이터베이스 구조

### 테이블 스키마

#### 1. users 테이블
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,                    -- Firebase UID
  email TEXT UNIQUE NOT NULL,
  blog_url TEXT,                          -- 사용자 블로그 URL
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME                     -- 마이그레이션으로 추가됨
);
```

#### 2. analyses 테이블
```sql
CREATE TABLE analyses (
  id TEXT PRIMARY KEY,
  user_id TEXT,                           -- users.id 참조
  url TEXT NOT NULL,
  aeo_score INTEGER NOT NULL CHECK(aeo_score >= 0 AND aeo_score <= 100),
  geo_score INTEGER NOT NULL CHECK(geo_score >= 0 AND geo_score <= 100),
  seo_score INTEGER NOT NULL CHECK(seo_score >= 0 AND seo_score <= 100),
  overall_score REAL NOT NULL CHECK(overall_score >= 0 AND overall_score <= 100),
  insights TEXT NOT NULL,                  -- JSON 문자열
  chatgpt_score INTEGER,                   -- 마이그레이션으로 추가됨
  perplexity_score INTEGER,
  gemini_score INTEGER,
  claude_score INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### 3. chat_conversations 테이블
```sql
CREATE TABLE chat_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT,                           -- users.id 참조
  analysis_id TEXT,                       -- analyses.id 참조
  messages TEXT NOT NULL,                 -- JSON 문자열
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
);
```

#### 4. schema_migrations 테이블
```sql
CREATE TABLE schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 인덱스

**기본 인덱스**:
- `idx_analyses_user_id` - 사용자별 분석 조회
- `idx_analyses_created_at` - 생성일 기준 정렬
- `idx_chat_user_id` - 사용자별 대화 조회
- `idx_chat_analysis_id` - 분석별 대화 조회

**복합 인덱스** (성능 최적화):
- `idx_analyses_user_created` - (user_id, created_at DESC)
- `idx_analyses_url_created` - (url, created_at DESC)
- `idx_chat_user_updated` - (user_id, updated_at DESC)

### 트리거

- `update_users_updated_at` - users 테이블 업데이트 시 updated_at 자동 갱신
- `update_chat_conversations_updated_at` - chat_conversations 테이블 업데이트 시 updated_at 자동 갱신

### 마이그레이션

**버전 1**: AI 점수 컬럼 추가 (chatgpt_score, perplexity_score, gemini_score, claude_score)
**버전 2**: users 테이블에 updated_at 컬럼 추가
**버전 3**: 복합 인덱스 추가

---

## 컴포넌트 구조

### 페이지 컴포넌트

#### 1. 메인 페이지 (`app/page.tsx`)
- URL 입력 및 분석 시작
- 분석 결과 표시
- AI Agent 통합
- 로딩 상태 관리
- 에러 처리 및 재시도

#### 2. 분석 이력 페이지 (`app/history/page.tsx`)
- 최근 분석 기록 조회
- 분석 결과 상세 보기
- 분석 재실행

#### 3. 로그인/회원가입 페이지
- Firebase Authentication 통합
- 폼 검증 및 에러 처리

### 재사용 가능한 컴포넌트

#### UI 컴포넌트
- **ScoreCard**: 점수 카드 (애니메이션 효과)
- **InsightList**: 개선 가이드 목록
- **AIOCitationCards**: AI 모델별 인용 확률 카드
- **ContentGuidelines**: 콘텐츠 작성 가이드라인
- **CopyButton**: 복사 버튼
- **ShareButton**: 공유 버튼 (Twitter, Facebook, 링크 복사)

#### 기능 컴포넌트
- **AIAgent**: AI 챗봇 (마크다운 렌더링, 추천 질문)
- **UrlInput**: URL 입력 (히스토리 드롭다운)
- **ProgressBar**: 진행 상태 표시
- **SkeletonLoader**: 로딩 스켈레톤 UI

#### 시스템 컴포넌트
- **ErrorBoundary**: 에러 경계 (예상치 못한 에러 처리)
- **ThemeProvider**: 테마 관리 (다크 모드)
- **ThemeToggle**: 테마 전환 버튼
- **Toast**: 토스트 알림 시스템
- **Navigation**: 네비게이션 바
- **SessionProvider**: 세션 관리

---

## 라이브러리 및 유틸리티

### 데이터베이스 (`lib/db.ts`, `lib/db-helpers.ts`)

**주요 기능**:
- SQLite 데이터베이스 초기화
- WAL 모드 활성화 (성능 최적화)
- 외래 키 제약 조건 활성화
- 트랜잭션 관리
- 마이그레이션 시스템

**헬퍼 함수**:
- `saveAnalysis()` - 분석 결과 저장
- `getUserAnalyses()` - 사용자 분석 이력 조회
- `saveOrUpdateChatConversation()` - 대화 저장/업데이트
- `checkDuplicateAnalysis()` - 중복 분석 확인
- `getUser()` - 사용자 정보 조회
- `createUser()` - 사용자 생성
- `updateUserBlogUrl()` - 블로그 URL 업데이트

### 콘텐츠 분석 (`lib/analyzer.ts`)

**주요 기능**:
- HTML 가져오기 (재시도 로직 포함)
- Cheerio를 사용한 HTML 파싱
- SEO 점수 계산
- AEO 점수 계산
- GEO 점수 계산
- 종합 점수 계산

### AI 인용 확률 분석 (`lib/ai-citation-analyzer.ts`)

**주요 기능**:
- ChatGPT 인용 확률 계산
- Perplexity 인용 확률 계산
- Gemini 인용 확률 계산
- Claude 인용 확률 계산
- 모델별 맞춤형 개선 제안

### API 유틸리티 (`lib/api-utils.ts`)

**주요 기능**:
- `createErrorResponse()` - 표준화된 에러 응답
- `createSuccessResponse()` - 표준화된 성공 응답
- `withErrorHandling()` - 에러 핸들링 래퍼
- `withValidation()` - 입력 검증 래퍼
- `sanitizeUrl()` - URL sanitization
- `sanitizeText()` - 텍스트 sanitization (XSS 방지)

### 레이트 리미터 (`lib/rate-limiter.ts`)

**주요 기능**:
- 메모리 기반 레이트 리미터
- IP/사용자별 요청 제한
- `withRateLimit()` - 레이트 리미트 미들웨어

### 캐시 (`lib/cache.ts`)

**주요 기능**:
- 메모리 기반 캐시
- TTL (Time To Live) 지원
- 자동 만료 정리
- 캐시 통계

### 재시도 로직 (`lib/retry.ts`, `lib/fetch-with-retry.ts`)

**주요 기능**:
- Exponential backoff
- 재시도 가능한 에러 판별
- 최대 재시도 횟수 제한

### 보안 헤더 (`lib/headers.ts`)

**주요 기능**:
- CORS 설정
- 보안 헤더 추가 (X-Content-Type-Options, X-Frame-Options 등)
- OPTIONS 요청 처리

### 로컬 스토리지 (`lib/storage.ts`)

**주요 기능**:
- 분석 결과 저장/불러오기
- URL 히스토리 관리
- 자동 복구 기능

---

## 인증 및 보안

### 인증 시스템

**NextAuth.js + Firebase Authentication**:
- 이메일/비밀번호 인증
- 세션 관리
- JWT 토큰 처리

### 보안 기능

1. **입력 검증**:
   - Zod 스키마 검증
   - URL sanitization
   - 텍스트 sanitization (XSS 방지)

2. **레이트 리미팅**:
   - IP별 제한
   - 사용자별 제한
   - 시간 윈도우 기반

3. **보안 헤더**:
   - CORS 설정
   - X-Content-Type-Options
   - X-Frame-Options
   - X-XSS-Protection
   - Referrer-Policy

4. **에러 처리**:
   - 표준화된 에러 응답
   - 에러 로깅
   - 사용자 친화적 에러 메시지

---

## 배포 및 인프라

### Vercel 배포

**설정 파일**: `vercel.json`

```json
{
  "functions": {
    "app/api/analyze/route.ts": {
      "maxDuration": 60
    },
    "app/api/chat/route.ts": {
      "maxDuration": 60
    }
  },
  "crons": []
}
```

**환경 변수**:
- `GEMINI_API_KEY` - Google Gemini API 키
- `NEXTAUTH_URL` - NextAuth URL
- `NEXTAUTH_SECRET` - NextAuth 시크릿
- `FIREBASE_*` - Firebase 설정

### 데이터베이스 배포

**로컬 환경**:
- 데이터베이스 위치: `./data/gaeo.db`
- WAL 모드 활성화
- 자동 백업 스크립트

**Vercel 환경**:
- 데이터베이스 위치: `/tmp/gaeo.db`
- 임시 파일 시스템 사용
- 함수 실행 간 데이터 유지 불가 (제한사항)

**주의사항**: 
- Vercel의 `/tmp` 디렉토리는 임시이므로 프로덕션 환경에서는 Vercel Postgres나 다른 영구 데이터베이스를 사용하는 것을 권장합니다.

### 모니터링

- **Vercel Analytics**: 페이지뷰, 사용자 세션 추적
- **Health Check API**: 서비스 상태 모니터링
- **에러 로깅**: 콘솔 로그 및 Vercel Functions 로그

---

## 개발 워크플로우

### npm 스크립트

```bash
npm run dev          # 개발 서버 시작
npm run dev:clean    # 개발 서버 정리 후 시작
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버 시작
npm run db:migrate   # 데이터베이스 마이그레이션
npm run db:backup    # 데이터베이스 백업
npm run db:restore   # 데이터베이스 복원
npm run db:optimize  # 데이터베이스 최적화
npm run cleanup      # 개발 서버 정리
npm run cleanup:all  # 개발 서버 및 캐시 정리
npm run push         # 자동 Git 푸시
```

### Git 워크플로우

- 자동 커밋 및 푸시: `.cursorrules`에 정의된 규칙에 따라 작업 완료 시 자동 푸시
- 커밋 메시지 형식: Conventional Commits (feat, fix, refactor 등)

---

## 향후 개선 사항

### 데이터베이스
- [ ] Vercel Postgres로 마이그레이션 (영구 저장소)
- [ ] 데이터베이스 연결 풀링
- [ ] 읽기 전용 복제본

### 성능
- [ ] Redis 캐싱 (프로덕션)
- [ ] CDN 통합
- [ ] 이미지 최적화

### 기능
- [ ] 실시간 분석 진행률 표시
- [ ] 분석 결과 비교 기능
- [ ] 리포트 생성 및 다운로드
- [ ] API 키 관리 대시보드

---

## 참고 문서

- [README.md](./README.md) - 프로젝트 개요 및 설치 가이드
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Firebase 설정 가이드
- [DATABASE_IMPROVEMENTS.md](./DATABASE_IMPROVEMENTS.md) - 데이터베이스 개선 사항
- [STABILITY_IMPROVEMENTS.md](./STABILITY_IMPROVEMENTS.md) - 안정화 개선 사항
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - 문제 해결 가이드

---

**문서 버전**: 1.0  
**최종 업데이트**: 2024년 12월

