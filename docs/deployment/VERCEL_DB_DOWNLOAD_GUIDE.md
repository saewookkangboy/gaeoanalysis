# Vercel에서 DB 파일 다운로드 가이드

Railway로 마이그레이션하기 전에 Vercel Blob Storage에 저장된 DB 파일을 다운로드하는 방법입니다.

## ⚠️ 중요 참고사항

**Railway로 마이그레이션하는 경우, 기존 DB 파일이 없어도 새로 생성됩니다.**
- 기존 데이터가 **반드시 필요한 경우**에만 이 가이드를 따라하세요.
- 기존 데이터가 없어도 되는 경우, Railway 배포 후 자동으로 새 DB가 생성됩니다.

---

## 방법 1: Vercel CLI 사용 (가장 간단) ⭐⭐⭐⭐⭐

### 장점
- ✅ `VERCEL_BLOB_READ_WRITE_TOKEN` 환경 변수 불필요
- ✅ 자동으로 환경 변수 로드
- ✅ 가장 간단한 방법

### 단계

1. **Vercel CLI 설치**
   ```bash
   npm i -g vercel
   ```

2. **Vercel 로그인**
   ```bash
   vercel login
   ```

3. **프로젝트 링크**
   ```bash
   vercel link
   ```
   - 기존 프로젝트 선택 또는 새로 생성

4. **스크립트 실행**
   ```bash
   npm run db:download-from-vercel:cli
   ```
   
   또는 수동으로:
   ```bash
   # 환경 변수 다운로드
   vercel env pull .env.local
   
   # DB 파일 다운로드
   npm run db:download-from-vercel
   ```

5. **다운로드된 파일 확인**
   ```bash
   ls -lh backup/gaeo.db
   ```

---

## 방법 2: 환경 변수 직접 설정

### 단계

1. **Vercel 대시보드에서 토큰 확인**
   - https://vercel.com/dashboard 접속
   - 프로젝트 선택
   - Settings → Environment Variables
   - `BLOB_READ_WRITE_TOKEN` 또는 `VERCEL_BLOB_READ_WRITE_TOKEN` 찾기
   - 값 복사

2. **환경 변수 설정**

   **옵션 A: 터미널에서 임시 설정**
   ```bash
   export VERCEL_BLOB_READ_WRITE_TOKEN="<토큰 값>"
   npm run db:download-from-vercel
   ```

   **옵션 B: .env.local 파일에 추가**
   ```bash
   # .env.local 파일에 추가
   echo 'VERCEL_BLOB_READ_WRITE_TOKEN=<토큰 값>' >> .env.local
   npm run db:download-from-vercel
   ```

---

## 방법 3: Vercel 대시보드에서 직접 다운로드

Vercel Blob Storage에 직접 접근할 수 있는 경우:

1. **Vercel 대시보드 → Storage → Blob**
2. `gaeo-db-file` 찾기
3. 다운로드 버튼 클릭
4. `backup/gaeo.db`로 저장

---

## 다운로드 후 Railway에 업로드

### Railway CLI 사용 (권장)

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

### Railway 볼륨 사용

1. Railway 대시보드 → 프로젝트 → "New" → "Volume" 추가
2. 볼륨 경로: `/data`
3. Railway CLI로 업로드:
   ```bash
   railway volume upload /data/gaeo.db ./backup/gaeo.db
   ```

---

## 문제 해결

### 문제 1: "VERCEL_BLOB_READ_WRITE_TOKEN 환경 변수가 설정되지 않았습니다"

**해결**: 방법 1 (Vercel CLI 사용)을 권장합니다.

### 문제 2: "Blob Storage에 DB 파일이 없음"

**원인**: 
- Vercel에 DB 파일이 아직 업로드되지 않았거나
- 다른 키 이름으로 저장되었을 수 있습니다

**해결**:
- Railway 배포 후 새 DB가 자동 생성됩니다
- 기존 데이터가 없어도 문제없습니다

### 문제 3: "다운로드 실패"

**해결**:
1. Vercel CLI로 재시도:
   ```bash
   vercel env pull .env.local
   npm run db:download-from-vercel
   ```

2. 또는 Railway에서 새 DB 사용 (기존 데이터가 없어도 되는 경우)

---

## 대안: Railway에서 새 DB 사용

기존 데이터가 없어도 되는 경우, Railway 배포 후 자동으로 새 DB가 생성됩니다:

1. Railway 배포
2. 첫 번째 분석 실행
3. DB 파일 자동 생성 (`/app/data/gaeo.db`)

**장점**:
- ✅ 마이그레이션 불필요
- ✅ 깨끗한 새 DB
- ✅ 빠른 시작

---

## 체크리스트

- [ ] Vercel CLI 설치 (`npm i -g vercel`)
- [ ] Vercel 로그인 (`vercel login`)
- [ ] 프로젝트 링크 (`vercel link`)
- [ ] DB 파일 다운로드 (`npm run db:download-from-vercel:cli`)
- [ ] 다운로드된 파일 확인 (`ls -lh backup/gaeo.db`)
- [ ] Railway에 업로드 (선택사항)

---

## 참고

- Vercel Blob Storage는 Vercel 프로젝트에 연결된 경우에만 접근 가능합니다
- 토큰은 프로젝트별로 다릅니다
- 토큰은 민감한 정보이므로 Git에 커밋하지 마세요

