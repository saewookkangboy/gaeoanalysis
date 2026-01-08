# GitHub OAuth 프로덕션 환경 오류 해결 가이드

## 문제 상황

프로덕션 환경(`https://gaeoanalysis.vercel.app`)에서 GitHub 로그인 시 다음 오류가 발생합니다:

```
Be careful!
The redirect_uri is not associated with this application.
```

## 원인

GitHub OAuth App의 **Authorization callback URL**이 프로덕션 환경의 실제 콜백 URL과 일치하지 않아서 발생합니다.

## 즉시 해결 방법

### 1단계: 정확한 콜백 URL 확인

프로덕션 환경에서 다음 URL을 브라우저에서 열어주세요:

```
https://gaeoanalysis.vercel.app/api/auth/debug
```

응답에서 `callbackUrls.github` 값을 확인하세요. 예:
```json
{
  "callbackUrls": {
    "github": "https://gaeoanalysis.vercel.app/api/auth/callback/github"
  }
}
```

### 2단계: GitHub OAuth App 설정 수정

1. [GitHub Settings](https://github.com/settings/developers)에 접속
2. **Developer settings** → **OAuth Apps** 클릭
3. 프로덕션용 OAuth App 클릭 (또는 새로 생성)
4. **Authorization callback URL** 필드에 다음을 **정확히** 입력:

   ```
   https://gaeoanalysis.vercel.app/api/auth/callback/github
   ```

   ⚠️ **중요 체크리스트:**
   - [ ] 프로토콜: `https` (http 아님)
   - [ ] 도메인: `gaeoanalysis.vercel.app` (정확히 일치)
   - [ ] 경로: `/api/auth/callback/github` (정확히 일치)
   - [ ] 마지막에 슬래시(`/`) 없음
   - [ ] 대소문자 정확히 일치

5. **Update application** 클릭하여 저장

### 3단계: Vercel 환경 변수 확인

Vercel 대시보드 → **Settings** → **Environment Variables**에서 다음이 설정되어 있는지 확인:

```env
# NextAuth
AUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://gaeoanalysis.vercel.app

# GitHub OAuth - 프로덕션용
GITHUB_CLIENT_ID=your-production-github-client-id
GITHUB_CLIENT_SECRET=your-production-github-client-secret
```

⚠️ **중요**: 
- `GITHUB_CLIENT_ID_DEV`와 `GITHUB_CLIENT_SECRET_DEV`는 프로덕션에서 사용되지 않습니다
- 프로덕션에서는 `GITHUB_CLIENT_ID`와 `GITHUB_CLIENT_SECRET`만 사용됩니다

### 4단계: Vercel 재배포

1. Vercel 대시보드에서 **Deployments** 탭으로 이동
2. 최신 배포를 선택하고 **Redeploy** 클릭
3. 또는 Git에 푸시하여 자동 재배포

### 5단계: 테스트

1. `https://gaeoanalysis.vercel.app/login` 접속
2. **GitHub로 로그인** 버튼 클릭
3. GitHub 인증 완료 후 정상적으로 리디렉션되는지 확인

## 환경별 OAuth App 설정 (권장)

### 옵션 1: 프로덕션용 별도 OAuth App 생성 (권장)

1. **프로덕션용 OAuth App 생성:**
   - Application name: `GAEO Analysis (Production)`
   - Homepage URL: `https://gaeoanalysis.vercel.app`
   - Authorization callback URL: `https://gaeoanalysis.vercel.app/api/auth/callback/github`

2. **Vercel 환경 변수 설정:**
   ```
   GITHUB_CLIENT_ID=<프로덕션용-client-id>
   GITHUB_CLIENT_SECRET=<프로덕션용-client-secret>
   ```

3. **로컬 개발용 OAuth App 유지:**
   - `.env.local`에 `GITHUB_CLIENT_ID_DEV`, `GITHUB_CLIENT_SECRET_DEV` 설정

### 옵션 2: 단일 OAuth App 사용 (간단하지만 권장하지 않음)

1. GitHub OAuth App의 Authorization callback URL을 프로덕션 URL로 설정:
   ```
   https://gaeoanalysis.vercel.app/api/auth/callback/github
   ```

2. 로컬 개발 시에도 프로덕션 URL 사용 (Vercel로 리디렉션됨)

## 문제 해결 체크리스트

- [ ] `/api/auth/debug`에서 확인한 정확한 콜백 URL을 GitHub OAuth App에 입력했는가?
- [ ] 프로토콜(`https`)이 정확한가?
- [ ] 도메인이 정확히 일치하는가? (`gaeoanalysis.vercel.app`)
- [ ] 경로가 정확한가? (`/api/auth/callback/github`)
- [ ] 마지막에 슬래시(`/`)가 없는가?
- [ ] Vercel 환경 변수에 `GITHUB_CLIENT_ID`와 `GITHUB_CLIENT_SECRET`이 설정되어 있는가?
- [ ] Vercel 재배포를 했는가?
- [ ] GitHub OAuth App 설정을 저장한 후 몇 분 기다렸는가?

## 추가 디버깅

### 네트워크 탭 확인

1. 브라우저 개발자 도구 (F12) → **Network** 탭
2. GitHub 로그인 버튼 클릭
3. `/api/auth/signin/github` 요청 확인
4. 리디렉션되는 URL 확인
5. `redirect_uri` 파라미터 값 확인

### 서버 로그 확인

Vercel 대시보드 → **Functions** → **Logs**에서 NextAuth 관련 오류 확인

## 참고 문서

- [GITHUB_OAUTH_MULTI_ENV.md](./GITHUB_OAUTH_MULTI_ENV.md) - 환경별 OAuth App 설정 가이드
- [GITHUB_OAUTH_FIX.md](./GITHUB_OAUTH_FIX.md) - 기본 GitHub OAuth 설정 가이드
- [GITHUB_OAUTH_CHECKLIST.md](./GITHUB_OAUTH_CHECKLIST.md) - 체크리스트

