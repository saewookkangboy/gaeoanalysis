# PostgreSQL 설정 가이드

Railway에서 PostgreSQL 데이터베이스를 추가한 후, 애플리케이션에 연결하고 사용하는 방법을 안내합니다.

## 📋 목차

1. [Railway PostgreSQL 설정](#1-railway-postgresql-설정)
2. [환경 변수 설정](#2-환경-변수-설정)
3. [스키마 생성](#3-스키마-생성)
4. [데이터 마이그레이션](#4-데이터-마이그레이션)
5. [애플리케이션 코드 수정](#5-애플리케이션-코드-수정)
6. [테스트 및 확인](#6-테스트-및-확인)

---

## 1. Railway PostgreSQL 설정

### 1.1 PostgreSQL 데이터베이스 추가

1. Railway 대시보드에서 프로젝트 선택
2. **"New"** 버튼 클릭
3. **"Database"** 선택
4. **"Add PostgreSQL"** 선택
5. 데이터베이스가 생성될 때까지 대기 (약 1-2분)

### 1.2 연결 정보 확인

PostgreSQL 서비스가 생성되면:

1. PostgreSQL 서비스 클릭
2. **"Variables"** 탭에서 `DATABASE_URL` 확인
   - 형식: `postgresql://user:password@host:port/database`
   - 예시: `postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway`

---

## 2. 환경 변수 설정

### 2.1 Railway 환경 변수 설정

1. Railway 대시보드에서 **메인 서비스** (Next.js 앱) 선택
2. **"Variables"** 탭 클릭
3. **"New Variable"** 클릭
4. 다음 환경 변수 추가:

```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

> **참고**: PostgreSQL 서비스의 `DATABASE_URL`을 복사하여 메인 서비스에 추가하세요.

### 2.2 로컬 환경 변수 설정 (선택사항)

로컬에서 테스트하려면 `.env.local` 파일에 추가:

```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

---

## 3. 스키마 생성

### 3.1 자동 스키마 생성

애플리케이션이 시작되면 자동으로 PostgreSQL 스키마가 생성됩니다.

또는 수동으로 생성하려면:

```bash
# Railway CLI를 사용하여 PostgreSQL에 연결
railway connect postgres

# 또는 psql을 사용하여 직접 연결
psql $DATABASE_URL

# 스키마 파일 실행
\i database/schema.postgresql.sql
```

### 3.2 스키마 확인

PostgreSQL에 연결하여 테이블 목록 확인:

```sql
\dt
```

다음 테이블이 생성되어야 합니다:
- `users`
- `auth_logs`
- `analyses`
- `chat_conversations`
- `ai_agent_usage`
- `site_statistics`
- `admin_logs`
- `schema_migrations`

---

## 4. 데이터 마이그레이션

### 4.1 SQLite에서 PostgreSQL로 데이터 마이그레이션

기존 SQLite 데이터를 PostgreSQL로 마이그레이션:

```bash
# 1. SQLite 데이터베이스 파일 확인
ls -la data/gaeo.db

# 2. DATABASE_URL 환경 변수 설정
export DATABASE_URL="postgresql://user:password@host:port/database"

# 3. 마이그레이션 실행
npm run db:migrate-to-postgres
```

### 4.2 마이그레이션 과정

스크립트가 자동으로:
1. PostgreSQL 스키마 생성
2. SQLite에서 모든 테이블 데이터 읽기
3. PostgreSQL에 데이터 삽입
4. 중복 데이터 자동 건너뜀 (ON CONFLICT DO NOTHING)
5. 마이그레이션 결과 통계 출력

### 4.3 마이그레이션 확인

마이그레이션 후 데이터 확인:

```sql
-- PostgreSQL에 연결
psql $DATABASE_URL

-- 레코드 수 확인
SELECT 
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM analyses) as analyses,
  (SELECT COUNT(*) FROM chat_conversations) as conversations;
```

---

## 5. 애플리케이션 코드 수정

### 5.1 자동 데이터베이스 전환

애플리케이션은 `DATABASE_URL` 환경 변수가 있으면 자동으로 PostgreSQL을 사용합니다.

- **DATABASE_URL 있음** → PostgreSQL 사용
- **DATABASE_URL 없음** → SQLite 사용

### 5.2 데이터베이스 어댑터 사용

기존 코드는 수정할 필요가 없습니다. `lib/db-adapter.ts`가 자동으로 SQLite와 PostgreSQL을 전환합니다.

```typescript
// 기존 코드 (변경 불필요)
import db from '@/lib/db';
import { dbHelpers } from '@/lib/db';

// 또는 새로운 어댑터 사용 (권장)
import { query, transaction, prepare } from '@/lib/db-adapter';
```

---

## 6. 테스트 및 확인

### 6.1 연결 테스트

```bash
# Railway에서 배포 후 로그 확인
railway logs

# 또는 헬스 체크 엔드포인트 확인
curl https://your-app.railway.app/api/health
```

### 6.2 기능 테스트

1. **사용자 로그인**: 소셜 로그인 (Google, GitHub) 테스트
2. **분석 실행**: URL 분석 기능 테스트
3. **분석 이력 조회**: `/history` 페이지에서 이력 확인
4. **데이터 저장**: 새로운 분석 결과가 PostgreSQL에 저장되는지 확인

### 6.3 데이터베이스 모니터링

Railway 대시보드에서:
- **PostgreSQL 서비스** → **Metrics** 탭에서 연결 수, 쿼리 수 확인
- **Logs** 탭에서 데이터베이스 관련 로그 확인

---

## 🔧 문제 해결

### 문제 1: "DATABASE_URL 환경 변수가 설정되지 않았습니다"

**해결 방법:**
1. Railway 대시보드에서 메인 서비스의 **Variables** 탭 확인
2. PostgreSQL 서비스의 `DATABASE_URL`을 복사하여 메인 서비스에 추가
3. 서비스 재배포

### 문제 2: "SSL connection required"

**해결 방법:**
- `lib/db-postgres.ts`에서 SSL 설정이 이미 포함되어 있습니다.
- Railway PostgreSQL은 SSL이 필수이므로 자동으로 처리됩니다.

### 문제 3: "relation does not exist"

**해결 방법:**
1. 스키마가 생성되었는지 확인:
   ```sql
   \dt
   ```
2. 스키마가 없으면 수동으로 생성:
   ```bash
   psql $DATABASE_URL < database/schema.postgresql.sql
   ```

### 문제 4: 마이그레이션 중 오류

**해결 방법:**
1. SQLite 데이터베이스 파일 경로 확인:
   ```bash
   export SQLITE_DB_PATH=/path/to/gaeo.db
   ```
2. PostgreSQL 연결 정보 확인:
   ```bash
   echo $DATABASE_URL
   ```
3. 스키마가 이미 생성되어 있는지 확인 (중복 생성 오류 방지)

---

## 📊 성능 최적화

### 연결 풀 설정

`lib/db-postgres.ts`에서 연결 풀 설정:

```typescript
pool = new Pool({
  connectionString,
  max: 20, // 최대 연결 수
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 인덱스 확인

PostgreSQL에서 인덱스 확인:

```sql
-- 인덱스 목록 확인
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public';
```

---

## ✅ 체크리스트

마이그레이션 완료 후 확인:

- [ ] Railway에서 PostgreSQL 데이터베이스 생성 완료
- [ ] `DATABASE_URL` 환경 변수 설정 완료
- [ ] PostgreSQL 스키마 생성 완료
- [ ] SQLite 데이터 마이그레이션 완료
- [ ] 애플리케이션 배포 및 연결 테스트 완료
- [ ] 사용자 로그인 테스트 완료
- [ ] 분석 기능 테스트 완료
- [ ] 분석 이력 조회 테스트 완료

---

## 🎉 완료!

PostgreSQL 연결 및 마이그레이션이 완료되었습니다!

이제 Railway에서 안정적인 PostgreSQL 데이터베이스를 사용할 수 있습니다.

**다음 단계:**
- Railway 대시보드에서 데이터베이스 모니터링
- 필요시 백업 설정
- 성능 최적화 (인덱스, 쿼리 최적화)

