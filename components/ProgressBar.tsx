'use client';

interface ProgressBarProps {
  steps: Array<{ label: string; completed: boolean }>;
  currentStep: number;
}

export default function ProgressBar({ steps, currentStep }: ProgressBarProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex-1 text-center text-xs font-medium transition-colors ${
              index <= currentStep
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-400 dark:text-gray-600'
            }`}
          >
            {step.label}
          </div>
        ))}
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
          style={{
            width: `${((currentStep + 1) / steps.length) * 100}%`,
          }}
        />
      </div>
      <div className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
        {steps[currentStep]?.label} 중...
      </div>
    </div>
  );
}

