# Freemium 모델 구현 가이드

이 문서는 실제 코드에 사용량 제한을 적용하는 방법을 설명합니다.

## 1. Analyze API에 사용량 제한 적용

`app/api/analyze/route.ts` 파일을 수정하여 사용량 제한을 추가합니다:

```typescript
import { checkUsageLimit, incrementUsage } from '@/lib/usage-helpers';
import { getUserByEmail } from '@/lib/db-helpers';

async function handleAnalyze(request: NextRequest) {
  // ... 기존 코드 ...
  
  // 세션 확인
  const session = await auth();
  const userId = session?.user?.id;
  
  // 로그인된 사용자인 경우 사용량 제한 확인
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
  
  // 분석 수행
  const result = await analyzeContent(sanitizedUrl);
  
  // 로그인된 사용자인 경우 사용량 증가 및 결과 저장
  if (userId) {
    // 사용량 증가
    incrementUsage(finalUserId, 'analysis', 1);
    
    // 분석 결과 저장 (기존 코드)
    // ...
  }
  
  // ... 나머지 코드 ...
}
```

## 2. Chat API에 사용량 제한 적용

`app/api/chat/route.ts` 파일을 수정합니다:

```typescript
import { checkUsageLimit, incrementUsage } from '@/lib/usage-helpers';

async function handleChat(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  
  if (!userId) {
    return createErrorResponse('로그인이 필요합니다.', 401);
  }
  
  // 사용량 제한 확인
  const limitCheck = checkUsageLimit(userId, 'chat');
  
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
  
  // 챗봇 응답 생성
  // ...
  
  // 사용량 증가
  incrementUsage(userId, 'chat', 1);
  
  // ...
}
```

## 3. 프론트엔드 컴포넌트

### UsageIndicator 컴포넌트

```typescript
// components/UsageIndicator.tsx
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
        if (data.success) {
          setUsage(data.data.usage);
        }
      })
      .catch(err => console.error('사용량 조회 오류:', err))
      .finally(() => setLoading(false));
  }, [session]);

  if (!session || loading || !usage) return null;

  return (
    <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">사용량</h3>
      <div className="space-y-2">
        <div>
          <div className="mb-1 flex justify-between text-xs text-gray-600">
            <span>분석</span>
            <span>
              {usage.analysis.used} / {usage.analysis.limit === -1 ? '∞' : usage.analysis.limit}
            </span>
          </div>
          {usage.analysis.limit !== -1 && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-sky-500 transition-all"
                style={{
                  width: `${Math.min(100, (usage.analysis.used / usage.analysis.limit) * 100)}%`,
                }}
              />
            </div>
          )}
        </div>
        <div>
          <div className="mb-1 flex justify-between text-xs text-gray-600">
            <span>챗봇</span>
            <span>
              {usage.chat.used} / {usage.chat.limit === -1 ? '∞' : usage.chat.limit}
            </span>
          </div>
          {usage.chat.limit !== -1 && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-indigo-500 transition-all"
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

### UpgradeBanner 컴포넌트

```typescript
// components/UpgradeBanner.tsx
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

  if (!isNearLimit) return null;

  return (
    <div className={`mb-4 rounded-lg border-2 p-4 ${
      isExceeded 
        ? 'border-red-300 bg-red-50' 
        : 'border-yellow-300 bg-yellow-50'
    }`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">
            {isExceeded ? '사용량 한도 도달' : '사용량이 거의 소진되었습니다'}
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            {resourceType === 'analysis' ? '분석' : '챗봇'} 사용량: {used} / {limit}회
          </p>
          <p className="mt-2 text-sm text-gray-700">
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

## 4. 에러 처리

프론트엔드에서 사용량 제한 에러를 처리합니다:

```typescript
// app/page.tsx 또는 분석 컴포넌트
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
        // 사용량 제한 도달 시 업그레이드 유도
        setError({
          message: data.error.message,
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

## 5. 마이그레이션 실행

데이터베이스 마이그레이션을 실행합니다:

```bash
npm run db:migrate
```

또는 직접 실행:

```typescript
// scripts/run-migration.ts
import { runMigrations } from '../lib/migrations';

runMigrations();
```

## 6. 테스트

### 사용량 제한 테스트

```typescript
// 테스트용 사용량 초기화
import { resetUsage, incrementUsage } from '@/lib/usage-helpers';

// 사용량 초기화
resetUsage(userId, 'analysis');

// 제한까지 사용량 증가
for (let i = 0; i < 10; i++) {
  incrementUsage(userId, 'analysis', 1);
}

// 제한 초과 시도
const limit = checkUsageLimit(userId, 'analysis');
console.log(limit); // { allowed: false, remaining: 0, limit: 10 }
```

## 7. 주의사항

1. **캐시된 결과는 사용량에 포함하지 않음**
   - 같은 URL을 다시 분석할 때는 사용량을 증가시키지 않아야 합니다.

2. **비로그인 사용자 처리**
   - 비로그인 사용자는 IP 기반 rate limiting만 적용하고, 사용량 추적은 하지 않습니다.

3. **기존 사용자 마이그레이션**
   - 마이그레이션 실행 시 모든 기존 사용자에게 Free 플랜이 자동으로 할당됩니다.

4. **사용량 집계**
   - 월간 사용량은 매월 1일 00:00에 자동으로 초기화됩니다.
   - `getCurrentPeriod()` 함수가 이를 처리합니다.

## 8. 다음 단계

1. 결제 시스템 통합 (토스페이먼츠 또는 Stripe)
2. 웹훅 처리 (결제 완료 시 구독 활성화)
3. 이메일 알림 (사용량 경고, 구독 만료 등)
4. 관리자 대시보드 (구독 관리, 통계 등)

