# 프로덕션 배포 체크리스트

이 문서는 GAEO Analysis를 실제 서버에 배포하기 전에 확인해야 할 사항들을 정리한 것입니다.

## 📋 사전 준비 사항

### 1. 환경 변수 설정

#### 필수 환경 변수
- [ ] `AUTH_SECRET` 또는 `NEXTAUTH_SECRET` 설정
  - 생성 방법: `openssl rand -base64 32`
  - Vercel: Settings → Environment Variables에서 추가

- [ ] `AUTH_URL` 또는 `NEXTAUTH_URL` 설정
  - 프로덕션 도메인: `https://your-domain.com`
  - Vercel: 자동으로 설정되지만 명시적으로 설정 권장

- [ ] Firebase 설정 (모든 `NEXT_PUBLIC_FIREBASE_*` 변수)
  - Firebase Console에서 웹 앱 등록 후 발급
  - [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) 참조

- [ ] `GEMINI_API_KEY` 설정
  - Google AI Studio에서 발급: https://aistudio.google.com/app/apikey

#### 선택적 환경 변수 (OAuth 로그인 사용 시)
- [ ] `GOOGLE_CLIENT_ID` 및 `GOOGLE_CLIENT_SECRET`
  - Google Cloud Console에서 OAuth 2.0 클라이언트 생성
  - [GOOGLE_OAUTH_FIX.md](./GOOGLE_OAUTH_FIX.md) 참조

- [ ] `GITHUB_CLIENT_ID` 및 `GITHUB_CLIENT_SECRET`
  - GitHub Developer Settings에서 OAuth App 생성
  - [GITHUB_OAUTH_FIX.md](./GITHUB_OAUTH_FIX.md) 참조
  - **중요**: Authorization callback URL을 프로덕션 URL로 설정
    - 예: `https://your-domain.com/api/auth/callback/github`

### 2. OAuth 콜백 URL 설정

#### Google OAuth
- [ ] Google Cloud Console → OAuth 2.0 클라이언트 ID → 승인된 리디렉션 URI에 추가
  - `https://your-domain.com/api/auth/callback/google`

#### GitHub OAuth
- [ ] GitHub Developer Settings → OAuth App → Authorization callback URL 설정
  - `https://your-domain.com/api/auth/callback/github`

### 3. 빌드 테스트

로컬에서 프로덕션 빌드가 성공하는지 확인:

```bash
# 의존성 설치
npm install

# 프로덕션 빌드
npm run build

# 빌드 성공 확인
# 에러가 없으면 성공
```

### 4. 데이터베이스 준비

- [ ] SQLite 데이터베이스는 Vercel의 `/tmp` 디렉토리에 자동 생성됨
  - Vercel은 서버리스 환경이므로 영구 저장소가 아님
  - **중요**: 프로덕션 환경에서는 외부 데이터베이스(PostgreSQL, MySQL 등) 사용 권장
  - 현재는 `/tmp` 디렉토리 사용 (임시 저장소)

### 5. Vercel 배포 설정

#### 프로젝트 설정
- [ ] Vercel 프로젝트 생성 또는 기존 프로젝트 연결
- [ ] Git 저장소 연결 확인

#### 빌드 설정
- [ ] Build Command: `npm run build` (기본값)
- [ ] Output Directory: `.next` (기본값)
- [ ] Install Command: `npm install` (기본값)

#### 환경 변수 설정
- [ ] Vercel Dashboard → Settings → Environment Variables
- [ ] 모든 필수 환경 변수 추가
- [ ] 환경별 설정 확인 (Production, Preview, Development)

#### 함수 타임아웃 설정
- [ ] `vercel.json`에서 API 라우트 타임아웃 확인
  - `/api/analyze`: 60초
  - `/api/chat`: 60초

### 6. 보안 설정

- [ ] HTTPS 강제 설정 확인 (Vercel 자동)
- [ ] CSP 헤더 확인 (`next.config.ts`의 `headers()` 함수)
- [ ] 환경 변수 보안 확인 (`.env.local` 파일이 Git에 커밋되지 않았는지)

### 7. 도메인 설정 (선택 사항)

- [ ] 커스텀 도메인 연결 (Vercel Dashboard → Settings → Domains)
- [ ] DNS 설정 확인
- [ ] SSL 인증서 자동 발급 확인 (Vercel 자동)

## 🚀 배포 프로세스

### 1. 코드 푸시

```bash
# 변경사항 커밋
git add .
git commit -m "feat: 프로덕션 배포 준비"

# 원격 저장소에 푸시
git push origin main
```

### 2. Vercel 자동 배포

- Vercel은 `main` 브랜치에 푸시되면 자동으로 배포를 시작합니다
- 배포 진행 상황은 Vercel Dashboard에서 확인 가능

### 3. 배포 후 확인

- [ ] 배포 성공 확인 (Vercel Dashboard)
- [ ] 사이트 접속 테스트: `https://your-domain.com`
- [ ] 로그인 기능 테스트 (Google/GitHub OAuth)
- [ ] 분석 기능 테스트 (URL 입력 및 분석 실행)
- [ ] AI Agent 기능 테스트 (챗봇 대화)
- [ ] 데이터베이스 기능 테스트 (분석 이력 저장/조회)

### 4. 모니터링 설정

- [ ] Vercel Analytics 활성화 (선택 사항)
- [ ] 에러 로그 모니터링 (Vercel Dashboard → Logs)
- [ ] 성능 모니터링 (Vercel Dashboard → Analytics)

## 🔍 배포 후 점검 사항

### 기능 테스트
- [ ] 메인 페이지 로드 확인
- [ ] URL 입력 및 분석 실행
- [ ] 분석 결과 표시 확인
- [ ] AI Agent 대화 기능
- [ ] 로그인/로그아웃 기능
- [ ] 분석 이력 조회
- [ ] 다크 모드 전환
- [ ] 반응형 디자인 (모바일/태블릿/데스크톱)

### 성능 확인
- [ ] 페이지 로딩 속도 (Vercel Analytics)
- [ ] API 응답 시간 (Vercel Dashboard → Functions)
- [ ] 데이터베이스 쿼리 성능

### 보안 확인
- [ ] HTTPS 연결 확인
- [ ] 환경 변수 노출 확인 (소스 코드 검사)
- [ ] CSP 헤더 확인 (브라우저 개발자 도구 → Network)

## ⚠️ 주의사항

### 데이터베이스 제한사항
- Vercel의 `/tmp` 디렉토리는 서버리스 함수 간에 공유되지 않을 수 있음
- 함수가 재시작되면 데이터가 초기화될 수 있음
- **프로덕션 환경에서는 외부 데이터베이스 사용을 강력히 권장**

### 환경 변수 보안
- 절대 환경 변수를 Git에 커밋하지 마세요
- `.env.local` 파일은 `.gitignore`에 포함되어 있는지 확인
- Vercel 환경 변수는 암호화되어 저장됨

### OAuth 콜백 URL
- 개발 환경과 프로덕션 환경의 콜백 URL이 다를 수 있음
- 각 환경에 맞는 OAuth App을 생성하거나, 콜백 URL을 여러 개 등록

## 📚 관련 문서

- [환경 변수 설정 가이드](./.env.example)
- [Firebase 설정](./FIREBASE_SETUP.md)
- [Google OAuth 설정](./GOOGLE_OAUTH_FIX.md)
- [GitHub OAuth 설정](./GITHUB_OAUTH_FIX.md)
- [문제 해결 가이드](./TROUBLESHOOTING.md)

## 🆘 문제 발생 시

배포 중 문제가 발생하면:

1. Vercel Dashboard → Logs에서 에러 로그 확인
2. [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) 참조
3. 환경 변수 설정 재확인
4. 빌드 로그 확인 (Vercel Dashboard → Deployments)

