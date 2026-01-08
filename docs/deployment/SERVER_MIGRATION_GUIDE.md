# Vercel 서버리스 → 실제 서버 마이그레이션 가이드

## 개요

현재 프로젝트는 Vercel 서버리스 환경에서 실행 중이며, SQLite 데이터베이스를 Vercel Blob Storage에 저장하고 있습니다. 이 문서는 실제 서버 환경으로 마이그레이션하는 방법을 설명합니다.

## 현재 아키텍처

- **호스팅**: Vercel (서버리스)
- **데이터베이스**: SQLite (파일 기반)
- **스토리지**: Vercel Blob Storage (DB 파일 저장)
- **문제점**:
  - 서버리스 환경에서 DB 동기화 지연
  - Blob Storage 업로드/다운로드 오버헤드
  - 트랜잭션 외부 확인 실패 가능성

## 추천 마이그레이션 옵션

### 1. Railway (가장 추천) ⭐⭐⭐⭐⭐

**장점:**
- ✅ 영구 파일 시스템 지원 (Blob Storage 불필요)
- ✅ 간단한 배포 (GitHub 연동)
- ✅ 자동 HTTPS/도메인 설정
- ✅ 환경 변수 관리 용이
- ✅ 현재 코드와 거의 호환 (Railway 환경 변수만 추가)
- ✅ 무료 티어 제공 ($5 크레딧/월)
- ✅ PostgreSQL, MySQL 등 다른 DB로 쉽게 전환 가능

**단점:**
- ❌ Vercel만큼 빠른 글로벌 CDN은 없음
- ❌ 서버리스 스케일링은 없음 (하지만 영구 서버로 충분)

**비용:**
- 무료 티어: $5 크레딧/월 (소규모 프로젝트에 충분)
- 유료: $20/월부터 (더 많은 리소스)

**마이그레이션 방법:**

1. **Railway 계정 생성 및 프로젝트 생성**
   ```bash
   # Railway CLI 설치 (선택사항)
   npm i -g @railway/cli
   railway login
   ```

2. **환경 변수 설정**
   - Railway 대시보드에서 다음 환경 변수 추가:
     ```
     RAILWAY_ENVIRONMENT=1
     NODE_ENV=production
     AUTH_SECRET=<기존 값>
     GOOGLE_CLIENT_ID=<기존 값>
     GOOGLE_CLIENT_SECRET=<기존 값>
     GITHUB_CLIENT_ID=<기존 값>
     GITHUB_CLIENT_SECRET=<기존 값>
     ```

3. **GitHub 연동**
   - Railway 대시보드에서 GitHub 저장소 연결
   - 자동 배포 활성화

4. **코드 변경 없음!**
   - `lib/db.ts`에서 이미 Railway 환경을 감지하고 있음
   - Blob Storage 로직 자동 비활성화

5. **데이터베이스 마이그레이션**
   ```bash
   # Vercel에서 DB 파일 다운로드
   # Railway 서버에 업로드하거나
   # Railway의 볼륨에 직접 복사
   ```

---

### 2. Render ⭐⭐⭐⭐

**장점:**
- ✅ 영구 디스크 지원
- ✅ 무료 티어 제공
- ✅ 간단한 배포
- ✅ PostgreSQL 지원 (향후 확장 가능)

**단점:**
- ❌ 무료 티어는 15분 비활성 시 스핀다운
- ❌ Railway보다 설정이 약간 복잡

**비용:**
- 무료 티어: 제한적 (스핀다운 있음)
- 유료: $7/월부터

**마이그레이션 방법:**

1. **Render 계정 생성 및 Web Service 생성**
2. **환경 변수 설정** (Railway와 유사)
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `npm start`
5. **Persistent Disk 추가** (데이터베이스 저장용)

---

### 3. DigitalOcean App Platform ⭐⭐⭐⭐

**장점:**
- ✅ 영구 디스크 지원
- ✅ 간단한 배포
- ✅ 좋은 성능
- ✅ PostgreSQL 지원

**단점:**
- ❌ 무료 티어 없음
- ❌ Railway보다 비쌈

**비용:**
- $5/월부터 (Basic Plan)

**마이그레이션 방법:**

1. **DigitalOcean 계정 생성**
2. **App Platform에서 새 앱 생성**
3. **GitHub 저장소 연결**
4. **영구 디스크 추가** (데이터베이스용)

---

### 4. AWS EC2 / Lightsail ⭐⭐⭐

**장점:**
- ✅ 완전한 제어권
- ✅ 다양한 인스턴스 타입
- ✅ 확장성
- ✅ PostgreSQL RDS 지원

**단점:**
- ❌ 설정이 복잡함
- ❌ 서버 관리 필요
- ❌ 초기 설정 시간 소요

**비용:**
- Lightsail: $3.50/월부터
- EC2: 사용량 기반

**마이그레이션 방법:**

1. **EC2/Lightsail 인스턴스 생성**
2. **Node.js 설치**
3. **PM2로 프로세스 관리**
4. **Nginx 리버스 프록시 설정**
5. **SSL 인증서 설정 (Let's Encrypt)**

---

### 5. Google Cloud Run / Compute Engine ⭐⭐⭐

**장점:**
- ✅ Google Cloud 인프라
- ✅ 좋은 성능
- ✅ 확장성

**단점:**
- ❌ 설정 복잡
- ❌ 비용 예측 어려움

---

### 6. 자체 서버 (VPS) ⭐⭐⭐

**장점:**
- ✅ 완전한 제어권
- ✅ 비용 효율적 (장기)
- ✅ 커스터마이징 자유

**단점:**
- ❌ 서버 관리 필요
- ❌ 보안 설정 필요
- ❌ 백업 관리 필요

**추천 VPS 제공업체:**
- DigitalOcean Droplets
- Linode
- Vultr
- Hetzner

---

## 상세 마이그레이션 가이드: Railway

### 1단계: Railway 프로젝트 생성

1. [Railway](https://railway.app) 접속 및 계정 생성
2. "New Project" 클릭
3. "Deploy from GitHub repo" 선택
4. GitHub 저장소 연결

### 2단계: 환경 변수 설정

Railway 대시보드 → Settings → Variables에서 추가:

```env
RAILWAY_ENVIRONMENT=1
RAILWAY=1
NODE_ENV=production
AUTH_SECRET=<Vercel에서 복사>
GOOGLE_CLIENT_ID=<Vercel에서 복사>
GOOGLE_CLIENT_SECRET=<Vercel에서 복사>
GITHUB_CLIENT_ID=<Vercel에서 복사>
GITHUB_CLIENT_SECRET=<Vercel에서 복사>
AUTH_URL=https://your-app.railway.app
```

### 3단계: 데이터베이스 마이그레이션

**옵션 A: Vercel Blob Storage에서 다운로드**

```bash
# 로컬에서 실행
npm run download-db  # (스크립트 추가 필요)

# 또는 Railway CLI 사용
railway run node scripts/download-db.js
```

**옵션 B: Railway 볼륨 사용**

1. Railway 대시보드 → 프로젝트 → "New" → "Volume" 추가
2. 볼륨 경로: `/data`
3. 환경 변수 추가: `DB_PATH=/data/gaeo.db`

### 4단계: 코드 확인

현재 코드는 이미 Railway 환경을 지원합니다:

```typescript
// lib/db.ts
isRailway = !!process.env.RAILWAY_ENVIRONMENT || !!process.env.RAILWAY;

if (isRailway) {
  console.log('🚂 [DB] Railway 환경 감지: 영구 파일 시스템 사용 (Blob Storage 불필요)');
}
```

**추가 설정이 필요한 경우:**

`lib/db.ts` 수정 (필요시):

```typescript
// Railway 볼륨 사용 시
dbDir = process.env.RAILWAY_VOLUME_MOUNT_PATH 
  ? process.env.RAILWAY_VOLUME_MOUNT_PATH 
  : join(process.cwd(), 'data');
```

### 5단계: 도메인 설정

1. Railway 대시보드 → Settings → Domains
2. "Generate Domain" 클릭 또는 커스텀 도메인 추가
3. DNS 설정 (커스텀 도메인 사용 시)

### 6단계: OAuth 리다이렉트 URL 업데이트

**Google OAuth:**
1. [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services → Credentials
3. OAuth 2.0 Client ID 편집
4. Authorized redirect URIs에 추가:
   - `https://your-app.railway.app/api/auth/callback/google`

**GitHub OAuth:**
1. GitHub → Settings → Developer settings → OAuth Apps
2. OAuth App 편집
3. Authorization callback URL 업데이트:
   - `https://your-app.railway.app/api/auth/callback/github`

### 7단계: 배포 확인

1. Railway 대시보드에서 배포 상태 확인
2. 로그 확인: "🚂 [DB] Railway 환경 감지" 메시지 확인
3. 애플리케이션 테스트

---

## 데이터베이스 백업 및 복구

### Vercel에서 백업 다운로드

```bash
# 스크립트 생성: scripts/download-db-from-vercel.sh
#!/bin/bash
# Vercel Blob Storage에서 DB 파일 다운로드
# (Vercel CLI 또는 API 사용)
```

### Railway로 복구

```bash
# Railway CLI 사용
railway run node scripts/restore-db.js

# 또는 직접 파일 업로드
railway volume upload /data/gaeo.db ./backup/gaeo.db
```

---

## 성능 비교

| 항목 | Vercel (서버리스) | Railway (영구 서버) |
|------|------------------|---------------------|
| Cold Start | 1-3초 | 없음 (항상 실행) |
| DB 동기화 | Blob Storage 필요 | 즉시 (로컬 파일) |
| 트랜잭션 확인 | 외부 확인 실패 가능 | 항상 성공 |
| 비용 | 사용량 기반 | $5-20/월 |
| 확장성 | 자동 스케일링 | 수동 스케일링 |

---

## 마이그레이션 체크리스트

- [ ] Railway/Render/DigitalOcean 계정 생성
- [ ] GitHub 저장소 연결
- [ ] 환경 변수 설정
- [ ] 데이터베이스 백업 다운로드 (Vercel)
- [ ] 데이터베이스 복구 (새 서버)
- [ ] OAuth 리다이렉트 URL 업데이트
- [ ] 도메인 설정
- [ ] 배포 및 테스트
- [ ] Vercel에서 도메인 DNS 변경 (커스텀 도메인 사용 시)
- [ ] 모니터링 설정
- [ ] 백업 자동화 설정

---

## 롤백 계획

문제 발생 시 Vercel로 롤백:

1. Vercel 프로젝트 재활성화
2. 도메인 DNS 되돌리기
3. 데이터베이스 복구 (Railway에서 백업 다운로드)

---

## 추가 권장 사항

### 1. PostgreSQL로 전환 (장기)

SQLite는 단일 서버 환경에 적합하지만, 향후 확장을 고려하면 PostgreSQL 전환을 권장합니다.

**Railway PostgreSQL 사용:**
1. Railway → "New" → "Database" → "PostgreSQL"
2. 연결 문자열 환경 변수로 설정
3. 마이그레이션 스크립트 실행

### 2. 모니터링 설정

- Railway: 내장 모니터링
- 추가: Sentry (에러 추적), Logtail (로그 관리)

### 3. 백업 자동화

```bash
# Railway Cron Job 설정
# 매일 자동 백업
0 2 * * * node scripts/backup-db.js
```

### 4. 성능 최적화

- CDN 추가 (Cloudflare)
- 캐싱 전략 개선
- 데이터베이스 인덱스 최적화

---

## 결론

**가장 추천하는 옵션: Railway**

이유:
1. ✅ 현재 코드와 100% 호환 (환경 변수만 추가)
2. ✅ 영구 파일 시스템으로 Blob Storage 불필요
3. ✅ 간단한 설정
4. ✅ 합리적인 비용
5. ✅ 향후 PostgreSQL 전환 용이

**마이그레이션 시간:** 약 30분-1시간

**예상 비용:** $5-20/월 (프로젝트 규모에 따라)

---

## 문의 및 지원

마이그레이션 중 문제가 발생하면:
1. Railway 문서: https://docs.railway.app
2. 프로젝트 이슈 트래커 사용
3. Railway Discord 커뮤니티 참여

