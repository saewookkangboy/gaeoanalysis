# GitHub OAuth 설정 체크리스트

## ✅ 필수 확인 사항

### 1. 디버깅 엔드포인트 확인
- [ ] `http://localhost:3000/api/auth/debug` 접속
- [ ] `callbackUrls.github` 값을 확인
- [ ] 값: `http://localhost:3000/api/auth/callback/github` (또는 실제 포트)

### 2. GitHub OAuth App 설정
- [ ] [GitHub Settings](https://github.com/settings/developers) 접속
- [ ] **Developer settings** → **OAuth Apps** 클릭
- [ ] 해당 OAuth App 클릭 (또는 새로 생성)

### 3. Authorization callback URL 설정
- [ ] **Authorization callback URL** 필드에 다음을 정확히 입력:
  ```
  http://localhost:3000/api/auth/callback/github
  ```
- [ ] ⚠️ **정확히 일치해야 합니다:**
  - [ ] 프로토콜: `http` (로컬) 또는 `https` (프로덕션)
  - [ ] 포트: `:3000` (또는 실제 사용 중인 포트)
  - [ ] 경로: `/api/auth/callback/github`
  - [ ] 마지막에 슬래시(`/`) 없음
  - [ ] 대소문자 정확히 일치

### 4. 환경 변수 확인
- [ ] `.env.local` 파일에 다음이 설정되어 있는지 확인:
  ```env
  GITHUB_CLIENT_ID=your-github-client-id
  GITHUB_CLIENT_SECRET=your-github-client-secret
  NEXTAUTH_URL=http://localhost:3000
  ```
- [ ] GitHub OAuth App의 Client ID와 Client Secret이 환경 변수와 일치하는지 확인

### 5. 저장 및 재시작
- [ ] GitHub OAuth App에서 **Update application** 클릭하여 저장
- [ ] 개발 서버 재시작: `npm run dev`
- [ ] 브라우저 캐시 지우기 (선택 사항)

### 6. 테스트
- [ ] `http://localhost:3000/login` 접속
- [ ] **GitHub로 로그인** 버튼 클릭
- [ ] GitHub 인증 페이지로 리디렉션되는지 확인
- [ ] 인증 완료 후 정상적으로 리디렉션되는지 확인

## ❌ 여전히 오류가 발생한다면

### 체크리스트
1. **콜백 URL 정확성**
   - `/api/auth/debug`에서 확인한 정확한 URL을 사용했는가?
   - 복사-붙여넣기를 사용했는가? (직접 입력 시 오타 가능)

2. **GitHub OAuth App 설정**
   - Client ID와 Client Secret이 올바른가?
   - Client Secret이 만료되지 않았는가? (만료 시 재생성 필요)

3. **환경 변수**
   - `.env.local` 파일이 프로젝트 루트에 있는가?
   - 환경 변수 이름이 정확한가? (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`)
   - 개발 서버를 재시작했는가?

4. **포트 확인**
   - 실제 사용 중인 포트가 3000인가?
   - 다른 포트를 사용 중이라면 GitHub OAuth App 설정도 해당 포트로 변경

5. **캐시 및 브라우저**
   - 브라우저 캐시를 지웠는가?
   - 시크릿 모드에서 테스트해보았는가?

6. **시간 대기**
   - GitHub OAuth App 설정 변경 후 몇 분 기다렸는가?
   - GitHub의 설정 반영에 시간이 걸릴 수 있음

## 🔍 디버깅 팁

### 서버 콘솔 확인
개발 서버 콘솔에서 다음 로그를 확인:
```
🔐 NextAuth URL: http://localhost:3000
🔐 GitHub 콜백 URL: http://localhost:3000/api/auth/callback/github
🔐 OAuth 로그인 시도: { provider: 'github', expectedCallbackUrl: '...' }
```

### 브라우저 네트워크 탭 확인
1. 브라우저 개발자 도구 열기 (F12)
2. **Network** 탭 선택
3. GitHub 로그인 버튼 클릭
4. GitHub로 리디렉션되는 요청 확인
5. `redirect_uri` 파라미터 값 확인

## 📝 프로덕션 환경 설정

프로덕션 환경(Vercel 등)에서는:

1. **실제 도메인 확인**
   - Vercel 대시보드 → **Settings** → **Domains**에서 확인
   - 또는 브라우저 주소창에서 확인

2. **GitHub OAuth App 설정**
   - Authorization callback URL: `https://your-actual-domain.com/api/auth/callback/github`
   - 여러 도메인 사용 시 각각 별도 OAuth App 생성 권장

3. **환경 변수 설정**
   - Vercel 대시보드 → **Settings** → **Environment Variables**
   - `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `NEXTAUTH_URL` 설정

## 🆘 추가 도움말

- [GITHUB_OAUTH_FIX.md](./GITHUB_OAUTH_FIX.md) - 상세한 문제 해결 가이드
- [OAUTH_SETUP.md](./OAUTH_SETUP.md) - 전체 OAuth 설정 가이드
- [NextAuth.js 문서](https://authjs.dev/getting-started/installation)
- [GitHub OAuth 문서](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)

