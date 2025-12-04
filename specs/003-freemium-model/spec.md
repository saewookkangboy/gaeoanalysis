# Freemium 모델 기능 명세서

## 📋 기본 정보

- **기능명**: Freemium 모델 (구독 플랜 및 사용량 관리)
- **목적**: Free, Pro, Business 플랜을 제공하고, 플랜별 사용량을 추적하여 제한을 관리하는 시스템
- **우선순위**: High
- **예상 소요 시간**: 이미 구현 완료 (일부 기능 추가 필요)
- **작성일**: 2025-12-04
- **작성자**: chunghyo, cursor ai(AI CODE IDE)

---

## 👤 사용자 스토리

### 주요 사용자 스토리
```
As a 서비스 사용자,
I want 플랜별 기능 제한과 사용량을 확인하고 싶다,
So that 내가 사용할 수 있는 기능과 한도를 파악하고 필요시 업그레이드할 수 있다.
```

### 추가 사용자 스토리
- **사용자 스토리 2**: Free 플랜에서 Pro 플랜으로 업그레이드하여 무제한 분석을 사용하고 싶다
- **사용자 스토리 3**: 월간 사용량이 한도에 도달했을 때 명확한 안내를 받고 싶다
- **사용자 스토리 4**: 구독을 취소하고 다음 결제 주기 종료 시 Free 플랜으로 자동 다운그레이드되기를 원한다
- **사용자 스토리 5**: 사용량 통계를 확인하여 내 사용 패턴을 파악하고 싶다

---

## 📝 기능 요구사항

### 기능적 요구사항 (Functional Requirements)

#### FR-1: 구독 플랜 관리
- **설명**: Free, Pro, Business 플랜 생성, 조회, 업데이트, 취소
- **우선순위**: High
- **수용 기준**:
  - [x] 구독 생성 (Free 플랜 자동 할당)
  - [x] 구독 조회
  - [x] 구독 업그레이드/다운그레이드
  - [x] 구독 취소 (다음 주기 종료 시)
  - [x] 구독 만료 시 자동 다운그레이드 (Free 플랜)

#### FR-2: 플랜별 제한 설정
- **설명**: 각 플랜별 기능 제한 정의
- **우선순위**: High
- **수용 기준**:
  - [x] Free 플랜: 월간 분석 10회, 챗봇 20회, AI 모델 2개, 이력 5개
  - [x] Pro 플랜: 무제한 분석/챗봇, AI 모델 4개, 이력 무제한, 내보내기 50회
  - [x] Business 플랜: Pro 기능 + 팀 협업, 공유 대시보드, 브랜드 리포트
  - [x] 제한 상수 정의 (`PLAN_LIMITS`)

#### FR-3: 사용량 추적
- **설명**: 사용자의 월간 사용량 추적 (분석, 챗봇, 내보내기)
- **우선순위**: High
- **수용 기준**:
  - [x] 사용량 증가 (`incrementUsage`)
  - [x] 사용량 조회 (`getUsage`, `getAllUsage`)
  - [x] 월간 기간 계산 (매월 1일 ~ 말일)
  - [x] 사용량 제한 확인 (`checkUsageLimit`)

#### FR-4: 사용량 제한 적용
- **설명**: API 엔드포인트에서 사용량 제한 확인 및 적용
- **우선순위**: High
- **수용 기준**:
  - [x] 분석 API에 사용량 제한 적용
  - [x] 챗봇 API에 사용량 제한 적용
  - [x] 제한 초과 시 429 에러 반환
  - [x] 명확한 에러 메시지 제공

#### FR-5: 구독 관리 API
- **설명**: 구독 생성, 조회, 업데이트, 취소 API
- **우선순위**: High
- **수용 기준**:
  - [x] GET `/api/subscription` - 구독 정보 조회
  - [x] POST `/api/subscription` - 구독 생성/업그레이드
  - [x] PATCH `/api/subscription` - 구독 변경
  - [x] DELETE `/api/subscription` - 구독 취소

#### FR-6: 사용량 조회 API
- **설명**: 사용자의 현재 사용량 조회 API
- **우선순위**: High
- **수용 기준**:
  - [x] GET `/api/usage` - 전체 사용량 조회
  - [x] GET `/api/usage?type={resourceType}` - 특정 리소스 사용량 조회
  - [x] 사용량, 제한, 남은 사용량 반환

#### FR-7: 분석 이력 제한
- **설명**: 플랜별 분석 이력 저장 개수 제한
- **우선순위**: Medium
- **수용 기준**:
  - [x] Free 플랜: 최근 5개만 저장
  - [x] Pro/Business 플랜: 무제한 저장
  - [x] 이력 저장 시 제한 확인

#### FR-8: AI 모델 제한
- **설명**: 플랜별 사용 가능한 AI 모델 수 제한
- **우선순위**: Medium
- **수용 기준**:
  - [x] Free 플랜: ChatGPT, Perplexity (2개)
  - [x] Pro/Business 플랜: 전체 모델 (4개)
  - [x] 분석 결과에서 사용 가능한 모델만 표시

#### FR-9: 구독 만료 처리
- **설명**: 구독 만료 시 자동으로 Free 플랜으로 다운그레이드
- **우선순위**: Medium
- **수용 기준**:
  - [x] 만료된 구독 감지
  - [x] 자동 다운그레이드 로직
  - [x] 만료 알림 (선택적)

### 비기능적 요구사항 (Non-functional Requirements)

#### NFR-1: 성능
- **요구사항**: 
  - 사용량 조회 < 100ms
  - 사용량 증가 < 50ms
  - 구독 조회 < 100ms
- **측정 기준**: 
  - 데이터베이스 쿼리 최적화
  - 인덱스 활용
- **현재 상태**: ✅ 구현 완료

#### NFR-2: 보안
- **요구사항**: 
  - 인증 필수 (모든 구독/사용량 API)
  - 사용자별 데이터 격리
  - 트랜잭션 보장
- **현재 상태**: ✅ 구현 완료

#### NFR-3: 확장성
- **요구사항**: 
  - 새로운 플랜 추가 용이
  - 새로운 리소스 타입 추가 용이
  - 결제 시스템 통합 가능
- **현재 상태**: ✅ 구현 완료

#### NFR-4: 사용성
- **요구사항**: 
  - 명확한 사용량 표시
  - 업그레이드 안내
  - 제한 도달 시 친화적 메시지
- **현재 상태**: ⚠️ 일부 구현 (프론트엔드 UI 추가 필요)

### 제약사항 (Constraints)
- 결제 시스템은 아직 통합되지 않음 (수동 구독 생성 필요)
- 월간 기간은 매월 1일 ~ 말일로 고정
- 사용량은 월간 단위로만 추적 (일간 추적 없음)

---

## 🔌 인터페이스 정의

### API 엔드포인트

#### 엔드포인트 1: 구독 정보 조회
- **메서드**: GET
- **경로**: `/api/subscription`
- **인증**: Required
- **응답 스키마**:
  ```typescript
  {
    subscription: {
      id: string; // UUID
      userId: string;
      planType: 'free' | 'pro' | 'business';
      status: 'active' | 'cancelled' | 'expired' | 'trial';
      currentPeriodStart: string; // ISO 8601
      currentPeriodEnd: string; // ISO 8601
      cancelAtPeriodEnd: boolean;
      createdAt: string; // ISO 8601
      updatedAt: string; // ISO 8601
    } | null;
    planType: 'free' | 'pro' | 'business';
    usage: {
      analysis: UsageInfo;
      chat: UsageInfo;
      export: UsageInfo;
    };
  }
  ```

#### 엔드포인트 2: 구독 생성/업그레이드
- **메서드**: POST
- **경로**: `/api/subscription`
- **인증**: Required
- **요청 스키마**:
  ```typescript
  {
    planType: 'free' | 'pro' | 'business';
    periodStart?: string; // ISO 8601 (선택적)
    periodEnd?: string; // ISO 8601 (선택적)
  }
  ```
- **응답 스키마**:
  ```typescript
  {
    subscriptionId: string; // UUID
    message: string;
  }
  ```

#### 엔드포인트 3: 구독 변경
- **메서드**: PATCH
- **경로**: `/api/subscription`
- **인증**: Required
- **요청 스키마**:
  ```typescript
  {
    planType: 'free' | 'pro' | 'business';
    cancelAtPeriodEnd?: boolean;
  }
  ```
- **응답 스키마**:
  ```typescript
  {
    subscriptionId: string; // UUID
    message: string;
  }
  ```

#### 엔드포인트 4: 구독 취소
- **메서드**: DELETE
- **경로**: `/api/subscription`
- **인증**: Required
- **응답 스키마**:
  ```typescript
  {
    message: string;
  }
  ```

#### 엔드포인트 5: 사용량 조회
- **메서드**: GET
- **경로**: `/api/usage` 또는 `/api/usage?type={resourceType}`
- **인증**: Required
- **응답 스키마**:
  ```typescript
  {
    usage?: UsageInfo; // type 파라미터가 있을 때
    usage?: { // type 파라미터가 없을 때
      analysis: UsageInfo;
      chat: UsageInfo;
      export: UsageInfo;
    };
    limit?: { // type 파라미터가 있을 때
      allowed: boolean;
      limit: number;
      used: number;
      remaining: number;
    };
  }
  
  interface UsageInfo {
    resourceType: 'analysis' | 'chat' | 'export';
    used: number;
    limit: number; // -1은 무제한
    remaining: number; // -1은 무제한
    periodStart: string; // ISO 8601
    periodEnd: string; // ISO 8601
  }
  ```

### 데이터베이스 스키마

#### subscriptions 테이블
```sql
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY, -- UUID
  user_id TEXT NOT NULL, -- users.id 참조
  plan_type TEXT NOT NULL CHECK(plan_type IN ('free', 'pro', 'business')),
  status TEXT NOT NULL CHECK(status IN ('active', 'cancelled', 'expired', 'trial')),
  current_period_start DATETIME NOT NULL,
  current_period_end DATETIME NOT NULL,
  cancel_at_period_end INTEGER DEFAULT 0, -- 0 또는 1
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 인덱스
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);
```

#### usage_tracking 테이블
```sql
CREATE TABLE usage_tracking (
  id TEXT PRIMARY KEY, -- UUID
  user_id TEXT NOT NULL, -- users.id 참조
  resource_type TEXT NOT NULL CHECK(resource_type IN ('analysis', 'chat', 'export')),
  count INTEGER NOT NULL DEFAULT 0,
  period_start DATETIME NOT NULL,
  period_end DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 인덱스
CREATE INDEX idx_usage_user_id ON usage_tracking(user_id);
CREATE INDEX idx_usage_resource_type ON usage_tracking(resource_type);
CREATE INDEX idx_usage_period ON usage_tracking(period_start, period_end);
CREATE INDEX idx_usage_user_period ON usage_tracking(user_id, period_start, period_end);
```

#### payments 테이블 (향후 사용)
```sql
CREATE TABLE payments (
  id TEXT PRIMARY KEY, -- UUID
  subscription_id TEXT NOT NULL, -- subscriptions.id 참조
  amount INTEGER NOT NULL, -- 원 단위
  currency TEXT NOT NULL DEFAULT 'KRW',
  status TEXT NOT NULL CHECK(status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT, -- 'card', 'bank_transfer' 등
  payment_provider TEXT, -- 'toss', 'iamport' 등
  transaction_id TEXT, -- 결제 제공업체 거래 ID
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
);

-- 인덱스
CREATE INDEX idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX idx_payments_status ON payments(status);
```

### UI/UX 요구사항

#### 사용량 표시 컴포넌트
- **컴포넌트명**: `UsageIndicator` (구현 필요)
- **위치**: `components/UsageIndicator.tsx`
- **기능**: 
  - 현재 사용량 표시 (분석, 챗봇)
  - 진행 바 표시
  - 남은 사용량 표시
- **프로퍼티**:
  ```typescript
  interface UsageIndicatorProps {
    usage: {
      analysis: UsageInfo;
      chat: UsageInfo;
    };
    planType: 'free' | 'pro' | 'business';
  }
  ```

#### 업그레이드 배너 컴포넌트
- **컴포넌트명**: `UpgradeBanner` (구현 필요)
- **위치**: `components/UpgradeBanner.tsx`
- **기능**: 
  - 사용량 제한 도달 시 업그레이드 안내
  - 플랜 비교 표시
  - 업그레이드 버튼
- **프로퍼티**:
  ```typescript
  interface UpgradeBannerProps {
    resourceType: 'analysis' | 'chat';
    currentPlan: 'free' | 'pro' | 'business';
    usage: UsageInfo;
  }
  ```

#### 가격 페이지
- **페이지명**: `Pricing`
- **위치**: `app/pricing/page.tsx` (구현 필요)
- **기능**: 
  - 플랜 비교 표
  - 가격 정보
  - 기능 비교
  - 구독 버튼

---

## ⚠️ 에러 처리

### 예상되는 에러 케이스

#### 에러 1: 인증되지 않은 요청
- **발생 조건**: 로그인하지 않은 사용자가 구독/사용량 API 호출
- **에러 코드**: `UNAUTHORIZED`
- **에러 메시지**: "인증이 필요합니다."
- **처리 방법**: 401 상태 코드 반환

#### 에러 2: 사용량 제한 초과
- **발생 조건**: 월간 사용량이 플랜 제한을 초과할 때
- **에러 코드**: `USAGE_LIMIT_EXCEEDED`
- **에러 메시지**: "월간 분석 한도에 도달했습니다. (10회/월)"
- **처리 방법**: 429 상태 코드 반환, 업그레이드 안내

#### 에러 3: 유효하지 않은 플랜 타입
- **발생 조건**: 존재하지 않는 플랜 타입으로 구독 생성/변경
- **에러 코드**: `VALIDATION_ERROR`
- **에러 메시지**: "유효하지 않은 플랜 타입입니다."
- **처리 방법**: 400 상태 코드 반환

#### 에러 4: 구독 조회 실패
- **발생 조건**: 데이터베이스 오류 등
- **에러 코드**: `INTERNAL_ERROR`
- **에러 메시지**: "구독 정보를 조회할 수 없습니다."
- **처리 방법**: 500 상태 코드 반환, 에러 로깅

#### 에러 5: 사용량 증가 실패
- **발생 조건**: 데이터베이스 오류, 트랜잭션 실패 등
- **에러 코드**: `INTERNAL_ERROR`
- **에러 메시지**: "사용량을 증가시킬 수 없습니다."
- **처리 방법**: 에러 로깅, 사용자는 계속 진행 가능하도록 처리

---

## 🧪 테스트 요구사항

### 단위 테스트
- [x] 구독 생성/조회 함수 테스트
- [x] 사용량 증가/조회 함수 테스트
- [x] 사용량 제한 확인 함수 테스트
- [x] 플랜 타입별 제한 상수 테스트

### 통합 테스트
- [x] 구독 API 엔드포인트 테스트
- [x] 사용량 API 엔드포인트 테스트
- [x] 데이터베이스 저장/조회 테스트
- [x] 사용량 제한 적용 테스트

### E2E 테스트
- [ ] 전체 구독 플로우 테스트 (생성 → 조회 → 업그레이드 → 취소)
- [ ] 사용량 추적 플로우 테스트 (증가 → 조회 → 제한 확인)
- [ ] 제한 초과 시 에러 처리 테스트

### 수동 테스트 체크리스트
- [x] Free 플랜 자동 할당 테스트
- [x] 구독 생성/조회 테스트
- [x] 구독 업그레이드 테스트
- [x] 구독 취소 테스트
- [x] 사용량 증가/조회 테스트
- [x] 사용량 제한 확인 테스트
- [x] 제한 초과 시 에러 처리 테스트
- [ ] 구독 만료 시 자동 다운그레이드 테스트

---

## 📚 참고 자료

### 관련 문서
- [프로젝트 README](../README.md)
- [프로젝트 아키텍처](../ARCHITECTURE.md)
- [Freemium 모델 요약](../FREEMIUM_SUMMARY.md)
- [Freemium 구현 가이드](../FREEMIUM_IMPLEMENTATION_GUIDE.md)
- [Freemium 모델 계획](../FREEMIUM_MODEL_PLAN.md)

### 외부 리소스
- [토스페이먼츠 문서](https://docs.tosspayments.com/) (결제 시스템 권장)
- [아임포트 문서](https://developers.iamport.kr/) (결제 시스템 대안)

### 기존 기능과의 연관성
- **콘텐츠 분석**: 분석 API에 사용량 제한 적용
- **AI Agent**: 챗봇 API에 사용량 제한 적용
- **분석 이력**: 플랜별 이력 저장 개수 제한
- **AI 모델별 인용 확률**: 플랜별 사용 가능한 모델 수 제한

---

## ✅ 명세서 검증 체크리스트

- [x] 모든 사용자 스토리 명세됨
- [x] 모든 기능 요구사항 정의됨
- [x] 모든 에러 케이스 정의됨
- [x] API 인터페이스 명확함
- [x] 데이터베이스 스키마 명확함
- [x] UI/UX 요구사항 명확함
- [x] 테스트 요구사항 정의됨
- [x] 기존 기능과의 호환성 확인됨

---

**명세서 버전**: 1.0  
**최종 업데이트**: 2025-12-04  
**상태**: 구현 완료 (프론트엔드 UI 일부 추가 필요)  
**다음 단계**: [Plan 작성](./plan.md) (선택사항 - 이미 구현 완료)

