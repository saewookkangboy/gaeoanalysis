'use client';

import { useState, useEffect, useRef } from 'react';
import { storage } from '@/lib/storage';

interface UrlInputProps {
  value: string;
  onChange: (url: string) => void;
  onAnalyze: () => void;
  disabled?: boolean;
  showHistory?: boolean;
}

export default function UrlInput({
  value,
  onChange,
  onAnalyze,
  disabled = false,
  showHistory = true,
}: UrlInputProps) {
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [urlHistory, setUrlHistory] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showHistory) {
      setUrlHistory(storage.getUrlHistory());
    }
  }, [showHistory]);

  useEffect(() => {
    // URL 유효성 실시간 검사
    if (value.trim()) {
      try {
        new URL(value.trim());
        setIsValid(true);
      } catch {
        setIsValid(false);
      }
    } else {
      setIsValid(true);
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setShowHistoryDropdown(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !disabled && isValid && value.trim()) {
      onAnalyze();
    }
  };

  const handleHistorySelect = (url: string) => {
    onChange(url);
    setShowHistoryDropdown(false);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    if (showHistory && urlHistory.length > 0) {
      setShowHistoryDropdown(true);
    }
  };

  const handleBlur = () => {
    // 클릭 이벤트가 먼저 발생하도록 약간의 지연
    setTimeout(() => setShowHistoryDropdown(false), 200);
  };

  return (
    <div className="relative flex-1">
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="url"
          value={value}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="https://example.com"
          className={`w-full rounded-lg border-2 ${
            isValid
              ? 'border-gray-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/20'
              : 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/20'
          } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 pl-12 pr-4 py-3.5 text-base font-medium shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={disabled}
          aria-label="분석할 URL 입력"
          aria-invalid={!isValid}
          aria-describedby={!isValid ? 'url-error' : undefined}
        />
      </div>
      
      {!isValid && value.trim() && (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 animate-slide-in">
          <svg className="h-4 w-4 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p
            id="url-error"
            className="text-sm font-medium text-red-700"
            role="alert"
          >
            유효하지 않은 URL 형식입니다.
          </p>
        </div>
      )}

      {showHistory && showHistoryDropdown && urlHistory.length > 0 && (
        <div className="absolute z-10 mt-2 w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl max-h-48 overflow-y-auto animate-fade-in">
          <div className="sticky top-0 bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 p-3 text-xs font-bold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
            📋 최근 URL
          </div>
          {urlHistory.map((url, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleHistorySelect(url)}
              className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-sky-50 hover:to-indigo-50 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200 truncate border-b border-gray-100 dark:border-gray-700 last:border-b-0"
            >
              <span className="flex items-center gap-2">
                <span className="text-sky-500">🔗</span>
                <span>{url}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

