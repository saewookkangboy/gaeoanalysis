# 카카오 로그인 인가 코드 요청 오류 해결 가이드

## 문제 상황

카카오 로그인 시 인가 코드 요청 단계에서 오류가 발생합니다.

## 카카오 인가 코드 요청 요구사항

카카오 개발자 문서에 따르면, 인가 코드 요청 시 다음 파라미터가 필요합니다:

### 필수 파라미터

1. **client_id**: REST API 키 (카카오 개발자 콘솔에서 확인)
2. **redirect_uri**: 콜백 URL (카카오 개발자 콘솔에 등록된 URL)
3. **response_type**: 항상 `"code"` (OAuth 2.0 Authorization Code Flow)

### 선택 파라미터

4. **scope**: 동의 항목 (공백으로 구분)

## 인가 코드 요청 URL 형식

```
https://kauth.kakao.com/oauth/authorize?
  client_id={REST_API_KEY}&
  redirect_uri={REDIRECT_URI}&
  response_type=code&
  scope={SCOPE}
```

## 해결 방법

### 1. client_id 확인

**문제**: REST API 키가 잘못되었거나 환경 변수에 설정되지 않음

**해결**:

1. **카카오 개발자 콘솔 확인**
   - [카카오 개발자 콘솔](https://developers.kakao.com/) → 내 애플리케이션 선택
   - **요약 정보** 탭 → **REST API 키** 복사

2. **환경 변수 확인**

   **로컬 개발 환경 (`.env.local`):**
   ```env
   KAKAO_CLIENT_ID=your-kakao-rest-api-key
   KAKAO_CLIENT_SECRET=your-kakao-client-secret
   ```

   **프로덕션 환경 (Vercel):**
   - Vercel 대시보드 → **Settings** → **Environment Variables**
   - `KAKAO_CLIENT_ID` 값 확인

3. **디버깅 엔드포인트로 확인**
   - `https://gaeoanalysis.vercel.app/api/auth/debug` 접속
   - `environment.KAKAO_CLIENT_ID`가 "설정됨"으로 표시되는지 확인

4. **체크리스트:**
   - [ ] REST API 키에 공백이 없음
   - [ ] 환경 변수 이름이 정확함 (`KAKAO_CLIENT_ID`)
   - [ ] 따옴표로 감싸지 않음
   - [ ] 앞뒤 공백 제거

### 2. redirect_uri 확인

**문제**: Redirect URI가 카카오 개발자 콘솔에 등록되지 않았거나 일치하지 않음

**해결**:

1. **정확한 콜백 URL 확인**
   - 디버깅 엔드포인트: `https://gaeoanalysis.vercel.app/api/auth/debug`
   - 응답의 `callbackUrls.kakao` 값 확인

2. **카카오 개발자 콘솔에 등록**
   - **제품 설정** → **카카오 로그인** → **Redirect URI**
   - 다음 URL을 **정확히** 등록:

   **로컬 개발 환경:**
   ```
   http://localhost:3000/api/auth/callback/kakao
   ```

   **프로덕션 환경:**
   ```
   https://gaeoanalysis.vercel.app/api/auth/callback/kakao
   ```

3. **체크리스트:**
   - [ ] 프로토콜 정확히 일치 (`http` vs `https`)
   - [ ] 도메인 정확히 일치
   - [ ] 경로 정확히 일치 (`/api/auth/callback/kakao`)
   - [ ] 마지막에 슬래시(`/`) 없음
   - [ ] 공백 없음
   - [ ] 대소문자 정확히 일치

### 3. response_type 확인

**문제**: response_type이 "code"가 아님

**해결**:

- NextAuth.js가 자동으로 `response_type: "code"`를 추가합니다
- 수동으로 설정할 필요 없음
- 현재 구현에서 명시적으로 설정되어 있음

### 4. scope 확인

**문제**: scope 형식이 잘못되었거나 동의 항목이 설정되지 않음

**해결**:

1. **scope 형식 확인**
   - 카카오는 scope를 공백으로 구분합니다
   - 현재 구현: `"profile_nickname profile_image account_email"` ✅

2. **동의 항목 설정 확인**
   - **제품 설정** → **카카오 로그인** → **동의항목**
   - 다음 항목이 설정되어 있는지 확인:
     - **닉네임**: 필수 또는 선택
     - **프로필 사진**: 선택
     - **카카오계정(이메일)**: 필수 또는 선택

3. **scope 선택 사항**
   - 카카오는 동의 항목에 따라 자동으로 scope를 처리합니다
   - 명시적으로 scope를 지정하지 않아도 됩니다
   - 하지만 필요한 정보를 명시적으로 요청하는 것이 좋습니다

### 5. NextAuth.js 설정 확인

**현재 구현 확인**:

```typescript
authorization: {
  url: "https://kauth.kakao.com/oauth/authorize",
  params: {
    response_type: "code",
    scope: "profile_nickname profile_image account_email",
  },
},
```

**NextAuth.js가 자동으로 추가하는 파라미터:**
- `client_id`: `options.clientId`에서 가져옴
- `redirect_uri`: NextAuth.js가 자동으로 생성 (`/api/auth/callback/kakao`)
- `state`: CSRF 방지를 위한 랜덤 문자열

## 디버깅 방법

### 1. 브라우저 개발자 도구 확인

1. 브라우저 개발자 도구 (F12) → **Network** 탭
2. 카카오 로그인 버튼 클릭
3. `/api/auth/signin/kakao` 요청 확인
4. 리디렉션되는 URL 확인
5. URL에 다음 파라미터가 포함되어 있는지 확인:
   - `client_id`
   - `redirect_uri`
   - `response_type=code`
   - `scope`
   - `state`

### 2. 카카오 인증 페이지 URL 확인

카카오 로그인 버튼 클릭 후 리디렉션되는 URL 예시:

```
https://kauth.kakao.com/oauth/authorize?
  client_id=YOUR_REST_API_KEY&
  redirect_uri=https%3A%2F%2Fgaeoanalysis.vercel.app%2Fapi%2Fauth%2Fcallback%2Fkakao&
  response_type=code&
  scope=profile_nickname%20profile_image%20account_email&
  state=YOUR_STATE_VALUE
```

### 3. 서버 로그 확인

로컬 개발 환경:
- 터미널에서 Next.js 서버 로그 확인
- 카카오 OAuth 관련 오류 메시지 확인

프로덕션 환경:
- Vercel 대시보드 → **Functions** → **Logs**
- 카카오 OAuth 관련 오류 메시지 확인

## 일반적인 오류 및 해결 방법

### 오류 1: "invalid_client"

**원인**: client_id가 잘못되었거나 설정되지 않음

**해결**:
1. REST API 키 확인
2. 환경 변수 확인
3. 공백 제거

### 오류 2: "redirect_uri_mismatch"

**원인**: Redirect URI가 카카오 개발자 콘솔에 등록되지 않았거나 일치하지 않음

**해결**:
1. 정확한 콜백 URL 확인 (`/api/auth/debug`)
2. 카카오 개발자 콘솔에 정확히 등록
3. 저장 후 몇 분 대기

### 오류 3: "KOE101" (앱 관리자 설정 오류)

**원인**: 앱 설정에 문제가 있음

**해결**:
- [KAKAO_KOE101_ERROR_FIX.md](./KAKAO_KOE101_ERROR_FIX.md) 참조

## 체크리스트

### 인가 코드 요청 전 확인 사항

- [ ] REST API 키가 환경 변수에 정확히 설정됨
- [ ] Client Secret이 환경 변수에 정확히 설정됨
- [ ] Redirect URI가 카카오 개발자 콘솔에 정확히 등록됨
- [ ] 카카오 로그인이 활성화됨
- [ ] 동의 항목이 설정됨
- [ ] 앱 도메인이 등록됨 (프로덕션)
- [ ] 환경 변수에 공백이 없음
- [ ] 개발 서버를 재시작했음
- [ ] 브라우저 캐시를 삭제했음

### 인가 코드 요청 URL 확인

- [ ] `client_id` 파라미터가 포함됨
- [ ] `redirect_uri` 파라미터가 포함됨
- [ ] `response_type=code` 파라미터가 포함됨
- [ ] `scope` 파라미터가 포함됨 (선택)
- [ ] `state` 파라미터가 포함됨

## 참고 문서

- [카카오 개발자 문서 - 인가 코드 요청](https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api#request-code)
- [KAKAO_OAUTH_SETUP.md](./KAKAO_OAUTH_SETUP.md) - 카카오 로그인 초기 설정 가이드
- [KAKAO_KOE101_ERROR_FIX.md](./KAKAO_KOE101_ERROR_FIX.md) - KOE101 오류 해결 가이드

