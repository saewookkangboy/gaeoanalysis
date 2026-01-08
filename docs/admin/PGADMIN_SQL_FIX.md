# pgAdmin SQL 실행 시 주의사항

## 잘못된 SQL 문법

사용자가 입력한 SQL에 몇 가지 문법 오류가 있습니다:

```sql
-- ❌ 잘못된 예시
SET role="admin"                    -- 큰따옴표 사용, PostgreSQL은 작은따옴표 권장
updateed_at="CURRENT_TIMESTAMP"     -- 오타 (updated_at), CURRENT_TIMESTAMP는 따옴표 없이
WHERE LOWER(email)="'chunghyo@troe.kr'"  -- 따옴표 중복
AND PROVIDER="google"               -- 큰따옴표 사용
```

## 올바른 SQL 문법

PostgreSQL에서는 다음과 같이 작성해야 합니다:

```sql
-- ✅ 올바른 SQL
UPDATE users 
SET role = 'admin', updated_at = CURRENT_TIMESTAMP 
WHERE LOWER(email) = 'chunghyo@troe.kr' AND provider = 'google';
```

### 주요 차이점:

1. **따옴표 사용**
   - ❌ 큰따옴표 (`"`) - 컬럼명이나 식별자에만 사용
   - ✅ 작은따옴표 (`'`) - 문자열 값에 사용

2. **CURRENT_TIMESTAMP**
   - ❌ `"CURRENT_TIMESTAMP"` 또는 `'CURRENT_TIMESTAMP'` - 문자열로 인식됨
   - ✅ `CURRENT_TIMESTAMP` - 따옴표 없이, 함수로 실행됨

3. **오타 수정**
   - ❌ `updateed_at` (오타)
   - ✅ `updated_at` (올바른 컬럼명)

4. **따옴표 중복 제거**
   - ❌ `"'chunghyo@troe.kr'"` - 따옴표가 중복됨
   - ✅ `'chunghyo@troe.kr'` - 작은따옴표 하나만 사용

## pgAdmin에서 실행 방법

1. pgAdmin에서 Railway PostgreSQL 데이터베이스 연결
2. Query Tool 열기 (우클릭 → Query Tool)
3. 다음 SQL을 복사하여 붙여넣기:

```sql
-- 1단계: 사용자 확인
SELECT id, email, role, provider, created_at 
FROM users 
WHERE LOWER(email) = 'chunghyo@troe.kr' AND provider = 'google';

-- 2단계: Admin 권한 부여
UPDATE users 
SET role = 'admin', updated_at = CURRENT_TIMESTAMP 
WHERE LOWER(email) = 'chunghyo@troe.kr' AND provider = 'google';

-- 3단계: 확인
SELECT id, email, role, provider, updated_at 
FROM users 
WHERE LOWER(email) = 'chunghyo@troe.kr' AND provider = 'google';
```

4. **Execute** 버튼 (또는 F5) 클릭하여 실행

## 실행 순서

1. **먼저 SELECT로 사용자 확인** - 사용자가 존재하는지 확인
2. **UPDATE 실행** - Admin 권한 부여
3. **다시 SELECT로 확인** - `role`이 `'admin'`으로 변경되었는지 확인

## 예상 결과

실행 후 3단계 SELECT 쿼리 결과에서:
- `role` 컬럼이 `admin`으로 표시되어야 합니다
- `updated_at` 컬럼이 현재 시간으로 업데이트되어야 합니다

