# GAEO Analysis by allrounder

생성형 검색 환경(GEO/AEO)에 최적화된 콘텐츠 분석 및 개선 가이드를 제공하는 웹 애플리케이션입니다.

## 주요 기능

### 핵심 분석 기능
- **통합 점수 분석**: AEO(Answer Engine Optimization), GEO(Generative Engine Optimization), SEO 점수를 종합적으로 분석
- **AI 모델별 인용 확률**: ChatGPT, Perplexity, Gemini, Claude 각 AI 모델의 특성을 반영한 인용 확률 시뮬레이션
- **알고리즘 자동 학습 시스템**: 
  - 분석 결과 기반 자동 가중치 학습
  - 리서치 결과 반영 및 알고리즘 버전 관리
  - A/B 테스트를 통한 성능 개선
  - 실시간 성능 모니터링 및 대시보드
- **고도화된 AI Agent**: 
  - 마크다운 형식 답변 렌더링 (코드 블록, 리스트, 링크 등)
  - 답변 복사 기능 (호버 시 복사 버튼 표시)
  - 동적 추천 질문 생성 (대화 맥락 학습)
  - 실시간 로딩 상태 표시
  - 토큰 최적화로 빠른 응답 처리
  - Agent Lightning 통합 (프롬프트 자동 최적화, 학습 메트릭 추적)

### 사용자 경험
- **다크 모드 지원**: 시스템 테마 자동 감지 및 수동 전환, 모든 컴포넌트 다크 모드 지원
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 완벽 지원
- **토스트 알림 시스템**: 성공/에러/경고/정보 메시지 자동 표시
- **개인화**: 회원가입/로그인 기반으로 사용자 블로그 URL을 연동하여 자동 분석 환경 구축
- **소셜 로그인**: Google, GitHub 계정으로 간편 로그인 지원
- **분석 이력**: 최근 분석 기록 조회 (플랜별 제한)
- **원클릭 복사**: 분석 결과를 Markdown 형식으로 클립보드에 복사
- **네트워크 상태 모니터링**: 실시간 온라인/오프라인 상태 표시
- **진행 상태 표시**: 분석 단계별 진행 상황 및 예상 소요 시간 표시
- **에러 복구**: 자동 재시도 및 상세한 에러 메시지 제공

### Freemium 모델
- **구독 플랜**: Free, Pro, Business 플랜 지원
- **사용량 추적**: 월간 분석/챗봇 사용량 실시간 추적
- **사용량 제한**: 플랜별 기능 제한 및 한도 관리
- **구독 관리**: 구독 생성, 업그레이드, 취소 기능
- **자동 만료 처리**: 구독 만료 시 Free 플랜으로 자동 다운그레이드

### 성능 및 안정성
- **캐싱 시스템**: 메모리 기반 캐시로 동일 URL 재분석 시 빠른 응답
- **레이트 리미팅**: IP/사용자별 요청 제한으로 서버 보호
- **네트워크 에러 핸들링**: 자동 재시도 및 Exponential Backoff
- **보안 헤더**: CORS, XSS 보호, CSRF 방지 등 보안 헤더 자동 설정
- **헬스 체크**: 데이터베이스, 외부 API 상태 모니터링
- **통계 및 모니터링**: 분석 통계, 사용자 활동 통계, 학습 메트릭 추적

## 기술 스택

### 프런트엔드
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Chart.js (react-chartjs-2)
- React Markdown (마크다운 렌더링)
- Highlight.js (코드 블록 하이라이팅)

### 백엔드
- Next.js Route Handlers
- Cheerio (HTML 파싱)
- Google Gemini API 2.5 Flash (AI 챗봇 및 추천 질문 생성)
- NextAuth.js (인증)

### 데이터베이스
- SQLite (better-sqlite3)
- Firebase Authentication

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. Firebase 프로젝트 설정

Firebase 프로젝트를 생성하고 Authentication을 활성화해야 합니다. 자세한 설정 방법은 [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)를 참조하세요.

**간단 요약:**
1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. Authentication → Sign-in method → 이메일/비밀번호 활성화
3. 웹 앱 등록 후 설정 정보 복사

### 3. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
# NextAuth
AUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Gemini API
GEMINI_API_KEY=your-gemini-api-key

# OAuth (선택 사항)
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

**OAuth 설정 가이드:**
- [Google OAuth 설정](./GOOGLE_OAUTH_FIX.md)
- [GitHub OAuth 설정](./GITHUB_OAUTH_FIX.md)

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

**문제 해결:**

만약 "Unable to acquire lock" 또는 포트 충돌 오류가 발생하면:

```bash
# 개발 서버 정리 후 재시작
npm run cleanup
npm run dev

# 또는 자동 정리와 함께 시작
npm run dev:clean
```

더 강력한 정리 (`.next` 폴더까지 삭제):
```bash
npm run cleanup:all
npm run dev
```

### 5. 데이터베이스 관리

```bash
# 마이그레이션 실행
npm run db:migrate

# 데이터베이스 백업
npm run db:backup

# 데이터베이스 복구
npm run db:restore [백업 파일 경로]

# 데이터베이스 최적화
npm run db:optimize
```

### 6. 개발 도구

```bash
# 개발 서버 정리
npm run cleanup

# 자동 Git 푸시
npm run push

# 헬스 체크 (브라우저에서 확인)
# http://localhost:3000/api/health
```

### 7. 프로덕션 빌드

```bash
npm run build
npm start
```

## 프로젝트 구조

```
gaeo-analysis/
├── app/                    # Next.js App Router
│   ├── api/               # API 라우트
│   │   ├── analyze/       # 콘텐츠 분석 API
│   │   ├── chat/          # AI 챗봇 API
│   │   │   ├── suggestions/  # 추천 질문 생성 API
│   │   │   ├── save/          # 대화 저장 API
│   │   │   └── history/       # 대화 이력 조회 API
│   │   ├── history/       # 분석 이력 API
│   │   ├── register/      # 회원가입 API
│   │   ├── subscription/  # 구독 관리 API
│   │   ├── usage/         # 사용량 조회 API
│   │   ├── algorithm-learning/  # 알고리즘 학습 API
│   │   ├── algorithm-performance/  # 알고리즘 성능 모니터링 API
│   │   ├── algorithm-initialize/  # 알고리즘 초기화 API
│   │   ├── learning-metrics/  # 학습 메트릭 조회 API
│   │   ├── statistics/     # 통계 조회 API
│   │   ├── health/        # 헬스 체크 API
│   │   └── user/          # 사용자 정보 API
│   ├── login/             # 로그인 페이지
│   ├── register/          # 회원가입 페이지
│   ├── about/             # 서비스 소개 페이지
│   └── page.tsx           # 메인 대시보드
├── components/            # React 컴포넌트
│   ├── Navigation.tsx     # 네비게이션 바 (다크 모드, 반응형)
│   ├── ScoreCard.tsx      # 점수 카드 (애니메이션)
│   ├── ScoreChart.tsx     # 점수 차트
│   ├── InsightList.tsx    # 개선 가이드 목록
│   ├── AIAgent.tsx        # 고도화된 AI Agent (마크다운 렌더링)
│   ├── AIOCitationCards.tsx  # AI 모델별 인용 확률 카드
│   ├── AIOModal.tsx       # AI 모델별 상세 정보 모달
│   ├── ContentGuidelines.tsx  # 콘텐츠 작성 가이드라인
│   ├── ComprehensiveChecklistModal.tsx  # 종합 개선 체크리스트 모달
│   ├── CopyButton.tsx     # 복사 버튼
│   ├── ShareButton.tsx    # 공유 버튼
│   ├── NetworkStatus.tsx  # 네트워크 상태 표시
│   ├── ProgressBar.tsx    # 진행 상태 표시
│   ├── SkeletonLoader.tsx  # 로딩 스켈레톤 UI
│   ├── ErrorBoundary.tsx  # 에러 바운더리
│   ├── ThemeProvider.tsx  # 테마 관리 (다크 모드)
│   ├── ThemeToggle.tsx    # 테마 전환 버튼
│   └── Toast.tsx          # 토스트 알림 컴포넌트
├── lib/                   # 유틸리티 및 라이브러리
│   ├── db.ts              # SQLite 데이터베이스 (트랜잭션, 인덱싱)
│   ├── db-helpers.ts      # 데이터베이스 헬퍼 함수
│   ├── migrations.ts      # 마이그레이션 시스템
│   ├── analyzer.ts        # 콘텐츠 분석 로직
│   ├── ai-agent-prompt.ts  # AI Agent 프롬프트 생성 (토큰 최적화)
│   ├── ai-citation-analyzer.ts  # AI 모델별 인용 확률 계산
│   ├── seo-guidelines.ts  # SEO/AEO/GEO 가이드라인
│   ├── subscription-helpers.ts  # 구독 관리 헬퍼 함수
│   ├── usage-helpers.ts   # 사용량 추적 헬퍼 함수
│   ├── algorithm-learning.ts  # 알고리즘 학습 로직
│   ├── algorithm-auto-learning.ts  # 알고리즘 자동 학습 파이프라인
│   ├── algorithm-initializer.ts  # 알고리즘 초기화 로직
│   ├── agent-lightning.ts  # Agent Lightning 통합 (프롬프트 최적화)
│   ├── cache.ts           # 메모리 기반 캐시 시스템
│   ├── rate-limiter.ts   # 레이트 리미팅 시스템
│   ├── retry.ts           # 재시도 로직 (Exponential Backoff)
│   ├── fetch-with-retry.ts  # 재시도가 포함된 fetch
│   ├── api-utils.ts       # API 유틸리티 (에러 핸들링, 검증)
│   ├── headers.ts         # 보안 헤더 설정
│   ├── statistics-helpers.ts  # 통계 계산 헬퍼
│   ├── auth.ts            # NextAuth 설정
│   └── firebase.ts        # Firebase 초기화
├── scripts/               # 유틸리티 스크립트
│   ├── backup-db.sh       # 데이터베이스 백업
│   ├── restore-db.sh      # 데이터베이스 복구
│   ├── cleanup-dev.sh     # 개발 서버 정리
│   ├── migrate-db.ts      # 마이그레이션 실행
│   ├── optimize-db.ts     # 데이터베이스 최적화
│   └── auto-push.sh       # 자동 Git 푸시
└── data/                  # SQLite 데이터베이스 파일 (자동 생성)
```

## 데이터베이스 개선 사항

### 주요 개선 내용

1. **트랜잭션 관리**
   - 모든 쓰기 작업이 트랜잭션으로 보호됨
   - 데이터 일관성 보장

2. **인덱싱 최적화**
   - 복합 인덱스 추가로 쿼리 성능 향상
   - 사용자별 최근 분석 조회 최적화

3. **데이터 정합성**
   - 외래 키 제약 조건 활성화
   - 체크 제약 조건으로 점수 범위 검증 (0-100)
   - 트리거로 updated_at 자동 업데이트

4. **마이그레이션 시스템**
   - 버전 관리된 스키마 변경
   - 자동 마이그레이션 실행

5. **백업 및 복구**
   - 자동 백업 스크립트
   - 안전한 복구 프로세스

6. **성능 최적화**
   - WAL 모드 활성화
   - 정기적인 VACUUM 실행

### 데이터베이스 헬퍼 함수

`lib/db-helpers.ts`에서 제공하는 주요 함수:

- `saveAnalysis()` - 분석 결과 저장 (트랜잭션)
- `getUserAnalyses()` - 사용자별 분석 이력 조회
- `saveOrUpdateChatConversation()` - 채팅 대화 저장/업데이트
- `checkDuplicateAnalysis()` - 중복 분석 확인

## 주요 기능 설명

### 콘텐츠 분석

URL을 입력하면 다음 항목들을 분석합니다:

- **SEO 점수**: H1 태그, Title, Meta description, Alt 텍스트, 구조화된 데이터 등
- **AEO 점수**: 질문 형식 콘텐츠, FAQ 섹션, 명확한 답변 구조 등
- **GEO 점수**: 콘텐츠 길이, 다중 미디어, 섹션 구조, 키워드 다양성 등

### AI Agent (고도화된 챗봇)

분석 결과를 기반으로 Google Gemini API 2.5 Flash를 사용하여 개선 방안에 대한 질문에 답변합니다.

**주요 기능:**
- **마크다운 렌더링**: 제목, 리스트, 코드 블록, 링크 등 마크다운 형식 지원
- **코드 하이라이팅**: 코드 블록의 구문 강조 표시
- **답변 복사**: 각 답변에 호버 시 복사 버튼 표시, 클릭으로 전체 답변 복사
- **동적 추천 질문**: 
  - 대화 맥락과 분석 결과를 학습하여 맞춤형 질문 생성
  - 이미 질문한 내용과 중복되지 않도록 필터링
  - 응답 후 자동으로 새로운 추천 질문 생성
  - 수동 새로고침 버튼 제공
- **실시간 피드백**: 질문 전송 시 "잠시만요, 곧 답변 드릴게요..." 메시지 표시
- **토큰 최적화**: 프롬프트 최적화로 빠른 응답 처리 (최대 4096 토큰)
- **대화 이력 저장**: 로그인 사용자의 대화 이력 자동 저장 및 불러오기

### 분석 이력

로그인한 사용자의 분석 기록을 저장하고 조회할 수 있습니다. 플랜별로 저장 가능한 이력 수가 다릅니다:
- **Free 플랜**: 최근 5개
- **Pro/Business 플랜**: 무제한

### Freemium 모델

서비스는 3가지 구독 플랜을 제공합니다:

#### 🆓 Free 플랜
- 월간 분석: 10회
- 월간 챗봇: 20회
- AI 모델: 2개 (ChatGPT, Perplexity)
- 분석 이력: 최근 5개

#### 💎 Pro 플랜 (월 19,000원)
- 월간 분석: 무제한
- 월간 챗봇: 무제한
- AI 모델: 4개 (전체)
- 분석 이력: 무제한
- CSV/PDF 내보내기
- API 액세스
- 웹훅 알림

#### 🏢 Business 플랜 (월 99,000원)
- Pro의 모든 기능
- 팀 협업 (최대 10명)
- 공유 대시보드
- 브랜드 리포트
- 전담 지원

### 알고리즘 자동 학습 시스템

분석 알고리즘의 정확도를 지속적으로 개선하는 자동 학습 시스템입니다:

- **자동 가중치 학습**: 분석 결과를 기반으로 알고리즘 가중치 자동 조정
- **리서치 결과 반영**: 최신 SEO/GEO/AEO 연구 결과를 알고리즘에 자동 반영
- **A/B 테스트**: 여러 알고리즘 버전을 비교하여 최적 버전 선택
- **성능 모니터링**: 알고리즘별 성능 지표 실시간 추적
- **버전 관리**: 알고리즘 버전별 성능 추적 및 롤백 지원

### AI 모델별 인용 확률

ChatGPT, Perplexity, Gemini, Claude 각 AI 모델의 특성을 반영하여 콘텐츠가 각 모델에서 인용될 확률을 계산하고 시각화합니다. 각 모델별로 맞춤형 개선 제안을 제공합니다.

## 최근 업데이트 (2025년 1월)

### Freemium 모델 도입 💎
- ✅ **구독 플랜 시스템**: Free, Pro, Business 플랜 지원
- ✅ **사용량 추적**: 월간 분석/챗봇 사용량 실시간 추적
- ✅ **사용량 제한**: 플랜별 기능 제한 및 한도 관리
- ✅ **구독 관리 API**: 구독 생성, 업그레이드, 취소 기능
- ✅ **자동 만료 처리**: 구독 만료 시 Free 플랜으로 자동 다운그레이드
- 📚 참고: [Freemium 모델 가이드](./FREEMIUM_SUMMARY.md)

### 알고리즘 자동 학습 시스템 🤖
- ✅ **자동 가중치 학습**: 분석 결과 기반 알고리즘 가중치 자동 조정
- ✅ **리서치 결과 반영**: 최신 연구 결과를 알고리즘에 자동 반영
- ✅ **A/B 테스트**: 여러 알고리즘 버전 비교 및 최적 버전 선택
- ✅ **성능 모니터링**: 알고리즘별 성능 지표 실시간 추적 및 대시보드
- ✅ **버전 관리**: 알고리즘 버전별 성능 추적 및 롤백 지원
- ✅ **자동 학습 파이프라인**: 분석 결과를 기반으로 자동 학습 수행
- 📚 참고: [알고리즘 학습 시스템 가이드](./ALGORITHM_LEARNING_SYSTEM.md)

### Claude Skill SEO/GEO Optimizer 가이드라인 통합 📊
- ✅ **향상된 분석 알고리즘**: 2025년 연구 기반 (41M AI 검색 결과, 680M 인용 분석)
- ✅ **AI 플랫폼별 최적화 전략 강화**: ChatGPT, Perplexity, Claude, Gemini, Grokipedia 특화
- ✅ **신선도(Freshness) 최적화**: 30일 이내 업데이트 시 3.2x 인용 증가 (Perplexity)
- ✅ **H2→H3→bullets 구조**: 40% 더 많은 인용 (Perplexity 최적화)
- ✅ **통계 및 인용 최적화**: +41% 개선 (통계), +28% 개선 (인용)
- ✅ **FAQPage 스키마 강조**: Highest AI citation probability
- ✅ **음성 검색 최적화**: Featured snippet, Speakable schema 지원
- ✅ **소셜 미디어 최적화**: Open Graph, Twitter Cards 상세 가이드
- 📚 참고: [Claude Skill SEO/GEO Optimizer](https://github.com/199-biotechnologies/claude-skill-seo-geo-optimizer)

### Agent Lightning 통합 ⚡
- ✅ **프롬프트 최적화 시스템**: SEO/AEO/GEO/AIO 특화 프롬프트 자동 최적화
- ✅ **응답 품질 평가**: 관련성, 정확성, 유용성 기반 자동 평가
- ✅ **학습 메트릭 추적**: Agent Type별 성능 모니터링 및 개선율 계산
- ✅ **이벤트 추적 (Spans)**: 프롬프트, 응답, Reward 추적
- ✅ **데이터베이스 통합**: 학습 데이터 영구 저장
- ✅ **자동 프롬프트 개선**: 성능 기반 프롬프트 자동 최적화
- 📚 [Agent Lightning 통합 가이드](./AGENT_LIGHTNING_INTEGRATION.md) 참조

## 최근 업데이트 (2024년 12월)

### 디자인 시스템 개선 ✨
- ✅ **다크 모드 지원**: 시스템 테마 자동 감지 및 수동 전환
- ✅ **반응형 디자인 강화**: 모바일/태블릿/데스크톱 완벽 지원
- ✅ **애니메이션 및 전환 효과**: 부드러운 페이드인/슬라이드인 애니메이션
- ✅ **토스트 알림 시스템**: 성공/에러/경고/정보 메시지 자동 표시
- ✅ **접근성 개선**: ARIA 라벨, 키보드 네비게이션, 포커스 관리
- ✅ **시각적 피드백**: 호버 효과, 클릭 피드백, 로딩 상태 개선

### 데이터베이스 개선 🗄️
- ✅ **트랜잭션 관리**: 모든 쓰기 작업이 트랜잭션으로 보호됨
- ✅ **인덱싱 최적화**: 복합 인덱스 추가로 쿼리 성능 10-30배 향상
- ✅ **데이터 정합성**: 외래 키 제약 조건, 체크 제약 조건, 트리거 추가
- ✅ **마이그레이션 시스템**: 버전 관리된 스키마 변경
- ✅ **백업 및 복구**: 자동 백업 스크립트 및 안전한 복구 프로세스
- ✅ **성능 최적화**: WAL 모드 활성화, 정기적인 VACUUM 실행
- ✅ **중복 분석 감지**: 24시간 내 동일 URL 재분석 방지

### 개발 환경 개선 🛠️
- ✅ **서버 정리 스크립트**: 포트 충돌 및 lock 파일 자동 정리
- ✅ **헬스 체크 API**: 데이터베이스 상태 및 통계 조회 (`/api/health`)
- ✅ **자동 푸시 시스템**: 작업 완료 시 자동 Git 커밋 및 푸시
- ✅ **문제 해결 가이드**: 상세한 트러블슈팅 문서 제공

### AI Agent 고도화 🤖
- ✅ 마크다운 형식 답변 렌더링 지원
- ✅ 코드 블록 하이라이팅 기능
- ✅ 답변 복사 기능 추가
- ✅ 동적 추천 질문 생성 (대화 맥락 학습)
- ✅ 실시간 로딩 상태 표시
- ✅ 토큰 최적화로 응답 속도 개선
- ✅ 스트리밍 응답으로 긴 답변도 완전히 수집

### 성능 개선 ⚡
- ✅ 프롬프트 최적화로 토큰 사용량 최소화
- ✅ 스트리밍 응답으로 전체 답변 수집 보장
- ✅ 대화 이력 기반 컨텍스트 관리
- ✅ 데이터베이스 쿼리 최적화 (복합 인덱스)
- ✅ 사용자별 분석 조회 성능 10배 향상

## 관련 문서

### 설정 가이드
- [Firebase 설정](./FIREBASE_SETUP.md) - Firebase 프로젝트 설정 방법
- [Google OAuth 설정](./GOOGLE_OAUTH_FIX.md) - Google 로그인 설정 및 문제 해결
- [GitHub OAuth 설정](./GITHUB_OAUTH_FIX.md) - GitHub 로그인 설정 및 문제 해결
- [GitHub OAuth 다중 환경 설정](./GITHUB_OAUTH_MULTI_ENV.md) - 개발/프로덕션 환경별 설정
- [GitHub OAuth 프로덕션 오류 해결](./GITHUB_OAUTH_PRODUCTION_FIX.md) - 프로덕션 환경 오류 해결

### 기술 문서
- [상세 기능 가이드](./FEATURES.md) - 모든 기능의 상세 설명
- [데이터베이스 개선 사항](./DATABASE_IMPROVEMENTS.md) - 데이터베이스 개선 상세 내용
- [서비스 안정화 개선 아이디어](./STABILITY_IMPROVEMENTS.md) - 향후 개선 계획
- [Firebase 설정 가이드](./FIREBASE_SETUP.md) - Firebase 프로젝트 설정 방법
- [문제 해결 가이드](./TROUBLESHOOTING.md) - 일반적인 문제 해결 방법
- [Freemium 모델 가이드](./FREEMIUM_SUMMARY.md) - Freemium 모델 상세 설명
- [Freemium 구현 가이드](./FREEMIUM_IMPLEMENTATION_GUIDE.md) - Freemium 모델 구현 방법
- [알고리즘 학습 시스템](./ALGORITHM_LEARNING_SYSTEM.md) - 알고리즘 자동 학습 시스템 상세 가이드
- [Agent Lightning 통합](./AGENT_LIGHTNING_INTEGRATION.md) - Agent Lightning 통합 가이드

## 기여

이슈나 개선 사항이 있으면 [GitHub Issues](https://github.com/saewookkangboy/gaeoanalysis/issues)에 등록해주세요.

## 라이선스

chunghyo@troe.kr