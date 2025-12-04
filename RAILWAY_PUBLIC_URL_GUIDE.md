# Railway Public DATABASE_URL 찾기 가이드

`postgres.railway.internal` 오류가 발생했다면, Railway의 **Public URL**을 사용해야 합니다.

## 🔍 문제 원인

Railway PostgreSQL은 두 가지 연결 URL을 제공합니다:

1. **Private URL** (내부 네트워크): `postgres.railway.internal`
   - ❌ 로컬 환경에서는 접근 불가
   - ✅ Railway 내부 서비스 간 통신용

2. **Public URL** (외부 접근 가능): `containers-xxx.railway.app`
   - ✅ 로컬 환경에서 마이그레이션 시 사용
   - ✅ 외부에서 접근 가능

## 📋 해결 방법

### 방법 1: Railway 대시보드에서 Public URL 찾기

1. **Railway 대시보드 접속**
   - https://railway.app 접속
   - 프로젝트 선택

2. **PostgreSQL 서비스 선택**
   - PostgreSQL 서비스 클릭

3. **Connect 탭 확인**
   - **"Connect"** 탭 클릭
   - **"Public Network"** 또는 **"External"** 섹션 확인
   - `postgresql://postgres:...@containers-xxx.railway.app:5432/railway` 형식의 URL 찾기

4. **또는 Variables 탭에서 확인**
   - **"Variables"** 탭 클릭
   - 여러 개의 `DATABASE_URL` 변수가 있을 수 있음
   - 호스트명이 `containers-xxx.railway.app` 형식인 URL 찾기

### 방법 2: Railway CLI 사용

```bash
# Railway CLI 설치 (없는 경우)
npm install -g @railway/cli

# Railway 로그인
railway login

# 프로젝트 연결
railway link

# PostgreSQL 서비스의 모든 환경 변수 확인
railway variables --service postgres

# Public URL 찾기 (containers-xxx.railway.app 포함)
railway variables --service postgres | grep containers
```

### 방법 3: Railway API 사용

```bash
# Railway API 토큰 필요
# Settings → Tokens → New Token

curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.railway.app/v1/services/SERVICE_ID/variables \
  | jq '.variables[] | select(.name == "DATABASE_URL") | select(.value | contains("containers"))'
```

## ✅ 올바른 URL 형식

**Public URL (사용해야 함)**:
```
postgresql://postgres:password@containers-us-west-123.railway.app:5432/railway
```

**Private URL (사용하지 말 것)**:
```
postgresql://postgres:password@postgres.railway.internal:5432/railway
```

## 🔧 환경 변수 설정

Public URL을 찾았다면:

```bash
# 터미널에서 설정
export DATABASE_URL="postgresql://postgres:password@containers-xxx.railway.app:5432/railway"

# 확인
echo $DATABASE_URL

# 마이그레이션 실행
npm run db:migrate-to-postgres
```

또는 `.env.local` 파일에 추가:

```bash
# .env.local 파일 생성/편집
echo 'DATABASE_URL="postgresql://postgres:password@containers-xxx.railway.app:5432/railway"' >> .env.local
```

## 🚨 Public URL이 없는 경우

Railway PostgreSQL 서비스에 Public URL이 없다면:

1. **PostgreSQL 서비스 설정 확인**
   - PostgreSQL 서비스 → Settings
   - "Public Networking" 또는 "External Access" 옵션 활성화

2. **새로운 PostgreSQL 서비스 생성**
   - Public Network 옵션으로 새 서비스 생성
   - 또는 기존 서비스 재생성

3. **Railway 지원팀 문의**
   - Public URL 활성화 요청

## 📝 확인 사항

마이그레이션 전에 다음을 확인하세요:

- [ ] DATABASE_URL이 `containers-xxx.railway.app` 형식인가?
- [ ] `postgres.railway.internal`이 포함되어 있지 않은가?
- [ ] 환경 변수가 올바르게 설정되었는가? (`echo $DATABASE_URL`)

## 🎯 빠른 확인 명령어

```bash
# 현재 DATABASE_URL 확인
echo $DATABASE_URL

# Public URL인지 확인 (containers 포함 여부)
echo $DATABASE_URL | grep -q "containers" && echo "✅ Public URL" || echo "❌ Private URL"

# 연결 테스트
psql $DATABASE_URL -c "SELECT version();"
```

---

**참고**: Railway의 일부 서비스는 Public URL을 제공하지 않을 수 있습니다. 이 경우 Railway 내부에서만 접근 가능하므로, Railway 환경에서 마이그레이션을 실행해야 합니다.

