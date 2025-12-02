'use client';

import { useTheme } from './ThemeProvider';

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getIcon = () => {
    if (theme === 'system') {
      return (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      );
    }
    if (resolvedTheme === 'dark') {
      return (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      );
    }
    return (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    );
  };

  const getLabel = () => {
    if (theme === 'system') return '시스템';
    if (resolvedTheme === 'dark') return '다크';
    return '라이트';
  };

  return (
    <button
      onClick={toggleTheme}
      className="group flex items-center gap-2 rounded-lg border-2 border-transparent px-3 py-2 text-sm font-semibold transition-all duration-200 hover:border-sky-200 hover:bg-gradient-to-r hover:from-sky-50 hover:to-indigo-50 dark:hover:from-gray-800 dark:hover:to-gray-700 hover:shadow-sm"
      aria-label={`테마 전환: 현재 ${getLabel()} 모드`}
      title={`테마 전환 (${getLabel()})`}
    >
      <span className="transition-transform group-hover:scale-110 group-hover:rotate-12">
        {getIcon()}
      </span>
      <span className="hidden sm:inline">{getLabel()}</span>
    </button>
  );
}

