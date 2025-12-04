# Railway 배포 체크리스트

Railway 연결이 완료된 후 확인해야 할 사항들을 정리한 체크리스트입니다.

## ✅ 필수 환경 변수 확인

Railway 대시보드 → 프로젝트 → Variables에서 다음 환경 변수들이 설정되어 있는지 확인하세요:

### 1. Railway 환경 감지 변수 (자동 설정됨)
```env
RAILWAY_ENVIRONMENT=1
# 또는
RAILWAY=1
```
**확인 방법**: Railway가 자동으로 설정합니다. 없으면 수동으로 추가하세요.

### 2. NextAuth 설정
```env
AUTH_SECRET=<Vercel에서 복사한 값 또는 새로 생성>
AUTH_URL=https://your-app.railway.app
# 또는 커스텀 도메인 사용 시
AUTH_URL=https://yourdomain.com
```

**AUTH_SECRET 생성 방법:**
```bash
openssl rand -base64 32
```

### 3. OAuth 설정
```env
# Google OAuth
GOOGLE_CLIENT_ID=<Vercel에서 복사>
GOOGLE_CLIENT_SECRET=<Vercel에서 복사>

# GitHub OAuth
GITHUB_CLIENT_ID=<Vercel에서 복사>
GITHUB_CLIENT_SECRET=<Vercel에서 복사>
```

### 4. Gemini API
```env
GEMINI_API_KEY=<Vercel에서 복사>
```

### 5. Firebase 설정 (사용하는 경우)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=<Vercel에서 복사>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<Vercel에서 복사>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<Vercel에서 복사>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<Vercel에서 복사>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<Vercel에서 복사>
NEXT_PUBLIC_FIREBASE_APP_ID=<Vercel에서 복사>
```

### 6. 기타 설정
```env
NODE_ENV=production
```

---

## ✅ OAuth 리다이렉트 URL 업데이트

Railway 배포 후 OAuth 리다이렉트 URL을 업데이트해야 합니다.

### Google OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. APIs & Services → Credentials
3. OAuth 2.0 Client ID 선택
4. Authorized redirect URIs에 추가:
   ```
   https://your-app.railway.app/api/auth/callback/google
   ```
   (커스텀 도메인 사용 시 해당 도메인으로 변경)

### GitHub OAuth 설정

1. GitHub → Settings → Developer settings → OAuth Apps
2. OAuth App 선택 또는 새로 생성
3. Authorization callback URL 업데이트:
   ```
   https://your-app.railway.app/api/auth/callback/github
   ```
   (커스텀 도메인 사용 시 해당 도메인으로 변경)

---

## ✅ 도메인 설정

### Railway 자동 도메인

Railway는 자동으로 다음 형식의 도메인을 제공합니다:
```
https://your-app-name.up.railway.app
```

### 커스텀 도메인 설정 (선택사항)

1. Railway 대시보드 → 프로젝트 → Settings → Domains
2. "Custom Domain" 클릭
3. 도메인 입력
4. DNS 설정 (Railway가 제공하는 CNAME 레코드 사용)

---

## ✅ 데이터베이스 마이그레이션

### Vercel에서 DB 파일 다운로드

```bash
# 로컬에서 실행
npm run db:download-from-vercel
```

이 명령은 `backup/gaeo.db` 파일을 생성합니다.

### Railway에 DB 파일 업로드

**방법 1: Railway CLI 사용 (권장)**

```bash
# Railway CLI 설치
npm i -g @railway/cli

# Railway 로그인
railway login

# 프로젝트 연결
railway link

# DB 파일 업로드
railway run bash -c "mkdir -p /app/data && cat > /app/data/gaeo.db" < backup/gaeo.db
```

**방법 2: Railway 볼륨 사용**

1. Railway 대시보드 → 프로젝트 → "New" → "Volume" 추가
2. 볼륨 경로: `/data`
3. 환경 변수 추가: `DB_PATH=/data/gaeo.db`
4. Railway CLI로 파일 업로드:
   ```bash
   railway volume upload /data/gaeo.db ./backup/gaeo.db
   ```

**방법 3: 배포 후 자동 생성**

DB 파일이 없으면 새로 생성됩니다. 기존 데이터가 필요하면 위 방법을 사용하세요.

---

## ✅ 배포 확인

### 1. 배포 상태 확인

Railway 대시보드에서:
- 배포가 성공적으로 완료되었는지 확인
- 로그에서 에러가 없는지 확인

### 2. 헬스 체크

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

### 3. Railway 로그 확인

Railway 대시보드 → Deployments → 최신 배포 → Logs에서 다음 로그 확인:

```
🚂 [DB] Railway 환경 감지: 영구 파일 시스템 사용 (Blob Storage 불필요)
📁 [DB] 데이터베이스 경로: { dbPath: '/app/data/gaeo.db', isRailway: true, exists: true }
```

**중요**: `isRailway: true`가 표시되어야 합니다.

---

## ✅ 기능 테스트

### 1. 홈페이지 접속
- [ ] `https://your-app.railway.app` 접속 가능
- [ ] 페이지가 정상적으로 로드됨

### 2. 로그인 테스트
- [ ] Google 로그인 작동
- [ ] GitHub 로그인 작동
- [ ] 로그인 후 세션 유지

### 3. 분석 기능 테스트
- [ ] URL 입력 후 분석 실행
- [ ] 분석 결과 표시
- [ ] 분석 이력 저장 확인

### 4. 분석 이력 조회
- [ ] `/history` 페이지 접속
- [ ] 이전 분석 이력 표시
- [ ] 데이터베이스 영구 저장 확인

---

## ✅ 성능 최적화 확인

### 1. WAL 모드 확인

Railway 로그에서 다음 확인:
```
PRAGMA journal_mode = WAL
```

Railway 환경에서는 WAL 모드가 자동으로 사용됩니다.

### 2. 데이터베이스 경로 확인

로그에서 다음 확인:
```
📁 [DB] 데이터베이스 경로: { 
  dbPath: '/app/data/gaeo.db', 
  isRailway: true, 
  exists: true 
}
```

---

## ⚠️ 주의사항

### 1. Blob Storage 비활성화 확인

Railway 환경에서는 Blob Storage가 사용되지 않아야 합니다. 로그에서 다음이 **없어야** 합니다:
```
📥 [DB] Vercel 환경 감지: Blob Storage에서 DB 파일 다운로드 시작...
```

### 2. 환경 변수 보안

- 민감한 정보(API 키, 시크릿)는 Railway 환경 변수로만 관리
- 코드에 하드코딩하지 않기
- `.env` 파일을 Git에 커밋하지 않기

### 3. 데이터베이스 백업

Railway는 영구 파일 시스템을 제공하지만, 정기적인 백업을 권장합니다:

```bash
# Railway CLI로 백업 다운로드
railway run cat /app/data/gaeo.db > backup/gaeo-$(date +%Y%m%d).db
```

---

## 🔧 문제 해결

### 문제 1: Railway 환경이 감지되지 않음

**증상**: 로그에 `isRailway: false` 표시

**해결**:
1. Railway 대시보드 → Variables에서 `RAILWAY_ENVIRONMENT=1` 확인
2. 또는 `RAILWAY=1` 추가
3. 재배포

### 문제 2: 데이터베이스 파일이 생성되지 않음

**증상**: 로그에 `exists: false` 표시

**해결**:
1. Railway 대시보드 → 프로젝트 → Settings → Variables
2. `DB_PATH` 환경 변수 확인 (필요시 설정)
3. 재배포

### 문제 3: OAuth 로그인 실패

**증상**: 로그인 후 리다이렉트 오류

**해결**:
1. Google/GitHub OAuth 설정에서 리다이렉트 URL 확인
2. Railway 도메인과 일치하는지 확인
3. `AUTH_URL` 환경 변수 확인

### 문제 4: 분석 저장 실패

**증상**: 분석 후 이력에 저장되지 않음

**해결**:
1. Railway 로그에서 DB 연결 확인
2. 데이터베이스 파일 권한 확인
3. `isRailway: true` 확인

---

## 📊 모니터링 설정

### Railway 내장 모니터링

Railway 대시보드에서:
- CPU 사용량
- 메모리 사용량
- 네트워크 트래픽
- 로그 확인

### 추가 모니터링 도구 (선택사항)

- **Sentry**: 에러 추적
- **Logtail**: 로그 관리
- **Uptime Robot**: 가동 시간 모니터링

---

## ✅ 최종 체크리스트

배포 완료 후 다음 항목을 모두 확인하세요:

- [ ] Railway 환경 변수 모두 설정됨
- [ ] OAuth 리다이렉트 URL 업데이트됨
- [ ] 도메인 설정 완료
- [ ] 데이터베이스 마이그레이션 완료 (또는 새로 생성)
- [ ] 헬스 체크 통과
- [ ] Railway 로그에서 `isRailway: true` 확인
- [ ] 홈페이지 정상 작동
- [ ] 로그인 기능 정상 작동
- [ ] 분석 기능 정상 작동
- [ ] 분석 이력 조회 정상 작동
- [ ] 데이터베이스 영구 저장 확인

---

## 🎉 완료!

모든 항목이 체크되면 Railway 배포가 성공적으로 완료된 것입니다!

추가 질문이나 문제가 있으면 Railway 문서를 참조하거나 이슈를 생성하세요.

- [Railway 문서](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)

