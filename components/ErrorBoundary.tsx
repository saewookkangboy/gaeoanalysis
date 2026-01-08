'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // 에러 리포팅 (서버로 전송)
    if (typeof window !== 'undefined') {
      // 에러를 로컬 스토리지에 저장 (개발용)
      try {
        const errors = JSON.parse(localStorage.getItem('app_errors') || '[]');
        errors.push({
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
        });
        localStorage.setItem('app_errors', JSON.stringify(errors.slice(-10))); // 최근 10개만
      } catch (e) {
        // 로컬 스토리지 저장 실패는 무시
      }

      // 서버로 에러 로그 전송 (비동기, 실패해도 무시)
      this.sendErrorToServer(error, errorInfo).catch((err) => {
        console.warn('에러 로그 전송 실패:', err);
      });
    }
  }

  private async sendErrorToServer(error: Error, errorInfo: ErrorInfo) {
    try {
      // 현재 URL과 사용자 정보 수집
      const url = window.location.href;
      const userAgent = navigator.userAgent;

      // 에러 타입 결정
      let errorType = 'unknown';
      if (error.name === 'TypeError') errorType = 'type_error';
      else if (error.name === 'ReferenceError') errorType = 'reference_error';
      else if (error.name === 'SyntaxError') errorType = 'syntax_error';
      else if (error.name === 'NetworkError' || error.message.includes('fetch')) errorType = 'network_error';
      else if (error.message.includes('timeout')) errorType = 'timeout_error';
      else errorType = 'runtime_error';

      // 심각도 결정
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
      if (errorType === 'network_error' || errorType === 'timeout_error') {
        severity = 'low';
      } else if (error.message.includes('Cannot read') || error.message.includes('undefined')) {
        severity = 'high';
      } else if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
        severity = 'low';
      }

      // 서버로 전송
      await fetch('/api/admin/error-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error_type: errorType,
          error_message: error.message,
          error_stack: error.stack || null,
          component_stack: errorInfo.componentStack || null,
          url,
          user_agent: userAgent,
          metadata: {
            error_name: error.name,
            timestamp: new Date().toISOString(),
          },
          severity,
        }),
      });
    } catch (sendError) {
      // 에러 전송 실패는 조용히 무시 (무한 루프 방지)
      console.warn('에러 로그 서버 전송 실패:', sendError);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-gray-800 p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <svg
              className="h-6 w-6 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              오류가 발생했습니다
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              예상치 못한 문제가 발생했습니다
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-gray-50 dark:bg-gray-900 p-3">
            <p className="text-sm font-mono text-red-600 dark:text-red-400 break-words">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onReset}
            className="flex-1 rounded-md bg-blue-600 dark:bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            다시 시도
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            홈으로
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && error?.stack && (
          <details className="mt-4">
            <summary className="cursor-pointer text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
              개발자 정보 보기
            </summary>
            <pre className="mt-2 overflow-auto rounded-md bg-gray-900 p-3 text-xs text-gray-100">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

