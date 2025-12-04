# PostgreSQL 완전 연동 마이그레이션 계획

## 현재 상태

- ✅ PostgreSQL 스키마 생성 완료
- ✅ 데이터베이스 어댑터 생성 완료 (`lib/db-adapter.ts`)
- ⚠️ `lib/db-helpers.ts`가 여전히 SQLite 직접 사용

## 마이그레이션 전략

파일이 매우 크므로(2000+ 줄), 단계적으로 마이그레이션합니다.

### 1단계: 핵심 함수 마이그레이션 (진행 중)

다음 함수들을 PostgreSQL 호환으로 변경:

- [x] `getAnalysesByEmail` - 비동기로 변경, 어댑터 사용
- [x] `getUserAnalyses` - 비동기로 변경, 어댑터 사용
- [ ] `saveAnalysis` - 어댑터 사용하도록 변경
- [ ] `getUser` - 비동기로 변경, 어댑터 사용
- [ ] `getUserByEmail` - 비동기로 변경, 어댑터 사용
- [ ] `createUser` - 비동기로 변경, 어댑터 사용

### 2단계: 나머지 함수 마이그레이션

- [ ] `saveOrUpdateChatConversation`
- [ ] `getChatConversations`
- [ ] `checkDuplicateAnalysis`
- [ ] `saveAuthLog`
- [ ] `getUserAuthLogs`
- [ ] `saveAIAgentUsage`
- [ ] `updateUserBlogUrl`
- [ ] `migrateUserEmail`
- [ ] `deleteUser`

### 3단계: SQLite 전용 코드 제거

- [ ] PRAGMA 문 제거 또는 조건부 처리
- [ ] SQLite 전용 함수 호출 제거

## 주요 변경 사항

### 1. Import 변경

```typescript
// Before
import db, { dbHelpers } from './db';

// After
import db, { dbHelpers } from './db';
import { query, transaction, prepare, isPostgreSQL, isSQLite } from './db-adapter';
```

### 2. 쿼리 실행 변경

```typescript
// Before (SQLite)
const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
const result = stmt.get(userId);

// After (PostgreSQL 호환)
const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
return result.rows[0] || null;
```

### 3. 트랜잭션 변경

```typescript
// Before
result = dbHelpers.transaction(() => {
  // ...
});

// After
result = await transaction(async (client) => {
  // ...
});
```

### 4. SQLite 전용 코드 조건부 처리

```typescript
// Before
db.pragma('synchronous = FULL');

// After
if (isSQLite()) {
  db.pragma('synchronous = FULL');
}
```

## 주의사항

1. **비동기 함수 변경**: 모든 함수를 비동기로 변경하면 호출하는 곳도 수정 필요
2. **파라미터 바인딩**: SQLite `?` → PostgreSQL `$1, $2, ...`
3. **PRAGMA 문**: SQLite 전용이므로 조건부 처리 필요
4. **테이블 정보 조회**: SQLite `PRAGMA table_info` → PostgreSQL `information_schema`

## 진행 상황

현재 1단계 진행 중입니다.

