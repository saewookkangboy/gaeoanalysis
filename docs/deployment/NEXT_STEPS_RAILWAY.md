# Railway 마이그레이션 다음 단계

현재까지 완료된 작업을 확인하고, 다음 단계를 진행하세요.

## ✅ 완료된 작업

- [x] Railway 프로젝트 연결
- [x] DB 업로드 스크립트 준비
- [x] 코드 Railway 환경 지원 확인
- [x] PORT 환경 변수 지원 추가

## 📋 다음 단계 체크리스트

### 1단계: Railway 환경 변수 설정 (필수)

Railway 대시보드 → 프로젝트 → Variables에서 다음 환경 변수들을 확인/설정하세요:

#### 필수 환경 변수

```env
# Railway 환경 감지 (자동 설정됨, 확인만)
RAILWAY_ENVIRONMENT=1
# 또는
RAILWAY=1

# NextAuth 설정
AUTH_SECRET=<Vercel에서 복사하거나 새로 생성>
AUTH_URL=https://your-app.railway.app
# 또는 커스텀 도메인 사용 시
AUTH_URL=https://yourdomain.com

# OAuth 설정
GOOGLE_CLIENT_ID=<Vercel에서 복사>
GOOGLE_CLIENT_SECRET=<Vercel에서 복사>
GITHUB_CLIENT_ID=<Vercel에서 복사>
GITHUB_CLIENT_SECRET=<Vercel에서 복사>

# Gemini API
GEMINI_API_KEY=<Vercel에서 복사>

# 기타
NODE_ENV=production
```

#### AUTH_SECRET 생성 방법 (없는 경우)

```bash
openssl rand -base64 32
```

생성된 값을 Railway 환경 변수에 추가하세요.

**체크:**
- [ ] 모든 필수 환경 변수 설정 완료
- [ ] `AUTH_URL`이 Railway 도메인과 일치하는지 확인

---

### 2단계: OAuth 리다이렉트 URL 업데이트 (필수)

Railway 배포 후 OAuth 리다이렉트 URL을 업데이트해야 합니다.

#### Google OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. APIs & Services → Credentials
3. OAuth 2.0 Client ID 선택
4. **Authorized redirect URIs**에 추가:
   ```
   https://your-app.railway.app/api/auth/callback/google
   ```
   (커스텀 도메인 사용 시 해당 도메인으로 변경)
5. **저장** 클릭

#### GitHub OAuth 설정

1. GitHub → Settings → Developer settings → OAuth Apps
2. OAuth App 선택 또는 새로 생성
3. **Authorization callback URL** 업데이트:
   ```
   https://your-app.railway.app/api/auth/callback/github
   ```
   (커스텀 도메인 사용 시 해당 도메인으로 변경)
4. **Update application** 클릭

**체크:**
- [ ] Google OAuth 리다이렉트 URL 업데이트 완료
- [ ] GitHub OAuth 리다이렉트 URL 업데이트 완료

---

### 3단계: 데이터베이스 설정 (선택사항)

#### 옵션 A: 기존 DB 업로드 (기존 데이터 필요 시)

```bash
# 1. DB 파일 업로드
npm run db:upload-to-railway

# 2. 업로드 확인
railway run ls -la data/
```

#### 옵션 B: 새 DB 사용 (기존 데이터 불필요)

- Railway 배포 후 자동으로 새 DB가 생성됩니다
- 첫 번째 분석 실행 시 `/app/data/gaeo.db` 자동 생성
- 업로드 불필요

**체크:**
- [ ] DB 파일 업로드 완료 (옵션 A 선택 시)
- [ ] 또는 새 DB 사용 결정 (옵션 B)

---

### 4단계: 배포 확인

#### Railway 대시보드에서 확인

1. Railway 대시보드 → 프로젝트 → Deployments
2. 최신 배포 상태 확인
3. **Logs** 탭에서 다음 로그 확인:

```
🚂 [DB] Railway 환경 감지: 영구 파일 시스템 사용 (Blob Storage 불필요)
📁 [DB] 데이터베이스 경로: { dbPath: '/app/data/gaeo.db', isRailway: true, exists: true }
```

**중요**: `isRailway: true`가 표시되어야 합니다.

#### 헬스 체크

```bash
curl https://your-app.railway.app/api/health
```

예상 응답:
```json
{
  "status": "healthy",
  "services": {
    "database": {
      "connected": true
    }
  }
}
```

**체크:**
- [ ] 배포 성공 확인
- [ ] Railway 로그에서 `isRailway: true` 확인
- [ ] 헬스 체크 통과

---

### 5단계: 기능 테스트

#### 기본 기능 테스트

1. **홈페이지 접속**
   - [ ] `https://your-app.railway.app` 접속 가능
   - [ ] 페이지가 정상적으로 로드됨

2. **로그인 테스트**
   - [ ] Google 로그인 작동
   - [ ] GitHub 로그인 작동
   - [ ] 로그인 후 세션 유지

3. **분석 기능 테스트**
   - [ ] URL 입력 후 분석 실행
   - [ ] 분석 결과 표시
   - [ ] 분석 이력 저장 확인

4. **분석 이력 조회**
   - [ ] `/history` 페이지 접속
   - [ ] 이전 분석 이력 표시
   - [ ] 데이터베이스 영구 저장 확인

**체크:**
- [ ] 모든 기본 기능 정상 작동
- [ ] 분석 이력이 저장되고 조회됨

---

### 6단계: 도메인 설정 (선택사항)

커스텀 도메인을 사용하는 경우:

1. Railway 대시보드 → 프로젝트 → Settings → Domains
2. "Custom Domain" 클릭
3. 도메인 입력
4. DNS 설정 (Railway가 제공하는 CNAME 레코드 사용)
5. `AUTH_URL` 환경 변수 업데이트

**체크:**
- [ ] 커스텀 도메인 설정 완료 (선택사항)
- [ ] `AUTH_URL` 환경 변수 업데이트 완료

---

## 🚨 문제 해결

### 문제 1: Railway 환경이 감지되지 않음

**증상**: 로그에 `isRailway: false` 표시

**해결**:
1. Railway 대시보드 → Variables에서 `RAILWAY_ENVIRONMENT=1` 확인
2. 또는 `RAILWAY=1` 추가
3. 재배포

### 문제 2: OAuth 로그인 실패

**증상**: 로그인 후 리다이렉트 오류

**해결**:
1. Google/GitHub OAuth 설정에서 리다이렉트 URL 확인
2. Railway 도메인과 일치하는지 확인
3. `AUTH_URL` 환경 변수 확인

### 문제 3: 분석 저장 실패

**증상**: 분석 후 이력에 저장되지 않음

**해결**:
1. Railway 로그에서 DB 연결 확인
2. `isRailway: true` 확인
3. 데이터베이스 파일 권한 확인

---

## 📊 진행 상황 확인

현재 단계를 체크하세요:

- [ ] 1단계: Railway 환경 변수 설정
- [ ] 2단계: OAuth 리다이렉트 URL 업데이트
- [ ] 3단계: 데이터베이스 설정
- [ ] 4단계: 배포 확인
- [ ] 5단계: 기능 테스트
- [ ] 6단계: 도메인 설정 (선택사항)

---

## 🎯 빠른 시작 (우선순위)

가장 중요한 것부터 진행하세요:

1. **Railway 환경 변수 설정** (5분)
   - `AUTH_SECRET`, `AUTH_URL` 필수
   - OAuth 설정 복사

2. **OAuth 리다이렉트 URL 업데이트** (5분)
   - Google, GitHub 콜백 URL 업데이트

3. **배포 확인** (2분)
   - Railway 로그에서 `isRailway: true` 확인

4. **기능 테스트** (10분)
   - 로그인, 분석 실행, 이력 조회

---

## 📚 참고 문서

- [RAILWAY_CHECKLIST.md](./RAILWAY_CHECKLIST.md) - 상세 체크리스트
- [QUICK_START_RAILWAY.md](./QUICK_START_RAILWAY.md) - 빠른 시작 가이드
- [SERVER_MIGRATION_GUIDE.md](./SERVER_MIGRATION_GUIDE.md) - 전체 마이그레이션 가이드

---

## ✅ 완료 확인

모든 단계를 완료하면:

1. Railway 배포가 정상 작동합니다
2. 분석 이력이 영구 저장됩니다
3. Blob Storage 없이도 정상 작동합니다
4. 트랜잭션 외부 확인 실패 문제가 해결됩니다

**다음 단계로 진행하세요!** 🚀

