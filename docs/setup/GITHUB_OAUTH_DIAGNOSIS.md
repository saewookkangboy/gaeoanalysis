# GitHub OAuth 오류 진단 가이드

## 오류 유형

### 1. `bad_verification_code` 오류
**원인:**
- OAuth 코드가 만료됨 (일반적으로 10분)
- OAuth 코드가 이미 사용됨
- OAuth 코드가 잘못됨
- 동시에 여러 로그인 시도가 발생

**해결 방법:**
1. GitHub OAuth App 설정 확인
2. Callback URL이 정확히 일치하는지 확인
3. 환경 변수가 올바르게 설정되었는지 확인
4. 브라우저 쿠키 및 캐시 삭제 후 재시도

## 진단 체크리스트

### 1. 환경 변수 확인

#### 개발 환경
```bash
# 다음 환경 변수가 설정되어 있는지 확인
GITHUB_CLIENT_ID_DEV=your-dev-client-id
GITHUB_CLIENT_SECRET_DEV=your-dev-secret

# 또는
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-secret
```

#### 프로덕션 환경 (Vercel)
```bash
# Vercel 대시보드에서 다음 환경 변수 확인
GITHUB_CLIENT_ID=your-production-client-id
GITHUB_CLIENT_SECRET=your-production-secret
AUTH_SECRET=your-auth-secret
AUTH_URL=https://your-domain.vercel.app
```

### 2. GitHub OAuth App 설정 확인

1. **GitHub Settings → Developer settings → OAuth Apps** 접속
2. 사용 중인 OAuth App 선택
3. 다음 항목 확인:

#### Authorization callback URL
- **개발 환경**: `http://localhost:3000/api/auth/callback/github`
- **프로덕션 환경**: `https://your-domain.vercel.app/api/auth/callback/github`

**중요:** URL이 정확히 일치해야 합니다 (대소문자, 슬래시, 포트 번호 포함)

#### Client ID 및 Client Secret
- Client ID가 환경 변수 `GITHUB_CLIENT_ID`와 일치하는지 확인
- Client Secret이 환경 변수 `GITHUB_CLIENT_SECRET`과 일치하는지 확인

### 3. NextAuth.js 설정 확인

#### AUTH_URL / NEXTAUTH_URL
```env
# 개발 환경
AUTH_URL=http://localhost:3000
# 또는
NEXTAUTH_URL=http://localhost:3000

# 프로덕션 환경
AUTH_URL=https://your-domain.vercel.app
# 또는
NEXTAUTH_URL=https://your-domain.vercel.app
```

#### AUTH_SECRET
```env
AUTH_SECRET=your-secret-key-here
# 또는
NEXTAUTH_SECRET=your-secret-key-here
```

**생성 방법:**
```bash
openssl rand -base64 32
```

### 4. 브라우저 및 쿠키 확인

1. **브라우저 개발자 도구 열기** (F12)
2. **Application 탭 → Cookies** 확인
3. 다음 쿠키 확인:
   - `authjs.pkce.code_verifier`
   - `authjs.state`
   - `authjs.session-token`

4. **문제가 있는 경우:**
   - 모든 쿠키 삭제
   - 브라우저 캐시 삭제
   - 시크릿 모드에서 재시도

### 5. 네트워크 요청 확인

1. **브라우저 개발자 도구 → Network 탭** 열기
2. GitHub 로그인 시도
3. 다음 요청 확인:

#### OAuth 인증 요청
- **URL**: `https://github.com/login/oauth/authorize?...`
- **상태 코드**: 302 (리다이렉트)
- **리다이렉트 URL**: `/api/auth/callback/github?code=...`

#### Callback 요청
- **URL**: `/api/auth/callback/github?code=...`
- **상태 코드**: 200 또는 302
- **오류 발생 시**: 500 또는 400

### 6. 서버 로그 확인

#### 개발 환경
터미널에서 다음 로그 확인:
```
🔐 [signIn] OAuth 로그인 시도: {
  provider: 'github',
  expectedCallbackUrl: 'http://localhost:3000/api/auth/callback/github',
  ...
}
```

#### 프로덕션 환경 (Vercel)
Vercel 대시보드 → 프로젝트 → Logs 탭에서 확인:
```
[auth][error] CallbackRouteError: ...
[auth][cause]: ...
[auth][details]: {
  "body": {
    "error": "bad_verification_code",
    ...
  },
  "provider": "github"
}
```

## 자동 진단 스크립트

다음 명령어로 환경 변수 확인:

```bash
# 환경 변수 확인
node -e "
console.log('=== GitHub OAuth 환경 변수 확인 ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('AUTH_URL:', process.env.AUTH_URL || process.env.NEXTAUTH_URL);
console.log('AUTH_SECRET:', process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET ? '설정됨' : '설정 안됨');
console.log('GITHUB_CLIENT_ID:', process.env.NODE_ENV === 'development' 
  ? (process.env.GITHUB_CLIENT_ID_DEV || process.env.GITHUB_CLIENT_ID || '설정 안됨')
  : (process.env.GITHUB_CLIENT_ID || '설정 안됨'));
console.log('GITHUB_CLIENT_SECRET:', process.env.NODE_ENV === 'development'
  ? (process.env.GITHUB_CLIENT_SECRET_DEV || process.env.GITHUB_CLIENT_SECRET ? '설정됨' : '설정 안됨')
  : (process.env.GITHUB_CLIENT_SECRET ? '설정됨' : '설정 안됨'));
"
```

## 일반적인 해결 방법

### 1. 환경 변수 재설정
1. Vercel 대시보드 → Settings → Environment Variables
2. 다음 변수 확인 및 재설정:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `AUTH_SECRET`
   - `AUTH_URL` 또는 `NEXTAUTH_URL`

### 2. GitHub OAuth App 재생성
1. 기존 OAuth App 삭제
2. 새 OAuth App 생성
3. Callback URL 정확히 설정
4. Client ID 및 Secret을 환경 변수에 업데이트

### 3. NextAuth.js 재배포
환경 변수 변경 후:
1. Vercel에서 재배포
2. 또는 로컬에서 `npm run dev` 재시작

### 4. 브라우저 완전 초기화
1. 모든 쿠키 삭제
2. 브라우저 캐시 삭제
3. 시크릿 모드에서 재시도

## 추가 디버깅

### NextAuth.js 디버그 모드 활성화
`auth.ts`에서 이미 활성화되어 있음:
```typescript
debug: process.env.NODE_ENV === 'development',
```

프로덕션에서도 디버그 모드를 활성화하려면:
```typescript
debug: true,
```

### 상세 로깅 추가
로그에서 다음 정보 확인:
- OAuth 인증 URL
- Callback URL
- 사용된 Client ID
- 오류 발생 시점

## 문제 해결 순서

1. ✅ 환경 변수 확인
2. ✅ GitHub OAuth App 설정 확인
3. ✅ Callback URL 일치 확인
4. ✅ 브라우저 쿠키 및 캐시 삭제
5. ✅ 서버 재시작 또는 재배포
6. ✅ GitHub OAuth App 재생성 (필요 시)

