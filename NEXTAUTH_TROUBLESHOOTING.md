# NextAuth App Router 문제 해결 가이드

## "Cannot destructure property 'nextauth' of 'e.query' as it is undefined" 에러

이 에러는 NextAuth v4가 App Router에서 요청을 처리할 때 발생할 수 있는 문제입니다.

## 원인

NextAuth v4는 내부적으로 `req.query.nextauth`를 기대하지만, Next.js App Router에서는 동적 라우트 파라미터가 `context.params`로 전달됩니다.

## 해결 방법

### 1. 환경 변수 확인

**필수 환경 변수:**
- `NEXTAUTH_SECRET`: NextAuth 시크릿 키
- `NEXTAUTH_URL`: 애플리케이션 URL (Vercel에서는 자동 설정되지만 명시적으로 설정 권장)
- `GOOGLE_CLIENT_ID`: Google OAuth 클라이언트 ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth 클라이언트 시크릿
- `GITHUB_CLIENT_ID`: GitHub OAuth 클라이언트 ID
- `GITHUB_CLIENT_SECRET`: GitHub OAuth 클라이언트 시크릿

### 2. Vercel 환경 변수 설정

Vercel Dashboard → 프로젝트 → Settings → Environment Variables에서 다음을 확인:

```
NEXTAUTH_URL=https://gaeoanalysis.vercel.app
NEXTAUTH_SECRET=<생성한-시크릿-키>
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
GITHUB_CLIENT_ID=<github-client-id>
GITHUB_CLIENT_SECRET=<github-client-secret>
```

### 3. OAuth 앱 설정 확인

#### Google OAuth
- [Google Cloud Console](https://console.cloud.google.com/)에서 OAuth 2.0 클라이언트 ID 확인
- 승인된 리디렉션 URI가 정확한지 확인:
  - `https://gaeoanalysis.vercel.app/api/auth/callback/google`

#### GitHub OAuth
- [GitHub Developer Settings](https://github.com/settings/developers)에서 OAuth App 확인
- Authorization callback URL이 정확한지 확인:
  - `https://gaeoanalysis.vercel.app/api/auth/callback/github`

### 4. NextAuth 버전 확인

현재 사용 중인 버전: `next-auth@4.24.13`

NextAuth v4는 App Router를 지원하지만, Next.js 16과의 호환성 문제가 있을 수 있습니다.

### 5. 대안: NextAuth v5 (Auth.js) 업그레이드 고려

NextAuth v5 (Auth.js)는 App Router를 완전히 지원합니다. 하지만 이는 큰 변경사항이므로 신중하게 결정해야 합니다.

## 디버깅

### Vercel Function Logs 확인

1. Vercel Dashboard → 프로젝트 → Functions 탭
2. `/api/auth/[...nextauth]` 함수 선택
3. 에러 로그 확인:
   - `[NextAuth GET] 에러:`
   - `[NextAuth POST] 에러:`
   - 요청 URL 및 메서드 정보

### 로컬 테스트

로컬 환경에서 테스트하여 문제를 격리:

```bash
npm run dev
```

로컬에서도 동일한 에러가 발생하면 코드 문제, Vercel에서만 발생하면 환경 변수 문제일 가능성이 높습니다.

## 임시 해결 방법

문제가 계속되면:

1. **환경 변수 재설정**: Vercel에서 모든 환경 변수를 삭제하고 다시 추가
2. **재배포**: 환경 변수 변경 후 새로 배포
3. **캐시 클리어**: Vercel에서 배포 캐시 클리어 후 재배포

## 추가 리소스

- [NextAuth.js 공식 문서](https://next-auth.js.org/)
- [NextAuth.js GitHub Issues](https://github.com/nextauthjs/next-auth/issues)
- [Next.js App Router 문서](https://nextjs.org/docs/app)

