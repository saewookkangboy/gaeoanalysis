# 카카오 로그인 KOE101 오류 해결 가이드

## 오류 메시지

```
앱 관리자 설정 오류 (KOE101)
서비스 설정에 오류가 있어, 이용할 수 없습니다.
서비스 관리자의 확인이 필요합니다.
```

## 주요 원인 및 해결 방법

### 1. Redirect URI 미등록 또는 오타 (가장 흔한 원인)

**증상**: 카카오 로그인 버튼 클릭 시 즉시 KOE101 오류 발생

**해결 방법**:

1. **카카오 개발자 콘솔 접속**
   - [카카오 개발자 콘솔](https://developers.kakao.com/) → 내 애플리케이션 선택

2. **Redirect URI 확인 및 수정**
   - **제품 설정** → **카카오 로그인** → **Redirect URI** 섹션
   - 다음 URL이 **정확히** 등록되어 있는지 확인:

   **로컬 개발 환경:**
   ```
   http://localhost:3000/api/auth/callback/kakao
   ```

   **프로덕션 환경:**
   ```
   https://gaeoanalysis.vercel.app/api/auth/callback/kakao
   ```

   ⚠️ **체크리스트:**
   - [ ] 프로토콜: `http` (로컬) 또는 `https` (프로덕션) - 정확히 일치
   - [ ] 도메인: `localhost:3000` (로컬) 또는 `gaeoanalysis.vercel.app` (프로덕션) - 정확히 일치
   - [ ] 경로: `/api/auth/callback/kakao` - 정확히 일치
   - [ ] 마지막에 슬래시(`/`) 없음
   - [ ] 대소문자 정확히 일치
   - [ ] 공백 없음

3. **저장 후 확인**
   - Redirect URI 저장 후 **몇 분 기다렸다가** 다시 시도
   - 카카오 서버에 설정이 반영되는데 시간이 걸릴 수 있습니다

### 2. REST API 키 또는 Client Secret 오류

**증상**: 환경 변수에 잘못된 값이 설정되어 있음

**해결 방법**:

1. **카카오 개발자 콘솔에서 키 확인**
   - **요약 정보** 탭 → **REST API 키** 복사
   - **제품 설정** → **카카오 로그인** → **보안** 탭 → **Client Secret** 확인

2. **환경 변수 확인**

   **로컬 개발 환경 (`.env.local`):**
   ```env
   KAKAO_CLIENT_ID=your-kakao-rest-api-key
   KAKAO_CLIENT_SECRET=your-kakao-client-secret
   ```

   **프로덕션 환경 (Vercel):**
   - Vercel 대시보드 → **Settings** → **Environment Variables**
   - `KAKAO_CLIENT_ID`와 `KAKAO_CLIENT_SECRET` 값 확인

3. **체크리스트:**
   - [ ] REST API 키에 공백이 없음
   - [ ] Client Secret에 공백이 없음
   - [ ] 따옴표로 감싸지 않음 (환경 변수는 따옴표 없이 입력)
   - [ ] 앞뒤 공백 제거
   - [ ] 복사 시 불필요한 문자가 포함되지 않았는지 확인

4. **디버깅 엔드포인트로 확인**
   - 프로덕션: `https://gaeoanalysis.vercel.app/api/auth/debug`
   - 로컬: `http://localhost:3000/api/auth/debug`
   - `KAKAO_CLIENT_ID`가 "설정됨"으로 표시되는지 확인

### 3. 카카오 로그인 미활성화

**증상**: 카카오 로그인 기능이 활성화되지 않음

**해결 방법**:

1. **카카오 개발자 콘솔 접속**
   - 내 애플리케이션 선택

2. **카카오 로그인 활성화**
   - **제품 설정** → **카카오 로그인** 클릭
   - **활성화 설정** → **활성화** 선택
   - **저장** 클릭

3. **확인**
   - 상태가 "활성화"로 표시되는지 확인

### 4. 동의 항목 미설정

**증상**: 사용자 정보를 가져올 수 없음

**해결 방법**:

1. **동의 항목 설정**
   - **제품 설정** → **카카오 로그인** → **동의항목** 클릭
   - 다음 항목을 설정:
     - **닉네임**: 필수 또는 선택
     - **프로필 사진**: 선택
     - **카카오계정(이메일)**: 필수 또는 선택 (이메일이 필요한 경우)

2. **저장**

### 5. 앱 도메인 미등록 (프로덕션 환경)

**증상**: 프로덕션 환경에서만 오류 발생

**해결 방법**:

1. **앱 도메인 등록**
   - **내 애플리케이션** → **앱 설정** → **플랫폼** 탭
   - **Web 플랫폼 등록** 클릭
   - **사이트 도메인**에 다음 추가:
     ```
     gaeoanalysis.vercel.app
     ```
   - **저장** 클릭

2. **확인**
   - 등록된 도메인이 정확히 일치하는지 확인

### 6. 앱 차단 또는 제한

**증상**: 카카오 개발자 콘솔에서 앱 상태가 "차단" 또는 "제한"으로 표시

**해결 방법**:

1. **앱 상태 확인**
   - 카카오 개발자 콘솔에서 앱 상태 확인
   - 운영정책 위반 여부 확인

2. **차단 해제 요청**
   - 카카오 고객센터에 문의
   - [카카오 디벨로퍼스 고객센터](https://developers.kakao.com/support)

## 단계별 문제 해결 체크리스트

### 1단계: 기본 설정 확인
- [ ] 카카오 개발자 콘솔에서 애플리케이션이 생성되어 있음
- [ ] 카카오 로그인이 활성화되어 있음
- [ ] REST API 키를 확인했음
- [ ] Client Secret을 발급받았음

### 2단계: Redirect URI 확인
- [ ] 로컬 개발 환경 Redirect URI 등록: `http://localhost:3000/api/auth/callback/kakao`
- [ ] 프로덕션 환경 Redirect URI 등록: `https://gaeoanalysis.vercel.app/api/auth/callback/kakao`
- [ ] Redirect URI에 오타가 없음
- [ ] Redirect URI에 공백이 없음
- [ ] Redirect URI 마지막에 슬래시(`/`)가 없음

### 3단계: 환경 변수 확인
- [ ] `.env.local`에 `KAKAO_CLIENT_ID` 설정
- [ ] `.env.local`에 `KAKAO_CLIENT_SECRET` 설정
- [ ] Vercel에 `KAKAO_CLIENT_ID` 설정 (프로덕션)
- [ ] Vercel에 `KAKAO_CLIENT_SECRET` 설정 (프로덕션)
- [ ] 환경 변수에 공백이 없음
- [ ] 환경 변수에 따옴표가 없음

### 4단계: 앱 도메인 확인 (프로덕션)
- [ ] Web 플랫폼 등록됨
- [ ] 사이트 도메인: `gaeoanalysis.vercel.app` 등록됨

### 5단계: 동의 항목 확인
- [ ] 닉네임 동의 항목 설정됨
- [ ] 이메일 동의 항목 설정됨 (필요한 경우)

### 6단계: 테스트
- [ ] 개발 서버 재시작: `npm run dev`
- [ ] 브라우저 캐시 삭제 후 다시 시도
- [ ] `/api/auth/debug` 엔드포인트에서 설정 확인
- [ ] 카카오 로그인 버튼 클릭하여 테스트

## 디버깅 방법

### 1. 디버깅 엔드포인트 확인

프로덕션 환경:
```
https://gaeoanalysis.vercel.app/api/auth/debug
```

로컬 개발 환경:
```
http://localhost:3000/api/auth/debug
```

응답에서 다음을 확인:
- `callbackUrls.kakao`: 정확한 콜백 URL
- `environment.KAKAO_CLIENT_ID`: "설정됨" 또는 "설정되지 않음"

### 2. 브라우저 개발자 도구 확인

1. 브라우저 개발자 도구 (F12) → **Network** 탭
2. 카카오 로그인 버튼 클릭
3. `/api/auth/signin/kakao` 요청 확인
4. 리디렉션되는 URL 확인
5. 오류 응답 확인

### 3. 서버 로그 확인

로컬 개발 환경:
- 터미널에서 Next.js 서버 로그 확인
- 카카오 OAuth 관련 오류 메시지 확인

프로덕션 환경:
- Vercel 대시보드 → **Functions** → **Logs**
- 카카오 OAuth 관련 오류 메시지 확인

## 추가 참고 사항

### Redirect URI 주의사항

1. **정확한 일치 필요**: 카카오는 Redirect URI를 정확히 일치시켜야 합니다
   - 프로토콜 (`http` vs `https`)
   - 도메인 (`localhost:3000` vs `gaeoanalysis.vercel.app`)
   - 경로 (`/api/auth/callback/kakao`)
   - 포트 번호 (로컬의 경우 `:3000`)

2. **여러 환경 지원**: 로컬과 프로덕션 환경을 모두 사용하는 경우, 두 Redirect URI를 모두 등록해야 합니다

3. **설정 반영 시간**: Redirect URI를 변경한 후 몇 분 기다려야 카카오 서버에 반영됩니다

### 환경 변수 주의사항

1. **공백 제거**: REST API 키와 Client Secret에 앞뒤 공백이 없어야 합니다
2. **따옴표 없음**: 환경 변수는 따옴표로 감싸지 않습니다
3. **대소문자 구분**: 환경 변수 이름은 대소문자를 구분합니다 (`KAKAO_CLIENT_ID`)

## 문제가 지속되는 경우

위의 모든 단계를 확인했는데도 문제가 지속된다면:

1. **카카오 개발자 콘솔 재확인**
   - 모든 설정이 정확히 일치하는지 다시 한 번 확인

2. **브라우저 캐시 삭제**
   - 브라우저 캐시 및 쿠키 삭제 후 다시 시도

3. **카카오 고객센터 문의**
   - [카카오 디벨로퍼스 고객센터](https://developers.kakao.com/support)
   - 오류 코드: KOE101
   - 앱 키와 Redirect URI 정보 제공

## 관련 문서

- [KAKAO_OAUTH_SETUP.md](./KAKAO_OAUTH_SETUP.md) - 카카오 로그인 초기 설정 가이드
- [카카오 개발자 문서 - 카카오 로그인](https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api)
- [카카오 개발자 문서 - 오류 코드](https://developers.kakao.com/docs/latest/ko/kakaologin/trouble-shooting)

