'use client';

interface SkeletonLoaderProps {
  type?: 'card' | 'chart' | 'list' | 'text';
  count?: number;
}

export default function SkeletonLoader({ type = 'card', count = 1 }: SkeletonLoaderProps) {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white via-sky-50/30 to-indigo-50/30 p-6 shadow-lg">
            {/* Shimmer 효과 */}
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
            {/* 배경 장식 */}
            <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-sky-100/30 blur-2xl"></div>
            <div className="relative">
              <div className="mb-4 h-4 w-24 rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200"></div>
              <div className="mb-3 h-10 w-20 rounded-lg bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200"></div>
              <div className="h-3 w-full rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 shadow-inner"></div>
            </div>
          </div>
        );
      case 'chart':
        return (
          <div className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white via-sky-50/30 to-indigo-50/30 p-8 shadow-lg">
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
            <div className="relative">
              <div className="mb-6 h-6 w-40 rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200"></div>
              <div className="mx-auto h-64 w-64 rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 shadow-inner"></div>
            </div>
          </div>
        );
      case 'list':
        return (
          <div className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white via-sky-50/30 to-indigo-50/30 p-6 shadow-lg">
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
            <div className="relative">
              <div className="mb-6 h-6 w-32 rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200"></div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 rounded-lg bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 shadow-inner"></div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'text':
        return (
          <div className="space-y-3">
            <div className="h-4 w-full rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse"></div>
            <div className="h-4 w-5/6 rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
            <div className="h-4 w-4/6 rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {[...Array(count)].map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </>
  );
}

