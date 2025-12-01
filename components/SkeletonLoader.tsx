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
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-6 shadow-sm animate-pulse">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        );
      case 'chart':
        return (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-6 shadow-sm animate-pulse">
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-64 w-64 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
        );
      case 'list':
        return (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-6 shadow-sm animate-pulse">
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        );
      case 'text':
        return (
          <div className="animate-pulse space-y-2">
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-4/6 bg-gray-200 dark:bg-gray-700 rounded"></div>
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

