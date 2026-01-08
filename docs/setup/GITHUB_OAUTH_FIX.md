# GitHub OAuth redirect_uri 오류 해결 가이드

## 문제 상황

GitHub 로그인 시 다음과 같은 오류가 발생합니다:
```
Be careful!
The redirect_uri is not associated with this application.
The application might be misconfigured or could be trying to redirect you to a website you weren't expecting.
```

## 원인

GitHub OAuth App의 **Authorization callback URL**이 현재 애플리케이션의 콜백 URL과 일치하지 않아서 발생합니다.

## 해결 방법

### 0단계: 정확한 콜백 URL 확인 (가장 중요!) ⭐

**디버깅 엔드포인트 사용 (권장):**

1. **실서버에서 다음 URL 접속:**
   ```
   https://your-actual-domain.com/api/auth/debug
   ```
   또는 Vercel 도메인:
   ```
   https://your-project.vercel.app/api/auth/debug
   ```

2. **응답에서 `callbackUrls.github` 값을 확인**
   - 예: `https://gaeo.allrounder.im/api/auth/callback/github`
   - 또는: `https://your-project.vercel.app/api/auth/callback/github`

3. **이 값을 복사하여 GitHub OAuth App에 정확히 입력해야 합니다**

**⚠️ 중요:** 
- 프로토콜(`https`), 도메인, 경로가 정확히 일치해야 합니다
- 마지막에 슬래시(`/`)가 없어야 합니다
- 대소문자를 정확히 맞춰야 합니다

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

1. **[GitHub Settings](https://github.com/settings/developers)에 접속**
   - GitHub 계정으로 로그인
   - 우측 상단 프로필 → **Settings** 클릭

2. **Developer settings → OAuth Apps 이동**
   - 왼쪽 메뉴에서 **Developer settings** 클릭
   - **OAuth Apps** 클릭

3. **OAuth App 선택 또는 생성**
   - 기존 OAuth App이 있으면 클릭
   - 없으면 **New OAuth App** 또는 **Register a new application** 클릭

4. **Authorization callback URL 수정**
   
   **⚠️ 중요: `/api/auth/debug` 엔드포인트에서 확인한 정확한 URL을 복사해서 사용하세요!**

   **실서버 (프로덕션) 예시:**
   ```
   https://gaeo.allrounder.im/api/auth/callback/github
   ```
   또는 Vercel 도메인:
   ```
   https://your-project.vercel.app/api/auth/callback/github
   ```

   **로컬 개발용 (예시):**
   ```
   http://localhost:3000/api/auth/callback/github
   ```

   ⚠️ **중요 체크리스트 (반드시 확인!):**
   - [ ] `/api/auth/debug`에서 확인한 정확한 URL을 복사해서 사용했는가?
   - [ ] 프로토콜이 정확한가? (실서버: `https`, 로컬: `http`)
   - [ ] 도메인이 실제 배포된 도메인과 정확히 일치하는가?
   - [ ] 경로가 정확한가? (`/api/auth/callback/github`)
   - [ ] 마지막에 슬래시(`/`)가 없는가?
   - [ ] 대소문자가 정확한가? (모두 소문자)
   - [ ] 포트 번호가 포함되어 있지 않은가? (실서버는 포트 없음)

5. **Update application** 또는 **Register application** 클릭하여 저장

6. **Client ID와 Client Secret 확인**
   - 저장 후 표시되는 **Client ID**와 **Client Secret**을 복사
   - Vercel 환경 변수에 설정해야 함

### 2단계: Vercel 환경 변수 설정 (실서버)

1. **Vercel 대시보드 접속**
   - [https://vercel.com/dashboard](https://vercel.com/dashboard)
   - 프로젝트 선택

2. **Settings → Environment Variables 이동**
   - 왼쪽 메뉴에서 **Settings** 클릭
   - **Environment Variables** 클릭

3. **환경 변수 추가/수정**

   **필수 환경 변수:**
   ```env
   AUTH_SECRET=your-secret-key-here
   AUTH_URL=https://gaeo.allrounder.im
   # 또는 Vercel 도메인: https://your-project.vercel.app
   
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   ```

   **⚠️ 중요:**
   - `AUTH_URL`은 실제 배포된 도메인과 정확히 일치해야 합니다
   - `GITHUB_CLIENT_ID`와 `GITHUB_CLIENT_SECRET`은 GitHub OAuth App에서 복사한 값입니다
   - 환경 변수 추가 후 **Redeploy** 필요

4. **Redeploy 실행**
   - 환경 변수 추가 후 **Deployments** 탭으로 이동
   - 최신 배포의 **⋯** 메뉴 → **Redeploy** 클릭
   - 또는 새 커밋 푸시 시 자동 재배포

### 3단계: 재배포 및 테스트

1. **Vercel 재배포**
   - 환경 변수 설정 후 자동 재배포 대기
   - 또는 수동으로 **Redeploy** 실행

2. **디버그 엔드포인트로 확인**
   - `https://your-domain.com/api/auth/debug` 접속
   - `callbackUrls.github` 값이 GitHub OAuth App 설정과 일치하는지 확인

3. **로그인 테스트**
   - `https://your-domain.com/login` 접속
   - **GitHub로 로그인** 버튼 클릭
   - GitHub 인증 완료 후 정상적으로 리디렉션되는지 확인

### 4단계: 로컬 개발 환경 설정 (선택사항)

로컬에서도 테스트하려면:

1. **별도의 GitHub OAuth App 생성 (권장)**
   - 개발용 OAuth App: `http://localhost:3000/api/auth/callback/github`
   - 프로덕션용 OAuth App: `https://your-domain.com/api/auth/callback/github`

2. **`.env.local` 파일 설정**
   ```env
   # NextAuth v5
   AUTH_SECRET=your-secret-key-here
   AUTH_URL=http://localhost:3000
   
   # GitHub OAuth (개발용)
   GITHUB_CLIENT_ID_DEV=your-dev-github-client-id
   GITHUB_CLIENT_SECRET_DEV=your-dev-github-client-secret
   ```

3. **개발 서버 재시작**
   ```bash
   npm run dev
   ```

## 실서버 문제 해결 체크리스트

다음 항목을 순서대로 확인하세요:

### ✅ 1. 현재 사용 중인 도메인 확인
- [ ] Vercel 대시보드 → Settings → Domains에서 실제 도메인 확인
- [ ] 또는 브라우저 주소창에서 확인
- [ ] `/api/auth/debug` 엔드포인트 접속하여 `callbackUrls.github` 확인

### ✅ 2. GitHub OAuth App 설정 확인
- [ ] [GitHub OAuth Apps](https://github.com/settings/developers) 접속
- [ ] 사용 중인 OAuth App 선택
- [ ] **Authorization callback URL**이 `/api/auth/debug`에서 확인한 URL과 정확히 일치하는지 확인
- [ ] 일치하지 않으면 수정 후 **Update application** 클릭

### ✅ 3. Vercel 환경 변수 확인
- [ ] Vercel 대시보드 → Settings → Environment Variables
- [ ] `AUTH_URL`이 실제 도메인과 일치하는지 확인
- [ ] `GITHUB_CLIENT_ID`와 `GITHUB_CLIENT_SECRET`이 설정되어 있는지 확인
- [ ] GitHub OAuth App의 Client ID/Secret과 일치하는지 확인

### ✅ 4. 재배포 및 테스트
- [ ] 환경 변수 수정 후 재배포 완료 대기
- [ ] `/api/auth/debug` 엔드포인트로 최종 확인
- [ ] GitHub 로그인 테스트

## 추가 팁

### 여러 환경 사용 시

GitHub OAuth App은 하나의 콜백 URL만 허용합니다. 다음 중 하나를 선택하세요:

**옵션 1: 별도의 OAuth App 생성 (권장)**
- 개발용 OAuth App: `http://localhost:3000/api/auth/callback/github`
- 프로덕션용 OAuth App: `https://your-domain.com/api/auth/callback/github`
- 환경 변수를 환경별로 다르게 설정 (`GITHUB_CLIENT_ID_DEV`, `GITHUB_CLIENT_SECRET_DEV`)

**옵션 2: 수동으로 콜백 URL 변경**
- 개발 시: GitHub OAuth App에서 로컬 URL로 변경
- 배포 시: GitHub OAuth App에서 프로덕션 URL로 변경
- ⚠️ 주의: 매번 수동으로 변경해야 하므로 불편함

### 커스텀 도메인 사용 시

`allrounder.im` 도메인의 서브도메인을 사용하는 경우:

1. **Vercel에서 도메인 연결 완료 확인**
2. **GitHub OAuth App 설정:**
   ```
   https://gaeo.allrounder.im/api/auth/callback/github
   ```
3. **Vercel 환경 변수:**
   ```env
   AUTH_URL=https://gaeo.allrounder.im
   ```
4. **재배포 후 테스트**

## 문제가 계속되면

1. **브라우저 콘솔 확인**: 실제 사용되는 콜백 URL 확인
2. **NextAuth 로그 확인**: 개발 서버 콘솔에서 오류 메시지 확인
3. **GitHub OAuth App 재생성**: 기존 앱을 삭제하고 새로 생성
4. **환경 변수 재확인**: `.env.local` 파일과 Vercel 환경 변수 모두 확인

## 참고 문서

- [OAUTH_SETUP.md](./OAUTH_SETUP.md) - 전체 OAuth 설정 가이드
- [NextAuth.js 문서](https://authjs.dev/getting-started/installation)
- [GitHub OAuth 문서](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)

