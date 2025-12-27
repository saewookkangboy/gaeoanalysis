import { useState, useEffect, useRef } from 'react';
import { AnalysisResult } from '@/types/analysis';
import { Message } from '@/types/chat';
import { sendChatMessage, generateSuggestions, saveChatHistory, loadChatHistory } from '@/utils/chat';
import MarkdownRenderer from './MarkdownRenderer';

interface AIAgentCompactProps {
  analysisData: AnalysisResult | null;
  aioAnalysis: any;
  url: string;
}

export default function AIAgentCompact({ analysisData, aioAnalysis, url }: AIAgentCompactProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quickQuestions, setQuickQuestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const analysisIdRef = useRef<string | null>(null);

  // 분석 ID 생성
  useEffect(() => {
    if (analysisData) {
      analysisIdRef.current = analysisData.id || `${url}-${Date.now()}`;
    }
  }, [analysisData, url]);

  // 스크롤 하단으로
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 대화 이력 불러오기
  useEffect(() => {
    if (analysisData && analysisIdRef.current && isExpanded) {
      loadChatHistory(analysisIdRef.current).then((savedMessages) => {
        if (savedMessages.length > 0) {
          setMessages(savedMessages);
        } else {
          // 환영 메시지
          const welcomeMessage: Message = {
            role: 'assistant',
            content: `안녕하세요! 👋 GAEO 분석 결과를 확인했습니다.\n\n📊 현재 점수:\n- 종합: ${analysisData.overallScore}/100\n- AEO: ${analysisData.aeoScore}/100\n- GEO: ${analysisData.geoScore}/100\n- SEO: ${analysisData.seoScore}/100\n\n어떤 부분에 대해 궁금하신가요?`,
            timestamp: new Date(),
          };
          setMessages([welcomeMessage]);
        }
      });
    }
  }, [analysisData, isExpanded]);

  // 추천 질문 생성
  useEffect(() => {
    if (analysisData && isExpanded && quickQuestions.length === 0) {
      const userQuestions = messages
        .filter(msg => msg.role === 'user')
        .map(msg => msg.content);

      generateSuggestions(
        analysisData,
        aioAnalysis,
        messages,
        userQuestions
      ).then(setQuickQuestions);
    }
  }, [analysisData, aioAnalysis, messages, isExpanded, quickQuestions.length]);

  // 메시지 전송
  const handleSendMessage = async () => {
    if (!input.trim() || !analysisData || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(
        userMessage.content,
        analysisData,
        aioAnalysis,
        messages
      );

      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // 대화 이력 저장
      if (analysisIdRef.current) {
        await saveChatHistory(
          analysisIdRef.current,
          url,
          [...messages, userMessage, assistantMessage]
        );
      }

      // 추천 질문 재생성
      const newQuickQuestions = await generateSuggestions(
        analysisData,
        aioAnalysis,
        [...messages, userMessage, assistantMessage],
        [...messages.filter(m => m.role === 'user').map(m => m.content), userMessage.content]
      );
      setQuickQuestions(newQuickQuestions);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '응답 생성 중 오류가 발생했습니다.';
      const errorMsg: Message = {
        role: 'assistant',
        content: `❌ 오류: ${errorMessage}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // 빠른 질문 클릭
  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  if (!analysisData) {
    return null;
  }

  return (
    <div className="rounded-lg border-2 border-gray-200 bg-gradient-to-br from-white to-sky-50/30 p-4 shadow-md">
      {/* 헤더 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 text-white text-sm">
            🤖
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">AI 개선 가이드</h3>
            <p className="text-xs text-gray-600">맞춤형 개선 방향 제시</p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-sky-600 hover:text-sky-700 font-semibold"
        >
          {isExpanded ? '접기' : '펼치기'}
        </button>
      </div>

      {/* 채팅 영역 */}
      {isExpanded && (
        <div className="space-y-3">
          {/* 메시지 목록 */}
          <div className="max-h-64 overflow-y-auto space-y-2 rounded-lg border border-gray-200 bg-white p-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-2 text-xs ${
                    message.role === 'user'
                      ? 'bg-sky-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <MarkdownRenderer content={message.content} />
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-gray-100 p-2 text-xs text-gray-600">
                  <span className="animate-pulse">답변 생성 중...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 빠른 질문 버튼 */}
          {quickQuestions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuestion(question)}
                  className="rounded-full border border-sky-300 bg-white px-2 py-1 text-xs text-sky-600 hover:bg-sky-50 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          )}

          {/* 입력 영역 */}
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="질문을 입력하세요..."
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              className="rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              전송
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

