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
      <input
        ref={inputRef}
        type="url"
        value={value}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="https://example.com"
        className={`w-full rounded-md border ${
          isValid
            ? 'border-gray-300 dark:border-gray-700'
            : 'border-red-300 dark:border-red-700'
        } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-3 text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors disabled:opacity-50`}
        disabled={disabled}
        aria-label="분석할 URL 입력"
        aria-invalid={!isValid}
        aria-describedby={!isValid ? 'url-error' : undefined}
      />
      
      {!isValid && value.trim() && (
        <p
          id="url-error"
          className="mt-1 text-xs text-red-600 dark:text-red-400"
          role="alert"
        >
          유효하지 않은 URL 형식입니다.
        </p>
      )}

      {showHistory && showHistoryDropdown && urlHistory.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg max-h-48 overflow-y-auto">
          <div className="p-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
            최근 URL
          </div>
          {urlHistory.map((url, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleHistorySelect(url)}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors truncate"
            >
              {url}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

