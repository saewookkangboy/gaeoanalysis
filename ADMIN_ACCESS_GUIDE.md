# Admin 대시보드 접근 가이드

## 📋 접근 방법

### 1. URL로 직접 접근
Admin 대시보드는 메인 페이지와 분리되어 있으며, 다음 URL로 직접 접근할 수 있습니다:

```
http://localhost:3000/admin          (로컬 개발 환경)
https://your-domain.com/admin        (프로덕션 환경)
```

### 2. 접근 조건
- **로그인 필요**: 먼저 로그인해야 합니다 (Google 또는 GitHub)
- **관리자 권한 필요**: 사용자의 `role`이 `'admin'`이어야 합니다
- **권한 없음 시**: 자동으로 메인 페이지(`/`)로 리다이렉트됩니다

## 🔐 관리자 권한 설정

관리자 권한을 설정하려면 사용자의 `role`을 `'admin'`으로 변경해야 합니다.

### 방법 1: 스크립트 사용 (권장)

스크립트를 사용하여 이메일로 사용자의 role을 업데이트할 수 있습니다:

```bash
npx tsx scripts/set-admin-role.ts <이메일>
```

예시:
```bash
npx tsx scripts/set-admin-role.ts chunghyo@troe.kr
```

### 방법 2: 데이터베이스 직접 수정

#### SQLite (로컬 개발)
```bash
# 데이터베이스 파일 열기
sqlite3 data/gaeo.db

# 사용자 role 업데이트
UPDATE users SET role = 'admin' WHERE email = 'chunghyo@troe.kr';

# 확인
SELECT id, email, role FROM users WHERE email = 'chunghyo@troe.kr';

# 종료
.quit
```

#### PostgreSQL (프로덕션)
```bash
# PostgreSQL에 연결
psql $DATABASE_URL

# 사용자 role 업데이트
UPDATE users SET role = 'admin' WHERE email = 'chunghyo@troe.kr';

# 확인
SELECT id, email, role FROM users WHERE email = 'chunghyo@troe.kr';

# 종료
\q
```

### 방법 3: Railway/Vercel 환경에서 SQL 실행

Railway나 Vercel 환경에서는 데이터베이스 대시보드에서 직접 SQL을 실행할 수 있습니다:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

## 📝 접근 절차

1. **로그인**
   - 메인 페이지에서 Google 또는 GitHub로 로그인

2. **관리자 권한 설정**
   - 위의 방법 중 하나를 사용하여 사용자의 role을 'admin'으로 설정

3. **Admin 페이지 접근**
   - 브라우저에서 `/admin` URL로 직접 접근
   - 예: `http://localhost:3000/admin`

4. **권한 확인**
   - 접근 시 권한 확인 중 메시지가 표시됩니다
   - 권한이 있으면 관리자 대시보드가 표시됩니다
   - 권한이 없으면 메인 페이지로 리다이렉트됩니다

## 🎯 Admin 페이지 기능

접근 성공 후 다음 기능들을 사용할 수 있습니다:

1. **메인 대시보드** (`/admin`)
   - 빠른 링크 및 개요

2. **로그인 이력** (`/admin/auth-logs`)
   - Provider별 로그인 이력 조회
   - 날짜 범위 필터링
   - 통계 요약

3. **사용자 관리** (`/admin/users`)
   - 사용자 목록 조회
   - Provider별 필터링
   - 이메일 검색
   - 사용자별 통계 (분석 수, 채팅 수, 로그인 수)

4. **통계 대시보드** (`/admin/statistics`)
   - 일일 통계 및 활동 측정 (추후 구현 예정)

## ⚠️ 주의사항

1. **보안**: 관리자 권한이 있는 사용자만 접근할 수 있습니다
2. **권한 확인**: 모든 Admin API와 페이지는 권한을 확인합니다
3. **활동 로그**: 모든 관리자 활동은 `admin_logs` 테이블에 기록됩니다

## 🔍 권한 확인 API

관리자 권한을 확인하려면 다음 API를 사용할 수 있습니다:

```
GET /api/admin/check
```

응답:
```json
{
  "isAdmin": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "admin"
  }
}
```

## 🐛 문제 해결

### 권한이 있어도 접근 불가
- 브라우저 캐시를 지우고 다시 로그인
- 세션을 종료하고 다시 로그인
- 데이터베이스에서 role이 정확히 'admin'인지 확인

### 권한 확인 오류
- 서버 로그 확인
- 데이터베이스 연결 상태 확인
- 사용자 정보가 올바르게 저장되었는지 확인

## 📚 관련 파일

- `lib/admin-auth.ts` - 관리자 권한 확인 로직
- `app/admin/layout.tsx` - 관리자 레이아웃 및 권한 확인
- `app/api/admin/check/route.ts` - 권한 확인 API
- `scripts/set-admin-role.ts` - 관리자 권한 설정 스크립트

