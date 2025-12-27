import { AnalysisResult } from '@/types/analysis';
import { Message, ChatHistory } from '@/types/chat';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://gaeoanalysis.vercel.app'
  : 'http://localhost:3000';

const STORAGE_KEY = 'chatHistory';

// 세션 쿠키 가져오기
async function getSessionCookie(): Promise<string | null> {
  try {
    const cookies = await chrome.cookies.getAll({
      domain: '.gaeoanalysis.vercel.app',
      name: 'authjs.session-token'
    });
    
    if (cookies.length > 0 && cookies[0].value) {
      return `${cookies[0].name}=${cookies[0].value}`;
    }
    return null;
  } catch (error) {
    console.error('세션 쿠키 가져오기 오류:', error);
    return null;
  }
}

// AI Agent 채팅 API 호출
export async function sendChatMessage(
  message: string,
  analysisData: AnalysisResult | null,
  aioAnalysis: any,
  conversationHistory: Message[]
): Promise<string> {
  try {
    const sessionCookie = await getSessionCookie();
    
    if (!sessionCookie) {
      throw new Error('로그인이 필요합니다.');
    }

    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie,
      },
      body: JSON.stringify({
        message,
        analysisData,
        aioAnalysis,
        conversationHistory: conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: '응답 생성 중 오류가 발생했습니다.' }));
      throw new Error(errorData.error?.message || errorData.error || '응답 생성 중 오류가 발생했습니다.');
    }

    const data = await response.json();
    return data.response || '응답을 생성할 수 없습니다.';
  } catch (error) {
    console.error('채팅 API 호출 오류:', error);
    throw error;
  }
}

// 추천 질문 생성
export async function generateSuggestions(
  analysisData: AnalysisResult | null,
  aioAnalysis: any,
  conversationHistory: Message[],
  askedQuestions: string[]
): Promise<string[]> {
  try {
    const sessionCookie = await getSessionCookie();
    
    if (!sessionCookie) {
      return getDefaultQuestions();
    }

    const response = await fetch(`${API_BASE_URL}/api/chat/suggestions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie,
      },
      body: JSON.stringify({
        analysisData,
        aioAnalysis,
        conversationHistory: conversationHistory.slice(-5).map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        askedQuestions,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.questions && data.questions.length > 0) {
        return data.questions;
      }
    }
    
    return getDefaultQuestions();
  } catch (error) {
    console.error('추천 질문 생성 오류:', error);
    return getDefaultQuestions();
  }
}

// 기본 질문
function getDefaultQuestions(): string[] {
  return [
    '점수를 올리는 방법은?',
    '개선 우선순위는?',
    'AI 모델별 최적화 팁은?',
  ];
}

// 대화 이력 저장
export async function saveChatHistory(
  analysisId: string,
  url: string,
  messages: Message[]
): Promise<void> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const histories: Record<string, ChatHistory> = result[STORAGE_KEY] || {};
    
    histories[analysisId] = {
      analysisId,
      url,
      messages: messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp,
      })),
      lastUpdated: Date.now(),
    };
    
    await chrome.storage.local.set({ [STORAGE_KEY]: histories });
  } catch (error) {
    console.error('대화 이력 저장 오류:', error);
  }
}

// 대화 이력 불러오기
export async function loadChatHistory(analysisId: string): Promise<Message[]> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const histories: Record<string, ChatHistory> = result[STORAGE_KEY] || {};
    
    const history = histories[analysisId];
    if (history && history.messages) {
      return history.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
    }
    
    return [];
  } catch (error) {
    console.error('대화 이력 불러오기 오류:', error);
    return [];
  }
}

