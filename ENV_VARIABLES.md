# 환경 변수 설정 가이드

이 문서는 GAEO Analysis 프로젝트에 필요한 모든 환경 변수를 설명합니다.

## 📋 필수 환경 변수

### NextAuth.js 인증 설정

```env
# AUTH_SECRET: NextAuth.js 세션 암호화를 위한 시크릿 키
# 생성 방법: openssl rand -base64 32
AUTH_SECRET=your-auth-secret-here

# AUTH_URL: 프로덕션 환경의 전체 URL (프로토콜 포함)
# 개발 환경: http://localhost:3000
# 프로덕션: https://your-domain.com
AUTH_URL=http://localhost:3000
```

**대체 옵션 (하위 호환성):**
- `NEXTAUTH_SECRET` (AUTH_SECRET 대체)
- `NEXTAUTH_URL` (AUTH_URL 대체)

### Firebase 설정

Firebase Console에서 웹 앱 등록 후 발급받은 설정 정보를 입력하세요.

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

**설정 방법:** [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) 참조

### Google Gemini API

```env
# Google AI Studio에서 발급받은 API 키
# https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your-gemini-api-key
```

## 🔍 SEO 최적화 환경 변수 (선택 사항)

```env
# 사이트 URL (메타데이터 및 구조화된 데이터에 사용)
NEXT_PUBLIC_SITE_URL=https://gaeo-analysis.vercel.app

# Google Search Console 검증 (선택 사항)
NEXT_PUBLIC_GOOGLE_VERIFICATION=your-google-verification-code

# Yandex 검증 (선택 사항)
NEXT_PUBLIC_YANDEX_VERIFICATION=your-yandex-verification-code

# 소셜 미디어 URL (선택 사항)
NEXT_PUBLIC_TWITTER_URL=https://twitter.com/allrounder
NEXT_PUBLIC_GITHUB_URL=https://github.com/allrounder
```

**참고:** 이 변수들은 SEO 최적화를 위해 사용되며, 설정하지 않아도 기본값으로 동작합니다.

## 🔐 선택적 환경 변수 (OAuth 로그인)

### Google OAuth

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**설정 방법:** [GOOGLE_OAUTH_FIX.md](./GOOGLE_OAUTH_FIX.md) 참조

### GitHub OAuth

```env
# 프로덕션 환경용 (기본)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# 개발 환경용 (선택 사항, NODE_ENV=development일 때 사용)
GITHUB_CLIENT_ID_DEV=your-dev-github-client-id
GITHUB_CLIENT_SECRET_DEV=your-dev-github-client-secret
```

**설정 방법:** [GITHUB_OAUTH_FIX.md](./GITHUB_OAUTH_FIX.md) 참조

**중요:** GitHub OAuth App의 Authorization callback URL을 프로덕션 URL로 설정해야 합니다.
- 개발: `http://localhost:3000/api/auth/callback/github`
- 프로덕션: `https://your-domain.com/api/auth/callback/github`

## 🚀 환경 변수 설정 방법

### 로컬 개발 환경

1. 프로젝트 루트에 `.env.local` 파일 생성
2. 위의 환경 변수들을 복사하여 실제 값 입력
3. 파일 저장 (`.env.local`은 자동으로 `.gitignore`에 포함됨)

### 프로덕션 환경 (Vercel)

1. Vercel Dashboard → 프로젝트 선택
2. Settings → Environment Variables
3. 각 환경 변수 추가:
   - Key: 환경 변수 이름 (예: `AUTH_SECRET`)
   - Value: 실제 값
   - Environment: Production, Preview, Development 선택
4. Save 클릭

## ✅ 환경 변수 검증

환경 변수가 올바르게 설정되었는지 확인:

```bash
npm run check:env
```

이 명령어는 모든 필수 환경 변수가 설정되어 있는지 확인하고, 누락된 변수가 있으면 알려줍니다.

## 🔒 보안 주의사항

1. **절대 Git에 커밋하지 마세요**
   - `.env.local` 파일은 `.gitignore`에 포함되어 있습니다
   - 환경 변수가 포함된 파일을 Git에 커밋하지 마세요

2. **프로덕션 환경 변수 보호**
   - Vercel 환경 변수는 암호화되어 저장됩니다
   - 환경 변수를 코드나 문서에 하드코딩하지 마세요

3. **시크릿 키 관리**
   - `AUTH_SECRET`은 강력한 랜덤 문자열이어야 합니다
   - 생성 방법: `openssl rand -base64 32`

## 📚 관련 문서

- [프로덕션 배포 체크리스트](./DEPLOYMENT_CHECKLIST.md)
- [Firebase 설정](./FIREBASE_SETUP.md)
- [Google OAuth 설정](./GOOGLE_OAUTH_FIX.md)
- [GitHub OAuth 설정](./GITHUB_OAUTH_FIX.md)

