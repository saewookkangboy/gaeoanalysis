# GitHub OAuth redirect_uri 오류 해결 가이드

## 문제 상황

GitHub 로그인 시 다음과 같은 오류가 발생합니다:
```
Be careful!
The redirect_uri is not associated with this application.
```

## 원인

GitHub OAuth App의 **Authorization callback URL**이 현재 애플리케이션의 콜백 URL과 일치하지 않아서 발생합니다.

## 해결 방법

### 0단계: 정확한 콜백 URL 확인 (가장 중요!)

**디버깅 엔드포인트 사용 (권장):**

1. 개발 서버 실행 후 브라우저에서 다음 URL 접속:
   ```
   http://localhost:3000/api/auth/debug
   ```
   또는 프로덕션 환경:
   ```
   https://your-domain.com/api/auth/debug
   ```

2. 응답에서 `callbackUrls.github` 값을 확인
3. 이 값이 GitHub OAuth App의 **Authorization callback URL**과 정확히 일치해야 합니다

**수동 확인:**

#### 로컬 개발 환경
- 현재 포트 확인: 터미널에서 `npm run dev` 실행 시 표시되는 포트
- 일반적으로: `http://localhost:3000` 또는 `http://localhost:3001`
- 콜백 URL: `http://localhost:3000/api/auth/callback/github` (또는 실제 포트)

#### 프로덕션 환경 (Vercel)
1. Vercel 대시보드에서 프로젝트 선택
2. **Settings** → **Domains**에서 실제 도메인 확인
3. 또는 브라우저 주소창에서 확인
4. 콜백 URL: `https://your-actual-domain.com/api/auth/callback/github`

### 1단계: GitHub OAuth App 설정 수정

1. [GitHub Settings](https://github.com/settings/developers)에 접속
2. **Developer settings** → **OAuth Apps** 클릭
3. 해당 OAuth App 클릭 (또는 새로 생성)
4. **Authorization callback URL** 필드 확인 및 수정:

   **⚠️ 중요: `/api/auth/debug` 엔드포인트에서 확인한 정확한 URL을 사용하세요!**

   **로컬 개발용 (예시):**
   ```
   http://localhost:3000/api/auth/callback/github
   ```
   또는 포트가 다른 경우:
   ```
   http://localhost:3001/api/auth/callback/github
   ```

   **프로덕션용 (예시):**
   ```
   https://your-actual-domain.com/api/auth/callback/github
   ```

   ⚠️ **중요 체크리스트:**
   - [ ] `/api/auth/debug`에서 확인한 정확한 URL을 사용했는가?
   - [ ] 프로토콜이 정확한가? (`http` vs `https`)
   - [ ] 포트 번호가 포함되어 있는가? (로컬의 경우 `:3000` 또는 실제 포트)
   - [ ] 경로가 정확한가? (`/api/auth/callback/github`)
   - [ ] 마지막에 슬래시(`/`)가 없는가?
   - [ ] 도메인이 실제 배포된 도메인과 일치하는가?
   - [ ] 대소문자가 정확한가? (일반적으로 소문자)

5. **Update application** 클릭하여 저장

### 3단계: 환경 변수 확인

`.env.local` 파일에 다음 환경 변수가 올바르게 설정되어 있는지 확인:

```env
# NextAuth v5
AUTH_SECRET=your-secret-key-here

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### 4단계: 개발 서버 재시작

```bash
npm run dev
```

### 5단계: 테스트

1. 브라우저에서 `http://localhost:3000/login` 접속
2. **GitHub로 로그인** 버튼 클릭
3. GitHub 인증 완료 후 정상적으로 리디렉션되는지 확인

## 추가 팁

### 여러 환경 사용 시

GitHub OAuth App은 하나의 콜백 URL만 허용합니다. 다음 중 하나를 선택하세요:

**옵션 1: 별도의 OAuth App 생성 (권장)**
- 개발용 OAuth App: `http://localhost:3000/api/auth/callback/github`
- 프로덕션용 OAuth App: `https://your-domain.com/api/auth/callback/github`
- 환경 변수를 환경별로 다르게 설정

**옵션 2: 수동으로 콜백 URL 변경**
- 개발 시: GitHub OAuth App에서 로컬 URL로 변경
- 배포 시: GitHub OAuth App에서 프로덕션 URL로 변경

### Vercel 배포 시

Vercel에서는 환경 변수를 자동으로 설정하지만, GitHub OAuth App의 콜백 URL은 수동으로 설정해야 합니다:

1. Vercel에서 배포된 실제 도메인 확인
2. GitHub OAuth App의 Authorization callback URL을 해당 도메인으로 설정
3. Vercel 환경 변수에 `GITHUB_CLIENT_ID`와 `GITHUB_CLIENT_SECRET` 설정

## 문제가 계속되면

1. **브라우저 콘솔 확인**: 실제 사용되는 콜백 URL 확인
2. **NextAuth 로그 확인**: 개발 서버 콘솔에서 오류 메시지 확인
3. **GitHub OAuth App 재생성**: 기존 앱을 삭제하고 새로 생성
4. **환경 변수 재확인**: `.env.local` 파일과 Vercel 환경 변수 모두 확인

## 참고 문서

- [OAUTH_SETUP.md](./OAUTH_SETUP.md) - 전체 OAuth 설정 가이드
- [NextAuth.js 문서](https://authjs.dev/getting-started/installation)
- [GitHub OAuth 문서](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)

