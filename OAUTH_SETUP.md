# OAuth 로그인 설정 가이드

이 문서는 Google 및 GitHub OAuth 로그인 설정 방법을 안내합니다.

## 1. Google OAuth 설정

### 1.1 Google Cloud Console에서 프로젝트 생성

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속합니다.
2. 프로젝트 선택 또는 새 프로젝트 생성
3. **API 및 서비스** → **사용자 인증 정보**로 이동

### 1.2 OAuth 2.0 클라이언트 ID 생성

1. **사용자 인증 정보 만들기** → **OAuth 클라이언트 ID** 선택
2. 애플리케이션 유형: **웹 애플리케이션** 선택
3. 이름 입력 (예: `GAEO Analysis Web`)
4. 승인된 리디렉션 URI 추가:
   - 로컬 개발: `http://localhost:3000/api/auth/callback/google`
   - 프로덕션: `https://gaeoanalysis.vercel.app/api/auth/callback/google`
5. **만들기** 클릭
6. **클라이언트 ID**와 **클라이언트 보안 비밀** 복사

### 1.3 OAuth 동의 화면 설정

1. **OAuth 동의 화면** 메뉴로 이동
2. 사용자 유형 선택 (외부 또는 내부)
3. 앱 정보 입력:
   - 앱 이름: `GAEO Analysis`
   - 사용자 지원 이메일: 본인 이메일
   - 앱 로고 (선택 사항)
4. 범위 추가 (기본 프로필 정보만 필요)
5. 테스트 사용자 추가 (필요한 경우)

## 2. GitHub OAuth 설정

### 2.1 GitHub Developer Settings

1. [GitHub Settings](https://github.com/settings/developers)에 접속
2. **Developer settings** → **OAuth Apps** → **New OAuth App** 클릭

### 2.2 OAuth App 생성

1. **Application name**: `GAEO Analysis` (또는 원하는 이름)
2. **Homepage URL**: 
   - 로컬 개발: `http://localhost:3000`
   - 프로덕션: `https://gaeoanalysis.vercel.app`
3. **Authorization callback URL**:
   - 로컬 개발: `http://localhost:3000/api/auth/callback/github`
   - 프로덕션: `https://gaeoanalysis.vercel.app/api/auth/callback/github`
4. **Register application** 클릭
5. **Client ID**와 **Client secrets** 복사 (Generate a new client secret 클릭)

## 3. 환경 변수 설정

### 3.1 로컬 개발 환경

`.env.local` 파일에 다음 환경 변수를 추가합니다:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Firebase (기존 설정 유지)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Gemini API
GEMINI_API_KEY=your-gemini-api-key
```

### 3.2 Vercel 배포 환경

1. [Vercel Dashboard](https://vercel.com/dashboard)에 접속
2. 프로젝트 선택 → **Settings** → **Environment Variables**
3. 다음 환경 변수 추가:

```
NEXTAUTH_URL=https://gaeoanalysis.vercel.app
NEXTAUTH_SECRET=<your-secret-key>
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GITHUB_CLIENT_ID=<your-github-client-id>
GITHUB_CLIENT_SECRET=<your-github-client-secret>
```

### 3.3 NEXTAUTH_SECRET 생성

터미널에서 다음 명령어를 실행하여 시크릿 키를 생성합니다:

```bash
openssl rand -base64 32
```

생성된 키를 `NEXTAUTH_SECRET`에 입력합니다.

## 4. 테스트

### 4.1 로컬 개발 서버 실행

```bash
npm run dev
```

### 4.2 로그인 테스트

1. 브라우저에서 `http://localhost:3000/login` 접속
2. **Google로 로그인** 또는 **GitHub로 로그인** 버튼 클릭
3. OAuth 인증 완료 후 메인 페이지로 리디렉션되는지 확인

## 5. 문제 해결

### 5.1 "redirect_uri_mismatch" 에러 (Google)

- Google Cloud Console에서 승인된 리디렉션 URI가 정확한지 확인
- 프로토콜(`http` vs `https`), 포트, 경로가 정확히 일치해야 함

### 5.2 "Bad credentials" 에러 (GitHub)

- GitHub OAuth App의 Client ID와 Client Secret이 올바른지 확인
- Client Secret이 만료되지 않았는지 확인 (만료 시 재생성 필요)

### 5.3 환경 변수 확인

- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 환경 변수 이름이 정확한지 확인 (대소문자 구분)
- 개발 서버 재시작 (`npm run dev`)

### 5.4 OAuth 콜백 URL 확인

- NextAuth는 자동으로 `/api/auth/callback/[provider]` 경로를 생성
- Google: `/api/auth/callback/google`
- GitHub: `/api/auth/callback/github`

## 6. 보안 주의사항

### 6.1 환경 변수 보호

- ✅ `.env.local` 파일은 절대 Git에 커밋하지 않음 (`.gitignore`에 포함됨)
- ✅ 프로덕션 환경에서는 Vercel 환경 변수 사용
- ✅ Client Secret은 절대 코드나 문서에 노출하지 않음

### 6.2 OAuth 앱 설정

- Google: 승인된 리디렉션 URI를 정확히 설정
- GitHub: Authorization callback URL을 정확히 설정
- 프로덕션 도메인 변경 시 OAuth 앱 설정도 업데이트 필요

## 7. 추가 리소스

- [NextAuth.js OAuth 제공자 문서](https://next-auth.js.org/providers/)
- [Google OAuth 2.0 문서](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth 문서](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)

