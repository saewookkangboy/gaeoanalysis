'use client';

interface RevisionProgressProps {
  progress: number;
  message: string;
}

export default function RevisionProgress({ progress, message }: RevisionProgressProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-md rounded-lg border border-gray-300 bg-white shadow-xl p-6">
        {/* 헤더 */}
        <div className="mb-6 text-center">
          <div className="mb-4 inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-sky-600 border-r-transparent"></div>
          <h2 className="text-xl font-bold text-gray-900">콘텐츠 수정 진행 중</h2>
          <p className="mt-2 text-sm text-gray-600">{message}</p>
        </div>

        {/* 진행 바 */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-gray-700">진행률</span>
            <span className="font-semibold text-sky-600">{progress}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 단계 표시 */}
        <div className="space-y-2 text-xs text-gray-600">
          <div className={`flex items-center gap-2 ${progress >= 25 ? 'text-sky-600' : ''}`}>
            <span className={progress >= 25 ? 'text-green-500' : 'text-gray-400'}>
              {progress >= 25 ? '✓' : '○'}
            </span>
            <span>원본 콘텐츠 가져오기</span>
          </div>
          <div className={`flex items-center gap-2 ${progress >= 50 ? 'text-sky-600' : ''}`}>
            <span className={progress >= 50 ? 'text-green-500' : 'text-gray-400'}>
              {progress >= 50 ? '✓' : '○'}
            </span>
            <span>AI 분석 및 수정 진행</span>
          </div>
          <div className={`flex items-center gap-2 ${progress >= 75 ? 'text-sky-600' : ''}`}>
            <span className={progress >= 75 ? 'text-green-500' : 'text-gray-400'}>
              {progress >= 75 ? '✓' : '○'}
            </span>
            <span>점수 계산 및 검증</span>
          </div>
          <div className={`flex items-center gap-2 ${progress >= 100 ? 'text-sky-600' : ''}`}>
            <span className={progress >= 100 ? 'text-green-500' : 'text-gray-400'}>
              {progress >= 100 ? '✓' : '○'}
            </span>
            <span>최종 결과 생성</span>
          </div>
        </div>
      </div>
    </div>
  );
}

