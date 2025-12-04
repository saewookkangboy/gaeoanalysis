# Railway DATABASE_URL 설정 가이드

Railway PostgreSQL 데이터베이스의 `DATABASE_URL`을 가져와서 마이그레이션하는 방법을 안내합니다.

## 📋 방법 1: Railway 대시보드에서 직접 복사

### 1단계: PostgreSQL 서비스 선택
1. Railway 대시보드 (https://railway.app) 접속
2. 프로젝트 선택
3. **PostgreSQL** 서비스 클릭

### 2단계: Variables 탭에서 DATABASE_URL 확인
1. PostgreSQL 서비스의 **"Variables"** 탭 클릭
2. `DATABASE_URL` 변수 찾기
3. 값 복사 (마우스 오른쪽 클릭 → Copy)

### 3단계: 환경 변수 설정

**로컬에서 마이그레이션 실행 시:**

```bash
# 터미널에서 직접 설정
export DATABASE_URL="postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway"

# 확인
echo $DATABASE_URL

# 마이그레이션 실행
npm run db:migrate-to-postgres
```

**또는 .env.local 파일에 추가:**

```bash
# .env.local 파일 생성/편집
echo 'DATABASE_URL="postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway"' >> .env.local

# 마이그레이션 실행 (환경 변수 자동 로드)
npm run db:migrate-to-postgres
```

---

## 📋 방법 2: Railway CLI 사용

### 1단계: Railway CLI 설치

```bash
npm install -g @railway/cli
```

### 2단계: Railway 로그인

```bash
railway login
```

### 3단계: 프로젝트 연결

```bash
railway link
```

### 4단계: DATABASE_URL 가져오기

```bash
# PostgreSQL 서비스의 DATABASE_URL 출력
railway variables --service postgres
```

또는:

```bash
# 모든 환경 변수 출력
railway variables
```

### 5단계: 환경 변수로 설정

```bash
# Railway CLI로 환경 변수 가져오기
export DATABASE_URL=$(railway variables --service postgres --json | jq -r '.DATABASE_URL')

# 마이그레이션 실행
npm run db:migrate-to-postgres
```

---

## 📋 방법 3: Railway 대시보드에서 메인 서비스에 추가

### 1단계: PostgreSQL 서비스에서 DATABASE_URL 복사
1. PostgreSQL 서비스 → Variables 탭
2. `DATABASE_URL` 값 복사

### 2단계: 메인 서비스 (Next.js 앱)에 추가
1. 메인 서비스 (Next.js 앱) 선택
2. **"Variables"** 탭 클릭
3. **"New Variable"** 클릭
4. Name: `DATABASE_URL`
5. Value: 복사한 DATABASE_URL 붙여넣기
6. **"Add"** 클릭

### 3단계: 서비스 재배포
- Railway가 자동으로 재배포하거나
- 수동으로 **"Deploy"** 버튼 클릭

이제 애플리케이션이 자동으로 PostgreSQL을 사용합니다!

---

## 🔍 DATABASE_URL 형식 확인

올바른 `DATABASE_URL` 형식:

```
postgresql://[사용자명]:[비밀번호]@[호스트]:[포트]/[데이터베이스명]
```

예시:
```
postgresql://postgres:AbCdEf123456@containers-us-west-123.railway.app:5432/railway
```

### 구성 요소 설명:
- **사용자명**: `postgres` (기본값)
- **비밀번호**: Railway가 자동 생성
- **호스트**: `containers-us-west-xxx.railway.app` (Railway가 제공)
- **포트**: `5432` (PostgreSQL 기본 포트)
- **데이터베이스명**: `railway` (기본값)

---

## ✅ 연결 테스트

마이그레이션 전에 연결을 테스트하려면:

```bash
# PostgreSQL 연결 테스트
psql $DATABASE_URL -c "SELECT version();"
```

또는 Node.js 스크립트로:

```bash
# 간단한 연결 테스트 스크립트 실행
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()').then(r => {
  console.log('✅ 연결 성공:', r.rows[0]);
  process.exit(0);
}).catch(e => {
  console.error('❌ 연결 실패:', e.message);
  process.exit(1);
});
"
```

---

## 🚨 문제 해결

### 오류 1: `ENOTFOUND` (호스트명을 찾을 수 없음)

**원인**: DATABASE_URL의 호스트명이 잘못되었거나 네트워크 문제

**해결 방법**:
1. Railway 대시보드에서 DATABASE_URL 다시 확인
2. 호스트명이 올바른지 확인
3. 인터넷 연결 확인

### 오류 2: `ECONNREFUSED` (연결 거부)

**원인**: 포트 번호가 잘못되었거나 PostgreSQL 서비스가 중지됨

**해결 방법**:
1. Railway 대시보드에서 PostgreSQL 서비스 상태 확인
2. 서비스가 실행 중인지 확인
3. 포트 번호 확인 (기본값: 5432)

### 오류 3: `28P01` (인증 실패)

**원인**: 사용자명 또는 비밀번호가 잘못됨

**해결 방법**:
1. Railway 대시보드에서 DATABASE_URL 다시 복사
2. 비밀번호에 특수문자가 포함되어 있는지 확인
3. URL 인코딩이 필요한 경우 확인

### 오류 4: `DATABASE_URL 환경 변수가 설정되지 않았습니다`

**원인**: 환경 변수가 설정되지 않음

**해결 방법**:
```bash
# 환경 변수 확인
echo $DATABASE_URL

# 설정되지 않았다면 설정
export DATABASE_URL="postgresql://..."

# 또는 .env.local 파일 사용
echo 'DATABASE_URL="..."' >> .env.local
```

---

## 📝 마이그레이션 실행

환경 변수가 설정되면:

```bash
# 마이그레이션 실행
npm run db:migrate-to-postgres
```

마이그레이션 과정:
1. ✅ SQLite 연결 확인
2. ✅ PostgreSQL 연결 테스트
3. 📋 PostgreSQL 스키마 생성
4. 📦 각 테이블 데이터 마이그레이션
5. ✅ 마이그레이션 완료 및 통계 출력

---

## 🎉 완료!

마이그레이션이 완료되면:
- 모든 SQLite 데이터가 PostgreSQL로 이동됨
- Railway에서 PostgreSQL 사용 가능
- 애플리케이션이 자동으로 PostgreSQL 사용

**다음 단계:**
- Railway에서 애플리케이션 배포
- 기능 테스트
- 데이터 확인

