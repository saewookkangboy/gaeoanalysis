import { AnalysisResult } from '@/types/analysis';
import { ChecklistItem, ChecklistSection, ChecklistState } from '@/types/checklist';

const STORAGE_KEY = 'checklistStates';

// 체크리스트 항목 ID 생성
function generateItemId(category: string, index: number): string {
  return `${category}-${index}`;
}

// 분석 결과를 기반으로 체크리스트 생성
export function generateChecklist(analysisData: AnalysisResult): ChecklistSection[] {
  const sections: ChecklistSection[] = [];

  // 1. AI 모델별 인용 확률 추천사항
  if (analysisData.aioAnalysis) {
    const aioItems: ChecklistItem[] = [];
    analysisData.aioAnalysis.insights.forEach((insight) => {
      insight.recommendations.forEach((rec) => {
        if (!aioItems.some(item => item.text === rec)) {
          aioItems.push({
            id: generateItemId('ai-optimization', aioItems.length),
            text: rec,
            category: 'AI 모델 최적화',
            priority: insight.level,
            checked: false,
          });
        }
      });
    });
    if (aioItems.length > 0) {
      sections.push({
        category: 'AI 모델 최적화',
        items: aioItems.slice(0, 6),
        priority: 'High',
      });
    }
  }

  // 2. 개선 가이드 (High 우선순위)
  const highPriorityInsights = analysisData.insights
    .filter((insight) => insight.severity === 'High')
    .slice(0, 5);
  
  if (highPriorityInsights.length > 0) {
    sections.push({
      category: '긴급 개선 사항',
      items: highPriorityInsights.map((insight, idx) => ({
        id: generateItemId('urgent', idx),
        text: insight.message,
        category: '긴급 개선 사항',
        priority: 'High',
        checked: false,
      })),
      priority: 'High',
    });
  }

  // 3. 개선 우선순위의 실행 가능한 팁
  if (analysisData.improvementPriorities) {
    const priorityItems: ChecklistItem[] = [];
    analysisData.improvementPriorities.forEach((priority) => {
      if (priority.actionableTips) {
        priority.actionableTips.forEach((tip) => {
          const itemText = `${tip.title}: ${tip.steps[0]}`;
          if (!priorityItems.some(item => item.text === itemText)) {
            priorityItems.push({
              id: generateItemId('actionable', priorityItems.length),
              text: itemText,
              category: '실행 가능한 개선 팁',
              priority: 'Medium',
              checked: false,
            });
          }
        });
      }
    });
    if (priorityItems.length > 0) {
      sections.push({
        category: '실행 가능한 개선 팁',
        items: priorityItems.slice(0, 5),
        priority: 'Medium',
      });
    }
  }

  // 4. 콘텐츠 작성 시 유의사항
  if (analysisData.contentGuidelines && analysisData.contentGuidelines.length > 0) {
    sections.push({
      category: '콘텐츠 작성 체크리스트',
      items: analysisData.contentGuidelines.slice(0, 6).map((guideline, idx) => ({
        id: generateItemId('content', idx),
        text: guideline,
        category: '콘텐츠 작성 체크리스트',
        priority: 'Medium',
        checked: false,
      })),
      priority: 'Medium',
    });
  }

  // 5. Medium 우선순위 인사이트
  const mediumPriorityInsights = analysisData.insights
    .filter((insight) => insight.severity === 'Medium')
    .slice(0, 4);
  
  if (mediumPriorityInsights.length > 0) {
    sections.push({
      category: '추가 개선 사항',
      items: mediumPriorityInsights.map((insight, idx) => ({
        id: generateItemId('additional', idx),
        text: insight.message,
        category: '추가 개선 사항',
        priority: 'Medium',
        checked: false,
      })),
      priority: 'Medium',
    });
  }

  return sections;
}

// 체크리스트 상태 저장
export async function saveChecklistState(url: string, checkedItems: string[]): Promise<void> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const states: Record<string, ChecklistState> = result[STORAGE_KEY] || {};
    
    states[url] = {
      url,
      checkedItems,
      lastUpdated: Date.now(),
    };
    
    await chrome.storage.local.set({ [STORAGE_KEY]: states });
  } catch (error) {
    console.error('체크리스트 상태 저장 오류:', error);
  }
}

// 체크리스트 상태 불러오기
export async function loadChecklistState(url: string): Promise<string[]> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const states: Record<string, ChecklistState> = result[STORAGE_KEY] || {};
    
    return states[url]?.checkedItems || [];
  } catch (error) {
    console.error('체크리스트 상태 불러오기 오류:', error);
    return [];
  }
}

// 체크리스트 항목에 체크 상태 적용
export function applyChecklistState(
  sections: ChecklistSection[],
  checkedItems: string[]
): ChecklistSection[] {
  return sections.map(section => ({
    ...section,
    items: section.items.map(item => ({
      ...item,
      checked: checkedItems.includes(item.id),
    })),
  }));
}

