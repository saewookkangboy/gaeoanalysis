# GAEO Analysis by allrounder

생성형 검색 환경(GEO/AEO)에 최적화된 콘텐츠 분석 및 개선 가이드를 제공하는 웹 애플리케이션입니다.

## 주요 기능

- **통합 점수 분석**: AEO(Answer Engine Optimization), GEO(Generative Engine Optimization), SEO 점수를 종합적으로 분석
- **AI 챗봇**: 분석 결과에 대한 상세 진단 및 개선 방안을 AI 챗봇을 통해 대화형으로 제공
- **개인화**: 회원가입/로그인 기반으로 사용자 블로그 URL을 연동하여 자동 분석 환경 구축
- **분석 이력**: 최근 분석 기록을 최대 10개까지 조회 가능
- **원클릭 복사**: 분석 결과를 Markdown 형식으로 클립보드에 복사

## 기술 스택

### 프런트엔드
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Chart.js (react-chartjs-2)

### 백엔드
- Next.js Route Handlers
- Cheerio (HTML 파싱)
- Google Gemini API (AI 챗봇)
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
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Gemini API
GEMINI_API_KEY=your-gemini-api-key
```

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

### 6. 프로덕션 빌드

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
│   │   ├── history/       # 분석 이력 API
│   │   └── register/      # 회원가입 API
│   ├── login/             # 로그인 페이지
│   ├── register/          # 회원가입 페이지
│   └── page.tsx           # 메인 대시보드
├── components/            # React 컴포넌트
│   ├── Navigation.tsx     # 네비게이션 바
│   ├── ScoreCard.tsx      # 점수 카드
│   ├── ScoreChart.tsx     # 점수 차트
│   ├── InsightList.tsx    # 개선 가이드 목록
│   ├── ChatBot.tsx        # AI 챗봇
│   └── CopyButton.tsx     # 복사 버튼
├── lib/                   # 유틸리티 및 라이브러리
│   ├── db.ts              # SQLite 데이터베이스
│   ├── analyzer.ts        # 콘텐츠 분석 로직
│   ├── auth.ts            # NextAuth 설정
│   └── firebase.ts        # Firebase 초기화
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

### AI 챗봇

분석 결과를 기반으로 Google Gemini API를 사용하여 개선 방안에 대한 질문에 답변합니다.

### 분석 이력

로그인한 사용자의 최근 분석 기록을 최대 10개까지 저장하고 조회할 수 있습니다.

## 라이선스

MIT
