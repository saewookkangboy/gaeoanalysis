# PKCE 오류 프로덕션 환경 해결 가이드

## 🚨 문제 상황

Google/GitHub 로그인 시 다음과 같은 오류가 발생합니다:
```
[auth][error] InvalidCheck: pkceCodeVerifier value could not be parsed.
Server error: There is a problem with the server configuration.
```

## 🔍 원인

1. **AUTH_SECRET 미설정 또는 잘못된 설정**
   - 쿠키 암호화/복호화에 필요한 시크릿 키가 없거나 잘못됨
   - Vercel 환경 변수에 제대로 설정되지 않음

2. **쿠키 설정 문제**
   - 프로덕션 환경에서 쿠키 도메인 설정이 잘못됨
   - Vercel 환경에서 도메인을 명시적으로 설정하면 문제 발생 가능

3. **쿠키 암호화/복호화 실패**
   - AUTH_SECRET이 변경되었거나 불일치
   - 쿠키가 손상되었거나 만료됨

## ✅ 해결 방법

### 1단계: AUTH_SECRET 확인 및 재설정 (가장 중요!)

**Vercel 환경 변수 확인:**

1. **Vercel 대시보드** → 프로젝트 → **Settings** → **Environment Variables**
2. `AUTH_SECRET` 또는 `NEXTAUTH_SECRET` 확인
3. 없거나 의심스러우면 재생성:

```bash
# 터미널에서 실행
openssl rand -base64 32
```

4. **생성된 키를 Vercel 환경 변수에 설정:**
   - Key: `AUTH_SECRET`
   - Value: 생성된 키 (따옴표 없이)
   - Environment: Production, Preview, Development 모두 선택

5. **기존 `NEXTAUTH_SECRET`이 있으면:**
   - `AUTH_SECRET`으로 변경하거나
   - 둘 다 동일한 값으로 설정

### 2단계: 환경 변수 확인

**필수 환경 변수:**
```env
AUTH_SECRET=your-secret-key-here (최소 32자)
AUTH_URL=https://your-domain.com
# 또는
NEXTAUTH_URL=https://your-domain.com
```

**OAuth 환경 변수:**
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### 3단계: 재배포

1. **환경 변수 설정 후 자동 재배포 대기**
   - 또는 수동으로 **Redeploy** 실행

2. **배포 완료 후 확인:**
   - Vercel 로그에서 `✅ AUTH_SECRET 설정 확인됨` 메시지 확인
   - AUTH_SECRET 길이 경고가 없는지 확인

### 4단계: 브라우저 쿠키 삭제

1. **브라우저 개발자 도구** (F12)
2. **Application** (Chrome) 또는 **Storage** (Firefox) 탭
3. **Cookies** → 도메인 선택
4. 다음 쿠키 삭제:
   - `__Secure-authjs.pkce.code_verifier`
   - `__Secure-authjs.state`
   - `__Secure-authjs.session-token`
   - 기타 `authjs.*` 쿠키
5. **또는 Clear site data** 클릭

### 5단계: 테스트

1. **시크릿 모드**에서 테스트 (권장)
2. Google/GitHub 로그인 시도
3. 정상적으로 작동하는지 확인

## 🔧 추가 해결 방법

### 방법 1: AUTH_SECRET 재생성

기존 AUTH_SECRET이 손상되었을 수 있습니다:

1. 새로운 AUTH_SECRET 생성
2. Vercel 환경 변수에 업데이트
3. 재배포
4. 브라우저 쿠키 삭제 후 재시도

### 방법 2: OAuth App 재생성

OAuth 설정 문제일 수 있습니다:

**Google OAuth:**
1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. OAuth 2.0 클라이언트 ID 확인
3. 승인된 리디렉션 URI 확인:
   ```
   https://your-domain.com/api/auth/callback/google
   ```

**GitHub OAuth:**
1. [GitHub OAuth Apps](https://github.com/settings/developers)
2. OAuth App 확인
3. Authorization callback URL 확인:
   ```
   https://your-domain.com/api/auth/callback/github
   ```

### 방법 3: Vercel 프로젝트 재배포

1. **Vercel 대시보드** → 프로젝트
2. **Deployments** 탭
3. 최신 배포의 **⋯** 메뉴 → **Redeploy**
4. 또는 새 커밋 푸시

## ⚠️ 주의사항

1. **AUTH_SECRET은 절대 변경하지 마세요**
   - 변경 시 모든 사용자의 세션이 무효화됩니다
   - 변경이 필요한 경우 점진적으로 마이그레이션

2. **환경 변수는 Production, Preview, Development 모두 설정**
   - 각 환경에서 동일한 AUTH_SECRET 사용 권장

3. **쿠키 도메인 설정**
   - Vercel 환경에서는 자동으로 처리되므로 명시적 설정 불필요
   - 커스텀 도메인 사용 시에만 필요

## 📋 체크리스트

- [ ] Vercel 환경 변수에 `AUTH_SECRET` 설정 확인
- [ ] AUTH_SECRET 길이가 32자 이상인지 확인
- [ ] `AUTH_URL` 또는 `NEXTAUTH_URL` 설정 확인
- [ ] Google OAuth Client ID/Secret 설정 확인
- [ ] GitHub OAuth Client ID/Secret 설정 확인
- [ ] 재배포 완료
- [ ] 브라우저 쿠키 삭제
- [ ] 시크릿 모드에서 테스트
- [ ] Vercel 로그에서 `✅ AUTH_SECRET 설정 확인됨` 확인

## 🐛 문제가 계속되면

1. **Vercel 로그 확인:**
   - Deployments → 최신 배포 → Logs
   - `AUTH_SECRET` 관련 오류 확인

2. **환경 변수 재확인:**
   - Vercel 대시보드에서 실제 값 확인
   - 공백이나 특수문자 없는지 확인

3. **NextAuth.js 버전 확인:**
   ```bash
   npm list next-auth
   ```
   - NextAuth.js v5 (5.0.0-beta.30 이상) 권장

4. **완전 재설정:**
   - 새로운 AUTH_SECRET 생성
   - 모든 환경 변수 재설정
   - 재배포
   - 브라우저 쿠키 완전 삭제

## 참고 문서

- [PKCE_ERROR_FIX.md](./PKCE_ERROR_FIX.md) - 일반 PKCE 오류 해결
- [GITHUB_OAUTH_FIX.md](./GITHUB_OAUTH_FIX.md) - GitHub OAuth 설정
- [GOOGLE_OAUTH_FIX.md](./GOOGLE_OAUTH_FIX.md) - Google OAuth 설정

