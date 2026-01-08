# PKCE 오류 해결 가이드

## 문제 상황

GitHub OAuth 로그인 시 다음과 같은 오류가 발생합니다:

```
[auth][error] InvalidCheck: pkceCodeVerifier value could not be parsed.
Server error: There is a problem with the server configuration.
```

## 원인

NextAuth.js v5에서 OAuth 콜백 처리 시 PKCE (Proof Key for Code Exchange) 코드 검증자를 쿠키에서 파싱하지 못해서 발생합니다.

주요 원인:
1. **AUTH_SECRET 미설정**: 쿠키 암호화/복호화에 필요한 시크릿 키가 없음
2. **쿠키 설정 문제**: PKCE 코드 검증자 쿠키가 제대로 설정되지 않음
3. **세션 쿠키 문제**: 브라우저 쿠키가 손상되었거나 만료됨

## 해결 방법

### 1단계: AUTH_SECRET 환경 변수 설정 (가장 중요!)

`.env.local` 파일에 `AUTH_SECRET`을 추가하세요:

```env
# NextAuth v5 (필수)
AUTH_SECRET=your-secret-key-here

# 참고: NEXTAUTH_SECRET도 호환되지만, AUTH_SECRET 사용 권장
# NEXTAUTH_SECRET=your-secret-key-here
```

**AUTH_SECRET 생성 방법:**

터미널에서 다음 명령어 실행:

```bash
# 방법 1: OpenSSL 사용
openssl rand -base64 32

# 방법 2: NextAuth.js v5 공식 명령어 (권장)
npx auth secret
```

생성된 키를 `.env.local` 파일의 `AUTH_SECRET`에 입력하세요.

### 2단계: 브라우저 쿠키 삭제

1. 브라우저 개발자 도구 열기 (F12)
2. **Application** (Chrome) 또는 **Storage** (Firefox) 탭 선택
3. **Cookies** → `http://localhost:3000` 선택
4. 다음 쿠키 삭제:
   - `authjs.pkce.code_verifier`
   - `authjs.state`
   - `authjs.session-token`
   - 기타 `authjs.*` 쿠키
5. 또는 **Clear site data** 클릭하여 모든 쿠키 삭제

### 3단계: 개발 서버 재시작

```bash
# 개발 서버 종료 (Ctrl+C)
# 그 다음 재시작
npm run dev
```

### 4단계: 다시 테스트

1. 브라우저에서 `http://localhost:3000/login` 접속
2. **GitHub로 로그인** 버튼 클릭
3. 정상적으로 작동하는지 확인

## 추가 확인 사항

### 환경 변수 확인

`.env.local` 파일에 다음이 모두 설정되어 있는지 확인:

```env
# NextAuth (필수)
AUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# GitHub OAuth (필수)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Google OAuth (선택)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 서버 콘솔 확인

개발 서버 콘솔에서 다음 경고가 나타나지 않는지 확인:

```
⚠️ AUTH_SECRET이 설정되지 않았습니다.
```

이 경고가 나타나면 `.env.local` 파일에 `AUTH_SECRET`을 추가하고 서버를 재시작하세요.

### 쿠키 설정 확인

NextAuth.js v5는 자동으로 PKCE 쿠키를 설정하지만, 문제가 지속되면:

1. 브라우저 개발자 도구 → **Network** 탭
2. GitHub 로그인 버튼 클릭
3. `/api/auth/signin/github` 요청 확인
4. **Response Headers**에서 `Set-Cookie` 헤더 확인
5. `authjs.pkce.code_verifier` 쿠키가 설정되는지 확인

## 프로덕션 환경 (Vercel)

Vercel 배포 시:

1. **Vercel 대시보드** → **Settings** → **Environment Variables**
2. 다음 환경 변수 추가:
   ```
   AUTH_SECRET=<생성한-시크릿-키>
   GITHUB_CLIENT_ID=<github-client-id>
   GITHUB_CLIENT_SECRET=<github-client-secret>
   NEXTAUTH_URL=https://your-domain.com
   ```
3. **Redeploy** 클릭하여 재배포

## 문제가 계속되면

1. **완전 정리 후 재시작:**
   ```bash
   npm run cleanup:all
   npm run dev
   ```

2. **시크릿 모드에서 테스트:**
   - 브라우저 시크릿/프라이빗 모드에서 테스트
   - 확장 프로그램이나 캐시 문제를 배제

3. **환경 변수 재확인:**
   - `.env.local` 파일이 프로젝트 루트에 있는지 확인
   - 환경 변수 이름이 정확한지 확인 (대소문자 구분)
   - 따옴표 없이 입력했는지 확인

4. **NextAuth.js 버전 확인:**
   ```bash
   npm list next-auth
   ```
   - NextAuth.js v5 (5.0.0-beta.30 이상) 사용 권장

## 참고 문서

- [NextAuth.js v5 문서](https://authjs.dev/getting-started/installation)
- [PKCE 설명](https://oauth.net/2/pkce/)
- [GITHUB_OAUTH_FIX.md](./GITHUB_OAUTH_FIX.md) - GitHub OAuth 설정 가이드

