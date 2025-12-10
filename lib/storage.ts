/**
 * 로컬 스토리지 유틸리티
 */

const STORAGE_KEYS = {
  ANALYSIS_RESULT: 'gaeo_analysis_result',
  ANALYSIS_URL: 'gaeo_analysis_url',
  URL_HISTORY: 'gaeo_url_history',
  THEME: 'theme',
  PENDING_LOGIN_URL: 'gaeo_pending_login_url', // 로그인 전 임시 저장 URL
} as const;

export const storage = {
  /**
   * 분석 결과 저장
   */
  saveAnalysisResult(data: any, url: string) {
    try {
      localStorage.setItem(STORAGE_KEYS.ANALYSIS_RESULT, JSON.stringify(data));
      localStorage.setItem(STORAGE_KEYS.ANALYSIS_URL, url);
      return true;
    } catch (error) {
      console.error('분석 결과 저장 실패:', error);
      return false;
    }
  },

  /**
   * 분석 결과 불러오기
   */
  getAnalysisResult(): { data: any; url: string } | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ANALYSIS_RESULT);
      const url = localStorage.getItem(STORAGE_KEYS.ANALYSIS_URL);
      
      if (data && url) {
        return {
          data: JSON.parse(data),
          url,
        };
      }
      return null;
    } catch (error) {
      console.error('분석 결과 불러오기 실패:', error);
      return null;
    }
  },

  /**
   * 분석 결과 삭제
   */
  clearAnalysisResult() {
    try {
      localStorage.removeItem(STORAGE_KEYS.ANALYSIS_RESULT);
      localStorage.removeItem(STORAGE_KEYS.ANALYSIS_URL);
      return true;
    } catch (error) {
      console.error('분석 결과 삭제 실패:', error);
      return false;
    }
  },

  /**
   * URL 히스토리에 추가
   */
  addUrlToHistory(url: string) {
    try {
      const history = this.getUrlHistory();
      const filtered = history.filter((u) => u !== url);
      const updated = [url, ...filtered].slice(0, 10); // 최대 10개
      localStorage.setItem(STORAGE_KEYS.URL_HISTORY, JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error('URL 히스토리 저장 실패:', error);
      return false;
    }
  },

  /**
   * URL 히스토리 불러오기
   */
  getUrlHistory(): string[] {
    try {
      const history = localStorage.getItem(STORAGE_KEYS.URL_HISTORY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('URL 히스토리 불러오기 실패:', error);
      return [];
    }
  },

  /**
   * URL 히스토리 삭제
   */
  clearUrlHistory() {
    try {
      localStorage.removeItem(STORAGE_KEYS.URL_HISTORY);
      return true;
    } catch (error) {
      console.error('URL 히스토리 삭제 실패:', error);
      return false;
    }
  },

  /**
   * 로그인 전 URL 임시 저장
   */
  savePendingLoginUrl(url: string) {
    try {
      localStorage.setItem(STORAGE_KEYS.PENDING_LOGIN_URL, url);
      return true;
    } catch (error) {
      console.error('로그인 전 URL 저장 실패:', error);
      return false;
    }
  },

  /**
   * 로그인 전 URL 불러오기
   */
  getPendingLoginUrl(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.PENDING_LOGIN_URL);
    } catch (error) {
      console.error('로그인 전 URL 불러오기 실패:', error);
      return null;
    }
  },

  /**
   * 로그인 전 URL 삭제
   */
  clearPendingLoginUrl() {
    try {
      localStorage.removeItem(STORAGE_KEYS.PENDING_LOGIN_URL);
      return true;
    } catch (error) {
      console.error('로그인 전 URL 삭제 실패:', error);
      return false;
    }
  },
};

