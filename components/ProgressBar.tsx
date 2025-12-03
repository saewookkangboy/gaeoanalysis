'use client';

interface ProgressBarProps {
  steps: Array<{ 
    label: string; 
    completed: boolean;
    description?: string;
    estimatedTime?: number;
  }>;
  currentStep: number;
  estimatedTime?: number;
  elapsedTime?: number;
}

export default function ProgressBar({ 
  steps, 
  currentStep,
  estimatedTime = 0,
  elapsedTime = 0
}: ProgressBarProps) {
  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`relative flex-1 text-center transition-all duration-300 ${
              index <= currentStep
                ? 'text-sky-600 dark:text-sky-400'
                : 'text-gray-400 dark:text-gray-600'
            }`}
          >
            <div className="mb-2 flex items-center justify-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  index < currentStep
                    ? 'border-sky-500 bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-md'
                    : index === currentStep
                    ? 'border-sky-500 bg-gradient-to-br from-sky-100 to-indigo-100 text-sky-700 shadow-sm animate-pulse'
                    : 'border-gray-300 bg-gray-100 text-gray-400'
                }`}
              >
                {index < currentStep ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-xs font-bold">{index + 1}</span>
                )}
              </div>
            </div>
            <div className={`text-xs font-semibold transition-all duration-300 ${
              index === currentStep ? 'scale-110' : ''
            }`}>
              {step.label}
            </div>
          </div>
        ))}
      </div>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-200/50 dark:bg-gray-700/50 shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 transition-all duration-700 ease-out shadow-md"
          style={{
            width: `${((currentStep + 1) / steps.length) * 100}%`,
          }}
        />
      </div>
      <div className="mt-3 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-100 to-indigo-100 px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold text-sky-700 shadow-sm">
          <span className="animate-pulse-slow">●</span>
          {steps[currentStep]?.description || `${steps[currentStep]?.label} 중...`}
        </span>
        {(estimatedTime > 0 || elapsedTime > 0) && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
            <span className="font-medium">
              {elapsedTime > 0 && `${elapsedTime}초 경과`}
              {elapsedTime > 0 && estimatedTime > 0 && ' / '}
              {estimatedTime > 0 && `예상 ${estimatedTime}초`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

