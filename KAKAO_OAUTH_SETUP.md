# 카카오 로그인 설정 가이드

## 개요

이 가이드는 GAEO Analysis by allrounder 서비스에 카카오 로그인을 추가하는 방법을 설명합니다.

## 1단계: 카카오 개발자 콘솔에서 애플리케이션 생성

### 1.1 카카오 개발자 콘솔 접속

1. [카카오 개발자 콘솔](https://developers.kakao.com/)에 접속
2. 카카오 계정으로 로그인

### 1.2 애플리케이션 생성

1. **내 애플리케이션** → **애플리케이션 추가하기** 클릭
2. 다음 정보 입력:
   - **앱 이름**: `GAEO Analysis by allrounder`
   - **사업자명**: 본인의 사업자명 또는 이름
3. **저장** 클릭

## 2단계: 카카오 로그인 활성화

### 2.1 카카오 로그인 설정

1. 생성한 애플리케이션 선택
2. **제품 설정** → **카카오 로그인** 클릭
3. **활성화 설정** → **활성화** 선택

### 2.2 Redirect URI 등록

1. **Redirect URI** 섹션으로 이동
2. **Redirect URI 추가** 클릭
3. 다음 URL들을 추가:

   **로컬 개발 환경:**
   ```
   http://localhost:3000/api/auth/callback/kakao
   ```

   **프로덕션 환경:**
   ```
   https://gaeoanalysis.vercel.app/api/auth/callback/kakao
   ```

   ⚠️ **중요 체크리스트:**
   - [ ] 프로토콜: `http` (로컬) 또는 `https` (프로덕션)
   - [ ] 도메인: `localhost:3000` (로컬) 또는 `gaeoanalysis.vercel.app` (프로덕션)
   - [ ] 경로: `/api/auth/callback/kakao` (정확히 일치)
   - [ ] 마지막에 슬래시(`/`) 없음
   - [ ] 대소문자 정확히 일치

4. **저장** 클릭

### 2.3 동의 항목 설정

1. **제품 설정** → **카카오 로그인** → **동의항목** 클릭
2. 다음 동의 항목을 **필수** 또는 **선택**으로 설정:
   - **닉네임** (필수 권장)
   - **프로필 사진** (선택)
   - **카카오계정(이메일)** (필수 권장)

## 3단계: REST API 키 및 Client Secret 확인

### 3.1 REST API 키 확인

1. **내 애플리케이션** → 생성한 애플리케이션 선택
2. **요약 정보** 탭에서 **REST API 키** 복사
   - 이 값이 `KAKAO_CLIENT_ID`입니다

### 3.2 Client Secret 발급

1. **제품 설정** → **카카오 로그인** → **보안** 탭으로 이동
2. **Client Secret 코드** 섹션에서 **코드 발급** 클릭
3. 발급된 **Client Secret** 복사
   - 이 값이 `KAKAO_CLIENT_SECRET`입니다
   - ⚠️ **주의**: Client Secret은 한 번만 표시되므로 안전하게 보관하세요

## 4단계: 환경 변수 설정

### 4.1 로컬 개발 환경 (`.env.local`)

프로젝트 루트에 `.env.local` 파일을 생성하거나 수정:

```env
# NextAuth
AUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# 카카오 OAuth
KAKAO_CLIENT_ID=your-kakao-rest-api-key
KAKAO_CLIENT_SECRET=your-kakao-client-secret
```

### 4.2 프로덕션 환경 (Vercel)

Vercel 대시보드 → **Settings** → **Environment Variables**에서 추가:

```env
# NextAuth
AUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://gaeoanalysis.vercel.app

# 카카오 OAuth
KAKAO_CLIENT_ID=your-kakao-rest-api-key
KAKAO_CLIENT_SECRET=your-kakao-client-secret
```

⚠️ **중요**: 
- `KAKAO_CLIENT_ID`는 카카오 개발자 콘솔의 **REST API 키**입니다
- `KAKAO_CLIENT_SECRET`는 카카오 개발자 콘솔의 **Client Secret**입니다
- 프로덕션과 개발 환경에서 같은 키를 사용할 수 있습니다 (Redirect URI만 다름)

## 5단계: 테스트

### 5.1 로컬 개발 환경 테스트

1. 개발 서버 실행:
   ```bash
   npm run dev
   ```

2. 브라우저에서 `http://localhost:3000/login` 접속
3. **카카오로 로그인** 버튼 클릭
4. 카카오 로그인 페이지에서 인증 완료
5. 정상적으로 리디렉션되는지 확인

### 5.2 프로덕션 환경 테스트

1. Vercel에 배포된 사이트 접속: `https://gaeoanalysis.vercel.app/login`
2. **카카오로 로그인** 버튼 클릭
3. 카카오 로그인 페이지에서 인증 완료
4. 정상적으로 리디렉션되는지 확인

## 6단계: 디버깅

### 6.1 콜백 URL 확인

프로덕션 환경에서 다음 URL을 브라우저에서 열어주세요:

```
https://gaeoanalysis.vercel.app/api/auth/debug
```

응답에서 `callbackUrls.kakao` 값을 확인하세요.

### 6.2 일반적인 오류 및 해결 방법

#### ⚠️ KOE101 오류 (앱 관리자 설정 오류)

**가장 흔한 오류입니다!** 자세한 해결 방법은 [KAKAO_KOE101_ERROR_FIX.md](./KAKAO_KOE101_ERROR_FIX.md)를 참조하세요.

**빠른 체크리스트:**
1. Redirect URI가 정확히 일치하는지 확인
2. REST API 키와 Client Secret에 공백이 없는지 확인
3. 카카오 로그인이 활성화되어 있는지 확인
4. 앱 도메인이 등록되어 있는지 확인 (프로덕션)

#### 오류 1: "redirect_uri_mismatch"

**원인**: 카카오 개발자 콘솔에 등록한 Redirect URI와 실제 콜백 URL이 일치하지 않음

**해결 방법**:
1. `/api/auth/debug`에서 정확한 콜백 URL 확인
2. 카카오 개발자 콘솔의 Redirect URI와 정확히 일치하는지 확인
3. 프로토콜, 도메인, 경로가 모두 정확히 일치해야 함

#### 오류 2: "invalid_client"

**원인**: `KAKAO_CLIENT_ID` 또는 `KAKAO_CLIENT_SECRET`이 잘못되었거나 설정되지 않음

**해결 방법**:
1. 카카오 개발자 콘솔에서 REST API 키와 Client Secret 재확인
2. 환경 변수가 정확히 설정되었는지 확인
3. Vercel의 경우 환경 변수 저장 후 재배포 필요

#### 오류 3: "access_denied"

**원인**: 사용자가 카카오 로그인을 취소했거나 동의 항목을 거부함

**해결 방법**:
1. 정상적인 동작입니다 (사용자가 취소한 경우)
2. 동의 항목 설정을 확인하여 필수 항목이 올바르게 설정되었는지 확인

## 7단계: 추가 설정 (선택 사항)

### 7.1 로그아웃 Redirect URI 설정

카카오 로그아웃 후 리디렉션할 URL을 설정할 수 있습니다:

1. **제품 설정** → **카카오 로그인** → **고급** 탭
2. **로그아웃 Redirect URI**에 다음 추가:
   ```
   https://gaeoanalysis.vercel.app
   ```

### 7.2 앱 도메인 설정

1. **내 애플리케이션** → **앱 설정** → **플랫폼** 탭
2. **Web 플랫폼 등록** 클릭
3. **사이트 도메인**에 다음 추가:
   ```
   gaeoanalysis.vercel.app
   ```

## 참고 문서

- [KAKAO_KOE101_ERROR_FIX.md](./KAKAO_KOE101_ERROR_FIX.md) - **KOE101 오류 해결 가이드 (중요!)**
- [카카오 개발자 문서 - 카카오 로그인](https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api)
- [카카오 개발자 문서 - 오류 코드](https://developers.kakao.com/docs/latest/ko/kakaologin/trouble-shooting)
- [NextAuth.js 공식 문서](https://next-auth.js.org/)
- [GITHUB_OAUTH_SETUP.md](./GITHUB_OAUTH_SETUP.md) - GitHub OAuth 설정 가이드
- [GOOGLE_OAUTH_FIX.md](./GOOGLE_OAUTH_FIX.md) - Google OAuth 설정 가이드

## 문제 해결 체크리스트

- [ ] 카카오 개발자 콘솔에서 애플리케이션을 생성했는가?
- [ ] 카카오 로그인을 활성화했는가?
- [ ] Redirect URI를 정확히 등록했는가? (로컬 및 프로덕션)
- [ ] REST API 키를 복사했는가? (`KAKAO_CLIENT_ID`)
- [ ] Client Secret을 발급받았는가? (`KAKAO_CLIENT_SECRET`)
- [ ] 환경 변수를 설정했는가? (로컬 및 프로덕션)
- [ ] Vercel에 환경 변수를 추가한 후 재배포했는가?
- [ ] `/api/auth/debug`에서 콜백 URL을 확인했는가?
- [ ] 카카오 개발자 콘솔의 Redirect URI와 실제 콜백 URL이 일치하는가?

