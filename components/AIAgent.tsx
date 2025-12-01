'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { AnalysisResult } from '@/lib/analyzer';
import { AIOCitationAnalysis } from '@/lib/ai-citation-analyzer';
import { getQuickQuestions } from '@/lib/ai-agent-prompt';
// 하이라이트 스타일은 globals.css에서 처리

interface AIAgentProps {
  analysisData: AnalysisResult | null;
  aioAnalysis: AIOCitationAnalysis | null;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIAgent({ analysisData, aioAnalysis }: AIAgentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [quickQuestions, setQuickQuestions] = useState<string[]>([]);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [lastAnalysisSignature, setLastAnalysisSignature] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 분석 데이터에서 ID 추출 및 변경 감지
  useEffect(() => {
    if (analysisData) {
      // 분석 데이터의 고유 시그니처 생성 (점수 조합으로 고유성 판단)
      const signature = `${analysisData.overallScore}-${analysisData.aeoScore}-${analysisData.geoScore}-${analysisData.seoScore}`;
      
      // ID가 있으면 사용, 없으면 시그니처 사용
      const currentId = (analysisData as any).id || signature;
      setAnalysisId(currentId);
      
      // 분석 데이터가 변경되었는지 확인 (새로운 분석인 경우)
      if (signature !== lastAnalysisSignature) {
        setLastAnalysisSignature(signature);
        // 새로운 분석이면 추천 질문 초기화 (새로운 질문 생성)
        setQuickQuestions([]);
        // 메시지도 초기화 (새로운 세션)
        setMessages([]);
      }
    }
  }, [analysisData, lastAnalysisSignature]);

  // 추천 질문 생성 함수 (useCallback으로 메모이제이션)
  const generateSuggestions = useCallback(async () => {
    if (!analysisData) return;
    
    setIsGeneratingSuggestions(true);
    try {
      const userQuestions = messages
        .filter(msg => msg.role === 'user')
        .map(msg => msg.content);

      const response = await fetch('/api/chat/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisData,
          aioAnalysis,
          conversationHistory: messages.slice(-5).map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          askedQuestions: userQuestions,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.questions && data.questions.length > 0) {
          setQuickQuestions(data.questions);
        } else {
          // API가 질문을 반환하지 않으면 기본 질문 사용
          setQuickQuestions(getQuickQuestions(analysisData));
        }
      } else {
        // API 실패 시 기본 질문 사용
        setQuickQuestions(getQuickQuestions(analysisData));
      }
    } catch (error) {
      console.error('추천 질문 생성 실패:', error);
      // 에러 발생 시 기본 질문 사용
      setQuickQuestions(getQuickQuestions(analysisData));
    } finally {
      setIsGeneratingSuggestions(false);
    }
  }, [analysisData, aioAnalysis, messages]);

  // 분석 데이터가 변경되거나 추천 질문이 없을 때 생성
  useEffect(() => {
    if (analysisData && quickQuestions.length === 0) {
      // 분석 데이터가 있고 추천 질문이 없으면 생성
      generateSuggestions();
    }
  }, [analysisData, quickQuestions.length, generateSuggestions]);

  // 분석 데이터가 변경되면 환영 메시지 표시 및 이전 대화 로드
  useEffect(() => {
    if (analysisData && messages.length === 0 && isOpen) {
      // 이전 대화 이력 로드
      if (analysisId) {
        loadChatHistory();
      }

      const welcomeMessage: Message = {
        role: 'assistant',
        content: `안녕하세요! 👋 GAEO 분석 결과를 확인했습니다.\n\n📊 현재 점수:\n- 종합 점수: ${analysisData.overallScore}/100\n- AEO: ${analysisData.aeoScore}/100\n- GEO: ${analysisData.geoScore}/100\n- SEO: ${analysisData.seoScore}/100\n\n어떤 부분에 대해 궁금하신가요? 아래 빠른 질문을 선택하거나 직접 질문해주세요!`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [analysisData, isOpen, analysisId]);

  // 분석 데이터가 변경되거나 추천 질문이 없을 때 생성
  useEffect(() => {
    if (analysisData && quickQuestions.length === 0) {
      // 분석 데이터가 있고 추천 질문이 없으면 생성
      generateSuggestions();
    }
  }, [analysisData, quickQuestions.length, generateSuggestions]);

  // 분석 데이터가 변경되면 환영 메시지 표시 및 이전 대화 로드
  useEffect(() => {
    if (analysisData && messages.length === 0 && isOpen) {
      // 이전 대화 이력 로드
      if (analysisId) {
        loadChatHistory();
      }

      const welcomeMessage: Message = {
        role: 'assistant',
        content: `안녕하세요! 👋 GAEO 분석 결과를 확인했습니다.\n\n📊 현재 점수:\n- 종합 점수: ${analysisData.overallScore}/100\n- AEO: ${analysisData.aeoScore}/100\n- GEO: ${analysisData.geoScore}/100\n- SEO: ${analysisData.seoScore}/100\n\n어떤 부분에 대해 궁금하신가요? 아래 빠른 질문을 선택하거나 직접 질문해주세요!`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [analysisData, isOpen, analysisId]);

  const loadChatHistory = async () => {
    if (!analysisId) return;

    try {
      const response = await fetch(`/api/chat/history?analysisId=${analysisId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.conversations && data.conversations.length > 0) {
          const savedMessages = data.conversations[0].messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp || Date.now()),
          }));
          setMessages(savedMessages);
        }
      }
    } catch (error) {
      console.error('대화 이력 로드 실패:', error);
    }
  };

  const saveChatHistory = async () => {
    if (!analysisId || messages.length === 0) return;

    try {
      await fetch('/api/chat/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId,
          messages: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp.toISOString(),
          })),
        }),
      });
    } catch (error) {
      console.error('대화 저장 실패:', error);
    }
  };

  // 메시지가 변경될 때마다 저장
  useEffect(() => {
    if (messages.length > 1 && analysisId) {
      const timer = setTimeout(() => {
        saveChatHistory();
      }, 2000); // 2초 후 저장 (디바운싱)

      return () => clearTimeout(timer);
    }
  }, [messages, analysisId]);

  const handleSend = async (question?: string) => {
    const messageToSend = question || input.trim();
    if (!messageToSend || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
    };

    setInput('');
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // 로딩 메시지 추가
    const loadingMessage: Message = {
      role: 'assistant',
      content: '잠시만요, 곧 답변 드릴게요... ⏳',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      // 대화 이력을 API에 전달
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          analysisData: analysisData,
          aioAnalysis: aioAnalysis,
          conversationHistory: conversationHistory,
        }),
      });

      const data = await response.json();

      // 로딩 메시지 제거
      setMessages((prev) => prev.filter((msg, idx) => 
        !(msg.role === 'assistant' && msg.content === '잠시만요, 곧 답변 드릴게요... ⏳')
      ));

      if (response.ok) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        
        // 응답 후 새로운 추천 질문 생성
        setTimeout(() => {
          generateSuggestions();
        }, 500);
      } else {
        const errorMessage: Message = {
          role: 'assistant',
          content: `❌ 오류: ${data.error}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      // 로딩 메시지 제거
      setMessages((prev) => prev.filter((msg, idx) => 
        !(msg.role === 'assistant' && msg.content === '잠시만요, 곧 답변 드릴게요... ⏳')
      ));
      
      const errorMessage: Message = {
        role: 'assistant',
        content: '❌ 오류가 발생했습니다. 다시 시도해주세요.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    handleSend(question);
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // 간단한 피드백 (토스트는 나중에 추가 가능)
      const button = document.activeElement as HTMLElement;
      const originalText = button?.textContent;
      if (button) {
        button.textContent = '복사됨!';
        setTimeout(() => {
          if (button) button.textContent = originalText || '복사';
        }, 2000);
      }
    } catch (error) {
      console.error('복사 실패:', error);
    }
  };

  return (
    <>
      {/* 플로팅 버튼 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transition-all hover:from-blue-700 hover:to-purple-700 hover:shadow-xl hover:scale-110 active:scale-95 animate-fade-in"
          aria-label="AI Agent 열기"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </button>
      )}

      {/* AI Agent 모달 */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[600px] sm:h-[700px] w-[calc(100vw-3rem)] sm:w-[500px] flex-col rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-2xl animate-slide-in">
          {/* 헤더 */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white">AI Agent</h3>
                <p className="text-xs text-white/80">GAEO 전문 상담사</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button
                  onClick={handleClearChat}
                  className="rounded-md bg-white/20 px-2 py-1 text-xs text-white hover:bg-white/30"
                  title="대화 초기화"
                >
                  초기화
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-800">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                  <p className="mb-2">👋 안녕하세요! AI Agent입니다.</p>
                  <p>분석 결과에 대해 질문하거나 아래 빠른 질문을 선택해주세요.</p>
                </div>
                {quickQuestions.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">💡 추천 질문</p>
                      <button
                        onClick={generateSuggestions}
                        disabled={isGeneratingSuggestions}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 transition-colors"
                        title="새로운 추천 질문 생성"
                      >
                        {isGeneratingSuggestions ? '생성 중...' : '🔄 새로고침'}
                      </button>
                    </div>
                    {quickQuestions.map((question, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickQuestion(question)}
                        disabled={isLoading}
                        className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-left text-xs text-gray-700 dark:text-gray-300 transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 disabled:opacity-50"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`group relative max-w-[85%] rounded-lg px-4 py-3 transition-all ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        msg.content === '잠시만요, 곧 답변 드릴게요... ⏳' ? (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex gap-1">
                              <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500"></div>
                              <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500 delay-75"></div>
                              <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500 delay-150"></div>
                            </div>
                            <span>{msg.content}</span>
                          </div>
                        ) : (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight]}
                            components={{
                              // 제목 스타일
                              h1: ({ node, ...props }) => (
                                <h1 className="text-lg font-bold mt-4 mb-2 text-gray-900 dark:text-gray-100" {...props} />
                              ),
                              h2: ({ node, ...props }) => (
                                <h2 className="text-base font-semibold mt-3 mb-2 text-gray-900 dark:text-gray-100" {...props} />
                              ),
                              h3: ({ node, ...props }) => (
                                <h3 className="text-sm font-semibold mt-2 mb-1 text-gray-900 dark:text-gray-100" {...props} />
                              ),
                              // 리스트 스타일
                              ul: ({ node, ...props }) => (
                                <ul className="list-disc list-inside space-y-1 my-2 text-sm" {...props} />
                              ),
                              ol: ({ node, ...props }) => (
                                <ol className="list-decimal list-inside space-y-1 my-2 text-sm" {...props} />
                              ),
                              li: ({ node, ...props }) => (
                                <li className="text-sm leading-relaxed" {...props} />
                              ),
                              // 코드 블록 스타일
                              code: ({ node, className, children, ...props }: any) => {
                                const isInline = !className;
                                const match = /language-(\w+)/.exec(className || '');
                                return isInline ? (
                                  <code
                                    className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-sm font-mono text-pink-600 dark:text-pink-400"
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                ) : (
                                  <code
                                    className={`block p-3 rounded-lg bg-gray-900 dark:bg-gray-950 text-gray-100 text-xs font-mono overflow-x-auto my-2 ${className || ''}`}
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                );
                              },
                              pre: ({ node, children, ...props }: any) => (
                                <pre className="my-2 overflow-x-auto rounded-lg" {...props}>
                                  {children}
                                </pre>
                              ),
                              // 링크 스타일
                              a: ({ node, ...props }) => (
                                <a
                                  className="text-blue-600 dark:text-blue-400 hover:underline"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  {...props}
                                />
                              ),
                              // 강조 스타일
                              strong: ({ node, ...props }) => (
                                <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props} />
                              ),
                              em: ({ node, ...props }) => (
                                <em className="italic" {...props} />
                              ),
                              // 구분선
                              hr: ({ node, ...props }) => (
                                <hr className="my-3 border-gray-300 dark:border-gray-600" {...props} />
                              ),
                              // 인용구
                              blockquote: ({ node, ...props }) => (
                                <blockquote
                                  className="border-l-4 border-blue-500 dark:border-blue-400 pl-3 py-1 my-2 italic text-gray-700 dark:text-gray-300"
                                  {...props}
                                />
                              ),
                              // 단락
                              p: ({ node, ...props }) => (
                                <p className="text-sm leading-relaxed my-2 text-gray-900 dark:text-gray-100" {...props} />
                              ),
                            }}
                          >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        )
                      ) : (
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      )}
                      
                      {/* 복사 버튼 (assistant 메시지에만, 로딩 메시지 제외) */}
                      {msg.role === 'assistant' && msg.content !== '잠시만요, 곧 답변 드릴게요... ⏳' && (
                        <button
                          onClick={() => handleCopyMessage(msg.content)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                          title="복사"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </button>
                      )}
                      
                      <p className="mt-2 text-xs opacity-70 flex items-center justify-between">
                        <span>
                          {msg.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
                {/* 로딩 메시지는 이미 메시지 리스트에 포함됨 */}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* 입력 영역 */}
          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="질문을 입력하세요... (Enter로 전송)"
                className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50"
                disabled={isLoading}
                aria-label="질문 입력"
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="rounded-md bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-medium text-white hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all transform hover:scale-105 active:scale-95"
                aria-label="메시지 전송"
              >
                전송
              </button>
            </div>
            {quickQuestions.length > 0 && messages.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">💡 추천 질문</p>
                  <button
                    onClick={generateSuggestions}
                    disabled={isGeneratingSuggestions}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 transition-colors"
                    title="새로운 추천 질문 생성"
                  >
                    {isGeneratingSuggestions ? '생성 중...' : '🔄 새로고침'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {quickQuestions.slice(0, 3).map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickQuestion(question)}
                      disabled={isLoading}
                      className="rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors disabled:opacity-50"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

