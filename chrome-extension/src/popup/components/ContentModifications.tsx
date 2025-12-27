import { useState, useEffect } from 'react';
import { AnalysisResult } from '@/types/analysis';
import { ContentModification } from '@/types/modifications';
import { generateModifications, saveModifications, loadModifications, copyModificationToClipboard } from '@/utils/modifications';
import BeforeAfterCompare from './BeforeAfterCompare';

interface ContentModificationsProps {
  analysisData: AnalysisResult;
  aioAnalysis: any;
  url: string;
}

export default function ContentModifications({
  analysisData,
  aioAnalysis,
  url,
}: ContentModificationsProps) {
  const [modifications, setModifications] = useState<ContentModification[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analysisId = analysisData.id || `${url}-${Date.now()}`;

  // 저장된 수정안 불러오기
  useEffect(() => {
    if (analysisData && analysisId) {
      loadModifications(analysisId).then((savedMods) => {
        if (savedMods.length > 0) {
          setModifications(savedMods);
        }
      });
    }
  }, [analysisData, analysisId]);

  // 수정안 생성
  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const generated = await generateModifications(analysisData, aioAnalysis, url);
      setModifications(generated);
      
      // 수정안 저장
      await saveModifications(analysisId, url, generated);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '수정안 생성 중 오류가 발생했습니다.';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  // 수정안 복사
  const handleCopy = async (modification: ContentModification) => {
    try {
      await copyModificationToClipboard(modification);
      // 성공 피드백 (간단한 토스트)
      alert('클립보드에 복사되었습니다!');
    } catch (err) {
      alert('복사 중 오류가 발생했습니다.');
    }
  };

  // 수정안 적용 (선택적 - Content Script 사용)
  const handleApply = async (modification: ContentModification) => {
    // Content Script를 통해 수정안 적용
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'APPLY_MODIFICATION',
          modification,
        });

        // 적용 상태 업데이트
        const updated = modifications.map(mod =>
          mod.id === modification.id ? { ...mod, applied: true } : mod
        );
        setModifications(updated);
        await saveModifications(analysisId, url, updated);
      }
    } catch (err) {
      console.error('수정안 적용 오류:', err);
      alert('수정안 적용 중 오류가 발생했습니다. 페이지를 새로고침한 후 다시 시도해주세요.');
    }
  };

  return (
    <div className="rounded-lg border-2 border-gray-200 bg-gradient-to-br from-white to-sky-50/30 p-4 shadow-md">
      {/* 헤더 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 text-white text-sm">
            ✏️
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">콘텐츠 수정안</h3>
            <p className="text-xs text-gray-600">AI 기반 구체적인 수정 제안</p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-sky-600 hover:text-sky-700 font-semibold"
        >
          {isExpanded ? '접기' : '펼치기'}
        </button>
      </div>

      {/* 수정안 생성 버튼 */}
      {modifications.length === 0 && !isGenerating && (
        <button
          onClick={handleGenerate}
          className="w-full rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition-all hover:shadow-lg"
        >
          ✨ 수정안 생성
        </button>
      )}

      {/* 생성 중 */}
      {isGenerating && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <div className="mb-2 text-sm text-gray-600">수정안 생성 중...</div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-gray-200">
            <div className="h-full w-full animate-pulse bg-gradient-to-r from-sky-500 to-indigo-500" />
          </div>
        </div>
      )}

      {/* 에러 표시 */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          {error}
        </div>
      )}

      {/* 수정안 목록 */}
      {isExpanded && modifications.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {modifications.map((modification) => (
            <BeforeAfterCompare
              key={modification.id}
              modification={modification}
              onCopy={() => handleCopy(modification)}
              onApply={() => handleApply(modification)}
            />
          ))}
        </div>
      )}

      {/* 요약 정보 */}
      {modifications.length > 0 && !isExpanded && (
        <div className="rounded-lg border border-gray-200 bg-white p-2">
          <p className="text-xs text-gray-600">
            {modifications.length}개의 수정안이 생성되었습니다. 펼치기 버튼을 클릭하여 확인하세요.
          </p>
        </div>
      )}
    </div>
  );
}

