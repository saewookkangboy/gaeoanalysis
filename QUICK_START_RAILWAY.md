# Railway 마이그레이션 빠른 시작 가이드

## 현재 상태
- ✅ Railway 연결 완료
- ⏳ Vercel에서 DB 파일 다운로드 필요 (선택사항)

## 빠른 시작

### 옵션 1: 기존 DB 파일 다운로드 (기존 데이터 필요 시)

**1단계: Vercel CLI 로그인**
```bash
vercel login
```
브라우저가 열리면 Vercel 계정으로 로그인하세요.

**2단계: 프로젝트 링크**
```bash
vercel link
```
- 기존 프로젝트를 선택하거나
- 새로 생성할 프로젝트 선택

**3단계: DB 파일 다운로드**
```bash
npm run db:download-from-vercel:cli
```

**4단계: Railway에 업로드**
```bash
# Railway CLI 설치 (아직 설치하지 않은 경우)
npm i -g @railway/cli

# Railway 로그인
railway login

# 프로젝트 연결
railway link

# DB 파일 업로드
# 옵션 A: backup/gaeo.db 사용 (Vercel에서 다운로드한 경우)
railway run bash -c "mkdir -p /app/data && cat > /app/data/gaeo.db" < backup/gaeo.db

# 옵션 B: 로컬 data/gaeo.db 사용 (개발 환경의 DB)
railway run bash -c "mkdir -p /app/data && cat > /app/data/gaeo.db" < data/gaeo.db
```

---

### 옵션 2: 새 DB 사용 (기존 데이터 불필요)

**기존 데이터가 없어도 되는 경우**, Railway 배포 후 자동으로 새 DB가 생성됩니다:

1. **Railway 환경 변수 확인**
   - Railway 대시보드 → 프로젝트 → Variables
   - 필수 환경 변수 설정 확인 (RAILWAY_CHECKLIST.md 참고)

2. **배포 확인**
   - Railway 대시보드에서 배포 상태 확인
   - 로그에서 `🚂 [DB] Railway 환경 감지` 메시지 확인

3. **첫 번째 분석 실행**
   - DB 파일이 자동으로 생성됩니다
   - `/app/data/gaeo.db` 경로에 저장됩니다

---

## 다음 단계

### 1. Railway 환경 변수 확인

Railway 대시보드 → 프로젝트 → Variables에서 다음 확인:

- [ ] `RAILWAY_ENVIRONMENT=1` 또는 `RAILWAY=1` (자동 설정됨)
- [ ] `AUTH_SECRET` 설정됨
- [ ] `AUTH_URL=https://your-app.railway.app` 설정됨
- [ ] `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` 설정됨
- [ ] `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` 설정됨
- [ ] `GEMINI_API_KEY` 설정됨

### 2. OAuth 리다이렉트 URL 업데이트

**Google OAuth:**
- Google Cloud Console → OAuth 2.0 Client ID
- Authorized redirect URIs에 추가:
  ```
  https://your-app.railway.app/api/auth/callback/google
  ```

**GitHub OAuth:**
- GitHub → Settings → Developer settings → OAuth Apps
- Authorization callback URL 업데이트:
  ```
  https://your-app.railway.app/api/auth/callback/github
  ```

### 3. 배포 확인

```bash
# 헬스 체크
curl https://your-app.railway.app/api/health
```

### 4. 기능 테스트

- [ ] 홈페이지 접속
- [ ] 로그인 (Google/GitHub)
- [ ] 분석 실행
- [ ] 분석 이력 조회

---

## 문제 해결

### Vercel CLI 로그인 문제

**문제**: `vercel login` 실행 후 브라우저가 열리지 않음

**해결**:
```bash
# 토큰 직접 사용
vercel login --token <your-vercel-token>
```

토큰은 Vercel 대시보드 → Settings → Tokens에서 생성할 수 있습니다.

### Railway 환경 변수 문제

**문제**: Railway 환경이 감지되지 않음

**해결**:
1. Railway 대시보드 → Variables에서 `RAILWAY_ENVIRONMENT=1` 확인
2. 재배포

### DB 파일 업로드 문제

**문제**: Railway에 DB 파일 업로드 실패

**해결**:
- Railway는 자동으로 새 DB를 생성하므로 업로드하지 않아도 됩니다
- 첫 번째 분석 실행 시 자동 생성됩니다

---

## 체크리스트

- [ ] Vercel CLI 로그인 (`vercel login`)
- [ ] Vercel 프로젝트 링크 (`vercel link`)
- [ ] DB 파일 다운로드 (선택사항)
- [ ] Railway 환경 변수 확인
- [ ] OAuth 리다이렉트 URL 업데이트
- [ ] Railway 배포 확인
- [ ] 기능 테스트

---

## 참고 문서

- [RAILWAY_CHECKLIST.md](./RAILWAY_CHECKLIST.md) - 상세 체크리스트
- [VERCEL_DB_DOWNLOAD_GUIDE.md](./VERCEL_DB_DOWNLOAD_GUIDE.md) - DB 다운로드 가이드
- [SERVER_MIGRATION_GUIDE.md](./SERVER_MIGRATION_GUIDE.md) - 전체 마이그레이션 가이드

