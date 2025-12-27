'use client';

interface RevisionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function RevisionConfirmModal({
  isOpen,
  onClose,
  onConfirm,
}: RevisionConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-lg border border-gray-300 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">콘텐츠 수정 확인</h2>
        </div>

        {/* 내용 */}
        <div className="px-6 py-6">
          <div className="mb-6 text-center">
            <div className="mb-4 text-5xl">✍️</div>
            <p className="text-lg font-medium text-gray-900">
              미리 보기 내용 대로 콘텐츠 출력을 하시겠습니까?
            </p>
            <p className="mt-2 text-sm text-gray-600">
              콘텐츠 수정이 진행되면 결과를 확인할 수 있습니다.
            </p>
          </div>

          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mb-6">
            <p className="text-sm text-blue-800">
              💡 <strong>참고:</strong> 수정된 콘텐츠는 마크다운 형식으로 복사하여 사용하실 수 있습니다.
            </p>
          </div>
        </div>

        {/* 버튼 */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            No
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-sky-600 px-6 py-2 text-sm font-medium text-white hover:bg-sky-700 transition-colors"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}

