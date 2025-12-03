# Vercel PKCE 에러 해결 가이드

## 🚨 에러 메시지

```
[auth][error] InvalidCheck: pkceCodeVerifier value could not be parsed.
```

이 에러는 NextAuth.js v5에서 PKCE (Proof Key for Code Exchange) 코드 검증자를 쿠키에서 파싱할 수 없을 때 발생합니다.

## 🔍 주요 원인

1. **AUTH_SECRET 미설정 또는 잘못된 설정** (가장 흔한 원인)
   - Vercel 환경 변수에 `AUTH_SECRET`이 설정되지 않았거나 값이 잘못됨
   - 쿠키 암호화/복호화에 필요한 시크릿 키가 없음

2. **쿠키 암호화/복호화 실패**
   - AUTH_SECRET이 변경되었거나 불일치
   - 쿠키가 손상되었거나 만료됨

3. **환경 변수 동기화 문제**
   - 환경 변수가 설정되었지만 배포가 반영되지 않음

## ✅ 해결 방법

### 1단계: Vercel 환경 변수 확인 및 설정

1. **Vercel 대시보드 접속**
   - [Vercel Dashboard](https://vercel.com/dashboard) → 프로젝트 선택

2. **환경 변수 확인**
   - **Settings** → **Environment Variables** 클릭
   - `AUTH_SECRET` 또는 `NEXTAUTH_SECRET` 확인

3. **AUTH_SECRET이 없거나 의심스러운 경우**

   **터미널에서 새 시크릿 생성:**
   ```bash
   openssl rand -base64 32
   ```

   **또는 NextAuth.js 공식 명령어:**
   ```bash
   npx auth secret
   ```

4. **Vercel에 환경 변수 추가/수정**
   - **Add New** 클릭
   - **Key**: `AUTH_SECRET`
   - **Value**: 생성한 시크릿 키 (따옴표 없이)
   - **Environment**: 
     - ✅ Production
     - ✅ Preview
     - ✅ Development (선택)
   - **Save** 클릭

5. **기존 NEXTAUTH_SECRET이 있는 경우**
   - `AUTH_SECRET`으로 변경하거나
   - 둘 다 동일한 값으로 설정

### 2단계: 필수 환경 변수 확인

다음 환경 변수들이 모두 설정되어 있는지 확인:

```env
# 필수: NextAuth 시크릿 키
AUTH_SECRET=your-secret-key-here (최소 32자)

# 필수: NextAuth URL
AUTH_URL=https://your-domain.vercel.app
# 또는
NEXTAUTH_URL=https://your-domain.vercel.app

# OAuth 설정
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### 3단계: 재배포

환경 변수를 추가/수정한 후:

1. **자동 재배포 대기**
   - Vercel이 자동으로 재배포를 시작합니다
   - 또는 수동으로 **Deployments** → 최신 배포의 **⋯** → **Redeploy** 클릭

2. **배포 완료 확인**
   - 배포가 완료될 때까지 대기 (보통 1-2분)

### 4단계: 배포 로그 확인

1. **Vercel 대시보드** → **Deployments** → 최신 배포 클릭
2. **Logs** 탭 확인
3. 다음 메시지가 나타나는지 확인:
   ```
   ✅ AUTH_SECRET 설정 확인됨
   AUTH_SECRET 길이: XX (권장: 32자 이상)
   ```

4. **경고 메시지가 있다면:**
   - `⚠️ AUTH_SECRET이 너무 짧습니다` → 더 긴 시크릿 생성
   - `⚠️ AUTH_SECRET 형식이 올바르지 않을 수 있습니다` → base64 형식 확인

### 5단계: 브라우저 쿠키 삭제

기존 쿠키가 손상되었을 수 있으므로 삭제:

1. **브라우저 개발자 도구** (F12)
2. **Application** (Chrome) 또는 **Storage** (Firefox) 탭
3. **Cookies** → 도메인 선택
4. 다음 쿠키 삭제:
   - `__Secure-authjs.pkce.code_verifier`
   - `__Secure-authjs.state`
   - `__Secure-authjs.session-token`
   - 기타 `authjs.*` 쿠키
5. **또는 Clear site data** 클릭

### 6단계: 테스트

1. **시크릿 모드**에서 테스트 (권장)
   - 브라우저 시크릿/프라이빗 모드 열기
   - 사이트 접속 후 로그인 시도

2. **정상 작동 확인**
   - Google/GitHub 로그인 버튼 클릭
   - OAuth 인증 완료 후 리디렉션 확인
   - 로그인 성공 확인

## 🔧 추가 해결 방법

### 방법 1: AUTH_SECRET 완전 재생성

기존 AUTH_SECRET이 손상되었을 수 있습니다:

1. 새로운 AUTH_SECRET 생성
2. Vercel 환경 변수에 업데이트
3. 재배포
4. 브라우저 쿠키 완전 삭제 후 재시도

**⚠️ 주의**: AUTH_SECRET을 변경하면 모든 사용자의 세션이 무효화됩니다.

### 방법 2: OAuth App 콜백 URL 확인

OAuth 설정 문제일 수 있습니다:

**Google OAuth:**
1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. OAuth 2.0 클라이언트 ID 확인
3. 승인된 리디렉션 URI 확인:
   ```
   https://your-domain.vercel.app/api/auth/callback/google
   ```

**GitHub OAuth:**
1. [GitHub OAuth Apps](https://github.com/settings/developers)
2. OAuth App 확인
3. Authorization callback URL 확인:
   ```
   https://your-domain.vercel.app/api/auth/callback/github
   ```

### 방법 3: NextAuth.js 버전 확인

```bash
npm list next-auth
```

- NextAuth.js v5 (5.0.0-beta.30 이상) 사용 권장
- 버전이 낮으면 업데이트:
  ```bash
  npm install next-auth@latest
  ```

## 📋 체크리스트

- [ ] Vercel 환경 변수에 `AUTH_SECRET` 설정 확인
- [ ] AUTH_SECRET 길이가 32자 이상인지 확인
- [ ] `AUTH_URL` 또는 `NEXTAUTH_URL` 설정 확인
- [ ] Google OAuth Client ID/Secret 설정 확인
- [ ] GitHub OAuth Client ID/Secret 설정 확인
- [ ] 재배포 완료
- [ ] 배포 로그에서 `✅ AUTH_SECRET 설정 확인됨` 확인
- [ ] 브라우저 쿠키 삭제
- [ ] 시크릿 모드에서 테스트
- [ ] 로그인 정상 작동 확인

## 🐛 문제가 계속되면

1. **Vercel 로그 상세 확인**
   - Deployments → 최신 배포 → Logs
   - `AUTH_SECRET` 관련 오류 확인
   - PKCE 에러 스택 트레이스 확인

2. **환경 변수 재확인**
   - Vercel 대시보드에서 실제 값 확인
   - 공백이나 특수문자 없는지 확인
   - 따옴표 없이 입력했는지 확인

3. **완전 재설정**
   - 새로운 AUTH_SECRET 생성
   - 모든 환경 변수 재설정
   - 재배포
   - 브라우저 쿠키 완전 삭제
   - 시크릿 모드에서 테스트

4. **NextAuth.js 설정 확인**
   - `auth.ts` 파일의 쿠키 설정 확인
   - `trustHost: true` 설정 확인

## 📚 참고 문서

- [PKCE_ERROR_PRODUCTION_FIX.md](./PKCE_ERROR_PRODUCTION_FIX.md) - 일반 PKCE 오류 해결
- [PKCE_ERROR_FIX.md](./PKCE_ERROR_FIX.md) - 로컬 환경 PKCE 오류 해결
- [GITHUB_OAUTH_FIX.md](./GITHUB_OAUTH_FIX.md) - GitHub OAuth 설정
- [GOOGLE_OAUTH_FIX.md](./GOOGLE_OAUTH_FIX.md) - Google OAuth 설정

## 💡 예방 방법

1. **환경 변수 백업**
   - AUTH_SECRET을 안전한 곳에 백업
   - 변경 시 신중하게 진행

2. **정기적인 확인**
   - 배포 후 로그 확인
   - AUTH_SECRET 관련 경고 확인

3. **테스트 환경 분리**
   - 개발/프로덕션 환경 분리
   - 각 환경에 적절한 AUTH_SECRET 설정

