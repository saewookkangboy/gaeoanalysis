import { ScoreHistory } from '@/types/analysis';

const STORAGE_KEYS = {
  SCORE_HISTORY: 'scoreHistory',
  CHECKLIST_STATES: 'checklistStates',
  CHAT_HISTORY: 'chatHistory',
} as const;

export async function saveScoreHistory(history: ScoreHistory): Promise<void> {
  try {
    const existing = await chrome.storage.local.get(STORAGE_KEYS.SCORE_HISTORY);
    const historyList: ScoreHistory[] = existing[STORAGE_KEYS.SCORE_HISTORY] || [];
    
    // 최근 10개만 유지
    const updated = [history, ...historyList].slice(0, 10);
    
    await chrome.storage.local.set({ [STORAGE_KEYS.SCORE_HISTORY]: updated });
  } catch (error) {
    console.error('점수 히스토리 저장 오류:', error);
  }
}

export async function getScoreHistory(url?: string): Promise<ScoreHistory[]> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SCORE_HISTORY);
    const historyList: ScoreHistory[] = result[STORAGE_KEYS.SCORE_HISTORY] || [];
    
    if (url) {
      return historyList.filter(h => h.url === url);
    }
    
    return historyList;
  } catch (error) {
    console.error('점수 히스토리 조회 오류:', error);
    return [];
  }
}

