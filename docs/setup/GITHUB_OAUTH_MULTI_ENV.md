# GitHub OAuth 다중 환경 설정 가이드

## 문제 상황

GitHub OAuth App은 **하나의 Authorization callback URL만 허용**합니다. 따라서 로컬 개발 환경(`http://localhost:3000`)과 프로덕션 환경(`https://gaeoanalysis.vercel.app`)에서 각각 다른 OAuth App을 사용해야 합니다.

## 해결 방법: 환경별 OAuth App 생성

### 1단계: 로컬 개발용 GitHub OAuth App 생성

1. [GitHub Settings](https://github.com/settings/developers)에 접속
2. **Developer settings** → **OAuth Apps** → **New OAuth App** 클릭
3. 다음 정보 입력:
   - **Application name**: `GAEO Analysis (Local Development)`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. **Register application** 클릭
5. **Client ID**와 **Client secrets** 복사 (Generate a new client secret 클릭)

### 2단계: 프로덕션용 GitHub OAuth App 확인

1. [GitHub Settings](https://github.com/settings/developers)에 접속
2. **Developer settings** → **OAuth Apps**에서 기존 프로덕션용 OAuth App 확인
3. **Authorization callback URL**이 다음인지 확인:
   ```
   https://gaeoanalysis.vercel.app/api/auth/callback/github
   ```
4. **Client ID**와 **Client secrets** 확인

### 3단계: 환경 변수 설정

#### 로컬 개발 환경 (`.env.local`)

```env
# NextAuth
AUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# GitHub OAuth - 로컬 개발용
GITHUB_CLIENT_ID_DEV=your-local-github-client-id
GITHUB_CLIENT_SECRET_DEV=your-local-github-client-secret

# GitHub OAuth - 프로덕션용 (선택 사항, 개발 환경에서는 사용되지 않음)
# GITHUB_CLIENT_ID=your-production-github-client-id
# GITHUB_CLIENT_SECRET=your-production-github-client-secret
```

#### 프로덕션 환경 (Vercel)

Vercel 대시보드 → **Settings** → **Environment Variables**에서 설정:

```env
# NextAuth
AUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://gaeoanalysis.vercel.app

# GitHub OAuth - 프로덕션용
GITHUB_CLIENT_ID=your-production-github-client-id
GITHUB_CLIENT_SECRET=your-production-github-client-secret
```

### 4단계: 코드 자동 전환 확인

`auth.ts` 파일이 자동으로 환경에 따라 올바른 OAuth App을 사용하도록 설정되어 있습니다:

- **개발 환경** (`NODE_ENV=development`): `GITHUB_CLIENT_ID_DEV`, `GITHUB_CLIENT_SECRET_DEV` 사용
- **프로덕션 환경**: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` 사용

### 5단계: 테스트

#### 로컬 개발 환경

1. `.env.local` 파일에 로컬 개발용 OAuth App 정보 입력
2. 개발 서버 재시작:
   ```bash
   npm run dev
   ```
3. `http://localhost:3000/login` 접속
4. **GitHub로 로그인** 버튼 클릭
5. 정상적으로 작동하는지 확인

#### 프로덕션 환경

1. Vercel 환경 변수에 프로덕션용 OAuth App 정보 입력
2. Vercel에서 재배포
3. `https://gaeoanalysis.vercel.app/login` 접속
4. **GitHub로 로그인** 버튼 클릭
5. 정상적으로 작동하는지 확인

## 환경 변수 우선순위

개발 환경에서:
1. `GITHUB_CLIENT_ID_DEV` / `GITHUB_CLIENT_SECRET_DEV` (우선)
2. `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` (fallback)

프로덕션 환경에서:
1. `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` (필수)

## 문제 해결

### 여전히 redirect_uri 오류가 발생한다면

1. **환경 변수 확인:**
   - 로컬: `GITHUB_CLIENT_ID_DEV`, `GITHUB_CLIENT_SECRET_DEV` 설정 확인
   - 프로덕션: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` 설정 확인

2. **GitHub OAuth App 설정 확인:**
   - 로컬용: `http://localhost:3000/api/auth/callback/github`
   - 프로덕션용: `https://gaeoanalysis.vercel.app/api/auth/callback/github`

3. **서버 재시작:**
   - 환경 변수 변경 후 반드시 서버 재시작

4. **디버깅 엔드포인트 확인:**
   - `http://localhost:3000/api/auth/debug` 접속
   - `callbackUrls.github` 값 확인
   - 이 값이 GitHub OAuth App 설정과 정확히 일치하는지 확인

## 대안: 단일 OAuth App 사용 (권장하지 않음)

만약 하나의 OAuth App만 사용하고 싶다면:

1. **로컬 개발 시**: 프로덕션 URL을 사용하도록 설정
   - `.env.local`에 `NEXTAUTH_URL=https://gaeoanalysis.vercel.app` 설정
   - GitHub OAuth App의 콜백 URL을 프로덕션 URL로 설정
   - ⚠️ **주의**: 로컬에서 로그인 시 프로덕션으로 리디렉션됨

2. **프로덕션 배포 전**: GitHub OAuth App 설정을 프로덕션 URL로 변경

이 방법은 권장하지 않습니다. 환경별 OAuth App을 사용하는 것이 더 안전하고 편리합니다.

## 참고 문서

- [GITHUB_OAUTH_FIX.md](./GITHUB_OAUTH_FIX.md) - 기본 GitHub OAuth 설정 가이드
- [GITHUB_OAUTH_CHECKLIST.md](./GITHUB_OAUTH_CHECKLIST.md) - 체크리스트
- [OAUTH_SETUP.md](./OAUTH_SETUP.md) - 전체 OAuth 설정 가이드

