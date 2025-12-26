import { useState, useEffect } from 'react';
import { AnalysisResult } from '@/types/analysis';
import { ChecklistSection } from '@/types/checklist';
import { generateChecklist, loadChecklistState, saveChecklistState, applyChecklistState } from '@/utils/checklist';
import ChecklistSectionComponent from './ChecklistSection';

interface ChecklistViewProps {
  analysisData: AnalysisResult | null;
  url: string;
}

type FilterPriority = 'All' | 'High' | 'Medium' | 'Low';

export default function ChecklistView({ analysisData, url }: ChecklistViewProps) {
  const [sections, setSections] = useState<ChecklistSection[]>([]);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [filter, setFilter] = useState<FilterPriority>('All');
  const [isExpanded, setIsExpanded] = useState(false);

  // 체크리스트 생성 및 상태 불러오기
  useEffect(() => {
    if (analysisData && url) {
      const generatedSections = generateChecklist(analysisData);
      
      // 저장된 체크 상태 불러오기
      loadChecklistState(url).then((savedCheckedItems) => {
        setCheckedItems(savedCheckedItems);
        const sectionsWithState = applyChecklistState(generatedSections, savedCheckedItems);
        setSections(sectionsWithState);
      });
    }
  }, [analysisData, url]);

  // 체크 상태 변경
  const handleItemToggle = async (id: string, checked: boolean) => {
    const newCheckedItems = checked
      ? [...checkedItems, id]
      : checkedItems.filter(itemId => itemId !== id);
    
    setCheckedItems(newCheckedItems);
    
    // 체크 상태 저장
    if (url) {
      await saveChecklistState(url, newCheckedItems);
      
      // 섹션 상태 업데이트
      setSections(prevSections =>
        prevSections.map(section => ({
          ...section,
          items: section.items.map(item =>
            item.id === id ? { ...item, checked } : item
          ),
        }))
      );
    }
  };

  // 필터링된 섹션
  const filteredSections = filter === 'All'
    ? sections
    : sections.filter(section => section.priority === filter);

  // 전체 진행률 계산
  const totalItems = sections.reduce((sum, section) => sum + section.items.length, 0);
  const completedItems = sections.reduce(
    (sum, section) => sum + section.items.filter(item => item.checked).length,
    0
  );
  const overallProgress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  if (!analysisData || sections.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border-2 border-gray-200 bg-gradient-to-br from-white to-sky-50/30 p-4 shadow-md">
      {/* 헤더 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 text-white text-sm">
            ✅
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">개선 체크리스트</h3>
            <p className="text-xs text-gray-600">
              {completedItems}/{totalItems} 완료 ({Math.round(overallProgress)}%)
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-sky-600 hover:text-sky-700 font-semibold"
        >
          {isExpanded ? '접기' : '펼치기'}
        </button>
      </div>

      {/* 전체 진행률 바 */}
      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-500"
          style={{ width: `${overallProgress}%` }}
        />
      </div>

      {/* 필터 버튼 */}
      <div className="mb-3 flex gap-1">
        {(['All', 'High', 'Medium', 'Low'] as FilterPriority[]).map((priority) => (
          <button
            key={priority}
            onClick={() => setFilter(priority)}
            className={`rounded-full px-2 py-1 text-xs font-semibold transition-all ${
              filter === priority
                ? 'bg-sky-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {priority === 'All' ? '전체' : priority}
          </button>
        ))}
      </div>

      {/* 체크리스트 섹션 */}
      {isExpanded && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredSections.length === 0 ? (
            <div className="text-center text-gray-500 py-4 text-xs">
              필터 조건에 맞는 항목이 없습니다.
            </div>
          ) : (
            filteredSections.map((section, index) => (
              <ChecklistSectionComponent
                key={section.category}
                section={section}
                sectionIndex={index}
                onItemToggle={handleItemToggle}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

