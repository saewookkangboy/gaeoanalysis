# Freemium 모델 다음 단계 개발 프로세스

## 🧭 Spec-Kit 워크플로우 반영 (Freemium)

- Constitution: ✅ `memory/constitution.md` 원칙 준수 (품질/보안/성능) → 사용량 제한·결제 로직에 적용.
- Spec: ✅ `specs/003-freemium-model/spec.md` (기능 정의 완료).
- Plan: 🚧 이 문서 내용을 `specs/003-freemium-model/plan.md`로 정리/배포 필요 (`templates/plan-template.md` 활용).
- Research: ☐ `specs/003-freemium-model/research.md` 작성 (결제 사업자 비교, rate-limit/캐시 정책 최신 검토 포함).
- Validation: ☐ `specs/003-freemium-model/validation.md` 작성 (사용량 제한·결제·보안·성능 검증 시나리오 체크리스트).
- Tasks: ☐ `specs/003-freemium-model/tasks.md`에 1~4시간 단위 작업 분해 (아래 Phase 1~4를 Task로 분리).
- Implementation: ▶️ 아래 Phase 1~4를 Implementation 단계로 추적.

## 📊 현재 구현 상태 분석

### ✅ 완료된 작업

1. **데이터베이스 스키마**
   - `subscriptions` 테이블 (구독 정보)
   - `usage_tracking` 테이블 (사용량 추적)
   - `payments` 테이블 (결제 이력)
   - 마이그레이션 시스템 (version 11)

2. **백엔드 로직**
   - `lib/subscription-helpers.ts` - 구독 관리 함수
   - `lib/usage-helpers.ts` - 사용량 추적 함수
   - 플랜별 제한 상수 정의 (`PLAN_LIMITS`)

3. **API 엔드포인트**
   - `GET/POST/PATCH/DELETE /api/subscription` - 구독 관리
   - `GET /api/usage` - 사용량 조회

### ❌ 미완료 작업

1. **API 통합 (우선순위: 높음)**
   - `app/api/analyze/route.ts`에 사용량 제한 적용 필요
   - `app/api/chat/route.ts`에 사용량 제한 적용 필요

2. **프론트엔드 UI (우선순위: 높음)**
   - `components/UsageIndicator.tsx` - 사용량 표시 컴포넌트
   - `components/UpgradeBanner.tsx` - 업그레이드 유도 배너
   - `app/pricing/page.tsx` - 가격 페이지

3. **결제 시스템 (우선순위: 중간)**
   - 결제 제공업체 통합 (토스페이먼츠 권장)
   - 결제 플로우 구현
   - 웹훅 처리

---

## 🚀 다음 단계 개발 프로세스

### Phase 1: API 통합 (1-2일)

#### 1.1 Analyze API에 사용량 제한 적용

**작업 내용:**
- `app/api/analyze/route.ts`에 사용량 제한 체크 추가
- 캐시된 결과는 사용량에 포함하지 않음
- 제한 초과 시 429 에러 반환
- 분석 성공 시 사용량 증가

**구현 위치:**
```typescript
// app/api/analyze/route.ts
// 1. 캐시 확인 후 (캐시된 경우 사용량 증가하지 않음)
// 2. 사용자 세션 확인 후
// 3. 사용량 제한 체크 추가
// 4. 분석 성공 후 사용량 증가
```

**구현 예시:**
```typescript
import { checkUsageLimit, incrementUsage } from '@/lib/usage-helpers';

// 캐시 확인 후, 세션 확인 후
if (userId) {
  // 실제 사용자 ID 확인 (기존 코드 활용)
  let finalUserId = userId;
  const normalizedEmail = session?.user?.email ? session.user.email.toLowerCase().trim() : null;
  if (normalizedEmail) {
    const userByEmail = getUserByEmail(normalizedEmail);
    if (userByEmail) {
      finalUserId = userByEmail.id;
    }
  }
  
  // 사용량 제한 확인 (캐시된 결과가 아닌 경우만)
  const limitCheck = checkUsageLimit(finalUserId, 'analysis');
  if (!limitCheck.allowed) {
    return createErrorResponse(
      {
        code: 'USAGE_LIMIT_EXCEEDED',
        message: `월간 분석 한도에 도달했습니다. (${limitCheck.limit}회/월)`,
        remaining: limitCheck.remaining,
        limit: limitCheck.limit,
      },
      429
    );
  }
}

// 분석 성공 후 (캐시된 결과가 아닌 경우만)
if (userId && !cachedResult) {
  incrementUsage(finalUserId, 'analysis', 1);
}
```

#### 1.2 Chat API에 사용량 제한 적용

**작업 내용:**
- `app/api/chat/route.ts`에 사용량 제한 체크 추가
- 로그인 필수 (이미 구현됨)
- 제한 초과 시 429 에러 반환
- 챗봇 응답 성공 시 사용량 증가

**구현 예시:**
```typescript
import { checkUsageLimit, incrementUsage } from '@/lib/usage-helpers';

// 세션 확인 후
if (userId) {
  // 실제 사용자 ID 확인
  let finalUserId = userId;
  const normalizedEmail = session?.user?.email ? session.user.email.toLowerCase().trim() : null;
  if (normalizedEmail) {
    const userByEmail = getUserByEmail(normalizedEmail);
    if (userByEmail) {
      finalUserId = userByEmail.id;
    }
  }
  
  // 사용량 제한 확인
  const limitCheck = checkUsageLimit(finalUserId, 'chat');
  if (!limitCheck.allowed) {
    return createErrorResponse(
      {
        code: 'USAGE_LIMIT_EXCEEDED',
        message: `월간 챗봇 질문 한도에 도달했습니다. (${limitCheck.limit}회/월)`,
        remaining: limitCheck.remaining,
        limit: limitCheck.limit,
      },
      429
    );
  }
}

// 챗봇 응답 성공 후
if (userId) {
  incrementUsage(finalUserId, 'chat', 1);
}
```

**테스트 체크리스트:**
- [ ] Free 플랜 사용자가 10회 분석 후 제한 확인
- [ ] Free 플랜 사용자가 20회 챗봇 질문 후 제한 확인
- [ ] Pro 플랜 사용자는 무제한 사용 가능 확인
- [ ] 캐시된 분석 결과는 사용량 증가하지 않음 확인
- [ ] 제한 초과 시 적절한 에러 메시지 반환 확인

---

### Phase 2: 프론트엔드 UI 개발 (2-3일)

#### 2.1 UsageIndicator 컴포넌트 생성

**파일:** `components/UsageIndicator.tsx`

**기능:**
- 현재 사용량 표시 (분석, 챗봇)
- 진행 바 표시
- 남은 사용량 표시
- 무제한 플랜의 경우 적절한 표시

**구현 예시:**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface UsageData {
  analysis: { used: number; limit: number; remaining: number };
  chat: { used: number; limit: number; remaining: number };
}

export default function UsageIndicator() {
  const { data: session } = useSession();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }

    fetch('/api/usage')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.usage) {
          setUsage(data.data.usage);
        }
      })
      .catch(err => console.error('사용량 조회 오류:', err))
      .finally(() => setLoading(false));
  }, [session]);

  if (!session || loading || !usage) return null;

  return (
    <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">월간 사용량</h3>
      <div className="space-y-3">
        {/* 분석 사용량 */}
        <div>
          <div className="mb-1 flex justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>콘텐츠 분석</span>
            <span>
              {usage.analysis.used} / {usage.analysis.limit === -1 ? '∞' : usage.analysis.limit}
            </span>
          </div>
          {usage.analysis.limit !== -1 && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className={`h-full transition-all ${
                  usage.analysis.remaining === 0
                    ? 'bg-red-500'
                    : usage.analysis.used / usage.analysis.limit >= 0.8
                    ? 'bg-yellow-500'
                    : 'bg-sky-500'
                }`}
                style={{
                  width: `${Math.min(100, (usage.analysis.used / usage.analysis.limit) * 100)}%`,
                }}
              />
            </div>
          )}
        </div>
        
        {/* 챗봇 사용량 */}
        <div>
          <div className="mb-1 flex justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>AI 챗봇</span>
            <span>
              {usage.chat.used} / {usage.chat.limit === -1 ? '∞' : usage.chat.limit}
            </span>
          </div>
          {usage.chat.limit !== -1 && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className={`h-full transition-all ${
                  usage.chat.remaining === 0
                    ? 'bg-red-500'
                    : usage.chat.used / usage.chat.limit >= 0.8
                    ? 'bg-yellow-500'
                    : 'bg-indigo-500'
                }`}
                style={{
                  width: `${Math.min(100, (usage.chat.used / usage.chat.limit) * 100)}%`,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

#### 2.2 UpgradeBanner 컴포넌트 생성

**파일:** `components/UpgradeBanner.tsx`

**기능:**
- 사용량이 80% 이상일 때 경고 표시
- 사용량이 100% 도달 시 강한 업그레이드 유도
- 업그레이드 버튼 제공

**구현 예시:**
```typescript
'use client';

import Link from 'next/link';

interface UpgradeBannerProps {
  resourceType: 'analysis' | 'chat';
  used: number;
  limit: number;
}

export default function UpgradeBanner({ resourceType, used, limit }: UpgradeBannerProps) {
  const percentage = (used / limit) * 100;
  const isNearLimit = percentage >= 80;
  const isExceeded = percentage >= 100;

  if (!isNearLimit || limit === -1) return null;

  const resourceName = resourceType === 'analysis' ? '콘텐츠 분석' : 'AI 챗봇';

  return (
    <div
      className={`mb-4 rounded-lg border-2 p-4 ${
        isExceeded
          ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
          : 'border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {isExceeded ? `${resourceName} 한도 도달` : `${resourceName} 사용량이 거의 소진되었습니다`}
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {resourceName} 사용량: {used} / {limit}회
          </p>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Pro 플랜으로 업그레이드하여 무제한으로 사용하세요!
          </p>
        </div>
        <Link
          href="/pricing"
          className="ml-4 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg"
        >
          업그레이드
        </Link>
      </div>
    </div>
  );
}
```

#### 2.3 Pricing 페이지 생성

**파일:** `app/pricing/page.tsx`

**기능:**
- 플랜 비교 표
- 가격 정보 표시
- 기능 비교
- 구독 버튼 (결제 시스템 통합 전까지 비활성화 가능)

**구현 예시:**
```typescript
// app/pricing/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';

const plans = [
  {
    name: 'Free',
    price: 0,
    description: '개인 사용자를 위한 기본 플랜',
    features: [
      '월간 분석 10회',
      '월간 챗봇 20회',
      'AI 모델 2개 (ChatGPT, Perplexity)',
      '최근 분석 이력 5개',
    ],
    buttonText: '현재 플랜',
    buttonDisabled: true,
  },
  {
    name: 'Pro',
    price: 19000,
    description: '전문가를 위한 무제한 플랜',
    features: [
      '월간 분석 무제한',
      '월간 챗봇 무제한',
      'AI 모델 4개 (전체)',
      '분석 이력 무제한',
      'CSV/PDF 내보내기',
      'API 액세스',
      '웹훅 알림',
    ],
    buttonText: 'Pro로 업그레이드',
    buttonDisabled: false,
    popular: true,
  },
  {
    name: 'Business',
    price: 99000,
    description: '팀 협업을 위한 플랜',
    features: [
      'Pro의 모든 기능',
      '팀 협업 (최대 10명)',
      '공유 대시보드',
      '브랜드 리포트',
      '전담 지원',
    ],
    buttonText: 'Business로 업그레이드',
    buttonDisabled: false,
  },
];

export default function PricingPage() {
  const { data: session } = useSession();

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          플랜 선택
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          당신에게 맞는 플랜을 선택하세요
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-lg border-2 p-8 ${
              plan.popular
                ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20'
                : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
            }`}
          >
            {plan.popular && (
              <div className="text-center mb-4">
                <span className="inline-block px-3 py-1 text-xs font-semibold text-sky-600 bg-sky-100 dark:bg-sky-900 dark:text-sky-300 rounded-full">
                  인기
                </span>
              </div>
            )}

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {plan.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{plan.description}</p>

            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">
                {plan.price === 0 ? '무료' : `₩${plan.price.toLocaleString()}`}
              </span>
              {plan.price > 0 && (
                <span className="text-gray-600 dark:text-gray-400">/월</span>
              )}
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              disabled={plan.buttonDisabled}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                plan.buttonDisabled
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                  : plan.popular
                  ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {plan.buttonText}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>결제 시스템은 곧 통합될 예정입니다.</p>
        {session && (
          <p className="mt-2">
            현재 플랜 확인: <Link href="/dashboard" className="text-sky-600 hover:underline">대시보드</Link>
          </p>
        )}
      </div>
    </div>
  );
}
```

#### 2.4 메인 페이지에 컴포넌트 통합

**작업 내용:**
- `app/page.tsx`에 `UsageIndicator` 추가
- 에러 처리에 `UpgradeBanner` 통합
- 사용량 제한 에러 시 업그레이드 유도

**구현 예시:**
```typescript
// app/page.tsx에 추가
import UsageIndicator from '@/components/UsageIndicator';
import UpgradeBanner from '@/components/UpgradeBanner';

// 컴포넌트 내부에서
const handleAnalyze = async (url: string) => {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();

    if (!data.success) {
      if (data.error?.code === 'USAGE_LIMIT_EXCEEDED') {
        setError({
          message: data.error.message,
          code: 'USAGE_LIMIT_EXCEEDED',
          showUpgrade: true,
        });
        return;
      }
      // 다른 에러 처리
    }

    // 성공 처리
  } catch (error) {
    // 에러 처리
  }
};
```

**테스트 체크리스트:**
- [ ] 로그인 시 사용량 표시 확인
- [ ] 사용량 80% 이상 시 경고 배너 표시
- [ ] 사용량 100% 도달 시 에러 및 업그레이드 배너 표시
- [ ] 가격 페이지 접근 확인
- [ ] 다크 모드에서 정상 작동 확인

---

### Phase 3: 결제 시스템 통합 (3-5일)

#### 3.1 결제 제공업체 선택 및 설정

**권장:** 토스페이먼츠 (국내 최고 시장 점유율)

**작업 내용:**
1. 토스페이먼츠 개발자 계정 생성
2. API 키 설정 (환경 변수)
3. SDK 설치: `npm install @tosspayments/payment-sdk`

#### 3.2 결제 플로우 구현

**작업 내용:**
1. 결제 요청 API 생성 (`app/api/payment/route.ts`)
2. 결제 성공 페이지 생성 (`app/payment/success/page.tsx`)
3. 결제 실패 페이지 생성 (`app/payment/fail/page.tsx`)
4. 웹훅 핸들러 구현 (`app/api/webhook/toss/route.ts`)

#### 3.3 구독 활성화 로직

**작업 내용:**
- 웹훅 수신 시 구독 활성화
- 결제 이력 저장
- 구독 만료 알림 설정

---

### Phase 4: 테스트 및 최적화 (2-3일)

#### 4.1 통합 테스트

**테스트 시나리오:**
1. Free 플랜 사용자가 10회 분석 → 제한 확인
2. Free 플랜 사용자가 20회 챗봇 → 제한 확인
3. Pro 플랜 업그레이드 → 무제한 사용 확인
4. 구독 취소 → 기간 종료 시 다운그레이드 확인

#### 4.2 성능 최적화

**작업 내용:**
- 사용량 조회 쿼리 최적화
- 인덱스 활용 확인
- 캐싱 전략 검토

#### 4.3 보안 검토

**작업 내용:**
- 사용량 조작 방지 검증
- 결제 정보 보안 확인
- API 레벨 제한 검증

---

## 📋 우선순위 및 일정

### 즉시 시작 가능한 작업 (1주일 내 완료 권장)

1. **Phase 1: API 통합** (1-2일) - **최우선**
   - Analyze API 사용량 제한 적용
   - Chat API 사용량 제한 적용
   - 테스트

2. **Phase 2: 프론트엔드 UI** (2-3일) - **높음**
   - UsageIndicator 컴포넌트
   - UpgradeBanner 컴포넌트
   - Pricing 페이지
   - 메인 페이지 통합

3. **Phase 3: 결제 시스템** (3-5일) - **중간**
   - 결제 제공업체 선택 및 설정
   - 결제 플로우 구현
   - 웹훅 처리

4. **Phase 4: 테스트 및 최적화** (2-3일) - **필수**
   - 통합 테스트
   - 성능 최적화
   - 보안 검토

### 권장 개발 순서

```
Week 1: Phase 1 (API 통합) + Phase 2 (프론트엔드 기본 UI)
Week 2: Phase 2 (프론트엔드 완성) + Phase 3 (결제 시스템 기본)
Week 3: Phase 3 (결제 시스템 완성) + Phase 4 (테스트 및 최적화)
```

---

## ⚠️ 주의사항

1. **캐시된 결과 처리**
   - 같은 URL 재분석 시 캐시된 결과를 반환하는 경우 사용량을 증가시키지 않아야 함
   - 이미 `cache.get()`으로 체크하므로 조건부 사용량 증가 적용

2. **기존 사용자 영향 최소화**
   - 모든 기존 사용자는 자동으로 Free 플랜 할당됨 (마이그레이션에서 처리)
   - 기존 데이터는 보존됨

3. **점진적 롤아웃**
   - 먼저 사용량 표시만 추가하여 사용자에게 알림
   - 제한 도달 시에만 실제 제한 적용
   - 사용자 피드백 수집 및 조정

4. **에러 처리**
   - 사용량 제한 초과 시 명확한 에러 메시지 제공
   - 업그레이드 링크 제공
   - 사용자 친화적인 UI

---

## 🔗 관련 문서

- [Freemium 모델 계획](./FREEMIUM_MODEL_PLAN.md)
- [Freemium 구현 가이드](./FREEMIUM_IMPLEMENTATION_GUIDE.md)
- [Freemium 요약](./FREEMIUM_SUMMARY.md)
- [Freemium 기능 명세서](./specs/003-freemium-model/spec.md)

---

**작성일:** 2025-12-15  
**상태:** 개발 준비 완료  
**다음 단계:** Phase 1 (API 통합) 시작
