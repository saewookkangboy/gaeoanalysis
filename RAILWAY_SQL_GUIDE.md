# Railway PostgreSQL에서 SQL 실행 가이드

## 올바른 방법

### 1단계: 사용자 확인

먼저 사용자가 존재하는지 확인합니다:

```sql
-- chunghyo@troe.kr 사용자 검색
SELECT id, email, role, provider, created_at 
FROM users 
WHERE LOWER(email) = 'chunghyo@troe.kr';
```

### 2단계: Google Provider 사용자 확인

같은 이메일이라도 provider별로 다른 사용자일 수 있으므로 확인:

```sql
-- Google provider로 로그인한 사용자 확인
SELECT id, email, role, provider, created_at 
FROM users 
WHERE LOWER(email) = 'chunghyo@troe.kr' AND provider = 'google';
```

### 3단계: Admin 권한 부여

사용자를 찾았으면 admin 권한을 부여합니다:

```sql
-- Admin 권한 부여
UPDATE users 
SET role = 'admin', updated_at = CURRENT_TIMESTAMP 
WHERE LOWER(email) = 'chunghyo@troe.kr' AND provider = 'google';
```

### 4단계: 확인

변경사항이 적용되었는지 확인:

```sql
-- Admin 권한 확인
SELECT id, email, role, provider, updated_at 
FROM users 
WHERE LOWER(email) = 'chunghyo@troe.kr' AND provider = 'google';
```

`role` 컬럼이 `'admin'`으로 표시되어야 합니다.

## Railway 대시보드에서 SQL 실행하는 방법

1. [Railway 대시보드](https://railway.app/) 접속
2. 프로젝트 선택
3. **PostgreSQL** 서비스 선택
4. 상단 탭에서 **Query** 또는 **SQL Editor** 탭 클릭
   - ⚠️ **주의**: "Database" 탭의 "Create table" 폼이 아닙니다!
   - **Query** 탭에서 SQL을 직접 입력하고 실행해야 합니다
5. SQL 입력창에 위의 SQL 문을 복사하여 붙여넣기
6. **Run** 또는 **Execute** 버튼 클릭

## 문제 해결

### Query 탭을 찾을 수 없는 경우

Railway 대시보드의 UI가 변경되었을 수 있습니다. 다음을 확인하세요:

1. PostgreSQL 서비스를 선택했는지 확인
2. 상단의 탭 메뉴에서 "Query", "SQL", "Editor" 등의 탭 찾기
3. 또는 "Connect" 버튼을 클릭하여 외부 클라이언트(예: pgAdmin, DBeaver) 사용

### SQL 실행 후 에러가 발생하는 경우

- 테이블이 존재하지 않는다는 에러: 스키마가 아직 초기화되지 않았을 수 있습니다
- 권한 에러: Railway PostgreSQL 서비스의 권한을 확인하세요

