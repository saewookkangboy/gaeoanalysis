# Google OAuth 설정 체크리스트 (gaeo.allrounder.im)

## ✅ 현재 확인된 정보

**Debug 콘솔 결과:**
- **현재 도메인**: `https://gaeo.allrounder.im`
- **Google 콜백 URL**: `https://gaeo.allrounder.im/api/auth/callback/google`
- **GitHub 콜백 URL**: `https://gaeo.allrounder.im/api/auth/callback/github`
- **AUTH_URL**: `https://gaeo.allrounder.im` ✅
- **NEXTAUTH_URL**: `https://gaeoanalysis.vercel.app` ⚠️ (업데이트 필요)

## 🔧 즉시 해결해야 할 사항

### 1. Google Cloud Console에 콜백 URL 추가 (가장 중요!)

1. **[Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials) 접속**

2. **프로젝트 선택** (상단 드롭다운에서 올바른 프로젝트 선택)

3. **OAuth 2.0 Client ID** 목록에서 **웹 애플리케이션** 타입 클릭

4. **"승인된 리디렉션 URI"** 섹션 찾기

5. **"URI 추가"** 또는 **"ADD URI"** 버튼 클릭

6. **다음 URL을 정확히 입력:**
   ```
   https://gaeo.allrounder.im/api/auth/callback/google
   ```
   ⚠️ **중요**: 
   - 마지막에 슬래시(/) 없이 입력
   - 프로토콜(https) 정확히 일치
   - 도메인과 경로 정확히 일치

7. **"저장"** 또는 **"SAVE"** 버튼 클릭

8. **변경사항 적용까지 5분 대기**

### 2. Vercel 환경 변수 업데이트 (선택 사항, 권장)

**현재 상태:**
- `AUTH_URL`: `https://gaeo.allrounder.im` ✅ (올바름)
- `NEXTAUTH_URL`: `https://gaeoanalysis.vercel.app` ⚠️ (업데이트 권장)

**업데이트 방법:**

1. **Vercel 대시보드** → 프로젝트 → **Settings** → **Environment Variables**

2. **`NEXTAUTH_URL` 환경 변수 찾기**

3. **값을 다음으로 업데이트:**
   ```
   https://gaeo.allrounder.im
   ```

4. **또는 `NEXTAUTH_URL`을 삭제** (NextAuth.js v5는 `AUTH_URL`을 우선 사용)

5. **환경 변수 저장 후 재배포**

**참고:** NextAuth.js v5에서는 `AUTH_URL`을 우선적으로 사용하므로, `NEXTAUTH_URL`이 다른 값이어도 문제가 없을 수 있습니다. 하지만 일관성을 위해 업데이트하는 것을 권장합니다.

### 3. GitHub OAuth 설정 확인 (선택 사항)

GitHub 로그인도 사용하는 경우:

1. **[GitHub Settings - OAuth Apps](https://github.com/settings/developers) 접속**

2. **OAuth App 선택**

3. **"Authorization callback URL"** 확인:
   ```
   https://gaeo.allrounder.im/api/auth/callback/github
   ```

4. **일치하지 않으면 업데이트**

## ✅ 체크리스트

### Google OAuth 설정
- [ ] Google Cloud Console 접속
- [ ] 올바른 프로젝트 선택
- [ ] OAuth 2.0 Client ID (웹 애플리케이션) 선택
- [ ] "승인된 리디렉션 URI"에 `https://gaeo.allrounder.im/api/auth/callback/google` 추가
- [ ] 마지막 슬래시(/) 없음 확인
- [ ] 프로토콜(https) 정확히 일치 확인
- [ ] "저장" 버튼 클릭
- [ ] 5분 대기

### Vercel 환경 변수
- [ ] `AUTH_URL` = `https://gaeo.allrounder.im` 확인
- [ ] `GOOGLE_CLIENT_ID` 설정 확인
- [ ] `GOOGLE_CLIENT_SECRET` 설정 확인
- [ ] `NEXTAUTH_URL` 업데이트 (선택 사항)
- [ ] 재배포 완료

### 테스트
- [ ] 브라우저 쿠키 삭제
- [ ] 시크릿 모드에서 테스트
- [ ] Google 로그인 시도
- [ ] 정상 로그인 확인

## 🔍 문제 해결

### 여전히 `redirect_uri_mismatch` 오류가 발생한다면

1. **Google Cloud Console에서 확인:**
   - "승인된 리디렉션 URI" 목록에 정확한 URL이 있는지 확인
   - 다른 URL이 있는지 확인 (예: `https://gaeoanalysis.vercel.app/api/auth/callback/google`)
   - 필요하면 기존 URL 삭제 후 정확한 URL만 추가

2. **Vercel 환경 변수 재확인:**
   - `AUTH_URL`이 `https://gaeo.allrounder.im`인지 확인
   - 환경 변수 저장 후 재배포 확인

3. **브라우저 캐시 및 쿠키 삭제:**
   - 개발자 도구 (F12) → Application → Cookies
   - `__Secure-authjs.*` 쿠키 삭제
   - 브라우저 캐시 삭제

4. **시간 대기:**
   - Google OAuth 설정 변경 후 최대 5분 소요
   - Vercel 재배포 후 최대 2분 소요

## 📋 빠른 링크

- [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
- [OAuth 동의 화면](https://console.cloud.google.com/apis/credentials/consent)
- [Vercel Environment Variables](https://vercel.com/dashboard)
- [GitHub OAuth Apps](https://github.com/settings/developers)

## 🎯 요약

**가장 중요한 단계:**
1. Google Cloud Console에서 `https://gaeo.allrounder.im/api/auth/callback/google` 추가
2. 5분 대기
3. 시크릿 모드에서 테스트

이 단계만 완료하면 Google 로그인이 정상적으로 작동해야 합니다!

