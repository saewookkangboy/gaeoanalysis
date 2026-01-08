# Google OAuth redirect_uri_mismatch 오류 즉시 해결 가이드

## 🚨 현재 오류

```
액세스 차단됨: 이 앱의 요청이 잘못되었습니다
400 오류: redirect_uri_mismatch
```

## ✅ 즉시 해결 방법 (3단계)

### 1단계: 정확한 콜백 URL 확인

**프로덕션 서버에서 실행:**

1. 브라우저에서 다음 URL 접속:
   ```
   https://gaeo.allrounder.im/api/auth/debug
   ```
   (또는 현재 사용 중인 도메인)

2. 응답에서 `callbackUrls.google` 값을 복사
   - 예: `https://gaeo.allrounder.im/api/auth/callback/google`

3. **이 URL을 정확히 복사해두세요** (다음 단계에서 사용)

### 2단계: Google Cloud Console에서 콜백 URL 추가

1. **[Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials) 접속**

2. **프로젝트 선택** (상단 드롭다운에서 올바른 프로젝트 선택)

3. **OAuth 2.0 Client ID** 목록에서 **웹 애플리케이션** 타입 클릭

4. **"승인된 리디렉션 URI"** 섹션 찾기

5. **"URI 추가"** 또는 **"ADD URI"** 버튼 클릭

6. **1단계에서 복사한 정확한 URL 입력:**
   ```
   https://gaeo.allrounder.im/api/auth/callback/google
   ```
   ⚠️ **중요**: 
   - 마지막에 슬래시(/) 없이 입력
   - 프로토콜(https) 정확히 일치
   - 도메인과 경로 정확히 일치

7. **"저장"** 또는 **"SAVE"** 버튼 클릭

### 3단계: Vercel 환경 변수 확인

1. **Vercel 대시보드** → 프로젝트 → **Settings** → **Environment Variables**

2. 다음 환경 변수 확인:
   ```env
   AUTH_URL=https://gaeo.allrounder.im
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

3. **없거나 잘못된 경우:**
   - `AUTH_URL`을 현재 도메인으로 설정
   - `GOOGLE_CLIENT_ID`와 `GOOGLE_CLIENT_SECRET` 확인

4. **환경 변수 저장 후 재배포**

## ⚠️ 중요 주의사항

### 1. 정확한 URL 일치 필수

콜백 URL은 **정확히** 일치해야 합니다:

- ✅ `https://gaeo.allrounder.im/api/auth/callback/google` (정확)
- ❌ `https://gaeo.allrounder.im/api/auth/callback/google/` (마지막 슬래시)
- ❌ `http://gaeo.allrounder.im/api/auth/callback/google` (http)
- ❌ `https://gaeo.allrounder.im/api/auth/callback/Google` (대문자)

### 2. 여러 환경 사용 시

로컬 개발과 프로덕션을 모두 사용하는 경우:

- **로컬**: `http://localhost:3000/api/auth/callback/google`
- **프로덕션**: `https://gaeo.allrounder.im/api/auth/callback/google`

두 URL을 모두 Google Cloud Console에 추가해야 합니다.

### 3. 변경사항 적용 시간

Google OAuth 설정 변경 후 적용까지 **최대 5분** 소요될 수 있습니다.

### 4. 브라우저 콘솔 오류 (무시 가능)

다음 오류는 Google 내부 오류로 무시해도 됩니다:
- `accounts.youtube.com…ionHttp/cspreport:1 Failed to load resource: 404`
- `inject.js:1 This document requires 'TrustedHTML' assignment`

이 오류들은 서비스에 영향을 주지 않습니다.

## 🔍 문제가 계속되면

### 체크리스트

- [ ] `/api/auth/debug` 엔드포인트에서 정확한 콜백 URL 확인
- [ ] Google Cloud Console의 "승인된 리디렉션 URI"에 정확한 URL 추가
- [ ] URL에 마지막 슬래시(/) 없음 확인
- [ ] 프로토콜(https) 정확히 일치 확인
- [ ] 올바른 Google Cloud 프로젝트 선택 확인
- [ ] OAuth 2.0 Client ID가 "웹 애플리케이션" 타입인지 확인
- [ ] Vercel 환경 변수 `AUTH_URL` 확인
- [ ] Vercel 환경 변수 `GOOGLE_CLIENT_ID` 확인
- [ ] Vercel 환경 변수 `GOOGLE_CLIENT_SECRET` 확인
- [ ] 설정 저장 후 5분 대기
- [ ] 브라우저 쿠키 삭제 후 재시도
- [ ] 시크릿 모드에서 테스트

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

## 📋 빠른 링크

- [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
- [OAuth 동의 화면](https://console.cloud.google.com/apis/credentials/consent)
- [Vercel Environment Variables](https://vercel.com/dashboard)

## 🎯 단계별 요약

1. **정확한 콜백 URL 확인**: `/api/auth/debug` 엔드포인트 사용
2. **Google Cloud Console에 URL 추가**: "승인된 리디렉션 URI"에 정확한 URL 추가
3. **Vercel 환경 변수 확인**: `AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
4. **5분 대기**: 변경사항 적용 대기
5. **테스트**: 시크릿 모드에서 Google 로그인 시도

## 참고 문서

- [GOOGLE_OAUTH_QUICK_FIX.md](./GOOGLE_OAUTH_QUICK_FIX.md) - 빠른 해결 가이드
- [GOOGLE_OAUTH_FIX.md](./GOOGLE_OAUTH_FIX.md) - 전체 Google OAuth 설정 가이드

