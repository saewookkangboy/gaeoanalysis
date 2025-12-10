'use client';

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (provider: 'google' | 'github') => void;
  url?: string; // 입력한 URL (선택적)
}

export default function LoginRequiredModal({
  isOpen,
  onClose,
  onLogin,
  url,
}: LoginRequiredModalProps) {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleOverlayClick}
    >
      <div
        className="relative w-full max-w-md rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          aria-label="모달 닫기"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* 헤더 */}
        <div className="mb-6 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 p-4">
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            로그인이 필요합니다
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            소셜 로그인을 진행 후, 분석 시작을 진행합니다
          </p>
        </div>

        {/* 안내 메시지 */}
        {url && (
          <div className="mb-6 rounded-lg bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 p-4">
            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <p className="text-xs font-medium text-sky-900 dark:text-sky-100 mb-1">
                  입력한 URL이 저장됩니다
                </p>
                <p className="text-xs text-sky-700 dark:text-sky-300 truncate">
                  {url}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 소셜 로그인 버튼 */}
        <div className="space-y-3 mb-4">
          {/* Google 로그인 */}
          <button
            onClick={() => onLogin('google')}
            className="group w-full flex items-center justify-center gap-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 px-5 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm transition-all duration-200 hover:border-sky-300 hover:bg-gradient-to-r hover:from-sky-50 hover:to-indigo-50 dark:hover:from-gray-600 dark:hover:to-gray-600 hover:shadow-md hover:scale-[1.02]"
          >
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
          </button>

          {/* GitHub 로그인 */}
          <button
            onClick={() => onLogin('github')}
            className="group w-full flex items-center justify-center gap-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 px-5 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm transition-all duration-200 hover:border-sky-300 hover:bg-gradient-to-r hover:from-sky-50 hover:to-indigo-50 dark:hover:from-gray-600 dark:hover:to-gray-600 hover:shadow-md hover:scale-[1.02]"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            GitHub로 로그인
          </button>
        </div>

        {/* 취소 버튼 */}
        <button
          onClick={onClose}
          className="w-full rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 px-5 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-600"
        >
          취소
        </button>
      </div>
    </div>
  );
}

