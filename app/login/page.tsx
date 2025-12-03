'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState<string | null>(null);

  // 로그인 성공 후 세션 확인 및 리디렉션
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // 로그인 성공 시 메인 페이지로 리디렉션
      try {
        router.push('/');
      } catch (error) {
        // 네비게이션 실패 시 전체 페이지 새로고침으로 대체
        console.warn('네비게이션 실패, 전체 페이지 새로고침:', error);
        window.location.href = '/';
      }
    }
  }, [status, session, router]);

  // 에러 메시지 표시
  useEffect(() => {
    if (searchParams?.get('error')) {
      const errorParam = searchParams.get('error');
      if (errorParam === 'OAuthSignin') {
        setError('OAuth 로그인 초기화에 실패했습니다.');
      } else if (errorParam === 'OAuthCallback') {
        setError('OAuth 콜백 처리 중 오류가 발생했습니다.');
      } else if (errorParam === 'OAuthCreateAccount') {
        setError('계정 생성 중 오류가 발생했습니다.');
      } else if (errorParam === 'EmailCreateAccount') {
        setError('이메일 계정 생성 중 오류가 발생했습니다.');
      } else if (errorParam === 'Callback') {
        setError('콜백 처리 중 오류가 발생했습니다.');
      } else if (errorParam === 'OAuthAccountNotLinked') {
        setError('이 이메일은 다른 로그인 방법으로 이미 등록되어 있습니다.');
      } else if (errorParam === 'EmailSignin') {
        setError('이메일 로그인 중 오류가 발생했습니다.');
      } else if (errorParam === 'CredentialsSignin') {
        setError('로그인 정보가 올바르지 않습니다.');
      } else {
        setError('로그인 중 오류가 발생했습니다.');
      }
    }
  }, [searchParams]);

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setError('');
    setIsLoading(provider);
    
    try {
      const result = await signIn(provider, {
        callbackUrl: '/',
        redirect: false, // 수동 리디렉션으로 변경하여 에러 처리 개선
      });

      if (result?.error) {
        console.error(`${provider} 로그인 오류:`, result.error);
        const providerName = provider === 'google' ? 'Google' : 'GitHub';
        setError(`${providerName} 로그인 중 오류가 발생했습니다.`);
        setIsLoading(null);
      } else if (result?.url) {
        // OAuth 리디렉션 URL이 있는 경우 (OAuth 제공자 페이지로 이동)
        // 이 경우는 OAuth 인증 페이지로 리디렉션하는 것이므로 isLoading 유지
        window.location.href = result.url;
      } else if (result?.ok) {
        // 로그인 성공 시 (콜백에서 돌아온 경우)
        // 세션 확인 후 리디렉션은 useEffect에서 처리
        setIsLoading(null);
      } else {
        // 결과가 없는 경우, 기본적으로 리디렉션 허용
        // NextAuth가 자동으로 처리하도록 redirect: true로 다시 시도
        await signIn(provider, {
          callbackUrl: '/',
          redirect: true,
        });
      }
    } catch (err: any) {
      console.error(`${provider} 로그인 예외:`, err);
      const providerName = provider === 'google' ? 'Google' : 'GitHub';
      setError(`${providerName} 로그인 중 오류가 발생했습니다.`);
      setIsLoading(null);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-8 shadow-sm">
          {/* 사이트 신뢰성 표시 */}
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
              GAEO Analysis
            </h1>
            <p className="text-sm font-medium text-sky-600 dark:text-sky-400">
              AI 검색 최적화 분석 도구
            </p>
          </div>
          
          <h2 className="mb-4 text-center text-xl font-semibold text-gray-900 dark:text-gray-100">
            로그인
          </h2>
          <p className="mb-6 text-center text-sm text-gray-600 dark:text-gray-400">
            소셜 계정으로 간편하게 로그인하세요
          </p>
          
          {/* 보안 및 신뢰성 안내 */}
          <div className="mb-6 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div className="flex-1">
                <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
                  안전한 로그인
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Google 및 GitHub의 공식 OAuth 인증을 사용합니다. 비밀번호는 저장되지 않으며, 소셜 계정의 보안 설정을 따릅니다.
                </p>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {/* Google 로그인 */}
            <button
              onClick={() => handleOAuthSignIn('google')}
              disabled={isLoading !== null}
              className="group w-full flex items-center justify-center gap-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 px-5 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm transition-all duration-200 hover:border-sky-300 hover:bg-gradient-to-r hover:from-sky-50 hover:to-indigo-50 dark:hover:from-gray-600 dark:hover:to-gray-600 hover:shadow-md hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading === 'google' ? (
                <span className="flex items-center gap-2">
                  <span className="animate-pulse">●</span>
                  로그인 중...
                </span>
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google로 로그인
                </>
              )}
            </button>

            {/* GitHub 로그인 */}
            <button
              onClick={() => handleOAuthSignIn('github')}
              disabled={isLoading !== null}
              className="group w-full flex items-center justify-center gap-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 px-5 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm transition-all duration-200 hover:border-sky-300 hover:bg-gradient-to-r hover:from-sky-50 hover:to-indigo-50 dark:hover:from-gray-600 dark:hover:to-gray-600 hover:shadow-md hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading === 'github' ? (
                <span className="flex items-center gap-2">
                  <span className="animate-pulse">●</span>
                  로그인 중...
                </span>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  GitHub로 로그인
                </>
              )}
            </button>
          </div>

          <div className="mt-6 space-y-2">
            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
              로그인 시 서비스 이용약관 및 개인정보처리방침에 동의한 것으로 간주됩니다.
            </p>
            <div className="flex items-center justify-center gap-4 text-xs">
              <a 
                href="/about" 
                className="text-sky-600 dark:text-sky-400 hover:underline"
                rel="noopener noreferrer"
              >
                서비스 소개
              </a>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <a 
                href="https://gaeo-analysis.vercel.app" 
                className="text-sky-600 dark:text-sky-400 hover:underline"
                rel="noopener noreferrer"
              >
                홈페이지
              </a>
            </div>
            <p className="text-center text-xs text-gray-400 dark:text-gray-500">
              vercel.app 으로 안전하게 보호됨
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="w-full max-w-md">
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-8 shadow-sm">
            <div className="text-center text-gray-600 dark:text-gray-400">로딩 중...</div>
          </div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
