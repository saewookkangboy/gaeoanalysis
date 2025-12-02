'use client';

import { useState } from 'react';
import { AnalysisResult } from '@/lib/analyzer';
import { useToast } from './Toast';

interface ShareButtonProps {
  analysisData: AnalysisResult;
  url: string;
}

export default function ShareButton({ analysisData, url }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { showToast } = useToast();

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}?url=${encodeURIComponent(url)}`
    : '';

  const handleShare = async (platform: 'link' | 'twitter' | 'facebook' | 'copy') => {
    const title = `GAEO Analysis 결과 - 종합 점수: ${analysisData.overallScore}/100`;
    const text = `AEO: ${analysisData.aeoScore}, GEO: ${analysisData.geoScore}, SEO: ${analysisData.seoScore}`;

    try {
      switch (platform) {
        case 'link':
          if (navigator.share) {
            await navigator.share({
              title,
              text,
              url: shareUrl,
            });
            showToast('공유되었습니다!', 'success');
          } else {
            await navigator.clipboard.writeText(shareUrl);
            showToast('링크가 클립보드에 복사되었습니다!', 'success');
          }
          break;
        case 'twitter':
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
            '_blank'
          );
          break;
        case 'facebook':
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
            '_blank'
          );
          break;
        case 'copy':
          await navigator.clipboard.writeText(shareUrl);
          showToast('링크가 클립보드에 복사되었습니다!', 'success');
          break;
      }
      setIsOpen(false);
    } catch (error) {
      console.error('공유 실패:', error);
      showToast('공유에 실패했습니다.', 'error');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2 rounded-lg border-2 border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:border-sky-300 hover:bg-gradient-to-r hover:from-sky-50 hover:to-indigo-50 hover:text-sky-700 hover:shadow-md"
        aria-label="결과 공유"
      >
        <svg
          className="h-4 w-4 transition-transform group-hover:scale-110"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        공유
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border-2 border-gray-200 bg-white shadow-2xl animate-fade-in overflow-hidden">
            <div className="bg-gradient-to-r from-sky-50 to-indigo-50 p-3 border-b border-gray-200">
              <p className="text-xs font-bold text-gray-700">공유하기</p>
            </div>
            <div className="p-2">
              <button
                onClick={() => handleShare('link')}
                className="group w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-sky-50 hover:to-indigo-50 transition-all duration-200"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 group-hover:bg-sky-200 transition-colors">
                  <svg className="h-4 w-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                링크 복사
              </button>
              <button
                onClick={() => handleShare('twitter')}
                className="group w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all duration-200"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                  <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </div>
                Twitter
              </button>
              <button
                onClick={() => handleShare('facebook')}
                className="group w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 group-hover:bg-indigo-200 transition-colors">
                  <svg className="h-4 w-4 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </div>
                Facebook
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

