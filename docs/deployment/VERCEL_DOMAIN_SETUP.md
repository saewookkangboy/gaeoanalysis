# Vercel 커스텀 도메인 설정 가이드

이 가이드는 Vercel에 배포된 서비스를 `allrounder.im` 도메인의 서브도메인으로 연결하는 방법을 설명합니다.

## 📋 사전 준비사항

1. **도메인 소유권 확인**
   - `allrounder.im` 도메인을 소유하고 있어야 합니다
   - 도메인 등록 업체(예: 가비아, 후이즈, Cloudflare 등)에 접근 가능해야 합니다

2. **Vercel 계정 및 프로젝트**
   - Vercel 계정이 있어야 합니다
   - 프로젝트가 Vercel에 배포되어 있어야 합니다

---

## 🚀 단계별 설정 방법

### 1단계: Vercel 대시보드에서 도메인 추가

1. **Vercel 대시보드 접속**
   - [https://vercel.com/dashboard](https://vercel.com/dashboard)에 로그인
   - 연결하려는 프로젝트 선택

2. **Settings → Domains 메뉴 이동**
   - 프로젝트 페이지에서 **Settings** 탭 클릭
   - 왼쪽 메뉴에서 **Domains** 선택

3. **도메인 추가**
   - **Add Domain** 또는 **Add** 버튼 클릭
   - 원하는 서브도메인 입력 (예: `gaeo.allrounder.im` 또는 `analysis.allrounder.im`)
   - **Add** 버튼 클릭

4. **DNS 설정 정보 확인**
   - Vercel이 DNS 설정 방법을 안내합니다
   - **CNAME** 또는 **A Record** 설정 정보를 확인하세요

---

### 2단계: DNS 설정 (도메인 등록 업체에서)

도메인 등록 업체의 DNS 관리 페이지에서 다음 설정을 추가합니다.

#### 방법 A: CNAME 레코드 사용 (권장)

**설정 예시:**
```
타입: CNAME
이름: gaeo (또는 원하는 서브도메인)
값: cname.vercel-dns.com
TTL: 3600 (또는 자동)
```

**설정 방법:**
1. 도메인 등록 업체의 DNS 관리 페이지 접속
2. DNS 레코드 추가/수정
3. 위의 CNAME 레코드 추가
4. 저장

#### 방법 B: A 레코드 사용

Vercel이 A 레코드를 요구하는 경우:

**설정 예시:**
```
타입: A
이름: gaeo (또는 원하는 서브도메인)
값: 76.76.21.21 (Vercel이 제공하는 IP 주소)
TTL: 3600 (또는 자동)
```

**참고:** Vercel은 여러 IP 주소를 제공할 수 있습니다. 모든 IP 주소에 대해 A 레코드를 추가해야 합니다.

---

### 3단계: DNS 전파 대기

1. **DNS 전파 시간**
   - 일반적으로 5분 ~ 24시간 소요
   - 대부분의 경우 1시간 이내 완료

2. **전파 확인 방법**
   ```bash
   # 터미널에서 확인
   dig gaeo.allrounder.im
   # 또는
   nslookup gaeo.allrounder.im
   ```

3. **온라인 도구 사용**
   - [whatsmydns.net](https://www.whatsmydns.net/)
   - [dnschecker.org](https://dnschecker.org/)

---

### 4단계: Vercel에서 도메인 인증 확인

1. **Vercel 대시보드에서 확인**
   - Settings → Domains 페이지로 이동
   - 추가한 도메인 옆에 상태 표시
   - ✅ **Valid** 또는 **Configured** 표시되면 성공

2. **SSL 인증서 자동 발급**
   - Vercel이 자동으로 Let's Encrypt SSL 인증서 발급
   - HTTPS 자동 활성화 (몇 분 소요)

---

## 🔧 환경 변수 업데이트

도메인 연결 후 환경 변수를 업데이트해야 합니다.

### Vercel 환경 변수 설정

1. **Vercel 대시보드 → Settings → Environment Variables**
2. 다음 환경 변수 추가/수정:

```env
# 기존 설정
AUTH_URL=https://gaeo.allrounder.im
# 또는
NEXTAUTH_URL=https://gaeo.allrounder.im

# OAuth 리다이렉트 URI 업데이트 필요
# Google OAuth: https://console.cloud.google.com/apis/credentials
# GitHub OAuth: https://github.com/settings/developers
```

### OAuth 리다이렉트 URI 업데이트

#### Google OAuth
1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) 접속
2. OAuth 2.0 클라이언트 ID 선택
3. 승인된 리디렉션 URI에 추가:
   ```
   https://gaeo.allrounder.im/api/auth/callback/google
   ```

#### GitHub OAuth
1. [GitHub Developer Settings](https://github.com/settings/developers) 접속
2. OAuth App 선택
3. Authorization callback URL 업데이트:
   ```
   https://gaeo.allrounder.im/api/auth/callback/github
   ```

---

## ✅ 확인 사항

### 1. 도메인 접속 확인
- 브라우저에서 `https://gaeo.allrounder.im` 접속
- 정상적으로 로드되는지 확인

### 2. SSL 인증서 확인
- 주소창에 🔒 자물쇠 아이콘 표시 확인
- HTTPS로 자동 리다이렉트되는지 확인

### 3. OAuth 로그인 테스트
- Google/GitHub 로그인 정상 작동 확인
- 리다이렉트 후 정상 로그인되는지 확인

---

## 🐛 문제 해결

### 문제 1: "Invalid Configuration" 오류

**원인:** DNS 설정이 아직 전파되지 않음

**해결:**
1. DNS 전파 시간 대기 (최대 24시간)
2. DNS 설정이 올바른지 확인
3. Vercel 대시보드에서 "Retry" 버튼 클릭

### 문제 2: SSL 인증서 발급 실패

**원인:** DNS 설정 오류 또는 도메인 인증 실패

**해결:**
1. DNS 설정 재확인
2. Vercel 대시보드에서 도메인 삭제 후 재추가
3. Vercel 지원팀에 문의

### 문제 3: OAuth 로그인 실패

**원인:** 리다이렉트 URI 미설정

**해결:**
1. Google/GitHub OAuth 설정에서 리다이렉트 URI 추가
2. 환경 변수 `AUTH_URL` 확인
3. 브라우저 캐시 삭제 후 재시도

### 문제 4: 도메인 연결은 되지만 페이지가 로드되지 않음

**원인:** 환경 변수 미설정 또는 빌드 오류

**해결:**
1. Vercel 환경 변수 확인
2. 빌드 로그 확인 (Deployments 탭)
3. 프로젝트 재배포

---

## 📝 추가 설정 (선택사항)

### 여러 서브도메인 연결

여러 서브도메인을 연결하려면:
1. Vercel Domains 페이지에서 추가 도메인 입력
2. 각 서브도메인에 대해 DNS 설정 반복
3. 환경 변수에 여러 도메인 설정 가능

### 루트 도메인 연결 (allrounder.im)

루트 도메인을 연결하려면:
1. Vercel에서 `allrounder.im` 추가
2. DNS에 A 레코드 또는 ALIAS 레코드 추가
3. Vercel이 제공하는 IP 주소 사용

**참고:** 일부 DNS 제공업체는 ALIAS 레코드를 지원하지 않을 수 있습니다.

---

## 🔗 유용한 링크

- [Vercel 도메인 설정 문서](https://vercel.com/docs/concepts/projects/domains)
- [Vercel DNS 설정 가이드](https://vercel.com/docs/concepts/projects/domains/add-a-domain)
- [NextAuth.js 도메인 설정](https://next-auth.js.org/configuration/options#nextauth_url)

---

## 💡 추천 서브도메인 이름

- `gaeo.allrounder.im` - GAEO Analysis 서비스
- `analysis.allrounder.im` - 분석 도구
- `app.allrounder.im` - 앱 서비스
- `tools.allrounder.im` - 도구 모음

원하는 서브도메인 이름을 선택하여 설정하세요!

