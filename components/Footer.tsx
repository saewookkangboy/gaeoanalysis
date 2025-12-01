'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              © {currentYear} chunghyo park. Built to move the market. All right reserved. |{' '}
              <a
                href="mailto:chunghyo@troe.kr"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                chunghyo@troe.kr
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

