# Google OAuth 로그인 문제 해결 가이드

## 문제 상황

Google 로그인 시 다음과 같은 문제가 발생합니다:

1. **브라우저 콘솔 오류**: `inject.js` TrustedHTML 오류 (브라우저 확장 프로그램 관련, 무시 가능)
2. **로그인 후 계속 로딩**: 로그인은 성공하지만 리디렉션이 제대로 되지 않음
3. **콜백 URL 불일치**: Google OAuth 콜백 URL이 `http://localhost:3000`으로 설정되어 있는데 프로덕션에서 실행 중

## 해결 방법

### 1단계: Google Cloud Console 설정 확인

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. **APIs & Services** → **Credentials**로 이동
3. 해당 OAuth 2.0 Client ID 클릭
4. **승인된 리디렉션 URI** 확인 및 수정:

   **로컬 개발 환경:**
   ```
   http://localhost:3000/api/auth/callback/google
   ```

   **프로덕션 환경:**
   ```
   https://gaeoanalysis.vercel.app/api/auth/callback/google
   ```

   ⚠️ **중요**: 여러 환경 사용 시 두 URL 모두 추가해야 합니다.

### 2단계: 환경 변수 확인

#### 로컬 개발 환경 (`.env.local`)

```env
# NextAuth
AUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### 프로덕션 환경 (Vercel)

Vercel 대시보드 → **Settings** → **Environment Variables**:

```env
# NextAuth
AUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://gaeoanalysis.vercel.app

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3단계: 브라우저 쿠키 삭제

로그인 후 계속 로딩되는 문제는 손상된 쿠키 때문일 수 있습니다:

1. 브라우저 개발자 도구 열기 (F12)
2. **Application** (Chrome) 또는 **Storage** (Firefox) 탭 선택
3. **Cookies** → `https://gaeoanalysis.vercel.app` 선택
4. 다음 쿠키 삭제:
   - `authjs.pkce.code_verifier`
   - `authjs.state`
   - `authjs.session-token`
   - `next-auth.session-token`
   - 기타 `authjs.*` 쿠키
5. 또는 **Clear site data** 클릭

### 4단계: 테스트

1. 브라우저에서 `https://gaeoanalysis.vercel.app/login` 접속
2. **Google로 로그인** 버튼 클릭
3. Google 인증 완료 후 정상적으로 메인 페이지로 리디렉션되는지 확인

## 추가 문제 해결

### TrustedHTML 오류 (inject.js)

이 오류는 브라우저 확장 프로그램에서 발생하는 것으로, 서비스 자체와는 무관합니다. 무시해도 됩니다.

### accounts.youtube.com CSP 리포트 404 오류

이것은 Google 계정 시스템의 내부 오류로, 서비스에 영향을 주지 않습니다. 무시해도 됩니다.

### Vercel Live frame-src 오류

이미 해결되었습니다. `frame-src`에 `https://vercel.live`가 추가되었습니다.

## 로그인 후 계속 로딩되는 경우

### 체크리스트

1. **세션 확인:**
   - 브라우저 개발자 도구 → **Application** → **Cookies**에서 세션 쿠키 확인
   - `authjs.session-token` 또는 `next-auth.session-token` 쿠키가 있는지 확인

2. **네트워크 확인:**
   - 브라우저 개발자 도구 → **Network** 탭
   - `/api/auth/callback/google` 요청 확인
   - 응답 상태 코드 확인 (200 또는 302여야 함)

3. **콘솔 확인:**
   - 브라우저 콘솔에서 JavaScript 오류 확인
   - 서버 콘솔에서 NextAuth 오류 확인

4. **수동 리디렉션:**
   - 로그인 후 메인 페이지로 수동 이동: `https://gaeoanalysis.vercel.app/`
   - 세션이 유지되는지 확인

## 프로덕션 환경 확인

### Vercel 환경 변수 확인

1. Vercel 대시보드 → 프로젝트 선택
2. **Settings** → **Environment Variables** 확인
3. 다음 환경 변수가 모두 설정되어 있는지 확인:
   - `AUTH_SECRET`
   - `NEXTAUTH_URL` (프로덕션 URL)
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

### Google OAuth App 설정 확인

1. Google Cloud Console에서 OAuth 2.0 Client ID 확인
2. **승인된 리디렉션 URI**에 다음이 포함되어 있는지 확인:
   ```
   https://gaeoanalysis.vercel.app/api/auth/callback/google
   ```

## 참고 문서

- [OAUTH_SETUP.md](./OAUTH_SETUP.md) - 전체 OAuth 설정 가이드
- [PKCE_ERROR_FIX.md](./PKCE_ERROR_FIX.md) - PKCE 오류 해결 가이드
- [GITHUB_OAUTH_MULTI_ENV.md](./GITHUB_OAUTH_MULTI_ENV.md) - 다중 환경 OAuth 설정

