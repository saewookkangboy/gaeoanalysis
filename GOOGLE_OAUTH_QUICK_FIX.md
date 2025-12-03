# Google OAuth redirect_uri_mismatch 오류 빠른 해결 가이드

## 🚨 문제 상황

Google 로그인 시 다음과 같은 오류가 발생합니다:
```
액세스 차단됨: 이 앱의 요청이 잘못되었습니다
400 오류: redirect_uri_mismatch
```

## ✅ 3단계 빠른 해결

### 0단계: 정확한 콜백 URL 확인 (가장 중요!)

**프로덕션 서버에서 실행:**
1. 브라우저에서 다음 URL 접속:
   ```
   https://your-domain.com/api/auth/debug
   ```
2. 응답에서 `callbackUrls.google` 값을 복사
3. 이 값이 정확한 콜백 URL입니다

**예시 응답:**
```json
{
  "callbackUrls": {
    "google": "https://gaeo.allrounder.im/api/auth/callback/google"
  }
}
```

### 1단계: Google Cloud Console에서 콜백 URL 추가

1. **[Google Cloud Console](https://console.cloud.google.com/apis/credentials) 접속**
2. **프로젝트 선택** (상단에서)
3. **APIs & Services** → **Credentials** 클릭
4. **OAuth 2.0 Client ID** 목록에서 웹 애플리케이션 타입 클릭
5. **"승인된 리디렉션 URI"** 섹션 찾기
6. **"URI 추가"** 또는 **"ADD URI"** 클릭
7. **0단계에서 확인한 정확한 URL 입력:**
   ```
   https://your-domain.com/api/auth/callback/google
   ```
8. **"저장"** 또는 **"SAVE"** 클릭

### 2단계: Vercel 환경 변수 확인

1. **Vercel 대시보드** → 프로젝트 → **Settings** → **Environment Variables**
2. 다음 환경 변수 확인:
   ```env
   AUTH_URL=https://your-domain.com
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```
3. 없거나 잘못된 경우 수정

### 3단계: 테스트

1. **브라우저 쿠키 삭제** (선택 사항, 권장):
   - 개발자 도구 (F12) → Application → Cookies
   - `__Secure-authjs.*` 쿠키 삭제
2. **시크릿 모드**에서 테스트
3. Google 로그인 시도

## ⚠️ 중요 주의사항

### 1. 정확한 URL 일치 필수

콜백 URL은 **정확히** 일치해야 합니다:
- ✅ `https://gaeo.allrounder.im/api/auth/callback/google`
- ❌ `https://gaeo.allrounder.im/api/auth/callback/google/` (마지막 슬래시)
- ❌ `http://gaeo.allrounder.im/api/auth/callback/google` (http)
- ❌ `https://gaeo.allrounder.im/api/auth/callback/Google` (대문자)

### 2. 여러 환경 사용 시

로컬 개발과 프로덕션을 모두 사용하는 경우:
- **로컬**: `http://localhost:3000/api/auth/callback/google`
- **프로덕션**: `https://your-domain.com/api/auth/callback/google`
- 두 URL을 모두 Google Cloud Console에 추가

### 3. 변경사항 적용 시간

Google OAuth 설정 변경 후 적용까지 **최대 5분** 소요될 수 있습니다.

## 🔍 문제가 계속되면

### 체크리스트

- [ ] `/api/auth/debug` 엔드포인트에서 정확한 콜백 URL 확인
- [ ] Google Cloud Console의 "승인된 리디렉션 URI"에 정확한 URL 추가
- [ ] URL에 마지막 슬래시(/) 없음 확인
- [ ] 프로토콜(https) 정확히 일치 확인
- [ ] Vercel 환경 변수 `AUTH_URL` 확인
- [ ] Vercel 환경 변수 `GOOGLE_CLIENT_ID` 확인
- [ ] Vercel 환경 변수 `GOOGLE_CLIENT_SECRET` 확인
- [ ] 설정 저장 후 5분 대기
- [ ] 브라우저 쿠키 삭제 후 재시도

### 추가 확인 사항

1. **Google Cloud Console에서 OAuth 동의 화면 확인:**
   - APIs & Services → OAuth consent screen
   - 앱이 "테스트 중" 상태인지 확인
   - 프로덕션 사용자 추가 필요할 수 있음

2. **OAuth Client ID 타입 확인:**
   - "웹 애플리케이션" 타입이어야 함
   - "데스크톱 앱" 또는 다른 타입이면 새로 생성

3. **프로젝트 선택 확인:**
   - Google Cloud Console 상단에서 올바른 프로젝트 선택
   - 여러 프로젝트가 있는 경우 주의

## 📋 상세 가이드

더 자세한 내용은 다음 문서를 참고하세요:
- [GOOGLE_OAUTH_FIX.md](./GOOGLE_OAUTH_FIX.md) - 전체 Google OAuth 설정 가이드
- [PKCE_ERROR_PRODUCTION_FIX.md](./PKCE_ERROR_PRODUCTION_FIX.md) - PKCE 오류 해결

## 🎯 빠른 링크

- [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
- [OAuth 동의 화면](https://console.cloud.google.com/apis/credentials/consent)
- [Vercel Environment Variables](https://vercel.com/dashboard)

