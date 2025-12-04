# pgAdmin에서 Admin 권한 설정 - 단계별 가이드

## 📝 pgAdmin에서 실행할 SQL

pgAdmin의 Query Tool에서 **다음 SQL을 정확히 복사**하여 실행하세요:

### 1단계: 사용자 확인

```sql
SELECT id, email, role, provider, created_at 
FROM users 
WHERE LOWER(email) = 'chunghyo@troe.kr' AND provider = 'google';
```

**예상 결과**: 사용자 정보가 표시되어야 합니다. 없다면 사용자가 아직 로그인하지 않았을 수 있습니다.

### 2단계: Admin 권한 부여

```sql
UPDATE users 
SET role = 'admin', updated_at = CURRENT_TIMESTAMP 
WHERE LOWER(email) = 'chunghyo@troe.kr' AND provider = 'google';
```

**예상 결과**: "UPDATE 1" 또는 비슷한 메시지가 표시되면 성공입니다.

### 3단계: 확인

```sql
SELECT id, email, role, provider, updated_at 
FROM users 
WHERE LOWER(email) = 'chunghyo@troe.kr' AND provider = 'google';
```

**예상 결과**: `role` 컬럼이 `admin`으로 표시되어야 합니다.

## ⚠️ 주의사항

### pgAdmin에서 입력할 때 주의할 점:

1. **작은따옴표 사용** (`'`)
   - ✅ `'chunghyo@troe.kr'`
   - ❌ `"chunghyo@troe.kr"` 또는 `"'chunghyo@troe.kr'"`

2. **CURRENT_TIMESTAMP는 따옴표 없이**
   - ✅ `CURRENT_TIMESTAMP`
   - ❌ `"CURRENT_TIMESTAMP"` 또는 `'CURRENT_TIMESTAMP'`

3. **컬럼명 오타 주의**
   - ✅ `updated_at`
   - ❌ `updateed_at`

## 🔄 대안: 로컬 스크립트 사용

pgAdmin이 복잡하다면, 터미널에서 간단히 실행할 수 있습니다:

```bash
# 방법 1: 쉘 스크립트 사용
./set-admin-local.sh

# 방법 2: 직접 실행
export DATABASE_URL="postgresql://postgres:KAPaIaUhyQdOEpcmVPjqlYhHWnEtdPUP@yamanote.proxy.rlwy.net:12487/railway"
npx tsx scripts/set-admin-role.ts chunghyo@troe.kr
```

## ✅ 완료 확인

Admin 권한 설정이 완료되면:

1. **브라우저에서 다시 로그인** (로그아웃 후 재로그인)
2. **`/admin` 경로로 접근**
   - 예: `https://gaeo.allrounder.im/admin`
3. **Admin 대시보드가 표시되면 성공!**

