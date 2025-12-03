# GitHub OAuth redirect_uri 오류 빠른 해결 가이드

## 🚨 실서버에서 발생한 오류

```
Be careful!
The redirect_uri is not associated with this application.
```

## ⚡ 빠른 해결 방법 (3단계)

### 1단계: 현재 콜백 URL 확인 (30초)

**실서버에서 다음 URL 접속:**
```
https://your-domain.com/api/auth/debug
```

**응답에서 `callbackUrls.github` 값을 복사하세요.**

예시:
```json
{
  "callbackUrls": {
    "github": "https://gaeo.allrounder.im/api/auth/callback/github"
  }
}
```

### 2단계: GitHub OAuth App 설정 수정 (1분)

1. **[GitHub OAuth Apps](https://github.com/settings/developers) 접속**
2. 사용 중인 OAuth App 클릭
3. **Authorization callback URL** 필드에 1단계에서 복사한 URL을 **정확히** 입력
4. **Update application** 클릭

**⚠️ 주의사항:**
- 프로토콜(`https`), 도메인, 경로가 정확히 일치해야 합니다
- 마지막에 슬래시(`/`) 없어야 합니다
- 대소문자 정확히 맞춰야 합니다

### 3단계: Vercel 환경 변수 확인 (1분)

1. **Vercel 대시보드** → 프로젝트 → **Settings** → **Environment Variables**
2. 다음 환경 변수 확인:
   ```env
   AUTH_URL=https://your-actual-domain.com
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   ```
3. 없으면 추가, 있으면 값 확인
4. **Redeploy** 실행 (또는 자동 재배포 대기)

## ✅ 완료!

이제 GitHub 로그인이 정상적으로 작동해야 합니다.

## 🔍 문제가 계속되면

1. **브라우저 캐시 삭제** 후 재시도
2. **시크릿 모드**에서 테스트
3. **GitHub OAuth App 재생성** (기존 앱 삭제 후 새로 생성)
4. **Vercel 로그 확인** (Deployments → 최신 배포 → Logs)

## 📝 체크리스트

- [ ] `/api/auth/debug`에서 콜백 URL 확인 완료
- [ ] GitHub OAuth App의 Authorization callback URL 수정 완료
- [ ] Vercel 환경 변수 `AUTH_URL` 확인 완료
- [ ] Vercel 환경 변수 `GITHUB_CLIENT_ID` 확인 완료
- [ ] Vercel 환경 변수 `GITHUB_CLIENT_SECRET` 확인 완료
- [ ] 재배포 완료
- [ ] GitHub 로그인 테스트 성공

