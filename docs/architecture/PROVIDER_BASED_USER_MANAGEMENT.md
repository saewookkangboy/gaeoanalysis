# Provider별 독립적인 사용자 관리 시스템

## 개요

소셜 로그인(Google, GitHub) 사용자의 분석 이력을 각 계정 단위로 독립적으로 관리하기 위한 시스템입니다.

## 핵심 개선 사항

### 1. 사용자 ID 생성 로직 변경

**기존 방식:**
- 이메일만으로 사용자 ID 생성
- 같은 이메일로 Google과 GitHub에 로그인하면 같은 ID가 생성되어 분석 이력이 섞임

**개선된 방식:**
- `email + provider` 조합으로 사용자 ID 생성
- 같은 이메일이라도 Google과 GitHub는 완전히 독립적인 계정으로 취급
- 각 계정의 분석 이력이 완전히 분리됨

```typescript
// 이메일 + Provider 조합으로 고유 ID 생성
export function generateUserIdFromEmail(email: string, provider?: string): string {
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedProvider = (provider || 'unknown').toLowerCase().trim();
  const combinedKey = `${normalizedEmail}:${normalizedProvider}`;
  const hash = createHash('sha256').update(combinedKey).digest('hex');
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`;
}
```

### 2. 인증 로직 업데이트

**변경된 파일:**
- `auth.ts`: NextAuth 콜백 함수들
  - `signIn` 콜백: Provider별 사용자 생성/조회
  - `jwt` 콜백: Provider별 사용자 ID 토큰에 저장
  - `session` 콜백: Provider별 사용자 ID 세션에 포함

**주요 변경:**
- 이메일 기반 사용자 조회 제거
- Provider + 이메일 조합으로 사용자 조회
- Provider별로 완전히 독립적인 사용자 계정 유지

### 3. 분석 결과 저장 로직 개선

**변경된 파일:**
- `app/api/analyze/route.ts`: 분석 결과 저장 API
  - Provider별 사용자 ID로 분석 결과 저장
  - Provider별로 독립적인 분석 이력 관리

**주요 변경:**
- Provider + 이메일로 사용자 ID 생성
- Provider별 사용자 조회 및 생성
- 분석 결과는 Provider별 사용자 ID와 연결

### 4. 분석 이력 조회 로직 개선

**변경된 파일:**
- `app/api/history/route.ts`: 분석 이력 조회 API
  - Provider별 사용자 ID로 분석 이력 조회
  - Provider별로 독립적인 분석 이력 표시

**주요 변경:**
- Provider별 사용자 ID로 분석 이력 조회
- 이메일 기반 복잡한 조회 로직 제거
- Provider별로 깔끔하게 분리된 분석 이력

### 5. 데이터베이스 스키마 최적화

**추가된 인덱스:**
- `idx_users_provider_email`: Provider + 이메일 복합 인덱스
  - Provider별 사용자 조회 성능 향상

**마이그레이션:**
- v14: Provider별 사용자 조회 최적화 인덱스 추가

## 데이터 구조

### 사용자 테이블 (users)

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,              -- Provider + Email 기반 고유 ID
  email TEXT UNIQUE NOT NULL,
  provider TEXT,                    -- 'google', 'github'
  name TEXT,
  image TEXT,
  ...
);
```

### 분석 이력 테이블 (analyses)

```sql
CREATE TABLE analyses (
  id TEXT PRIMARY KEY,
  user_id TEXT,                     -- Provider별 사용자 ID (외래 키)
  url TEXT NOT NULL,
  ...
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 사용자 시나리오

### 시나리오 1: 같은 이메일로 Google과 GitHub에 각각 로그인

**사용자 A:**
- 이메일: `user@example.com`
- Provider: `google`
- 사용자 ID: `google-user@example.com` (해시값)

**사용자 B:**
- 이메일: `user@example.com`
- Provider: `github`
- 사용자 ID: `github-user@example.com` (해시값)

**결과:**
- 두 사용자는 완전히 독립적인 계정
- Google 계정의 분석 이력과 GitHub 계정의 분석 이력이 완전히 분리됨
- 각 계정은 독립적으로 관리됨

### 시나리오 2: Provider별 분석 이력 조회

**Google 로그인:**
- Provider: `google`
- 사용자 ID: `google-user@example.com`
- 분석 이력: Google 계정에 저장된 분석 결과만 조회

**GitHub 로그인:**
- Provider: `github`
- 사용자 ID: `github-user@example.com`
- 분석 이력: GitHub 계정에 저장된 분석 결과만 조회

## 마이그레이션 가이드

### 기존 데이터가 있는 경우

기존 데이터는 그대로 유지되며, 새로운 로그인부터 Provider별로 관리됩니다.

**주의사항:**
- 기존 사용자는 provider가 `null`일 수 있음
- Provider가 없는 기존 사용자는 이전 방식(이메일 기반)으로 계속 작동
- 새로운 로그인부터 Provider별로 관리됨

## 성능 최적화

### 인덱스

1. **사용자 조회 최적화:**
   - `idx_users_provider`: Provider별 사용자 조회
   - `idx_users_provider_email`: Provider + 이메일 복합 조회

2. **분석 이력 조회 최적화:**
   - `idx_analyses_user_id`: 사용자별 분석 이력 조회
   - `idx_analyses_user_created`: 사용자별 최근 분석 조회

## 보안 고려사항

1. **사용자 ID 생성:**
   - SHA-256 해시를 사용하여 일관된 ID 생성
   - 이메일과 Provider 정보를 안전하게 해시화

2. **데이터 분리:**
   - Provider별로 완전히 분리된 사용자 계정
   - 다른 Provider의 데이터에 접근 불가

3. **외래 키 제약 조건:**
   - 분석 이력은 해당 사용자와만 연결
   - 사용자 삭제 시 관련 분석 이력도 자동 삭제 (CASCADE)

## API 변경사항

### 분석 저장 API (`/api/analyze`)

**변경 전:**
- 이메일 기반 사용자 ID 사용
- 같은 이메일은 같은 ID

**변경 후:**
- Provider + 이메일 기반 사용자 ID 사용
- Provider별로 독립적인 ID

### 분석 이력 조회 API (`/api/history`)

**변경 전:**
- 이메일 기반 복잡한 조회 로직
- 유사한 이메일도 함께 조회

**변경 후:**
- Provider별 사용자 ID로 직접 조회
- 간단하고 빠른 조회

## 테스트 시나리오

1. **같은 이메일로 Google 로그인:**
   - Provider별 사용자 생성 확인
   - 분석 결과 저장 확인
   - 분석 이력 조회 확인

2. **같은 이메일로 GitHub 로그인:**
   - Provider별 독립적인 사용자 생성 확인
   - Google 계정과 분리된 분석 결과 저장 확인
   - Google 계정과 분리된 분석 이력 조회 확인

3. **Provider 전환:**
   - Google → GitHub 전환 시 독립적인 계정으로 인식
   - 분석 이력이 완전히 분리됨

## 문제 해결

### 문제: 분석 이력이 보이지 않음

**원인:**
- Provider별 사용자 ID가 일치하지 않음
- 세션의 Provider 정보가 누락됨

**해결:**
- 세션에 Provider 정보가 포함되어 있는지 확인
- Provider별 사용자 ID 생성 로직 확인

### 문제: 같은 이메일로 여러 Provider에 로그인 시 데이터가 섞임

**원인:**
- 이전 방식(이메일 기반)으로 생성된 사용자 ID 사용
- Provider 정보가 누락됨

**해결:**
- Provider 정보가 반드시 포함되도록 확인
- 새로운 로그인부터 Provider별로 관리됨

## 참고 자료

- [NextAuth.js 문서](https://next-auth.js.org/)
- [데이터베이스 스키마](./database/schema.sql)
- [마이그레이션 스크립트](./lib/migrations.ts)

