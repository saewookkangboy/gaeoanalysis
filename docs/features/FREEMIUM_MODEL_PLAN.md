# Freemium 모델 전환 계획

## 📊 현재 서비스 분석

### 주요 기능
1. **콘텐츠 분석**: AEO, GEO, SEO 점수 분석
2. **AI 모델별 인용 확률**: ChatGPT, Perplexity, Gemini, Claude 인용 확률 시뮬레이션
3. **AI Agent 챗봇**: Gemini API 기반 개선 가이드 제공
4. **분석 이력**: 사용자별 분석 기록 저장 및 조회

### 현재 기술 스택
- **Frontend**: Next.js 16, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite (better-sqlite3)
- **인증**: NextAuth.js (Google, GitHub OAuth)
- **AI**: Google Gemini API 2.5 Flash
- **Rate Limiting**: 기본적인 IP/사용자별 제한 (메모리 기반)

---

## 💡 Freemium 모델 아이디어

### 1. 플랜 구조

#### 🆓 Free 플랜
- **월간 분석 횟수**: 10회
- **AI 챗봇 질문**: 20회/월
- **분석 이력 저장**: 최근 5개
- **기본 점수 분석**: AEO, GEO, SEO
- **AI 인용 확률**: 2개 모델 (ChatGPT, Perplexity)
- **기본 개선 가이드**: 텍스트만

#### 💎 Pro 플랜 (월 19,000원)
- **월간 분석 횟수**: 무제한
- **AI 챗봇 질문**: 무제한
- **분석 이력 저장**: 무제한
- **전체 점수 분석**: AEO, GEO, SEO
- **AI 인용 확률**: 4개 모델 (ChatGPT, Perplexity, Gemini, Claude)
- **고급 개선 가이드**: 마크다운, 코드 하이라이팅, 상세 권장사항
- **우선순위 지원**: 빠른 응답 시간
- **CSV/PDF 내보내기**: 분석 결과 다운로드
- **API 액세스**: REST API 사용 가능
- **웹훅 알림**: 분석 완료 시 알림

#### 🏢 Business 플랜 (월 99,000원)
- Pro 플랜의 모든 기능
- **팀 협업**: 최대 10명 멤버
- **공유 대시보드**: 팀 분석 결과 통합
- **브랜드 리포트**: 로고, 커스텀 리포트
- **전담 지원**: 우선 고객 지원
- **SLA 보장**: 99.9% 가동 시간

### 2. 수익화 전략

#### 단계별 접근
1. **Phase 1 (MVP)**: Free + Pro 플랜만 제공
2. **Phase 2**: Business 플랜 추가
3. **Phase 3**: Enterprise 플랜 (맞춤형 가격)

#### 가격 전략
- **Free**: 영구 무료 (사용자 확보)
- **Pro**: 월 19,000원 (연간 결제 시 15% 할인)
- **Business**: 월 99,000원 (연간 결제 시 20% 할인)

#### 전환 전략
- **사용량 제한 도달 시**: 자연스러운 업그레이드 유도
- **프리미엄 기능 미리보기**: Free 사용자에게 일부 기능 체험 제공
- **사용 패턴 분석**: 활발한 사용자에게 타겟팅된 프로모션

---

## 🏗️ 기술 구현 계획

### 1. 데이터베이스 스키마 확장

#### 필요한 테이블

```sql
-- 사용자 구독 정보
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK(plan_type IN ('free', 'pro', 'business')),
  status TEXT NOT NULL CHECK(status IN ('active', 'cancelled', 'expired', 'trial')),
  current_period_start DATETIME NOT NULL,
  current_period_end DATETIME NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 사용량 추적
CREATE TABLE IF NOT EXISTS usage_tracking (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  resource_type TEXT NOT NULL CHECK(resource_type IN ('analysis', 'chat', 'export')),
  count INTEGER DEFAULT 1,
  period_start DATETIME NOT NULL,
  period_end DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 결제 이력
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  subscription_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'KRW',
  status TEXT NOT NULL CHECK(status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  payment_provider TEXT,
  transaction_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_period ON usage_tracking(user_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
```

#### users 테이블 확장

```sql
-- users 테이블에 컬럼 추가
ALTER TABLE users ADD COLUMN subscription_id TEXT;
ALTER TABLE users ADD COLUMN trial_ends_at DATETIME;
ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT 0;
```

### 2. Backend API 구현

#### 필요한 API 엔드포인트

```typescript
// app/api/subscription/route.ts
// - GET: 현재 구독 정보 조회
// - POST: 구독 생성/업그레이드
// - PATCH: 구독 변경/취소
// - DELETE: 구독 취소

// app/api/usage/route.ts
// - GET: 현재 사용량 조회
// - POST: 사용량 증가 (내부용)

// app/api/payment/route.ts
// - POST: 결제 요청 생성
// - GET: 결제 상태 확인
// - POST: 웹훅 처리 (결제 완료 알림)

// app/api/plans/route.ts
// - GET: 플랜 목록 및 가격 정보
```

#### 사용량 제한 미들웨어

```typescript
// lib/usage-limiter.ts
export async function checkUsageLimit(
  userId: string,
  resourceType: 'analysis' | 'chat' | 'export'
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  // 1. 사용자 구독 정보 조회
  // 2. 플랜별 제한 확인
  // 3. 현재 사용량 조회
  // 4. 제한 초과 여부 확인
}
```

### 3. Frontend 구현

#### 필요한 컴포넌트

```typescript
// components/SubscriptionBanner.tsx
// - 사용량 제한 도달 시 업그레이드 배너

// components/UsageIndicator.tsx
// - 현재 사용량 표시 (예: "5/10 분석 사용")

// components/PlanSelector.tsx
// - 플랜 선택 및 결제 페이지

// components/UpgradeModal.tsx
// - 업그레이드 유도 모달

// app/pricing/page.tsx
// - 가격 페이지

// app/dashboard/page.tsx
// - 사용량 대시보드
```

#### 기능 제한 로직

```typescript
// lib/feature-flags.ts
export function canUseFeature(
  user: User,
  feature: 'unlimited_analysis' | 'all_ai_models' | 'export' | 'api'
): boolean {
  // 구독 정보 기반 기능 사용 가능 여부 확인
}
```

### 4. 결제 시스템 통합

#### 추천 결제 제공업체
1. **토스페이먼츠** (국내 최고 시장 점유율)
2. **아임포트** (간편 통합)
3. **Stripe** (해외 결제 지원)

#### 구현 단계
1. 결제 SDK 통합
2. 웹훅 핸들러 구현
3. 결제 상태 동기화
4. 환불 처리 로직

---

## 📋 구현 우선순위

### Phase 1: 기본 인프라 (2주)
- [ ] DB 스키마 확장 (subscriptions, usage_tracking, payments)
- [ ] 사용량 추적 시스템 구현
- [ ] 플랜별 제한 로직 구현
- [ ] 사용량 제한 미들웨어 구현

### Phase 2: Frontend 기본 UI (1주)
- [ ] 사용량 표시 컴포넌트
- [ ] 업그레이드 배너/모달
- [ ] 가격 페이지
- [ ] 기능 제한 UI

### Phase 3: 결제 시스템 (2주)
- [ ] 결제 제공업체 선택 및 통합
- [ ] 결제 플로우 구현
- [ ] 웹훅 처리
- [ ] 구독 관리 API

### Phase 4: 고급 기능 (1주)
- [ ] CSV/PDF 내보내기
- [ ] API 액세스
- [ ] 웹훅 알림
- [ ] 대시보드

### Phase 5: 테스트 및 최적화 (1주)
- [ ] 통합 테스트
- [ ] 성능 최적화
- [ ] 보안 검토
- [ ] 문서화

---

## 🔍 현재 준비 상황 분석

### ✅ 이미 준비된 것들

1. **인증 시스템**
   - NextAuth.js로 사용자 인증 완료
   - 사용자 ID 기반 데이터 분리 가능
   - ✅ **준비 완료**

2. **데이터베이스 구조**
   - SQLite 기반 안정적인 구조
   - 트랜잭션 지원
   - 마이그레이션 시스템 존재
   - ⚠️ **스키마 확장 필요**

3. **Rate Limiting**
   - 기본적인 rate limiter 구현됨
   - IP/사용자별 제한 가능
   - ⚠️ **플랜별 제한으로 확장 필요**

4. **사용자별 데이터 분리**
   - `user_id` 기반 분석 이력 저장
   - 사용자별 조회 가능
   - ✅ **준비 완료**

### ❌ 아직 준비되지 않은 것들

1. **구독 관리 시스템**
   - 구독 정보 저장 테이블 없음
   - 구독 상태 관리 로직 없음
   - ❌ **구현 필요**

2. **사용량 추적 시스템**
   - 사용량 집계 테이블 없음
   - 월간/일간 사용량 추적 없음
   - ❌ **구현 필요**

3. **결제 시스템**
   - 결제 통합 없음
   - 웹훅 처리 없음
   - ❌ **구현 필요**

4. **플랜별 기능 제한**
   - 기능 사용 가능 여부 체크 로직 없음
   - UI에서 기능 제한 표시 없음
   - ❌ **구현 필요**

5. **프론트엔드 UI**
   - 가격 페이지 없음
   - 사용량 표시 없음
   - 업그레이드 유도 UI 없음
   - ❌ **구현 필요**

---

## 🎯 권장 사항

### 즉시 시작 가능한 작업

1. **DB 스키마 확장** (1일)
   - subscriptions, usage_tracking, payments 테이블 생성
   - 마이그레이션 스크립트 작성

2. **사용량 추적 로직** (2일)
   - 분석/챗봇 사용 시 사용량 증가
   - 월간 사용량 집계 함수

3. **기본 제한 로직** (2일)
   - 플랜별 제한 상수 정의
   - 사용량 체크 함수 구현

4. **프론트엔드 기본 UI** (3일)
   - 사용량 표시
   - 업그레이드 배너

### 단계별 롤아웃 전략

1. **Week 1-2**: 백엔드 인프라 구축
2. **Week 3**: 프론트엔드 기본 UI
3. **Week 4**: 결제 시스템 통합
4. **Week 5**: 테스트 및 버그 수정
5. **Week 6**: 베타 테스트
6. **Week 7**: 정식 출시

### 리스크 관리

1. **기존 사용자 영향 최소화**
   - 모든 기존 사용자를 Free 플랜으로 자동 할당
   - 기존 데이터 보존

2. **점진적 기능 제한**
   - 먼저 사용량 표시만 추가
   - 제한 도달 시에만 제한 적용

3. **롤백 계획**
   - 기능 플래그로 쉽게 비활성화 가능하도록 구현

---

## 📊 예상 수익 모델

### 가정
- 월간 활성 사용자: 1,000명
- Free → Pro 전환율: 5% (50명)
- Pro 플랜 가격: 월 19,000원

### 예상 월간 수익
- 50명 × 19,000원 = **950,000원/월**
- 연간 수익: **11,400,000원**

### 성장 시나리오
- 6개월 후: 3,000명 MAU → 150명 Pro → **2,850,000원/월**
- 12개월 후: 10,000명 MAU → 500명 Pro → **9,500,000원/월**

---

## 🔐 보안 고려사항

1. **결제 정보 보안**
   - PCI DSS 준수
   - 결제 정보는 결제 제공업체에만 저장

2. **사용량 조작 방지**
   - 서버 사이드 검증 필수
   - 클라이언트 사이드 제한은 UX용일 뿐

3. **구독 우회 방지**
   - 모든 제한은 백엔드에서 검증
   - API 레벨에서 차단

---

## 📝 다음 단계

1. **결제 제공업체 선택** (토스페이먼츠 권장)
2. **DB 마이그레이션 스크립트 작성**
3. **사용량 추적 시스템 구현**
4. **기본 UI 컴포넌트 개발**
5. **결제 플로우 통합**

---

## 💬 참고 자료

- [토스페이먼츠 개발자 문서](https://developers.tosspayments.com/)
- [Stripe Billing 문서](https://stripe.com/docs/billing)
- [Freemium 모델 베스트 프랙티스](https://www.priceintelligently.com/blog/freemium-pricing-strategy)

