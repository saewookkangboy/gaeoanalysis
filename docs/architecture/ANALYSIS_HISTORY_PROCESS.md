# 분석 이력 프로세스 문서

## 📋 프로세스 개요

분석 이력이 정상적으로 작동하기 위한 전체 프로세스입니다.

### 프로세스 흐름

```
1. 사용자 로그인
   ↓
2. 사용자 이메일 정보 확인
   ↓
3. 이메일 기반 일관된 사용자 ID 생성/확인
   ↓
4. 분석 결과 저장 (이메일 기반 ID 사용)
   ↓
5. 분석 이력 조회 (이메일 기반으로 조회)
   ↓
6. 로그아웃 (기존 분석 이력 DB에 보존)
   ↓
7. 동일 이메일로 재로그인 시 분석 이력 불러오기
```

## 🔑 핵심 원칙

### 1. 이메일 기반 일관된 사용자 ID

- **같은 이메일은 항상 같은 사용자 ID를 사용**
- `generateUserIdFromEmail()` 함수 사용 (auth.ts에서 export)
- SHA-256 해시를 사용하여 일관된 ID 생성

```typescript
// 이메일 기반 ID 생성
const emailBasedUserId = generateUserIdFromEmail(normalizedEmail);
// 예: "pakseri@gmail.com" → "155f42a1-e4c4-edd1-53e6-5445c31a9863"
```

### 2. 사용자 생성/확인 로직

1. **이메일로 기존 사용자 찾기**
   - `getUserByEmail(normalizedEmail)` 사용
   - 기존 사용자가 있으면 그 ID 사용 (분석 이력 유지)

2. **기존 사용자가 없으면 이메일 기반 ID로 생성**
   - `createUser({ id: emailBasedUserId, email: normalizedEmail, ... })`
   - `createUser`는 이메일로 기존 사용자를 찾으면 기존 ID 반환

3. **이메일이 없으면 세션 ID 사용**
   - 폴백 메커니즘

## 📝 상세 프로세스

### 프로세스 1: 로그인 (auth.ts)

**위치**: `auth.ts` - `signIn` 콜백

1. 이메일 정규화: `email.toLowerCase().trim()`
2. 이메일 기반 ID 생성: `generateUserIdFromEmail(normalizedEmail)`
3. 이메일로 기존 사용자 확인: `getUserByEmail(normalizedEmail)`
4. 사용자 생성/업데이트: `createUser({ id: emailBasedUserId, ... })`
5. JWT 토큰에 실제 사용자 ID 저장

**로그 예시**:
```
✅ [signIn] 기존 사용자 로그인: { 
  id: '155f42a1-e4c4-edd1-53e6-5445c31a9863', 
  email: 'pakseri@gmail.com', 
  provider: 'google' 
}
```

### 프로세스 2: 분석 결과 저장 (app/api/analyze/route.ts)

**위치**: `app/api/analyze/route.ts` - `handleAnalyze` 함수

1. 세션에서 사용자 정보 확인
2. 이메일 정규화
3. 이메일 기반 ID 생성: `generateUserIdFromEmail(normalizedEmail)`
4. 이메일로 기존 사용자 확인
5. 기존 사용자가 없으면 이메일 기반 ID로 생성
6. **분석 결과 저장**: `saveAnalysis({ userId: finalUserId, ... })`
7. 저장 후 즉시 확인 (최대 3회 재시도)

**로그 예시**:
```
✅ [Analyze API] 이메일로 기존 사용자 확인: { 
  sessionId: 'xxx', 
  emailBasedId: '155f42a1-e4c4-edd1-53e6-5445c31a9863',
  actualUserId: '155f42a1-e4c4-edd1-53e6-5445c31a9863', 
  email: 'pakseri@gmail.com' 
}
💾 [Analyze API] 분석 결과 저장 시도: { 
  userId: '155f42a1-e4c4-edd1-53e6-5445c31a9863',
  url: 'https://example.com'
}
✅ [Analyze API] 분석 결과 저장 및 확인 성공
```

### 프로세스 3: 분석 이력 조회 (app/api/history/route.ts)

**위치**: `app/api/history/route.ts` - `GET` 함수

1. 세션에서 사용자 정보 확인
2. 이메일 정규화
3. 이메일 기반 ID 생성: `generateUserIdFromEmail(normalizedEmail)`
4. 이메일로 기존 사용자 확인
5. **이메일로 분석 이력 조회**: `getAnalysesByEmail(normalizedEmail)`
   - 여러 사용자 ID에 걸쳐 조회 (같은 이메일로 여러 ID가 있을 수 있음)
6. 이메일로 조회 결과가 없으면 실제 사용자 ID로 조회
7. 세션 ID와 실제 ID가 다르면 세션 ID로도 조회 (ID 불일치 대비)

**로그 예시**:
```
✅ [History API] 이메일로 기존 사용자 확인: {
  sessionUserId: 'xxx',
  emailBasedId: '155f42a1-e4c4-edd1-53e6-5445c31a9863',
  actualUserId: '155f42a1-e4c4-edd1-53e6-5445c31a9863',
  email: 'pakseri@gmail.com'
}
🔍 [History API] 이메일로 조회 결과: {
  email: 'pakseri@gmail.com',
  count: 3
}
✅ [History API] 분석 이력 조회 완료: { 
  actualUserId: '155f42a1-e4c4-edd1-53e6-5445c31a9863',
  count: 3
}
```

### 프로세스 4: 로그아웃 (components/Navigation.tsx)

**위치**: `components/Navigation.tsx` - 로그아웃 버튼

1. `signOut()` 호출
2. 실패 시 NextAuth 관련 쿠키 수동 삭제
3. 페이지 새로고침
4. **기존 분석 이력은 DB에 보존됨** (삭제되지 않음)

## 🔧 기술적 세부사항

### generateUserIdFromEmail 함수

```typescript
export function generateUserIdFromEmail(email: string): string {
  const normalizedEmail = email.toLowerCase().trim();
  const hash = createHash('sha256').update(normalizedEmail).digest('hex');
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`;
}
```

**특징**:
- 같은 이메일은 항상 같은 ID 반환
- UUID 형식 (8-4-4-4-12)
- SHA-256 해시 사용

### getAnalysesByEmail 함수

```typescript
export function getAnalysesByEmail(email: string, options: QueryOptions = {}) {
  const normalizedEmail = email.toLowerCase().trim();
  const userStmt = db.prepare('SELECT id FROM users WHERE LOWER(TRIM(email)) = ?');
  const users = userStmt.all(normalizedEmail) as Array<{ id: string }>;
  const userIds = users.map(u => u.id);
  // 모든 사용자 ID로 분석 이력 조회
  // ...
}
```

**특징**:
- 같은 이메일로 여러 사용자 ID가 있을 수 있음
- 모든 관련 사용자 ID의 분석 이력을 조회
- 이메일 기반으로 일관된 조회 보장

## ✅ 검증 체크리스트

- [ ] 로그인 시 이메일 기반 ID 생성 확인
- [ ] 분석 저장 시 이메일 기반 ID 사용 확인
- [ ] 분석 이력 조회 시 이메일 기반 조회 확인
- [ ] 동일 이메일로 재로그인 시 분석 이력 불러오기 확인
- [ ] 로그아웃 후 분석 이력 보존 확인
- [ ] 여러 사용자 ID가 있어도 이메일로 통합 조회 확인

## 🐛 문제 해결

### 문제: 분석 이력이 조회되지 않음

**원인**:
- 사용자 ID 불일치
- 이메일 정규화 문제
- DB 동기화 지연 (Vercel 환경)

**해결**:
1. 이메일 기반 ID 사용 확인
2. `getAnalysesByEmail` 사용 확인
3. Vercel 환경에서 재시도 로직 확인

### 문제: 동일 이메일로 재로그인 시 분석 이력이 없음

**원인**:
- 다른 사용자 ID로 저장됨
- 이메일 기반 ID가 일관되지 않음

**해결**:
1. `generateUserIdFromEmail` 사용 확인
2. `getAnalysesByEmail`로 조회 확인
3. 로그에서 사용자 ID 일치 확인

## 📊 로그 확인 포인트

### 로그인 시
```
✅ [signIn] 기존 사용자 로그인: { id: '...', email: '...' }
```

### 분석 저장 시
```
✅ [Analyze API] 이메일로 기존 사용자 확인: { actualUserId: '...' }
💾 [Analyze API] 분석 결과 저장 시도: { userId: '...' }
✅ [Analyze API] 분석 결과 저장 및 확인 성공
```

### 분석 이력 조회 시
```
✅ [History API] 이메일로 기존 사용자 확인: { actualUserId: '...' }
🔍 [History API] 이메일로 조회 결과: { count: 3 }
✅ [History API] 분석 이력 조회 완료: { count: 3 }
```

## 🔄 마이그레이션 가이드

기존 사용자 ID를 이메일 기반 ID로 마이그레이션하는 경우:

1. 이메일로 기존 사용자 찾기
2. 이메일 기반 ID 생성
3. 분석 이력 업데이트 (user_id 변경)
4. 사용자 ID 업데이트

**주의**: 마이그레이션은 신중하게 진행해야 하며, 백업 후 진행 권장

