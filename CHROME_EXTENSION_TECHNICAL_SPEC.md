# Chrome Extension 기술 구현 가이드

## 1. 프로젝트 초기 설정

### 1.1 프로젝트 구조 생성

```bash
mkdir gaeo-extension
cd gaeo-extension
npm init -y
npm install -D typescript @types/chrome vite @vitejs/plugin-react react react-dom
npm install tailwindcss postcss autoprefixer
```

### 1.2 manifest.json

```json
{
  "manifest_version": 3,
  "name": "GAEO Analysis",
  "version": "1.0.0",
  "description": "AI 검색 시대를 위한 콘텐츠 최적화 분석 도구",
  "permissions": [
    "tabs",
    "cookies",
    "storage"
  ],
  "host_permissions": [
    "https://gaeoanalysis.vercel.app/*"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "background": {
    "service_worker": "background.js"
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### 1.3 TypeScript 설정

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "jsx": "react",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "types": ["chrome"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

---

## 2. 핵심 기능 구현

### 2.1 현재 탭 URL 가져오기

```typescript
// src/utils/tabs.ts
export async function getCurrentTabUrl(): Promise<string | null> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab?.url) {
      return null;
    }
    
    // 특수 URL 필터링
    const url = new URL(tab.url);
    const protocol = url.protocol;
    
    if (protocol === 'chrome:' || protocol === 'chrome-extension:' || protocol === 'about:') {
      throw new Error('이 페이지는 분석할 수 없습니다.');
    }
    
    if (protocol === 'file:') {
      throw new Error('로컬 파일은 분석할 수 없습니다.');
    }
    
    return tab.url;
  } catch (error) {
    console.error('URL 가져오기 실패:', error);
    throw error;
  }
}
```

### 2.2 인증 상태 확인

```typescript
// src/utils/auth.ts
const SERVICE_DOMAIN = 'gaeoanalysis.vercel.app';
const SESSION_COOKIE_NAME = 'authjs.session-token';

export interface AuthStatus {
  authenticated: boolean;
  userId?: string;
  email?: string;
}

export async function checkAuthStatus(): Promise<AuthStatus> {
  try {
    const cookies = await chrome.cookies.getAll({
      domain: `.${SERVICE_DOMAIN}`,
      name: SESSION_COOKIE_NAME
    });
    
    if (cookies.length === 0 || !cookies[0].value) {
      return { authenticated: false };
    }
    
    // 세션 쿠키가 있으면 API로 사용자 정보 확인
    const response = await fetch(`https://${SERVICE_DOMAIN}/api/auth/status`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Cookie': `${SESSION_COOKIE_NAME}=${cookies[0].value}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        authenticated: true,
        userId: data.user?.id,
        email: data.user?.email
      };
    }
    
    return { authenticated: false };
  } catch (error) {
    console.error('인증 상태 확인 실패:', error);
    return { authenticated: false };
  }
}

export function redirectToLogin(currentUrl: string): void {
  const loginUrl = `https://${SERVICE_DOMAIN}/login?returnTo=extension&url=${encodeURIComponent(currentUrl)}`;
  chrome.tabs.create({ url: loginUrl });
}
```

### 2.3 분석 API 호출

```typescript
// src/utils/api.ts
import { checkAuthStatus } from './auth';

const API_BASE_URL = 'https://gaeoanalysis.vercel.app';
const SESSION_COOKIE_NAME = 'authjs.session-token';

export interface AnalysisResult {
  id: string;
  aeoScore: number;
  geoScore: number;
  seoScore: number;
  overallScore: number;
  insights: Insight[];
  aioAnalysis?: AIOAnalysis;
  createdAt: string;
}

export interface Insight {
  severity: 'High' | 'Medium' | 'Low';
  category: string;
  message: string;
}

export interface AIOAnalysis {
  scores: {
    chatgpt: number;
    perplexity: number;
    gemini: number;
    claude: number;
  };
}

async function getSessionCookie(): Promise<string | null> {
  const cookies = await chrome.cookies.getAll({
    domain: '.gaeoanalysis.vercel.app',
    name: SESSION_COOKIE_NAME
  });
  
  if (cookies.length === 0) {
    return null;
  }
  
  return `${SESSION_COOKIE_NAME}=${cookies[0].value}`;
}

export async function analyzeUrl(url: string): Promise<AnalysisResult> {
  // 인증 상태 확인
  const authStatus = await checkAuthStatus();
  if (!authStatus.authenticated) {
    throw new Error('로그인이 필요합니다.');
  }
  
  // 세션 쿠키 가져오기
  const cookie = await getSessionCookie();
  if (!cookie) {
    throw new Error('세션 쿠키를 가져올 수 없습니다.');
  }
  
  // 분석 요청
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie
    },
    body: JSON.stringify({ url })
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '알 수 없는 오류가 발생했습니다.' }));
    
    if (response.status === 401) {
      throw new Error('로그인이 필요합니다.');
    }
    
    if (response.status === 429) {
      throw new Error('요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
    }
    
    throw new Error(error.error?.message || error.error || '분석 중 오류가 발생했습니다.');
  }
  
  return response.json();
}
```

### 2.4 로컬 스토리지 관리

```typescript
// src/utils/storage.ts
export interface AnalysisHistoryItem {
  id: string;
  url: string;
  overallScore: number;
  createdAt: string;
}

const STORAGE_KEYS = {
  ANALYSIS_HISTORY: 'analysisHistory',
  SETTINGS: 'settings'
} as const;

export async function saveAnalysisHistory(analysis: AnalysisResult, url: string): Promise<void> {
  const item: AnalysisHistoryItem = {
    id: analysis.id,
    url,
    overallScore: analysis.overallScore,
    createdAt: analysis.createdAt
  };
  
  const result = await chrome.storage.local.get(STORAGE_KEYS.ANALYSIS_HISTORY);
  const history: AnalysisHistoryItem[] = result[STORAGE_KEYS.ANALYSIS_HISTORY] || [];
  
  // 중복 제거 (같은 ID가 있으면 제거)
  const filteredHistory = history.filter(h => h.id !== item.id);
  
  // 최신 항목을 맨 앞에 추가 (최대 10개)
  const updatedHistory = [item, ...filteredHistory].slice(0, 10);
  
  await chrome.storage.local.set({
    [STORAGE_KEYS.ANALYSIS_HISTORY]: updatedHistory
  });
}

export async function getAnalysisHistory(): Promise<AnalysisHistoryItem[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.ANALYSIS_HISTORY);
  return result[STORAGE_KEYS.ANALYSIS_HISTORY] || [];
}
```

---

## 3. React 컴포넌트 구현

### 3.1 메인 Popup 컴포넌트

```typescript
// src/popup/Popup.tsx
import React, { useState, useEffect } from 'react';
import { getCurrentTabUrl } from '../utils/tabs';
import { checkAuthStatus, redirectToLogin } from '../utils/auth';
import { analyzeUrl, AnalysisResult } from '../utils/api';
import AnalysisButton from './components/AnalysisButton';
import SummaryCard from './components/SummaryCard';
import LoginPrompt from './components/LoginPrompt';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';

export default function Popup() {
  const [url, setUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initialize();
  }, []);

  async function initialize() {
    try {
      // 현재 URL 가져오기
      const currentUrl = await getCurrentTabUrl();
      if (currentUrl) {
        setUrl(currentUrl);
      }
      
      // 인증 상태 확인
      const authStatus = await checkAuthStatus();
      setIsAuthenticated(authStatus.authenticated);
    } catch (error) {
      console.error('초기화 실패:', error);
      setError(error instanceof Error ? error.message : '초기화 중 오류가 발생했습니다.');
    }
  }

  async function handleAnalyze() {
    if (!url.trim()) {
      setError('URL을 입력해주세요.');
      return;
    }

    // 인증 확인
    const authStatus = await checkAuthStatus();
    if (!authStatus.authenticated) {
      redirectToLogin(url);
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await analyzeUrl(url);
      setAnalysisResult(result);
      
      // 분석 이력 저장
      await saveAnalysisHistory(result, url);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '분석 중 오류가 발생했습니다.';
      setError(errorMessage);
      
      // 인증 오류인 경우 로그인 페이지로 리디렉션
      if (errorMessage.includes('로그인')) {
        redirectToLogin(url);
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleViewFullResults() {
    if (!analysisResult) return;
    
    const fullResultsUrl = `https://gaeoanalysis.vercel.app/?analysisId=${analysisResult.id}`;
    chrome.tabs.create({ url: fullResultsUrl });
  }

  // 로딩 중
  if (isAuthenticated === null) {
    return <LoadingState message="초기화 중..." />;
  }

  // 로그인 필요
  if (!isAuthenticated && !analysisResult) {
    return (
      <LoginPrompt
        url={url}
        onLogin={() => redirectToLogin(url)}
      />
    );
  }

  return (
    <div className="w-96 p-4">
      <header className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">GAEO Analysis</h1>
      </header>

      {/* URL 표시 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          현재 페이지
        </label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          placeholder="URL을 입력하세요"
        />
      </div>

      {/* 분석 버튼 */}
      <AnalysisButton
        onClick={handleAnalyze}
        isLoading={isLoading}
        disabled={!url.trim() || isLoading}
      />

      {/* 에러 표시 */}
      {error && <ErrorState message={error} onRetry={handleAnalyze} />}

      {/* 분석 결과 요약 */}
      {analysisResult && (
        <SummaryCard
          result={analysisResult}
          onViewFullResults={handleViewFullResults}
        />
      )}
    </div>
  );
}
```

### 3.2 요약 카드 컴포넌트

```typescript
// src/popup/components/SummaryCard.tsx
import React from 'react';
import { AnalysisResult } from '../../utils/api';
import ScoreCard from './ScoreCard';
import InsightList from './InsightList';
import AIOScores from './AIOScores';

interface SummaryCardProps {
  result: AnalysisResult;
  onViewFullResults: () => void;
}

export default function SummaryCard({ result, onViewFullResults }: SummaryCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return '⭐ 우수';
    if (score >= 60) return '✓ 양호';
    return '⚠ 개선 필요';
  };

  return (
    <div className="mt-4 space-y-4">
      {/* 종합 점수 */}
      <div className="bg-gradient-to-br from-sky-50 to-indigo-50 rounded-lg p-4 border-2 border-sky-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">종합 점수</h3>
            <p className="text-xs text-gray-600">AEO, GEO, SEO 점수의 평균</p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${getScoreColor(result.overallScore)}`}>
              {Math.round(result.overallScore)}
            </div>
            <div className="text-sm text-gray-500">/ 100</div>
            <div className="mt-1 text-xs font-semibold text-gray-700">
              {getScoreLabel(result.overallScore)}
            </div>
          </div>
        </div>
      </div>

      {/* 세부 점수 */}
      <div className="grid grid-cols-3 gap-2">
        <ScoreCard title="AEO" score={result.aeoScore} />
        <ScoreCard title="GEO" score={result.geoScore} />
        <ScoreCard title="SEO" score={result.seoScore} />
      </div>

      {/* 주요 인사이트 */}
      {result.insights && result.insights.length > 0 && (
        <InsightList insights={result.insights.slice(0, 3)} />
      )}

      {/* AI 모델별 인용 확률 */}
      {result.aioAnalysis && (
        <AIOScores scores={result.aioAnalysis.scores} />
      )}

      {/* 전체 결과 보기 버튼 */}
      <button
        onClick={onViewFullResults}
        className="w-full py-2 px-4 bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-sky-700 hover:to-indigo-700 transition-colors"
      >
        📊 전체 결과 보기
      </button>
    </div>
  );
}
```

### 3.3 점수 카드 컴포넌트

```typescript
// src/popup/components/ScoreCard.tsx
import React from 'react';

interface ScoreCardProps {
  title: string;
  score: number;
}

export default function ScoreCard({ title, score }: ScoreCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
      <div className="text-xs font-medium text-gray-600 mb-1">{title}</div>
      <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
        {Math.round(score)}
      </div>
    </div>
  );
}
```

---

## 4. 빌드 설정

### 4.1 Vite 설정

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        background: resolve(__dirname, 'src/background/background.ts')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
});
```

### 4.2 Tailwind CSS 설정

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sky: {
          50: '#f0f9ff',
          // ... 기존 Tailwind sky 색상
        }
      }
    }
  },
  plugins: []
};
```

---

## 5. 웹 서비스 API 추가 (필요시)

### 5.1 분석 결과 조회 API

```typescript
// app/api/analysis/[analysisId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getAnalysisById } from '@/lib/db-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: { analysisId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const analysis = await getAnalysisById(params.analysisId);
    
    if (!analysis) {
      return NextResponse.json(
        { error: '분석 결과를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 사용자 권한 확인 (자신의 분석 결과만 조회 가능)
    if (analysis.user_id !== session.user.id) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('분석 결과 조회 실패:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
```

### 5.2 인증 상태 확인 API

```typescript
// app/api/auth/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({
        authenticated: false
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email
      }
    });
  } catch (error) {
    console.error('인증 상태 확인 실패:', error);
    return NextResponse.json({
      authenticated: false
    });
  }
}
```

---

## 6. 테스트

### 6.1 단위 테스트 예시

```typescript
// src/utils/__tests__/tabs.test.ts
import { getCurrentTabUrl } from '../tabs';

describe('getCurrentTabUrl', () => {
  it('should return current tab URL', async () => {
    // Mock chrome.tabs.query
    global.chrome = {
      tabs: {
        query: jest.fn((query, callback) => {
          callback([{ url: 'https://example.com' }]);
        })
      }
    } as any;

    const url = await getCurrentTabUrl();
    expect(url).toBe('https://example.com');
  });

  it('should throw error for chrome:// URLs', async () => {
    global.chrome = {
      tabs: {
        query: jest.fn((query, callback) => {
          callback([{ url: 'chrome://settings' }]);
        })
      }
    } as any;

    await expect(getCurrentTabUrl()).rejects.toThrow('이 페이지는 분석할 수 없습니다.');
  });
});
```

---

## 7. 배포 체크리스트

- [ ] manifest.json 버전 업데이트
- [ ] 아이콘 파일 준비 (16x16, 48x48, 128x128)
- [ ] 빌드 및 패키징 (zip 파일)
- [ ] Chrome Web Store 리스팅 작성
- [ ] 스크린샷 준비 (최소 1개, 권장 5개)
- [ ] 개인정보 보호 정책 작성
- [ ] 사용 약관 작성 (필요시)
- [ ] 스토어에 업로드 및 심사 제출

---

이 기술 가이드는 Chrome Extension 개발을 시작하는 데 필요한 모든 기술적 세부사항을 포함하고 있습니다. 실제 개발 시 이 가이드를 참고하여 단계적으로 구현하시기 바랍니다.

