import { ContentModification } from '@/types/modifications';

interface BeforeAfterCompareProps {
  modification: ContentModification;
  onCopy: () => void;
  onApply?: () => void;
}

export default function BeforeAfterCompare({
  modification,
  onCopy,
  onApply,
}: BeforeAfterCompareProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'meta-description':
      case 'meta-title':
        return '📝';
      case 'h1-tag':
      case 'h2-tag':
        return '📄';
      case 'image-alt':
        return '🖼️';
      case 'structured-data':
        return '🔧';
      case 'keyword-optimization':
        return '🔑';
      case 'content-structure':
        return '📋';
      default:
        return '✏️';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'meta-description':
        return '메타 설명';
      case 'meta-title':
        return '메타 제목';
      case 'h1-tag':
        return 'H1 태그';
      case 'h2-tag':
        return 'H2 태그';
      case 'image-alt':
        return '이미지 Alt';
      case 'structured-data':
        return '구조화된 데이터';
      case 'keyword-optimization':
        return '키워드 최적화';
      case 'content-structure':
        return '콘텐츠 구조';
      default:
        return '기타';
    }
  };

  return (
    <div className="rounded-lg border-2 border-gray-200 bg-white p-3 shadow-md">
      {/* 헤더 */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-lg">{getTypeIcon(modification.type)}</span>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-gray-900">{modification.title}</h4>
          <p className="text-xs text-gray-600">{getTypeLabel(modification.type)}</p>
        </div>
        {modification.applied && (
          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
            적용됨
          </span>
        )}
      </div>

      {/* Before/After 비교 */}
      <div className="space-y-2 mb-3">
        <div className="rounded border border-red-200 bg-red-50 p-2">
          <div className="mb-1 text-xs font-semibold text-red-800">Before</div>
          <p className="text-xs text-gray-700 whitespace-pre-wrap break-words">
            {modification.before || '(내용 없음)'}
          </p>
        </div>
        <div className="flex items-center justify-center">
          <span className="text-lg">↓</span>
        </div>
        <div className="rounded border border-green-200 bg-green-50 p-2">
          <div className="mb-1 text-xs font-semibold text-green-800">After</div>
          <p className="text-xs text-gray-700 whitespace-pre-wrap break-words">
            {modification.after || '(내용 없음)'}
          </p>
        </div>
      </div>

      {/* 이유 및 예상 효과 */}
      <div className="mb-3 space-y-1 rounded bg-gray-50 p-2">
        <div>
          <span className="text-xs font-semibold text-gray-700">이유: </span>
          <span className="text-xs text-gray-600">{modification.reason}</span>
        </div>
        <div>
          <span className="text-xs font-semibold text-gray-700">예상 효과: </span>
          <span className="text-xs text-gray-600">{modification.expectedImpact}</span>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-2">
        <button
          onClick={onCopy}
          className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-all hover:bg-gray-50"
        >
          📋 복사
        </button>
        {onApply && (
          <button
            onClick={onApply}
            disabled={modification.applied}
            className="flex-1 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {modification.applied ? '✓ 적용됨' : '적용'}
          </button>
        )}
      </div>
    </div>
  );
}

