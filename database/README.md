# 데이터베이스 스키마 및 마이그레이션

## 개요

이 디렉토리에는 GAEO Analysis 애플리케이션의 데이터베이스 스키마와 관련 문서가 포함되어 있습니다.

## 파일 구조

- `schema.sql`: 전체 데이터베이스 스키마 정의 (SQL 스크립트)
- `README.md`: 이 문서

## 데이터베이스 스키마

### 주요 테이블

1. **users** - 사용자 정보
   - 기본 사용자 정보 (id, email, name, image)
   - OAuth 제공자 정보 (provider: 'google', 'github')
   - 역할 관리 (role: 'user', 'admin')
   - 마지막 로그인 시간 (last_login_at)

2. **auth_logs** - 인증 로그
   - 로그인/로그아웃/회원가입 이력
   - IP 주소, User Agent 기록
   - 성공/실패 여부 및 오류 메시지

3. **analyses** - 분석 이력
   - AEO, GEO, SEO 점수
   - AI Citation 점수 (ChatGPT, Perplexity, Gemini, Claude)
   - 분석 인사이트 (JSON)

4. **chat_conversations** - 채팅 대화
   - 사용자별 AI Agent 대화 이력
   - 분석 결과와 연결

5. **ai_agent_usage** - AI Agent 사용 이력
   - 각 AI Agent별 사용 통계
   - 토큰 사용량, 비용, 응답 시간
   - 성공/실패 여부

6. **site_statistics** - 사이트 통계
   - 일별 집계 통계
   - 사용자 수, 분석 수, AI Agent 사용량 등

7. **admin_logs** - 어드민 활동 로그
   - 어드민 사용자의 활동 기록
   - 사용자 관리, 분석 관리 등

8. **schema_migrations** - 마이그레이션 버전 관리
   - 적용된 마이그레이션 버전 추적

## 마이그레이션

마이그레이션은 `lib/migrations.ts`에서 관리되며, 애플리케이션 시작 시 자동으로 실행됩니다.

### 마이그레이션 버전

- v1: AI 점수 컬럼 추가 (chatgpt_score, perplexity_score, gemini_score, claude_score)
- v2: users 테이블에 updated_at 컬럼 추가
- v3: 복합 인덱스 추가 (성능 최적화)
- v4: users 테이블에 provider, name, image, role, is_active, last_login_at 컬럼 추가
- v5: auth_logs 테이블 생성
- v6: ai_agent_usage 테이블 생성
- v7: site_statistics 테이블 생성
- v8: admin_logs 테이블 생성
- v9: users 테이블 인덱스 추가

## 사용 방법

### SQL 스크립트로 새 데이터베이스 생성

```bash
sqlite3 data/gaeo.db < database/schema.sql
```

### 마이그레이션 상태 확인

마이그레이션은 애플리케이션 시작 시 자동으로 실행됩니다. 수동으로 확인하려면:

```typescript
import { getMigrationStatus } from '@/lib/migrations';

const status = getMigrationStatus();
console.log(status);
```

## 실제 서버 배포 시 주의사항

1. **데이터베이스 백업**: 배포 전 기존 데이터베이스를 백업하세요.
2. **마이그레이션 순서**: 마이그레이션은 순차적으로 실행되므로 순서를 변경하지 마세요.
3. **트랜잭션**: 모든 마이그레이션은 트랜잭션으로 보호됩니다.
4. **롤백**: 필요시 `down` 함수를 구현하여 롤백할 수 있습니다.

## 인덱스 최적화

성능 향상을 위해 다음 인덱스가 생성됩니다:

- 사용자별 분석 이력 조회 최적화
- URL 기반 중복 검사 최적화
- 인증 로그 조회 최적화
- AI Agent 사용 이력 조회 최적화

## 외래 키 제약 조건

모든 외래 키 제약 조건이 활성화되어 있어 데이터 무결성이 보장됩니다:

- `ON DELETE CASCADE`: 부모 레코드 삭제 시 자식 레코드도 자동 삭제
- `ON DELETE SET NULL`: 부모 레코드 삭제 시 자식 레코드의 외래 키를 NULL로 설정

