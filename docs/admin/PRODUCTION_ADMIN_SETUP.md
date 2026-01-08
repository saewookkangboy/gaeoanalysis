# 프로덕션 환경 Admin 권한 설정 가이드

프로덕션 환경에서 Google 로그인 후 admin 권한을 설정하는 방법입니다.

## 상황 설명

- **로컬 데이터베이스**: SQLite (로컬 개발 환경)
- **프로덕션 데이터베이스**: PostgreSQL (Railway)
- 사용자가 프로덕션에서 로그인했지만, 로컬 DB에는 사용자가 없음

## 해결 방법

### 방법 1: Railway 대시보드에서 직접 SQL 실행 (가장 간단)

1. [Railway 대시보드](https://railway.app/) 접속
2. 프로젝트 선택
3. **PostgreSQL** 서비스 선택
4. **Query** 탭 클릭 (⚠️ "Create table" 폼이 아닌 **Query** 또는 **SQL Editor** 탭 사용)
5. 다음 SQL 실행:

**⚠️ 중요**: "Create table" 폼이 아니라 **Query** 탭에서 SQL을 직접 입력하고 실행해야 합니다!

```sql
-- chunghyo@troe.kr 사용자 찾기
SELECT id, email, role, provider FROM users WHERE LOWER(email) = 'chunghyo@troe.kr';

-- Google provider로 검색 (같은 이메일이라도 provider별로 다른 사용자일 수 있음)
SELECT id, email, role, provider FROM users 
WHERE LOWER(email) = 'chunghyo@troe.kr' AND provider = 'google';

-- Admin 권한 부여
UPDATE users 
SET role = 'admin', updated_at = CURRENT_TIMESTAMP 
WHERE LOWER(email) = 'chunghyo@troe.kr' AND provider = 'google';

-- 또는 provider 없이 (모든 provider)
UPDATE users 
SET role = 'admin', updated_at = CURRENT_TIMESTAMP 
WHERE LOWER(email) = 'chunghyo@troe.kr';
```

### 방법 2: 프로덕션 환경에서 스크립트 실행

프로덕션 환경 변수를 사용하여 로컬에서 프로덕션 데이터베이스에 접근:

```bash
# 프로덕션 DATABASE_URL 환경 변수 설정 (Railway에서 복사)
export DATABASE_URL="postgresql://postgres:비밀번호@호스트:포트/데이터베이스"

# 스크립트 실행
npx tsx scripts/set-admin-role.ts chunghyo@troe.kr
```

**참고**: 로컬 환경에서도 `DATABASE_URL`을 사용할 수 있도록 PostgreSQL 연결 로직이 개선되었습니다. Railway 환경이 아니어도 정상적으로 작동합니다.

### 방법 3: Vercel CLI 또는 Railway CLI 사용

```bash
# Railway CLI 사용
railway run npx tsx scripts/set-admin-role.ts chunghyo@troe.kr

# 또는 Vercel CLI 사용
vercel env pull .env.production
export $(cat .env.production | xargs)
npx tsx scripts/set-admin-role.ts chunghyo@troe.kr
```

## 확인 방법

Admin 권한이 설정되었는지 확인:

1. 브라우저에서 `/admin` 경로로 접근
2. 또는 Railway 대시보드에서 다음 SQL로 확인:

```sql
SELECT id, email, role, provider FROM users WHERE LOWER(email) = 'chunghyo@troe.kr';
```

`role` 컬럼이 `'admin'`으로 표시되어야 합니다.

## 문제 해결

### 사용자를 찾을 수 없는 경우

Provider별로 사용자가 분리되어 있을 수 있습니다. 다음 쿼리로 모든 Provider의 사용자를 확인:

```sql
SELECT id, email, role, provider, created_at 
FROM users 
WHERE LOWER(email) LIKE '%chunghyo%' 
ORDER BY created_at DESC;
```

### 권한 설정 후에도 접근이 안 되는 경우

1. 브라우저 캐시 및 쿠키 삭제
2. 다시 로그인
3. `/admin` 경로로 재접근

