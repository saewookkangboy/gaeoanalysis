'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AnalysisResult } from '@/lib/analyzer';
import { useToast } from '@/components/Toast';

interface RevisionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  analysisData: AnalysisResult | null;
  url: string;
}

type ViewMode = 'preview' | 'compare' | 'changes';
type CopyFormat = 'markdown' | 'html' | 'text';

export default function RevisionPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  analysisData,
  url,
}: RevisionPreviewModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [preview, setPreview] = useState<{
    revisedMarkdown: string;
    originalContent?: string;
    changes?: Array<{
      type: 'added' | 'removed' | 'modified';
      section: string;
      description: string;
      reason: string;
    }>;
    predictedScores?: {
      seo: number;
      aeo: number;
      geo: number;
      overall: number;
    };
    improvements: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [copyFormat, setCopyFormat] = useState<CopyFormat>('markdown');
  const { showToast } = useToast();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleGeneratePreview = async () => {
    if (!analysisData || !url) return;

    setIsLoading(true);
    setError(null);

    try {
      const startTime = Date.now();
      const response = await fetch('/api/content/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          analysisResult: analysisData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '미리보기 생성 실패');
      }

      const data = await response.json();
      const elapsedTime = Date.now() - startTime;
      console.log(`✅ 미리보기 생성 완료 (${elapsedTime}ms)`);
      
      // 원본 콘텐츠 추출 및 변경 사항 분석
      const originalContent = await extractOriginalContent(url);
      const changes = analyzeChanges(originalContent, data.preview.revisedMarkdown, analysisData);
      
      setPreview({
        ...data.preview,
        originalContent,
        changes,
      });
    } catch (err: any) {
      console.error('미리보기 생성 오류:', err);
      setError(err.message || '미리보기를 생성할 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 원본 콘텐츠 추출
  const extractOriginalContent = async (url: string): Promise<string> => {
    try {
      const response = await fetch(`/api/content/extract?url=${encodeURIComponent(url)}`);
      if (response.ok) {
        const data = await response.json();
        return data.content || '';
      }
    } catch (error) {
      console.warn('원본 콘텐츠 추출 실패:', error);
    }
    return '';
  };

  // 변경 사항 분석 (분석 결과 기반)
  const analyzeChanges = (
    original: string,
    revised: string,
    analysis: AnalysisResult
  ): Array<{
    type: 'added' | 'removed' | 'modified';
    section: string;
    description: string;
    reason: string;
  }> => {
    const changes: Array<{
      type: 'added' | 'removed' | 'modified';
      section: string;
      description: string;
      reason: string;
    }> = [];

    // SEO 개선 사항
    const hasH1 = revised.includes('<h1>') || revised.match(/^#\s+/m);
    const needsH1 = analysis.seoScore < 70 && !hasH1;
    if (needsH1) {
      const seoInsight = analysis.insights?.find(
        (i) => i.category === 'SEO' && i.severity === 'High' && i.message.includes('제목')
      );
      changes.push({
        type: 'added',
        section: 'SEO - 제목 구조',
        description: 'H1 태그 추가/개선',
        reason: seoInsight?.message || '검색 엔진 최적화를 위한 명확한 제목 구조',
      });
    }

    // AEO 개선 사항
    const hasFAQ = revised.toLowerCase().includes('faq') || 
                   revised.includes('자주 묻는 질문') || 
                   revised.includes('질문과 답변');
    const needsFAQ = analysis.aeoScore < 70 && !hasFAQ;
    if (needsFAQ) {
      const aeoInsight = analysis.insights?.find(
        (i) => i.category === 'AEO' && i.severity === 'High'
      );
      changes.push({
        type: 'added',
        section: 'AEO - FAQ 섹션',
        description: '자주 묻는 질문 섹션 추가',
        reason: aeoInsight?.message || 'AI 검색 엔진 최적화를 위한 질문-답변 형식',
      });
    }

    // 질문 형식 콘텐츠
    const questionCount = (revised.match(/[?？]/g)?.length || 0);
    if (questionCount > 3 && analysis.aeoScore < 80) {
      changes.push({
        type: 'added',
        section: 'AEO - 질문 형식',
        description: `질문 형식 콘텐츠 추가 (${questionCount}개 질문)`,
        reason: 'AI 검색 엔진이 답변하기 쉬운 구조로 개선',
      });
    }

    // GEO 개선 사항 - 콘텐츠 길이
    const originalWordCount = original.split(/\s+/).filter(Boolean).length;
    const revisedWordCount = revised.split(/\s+/).filter(Boolean).length;
    if (revisedWordCount > originalWordCount * 1.2) {
      const geoInsight = analysis.insights?.find(
        (i) => i.category === 'GEO' && i.severity === 'High'
      );
      changes.push({
        type: 'added',
        section: 'GEO - 콘텐츠 확장',
        description: `콘텐츠 길이 증가 (${originalWordCount} → ${revisedWordCount} 단어, ${Math.round((revisedWordCount / originalWordCount - 1) * 100)}% 증가)`,
        reason: geoInsight?.message || '깊이 있는 정보 제공을 통한 전문성 강화',
      });
    }

    // 구조화된 데이터
    const hasSchema = revised.includes('schema.org') || 
                      revised.includes('application/ld+json') ||
                      revised.includes('구조화된 데이터');
    if (hasSchema && analysis.seoScore < 80) {
      changes.push({
        type: 'added',
        section: 'SEO - 구조화된 데이터',
        description: 'Schema.org 구조화된 데이터 추가',
        reason: '검색 결과 향상을 위한 구조화된 정보 제공',
      });
    }

    // 이미지 alt 속성
    const imgMatches = revised.match(/!\[([^\]]*)\]/g) || [];
    if (imgMatches.length > 0) {
      changes.push({
        type: 'added',
        section: 'SEO - 이미지 최적화',
        description: `이미지 alt 속성 추가/개선 (${imgMatches.length}개 이미지)`,
        reason: '접근성 및 검색 엔진 최적화',
      });
    }

    // 개선 우선순위 기반 변경 사항
    if (analysis.improvementPriorities) {
      analysis.improvementPriorities
        .slice(0, 3)
        .forEach((priority) => {
          if (priority.actionableTips && priority.actionableTips.length > 0) {
            const tip = priority.actionableTips[0];
            changes.push({
              type: 'added',
              section: `${priority.category} - ${tip.title}`,
              description: tip.steps[0] || '개선 사항 적용',
              reason: priority.reason || tip.expectedImpact,
            });
          }
        });
    }

    return changes.length > 0 ? changes : [
      {
        type: 'modified',
        section: '전반적 개선',
        description: '분석 결과를 바탕으로 콘텐츠 최적화',
        reason: 'SEO/AEO/GEO 점수 향상을 위한 종합 개선',
      },
    ];
  };

  // 복사 기능 (다양한 형식 지원)
  const handleCopy = async (format: CopyFormat = copyFormat) => {
    if (!preview) return;

    let textToCopy = '';
    
    try {
      switch (format) {
        case 'markdown':
          textToCopy = preview.revisedMarkdown;
          break;
        case 'html':
          // 마크다운을 HTML로 변환 (간단한 변환)
          textToCopy = await convertMarkdownToHtml(preview.revisedMarkdown);
          break;
        case 'text':
          // HTML 태그 및 마크다운 문법 제거
          textToCopy = preview.revisedMarkdown
            .replace(/<[^>]*>/g, '') // HTML 태그 제거
            .replace(/#{1,6}\s+/g, '') // 헤더 마크다운 제거
            .replace(/\*\*([^*]+)\*\*/g, '$1') // 볼드 제거
            .replace(/\*([^*]+)\*/g, '$1') // 이탤릭 제거
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // 링크 제거
            .replace(/`([^`]+)`/g, '$1') // 인라인 코드 제거
            .trim();
          break;
      }

      await navigator.clipboard.writeText(textToCopy);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setCopySuccess(true);
      showToast(`${format.toUpperCase()} 형식으로 복사되었습니다!`, 'success');
      timeoutRef.current = setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('복사 실패:', err);
      showToast('복사에 실패했습니다.', 'error');
    }
  };

  // 마크다운을 HTML로 변환 (서버 API 호출)
  const convertMarkdownToHtml = async (markdown: string): Promise<string> => {
    try {
      const response = await fetch('/api/content/markdown-to-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.html;
      }
    } catch (error) {
      console.warn('HTML 변환 실패, 마크다운 반환:', error);
    }
    
    // 변환 실패 시 마크다운 그대로 반환
    return markdown;
  };

  // 마크다운 텍스트 정리 (HTML 태그 제거 및 텍스트 중심으로)
  const cleanMarkdownForDisplay = (markdown: string): string => {
    // HTML 태그가 많이 포함된 경우 텍스트만 추출
    if (markdown.match(/<[^>]+>/g)?.length && markdown.match(/<[^>]+>/g)!.length > markdown.length / 20) {
      // HTML 태그를 제거하고 텍스트만 추출
      let cleaned = markdown
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // script 태그 제거
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // style 태그 제거
        .replace(/<[^>]+>/g, ' ') // 나머지 HTML 태그 제거
        .replace(/\s+/g, ' ') // 연속된 공백 정리
        .trim();
      
      // 마크다운 형식으로 변환 시도
      cleaned = cleaned
        .replace(/^#\s+(.+)$/gm, '# $1') // 헤더 정리
        .replace(/\*\*(.+?)\*\*/g, '**$1**') // 볼드 유지
        .replace(/\*(.+?)\*/g, '*$1*'); // 이탤릭 유지
      
      return cleaned;
    }
    
    // 일반 마크다운은 그대로 반환
    return markdown;
  };

  // 텍스트 콘텐츠만 추출 (HTML 태그 제거)
  const extractTextContent = (html: string): string => {
    // HTML 태그 제거
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return text;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[95vh] rounded-xl border-2 border-gray-200 bg-white shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="sticky top-0 bg-gradient-to-r from-sky-50 to-indigo-50 border-b-2 border-gray-200 px-6 py-5 z-10 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-3xl">✍️</span>
                콘텐츠 수정안 미리 보기
              </h2>
              <p className="mt-1.5 text-sm text-gray-600">개선된 콘텐츠를 완성형으로 확인하세요</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 hover:bg-white rounded-full p-2 transition-all"
              aria-label="닫기"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto p-6">
          {!preview && !isLoading && !error && (
            <div className="text-center py-8">
              <div className="mb-4 text-4xl">👀</div>
              <p className="text-gray-600 mb-6">
                미리보기를 생성하면 개선된 콘텐츠와 예상 점수를 확인할 수 있습니다.
              </p>
              <button
                onClick={handleGeneratePreview}
                className="rounded-lg bg-sky-600 px-6 py-3 text-white font-semibold hover:bg-sky-700 transition-colors"
              >
                미리보기 생성
              </button>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-sky-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">미리보기를 생성하는 중...</p>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-red-800">{error}</p>
              <button
                onClick={handleGeneratePreview}
                className="mt-4 text-sm text-red-600 hover:text-red-800 underline"
              >
                다시 시도
              </button>
            </div>
          )}

          {preview && (
            <div className="space-y-6">
              {/* 뷰 모드 선택 */}
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
                <button
                  onClick={() => setViewMode('preview')}
                  className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                    viewMode === 'preview'
                      ? 'bg-white text-sky-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📄 미리보기
                </button>
                <button
                  onClick={() => setViewMode('compare')}
                  className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                    viewMode === 'compare'
                      ? 'bg-white text-sky-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  ⚖️ 비교
                </button>
                <button
                  onClick={() => setViewMode('changes')}
                  className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                    viewMode === 'changes'
                      ? 'bg-white text-sky-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📊 변경 사항
                </button>
              </div>

              {/* 예상 점수 */}
              {preview.predictedScores && (
                <div className="rounded-lg border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-indigo-50 p-5 shadow-sm">
                  <h3 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span>📈</span>
                    예상 점수 변화
                  </h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                      { label: 'SEO', score: preview.predictedScores.seo, original: analysisData?.seoScore || 0 },
                      { label: 'AEO', score: preview.predictedScores.aeo, original: analysisData?.aeoScore || 0 },
                      { label: 'GEO', score: preview.predictedScores.geo, original: analysisData?.geoScore || 0 },
                      { label: '종합', score: preview.predictedScores.overall, original: analysisData?.overallScore || 0 },
                    ].map(({ label, score, original }) => {
                      const diff = score - original;
                      return (
                        <div key={label} className="rounded-lg bg-white p-4 shadow-sm">
                          <div className="text-xs text-gray-600 mb-1">{label}</div>
                          <div className="text-2xl font-bold text-sky-600 mb-1">
                            {score}
                          </div>
                          <div className="text-xs">
                            <span className="text-gray-500">이전: </span>
                            <span className="font-medium">{original}</span>
                            <span className={`ml-2 font-semibold ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {diff >= 0 ? '+' : ''}{diff}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 변경 사항 상세 (changes 모드) */}
              {viewMode === 'changes' && preview.changes && preview.changes.length > 0 && (
                <div className="rounded-lg border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-5">
                  <h3 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span>🔍</span>
                    분석 기반 변경 사항
                  </h3>
                  <div className="space-y-3">
                    {preview.changes.map((change, idx) => (
                      <div
                        key={idx}
                        className={`rounded-lg border-2 p-4 ${
                          change.type === 'added'
                            ? 'border-green-200 bg-green-50'
                            : change.type === 'removed'
                            ? 'border-red-200 bg-red-50'
                            : 'border-yellow-200 bg-yellow-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`text-xl ${
                            change.type === 'added'
                              ? 'text-green-600'
                              : change.type === 'removed'
                              ? 'text-red-600'
                              : 'text-yellow-600'
                          }`}>
                            {change.type === 'added' ? '➕' : change.type === 'removed' ? '➖' : '✏️'}
                          </span>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 mb-1">{change.section}</div>
                            <div className="text-sm text-gray-700 mb-2">{change.description}</div>
                            <div className="text-xs text-gray-600 bg-white/50 rounded px-2 py-1 inline-block">
                              💡 {change.reason}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 개선 사항 */}
              {preview.improvements && preview.improvements.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <h3 className="mb-3 font-semibold text-gray-900 flex items-center gap-2">
                    <span>✨</span>
                    주요 개선 사항
                  </h3>
                  <ul className="space-y-2">
                    {preview.improvements.map((improvement, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-green-600 mt-0.5 font-bold">✓</span>
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 콘텐츠 뷰 */}
              {viewMode === 'preview' && (
                <div className="mt-6">
                  <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <span>📄</span>
                      수정된 콘텐츠 (완성형)
                    </h3>
                    <div className="flex items-center gap-2">
                      {/* 복사 형식 선택 */}
                      <select
                        value={copyFormat}
                        onChange={(e) => setCopyFormat(e.target.value as CopyFormat)}
                        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="markdown">Markdown</option>
                        <option value="html">HTML</option>
                        <option value="text">텍스트</option>
                      </select>
                      <button
                        onClick={() => handleCopy()}
                        className={`text-xs font-medium flex items-center gap-1 transition-colors px-3 py-1.5 rounded-md ${
                          copySuccess
                            ? 'bg-green-100 text-green-700'
                            : 'bg-sky-100 text-sky-600 hover:bg-sky-200'
                        }`}
                      >
                        {copySuccess ? (
                          <>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            복사됨!
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            복사 ({copyFormat.toUpperCase()})
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="rounded-lg border-2 border-gray-200 bg-white p-6 max-h-[60vh] overflow-y-auto shadow-inner" data-allow-copy="true">
                    <div className="markdown-content prose prose-sky max-w-none" data-allow-copy="true">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-gray-900 mt-6 mb-4 pb-3 border-b-2 border-gray-300" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-2xl font-bold text-gray-900 mt-5 mb-3 pb-2 border-b border-gray-200" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2" {...props} />,
                          h4: ({node, ...props}) => <h4 className="text-lg font-semibold text-gray-900 mt-3 mb-2" {...props} />,
                          p: ({node, ...props}) => <p className="text-gray-800 mb-4 leading-relaxed text-base" {...props} />,
                          a: ({node, ...props}) => <a className="text-sky-600 hover:text-sky-700 underline font-medium" target="_blank" rel="noopener noreferrer" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-bold text-gray-900" {...props} />,
                          em: ({node, ...props}) => <em className="italic text-gray-800" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc list-outside mb-4 space-y-2 text-gray-800 ml-6" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal list-outside mb-4 space-y-2 text-gray-800 ml-6" {...props} />,
                          li: ({node, ...props}) => <li className="text-gray-800 leading-relaxed" {...props} />,
                          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-sky-500 pl-4 italic text-gray-700 my-4 bg-sky-50 py-2 rounded-r" {...props} />,
                          code: ({node, inline, ...props}: any) => 
                            inline ? (
                              <code className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded text-sm font-mono border border-sky-200" {...props} />
                            ) : (
                              <code className="block bg-gray-100 text-gray-800 p-4 rounded-lg overflow-x-auto text-sm font-mono border border-gray-300 mb-4" {...props} />
                            ),
                          pre: ({node, ...props}) => <pre className="bg-gray-100 text-gray-800 p-4 rounded-lg overflow-x-auto mb-4 border border-gray-300" {...props} />,
                          hr: ({node, ...props}) => <hr className="my-6 border-gray-300" {...props} />,
                          table: ({node, ...props}) => <div className="overflow-x-auto mb-4"><table className="w-full border-collapse border border-gray-300" {...props} /></div>,
                          th: ({node, ...props}) => <th className="border border-gray-300 bg-gray-100 px-4 py-2 text-left font-semibold text-gray-900" {...props} />,
                          td: ({node, ...props}) => <td className="border border-gray-300 px-4 py-2 text-gray-800" {...props} />,
                        }}
                      >
                        {cleanMarkdownForDisplay(preview.revisedMarkdown)}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}

              {/* 비교 뷰 */}
              {viewMode === 'compare' && preview.originalContent && (
                <div className="mt-6">
                  <h3 className="mb-3 text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <span>⚖️</span>
                    원본 vs 수정본 비교
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 원본 */}
                    <div className="rounded-lg border-2 border-gray-200 bg-white">
                      <div className="sticky top-0 bg-gray-100 border-b-2 border-gray-200 px-4 py-3 rounded-t-lg">
                        <h4 className="font-semibold text-gray-900">원본 콘텐츠</h4>
                      </div>
                      <div className="p-6 max-h-[60vh] overflow-y-auto">
                        <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed">
                          <div className="whitespace-pre-wrap text-base">
                            {extractTextContent(preview.originalContent).substring(0, 3000)}
                            {extractTextContent(preview.originalContent).length > 3000 && '...'}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* 수정본 */}
                    <div className="rounded-lg border-2 border-sky-200 bg-white">
                      <div className="sticky top-0 bg-sky-100 border-b-2 border-sky-200 px-4 py-3 rounded-t-lg">
                        <h4 className="font-semibold text-gray-900">수정된 콘텐츠</h4>
                      </div>
                      <div className="p-6 max-h-[60vh] overflow-y-auto">
                        <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-3 pb-2 border-b border-gray-200" {...props} />,
                              h2: ({node, ...props}) => <h2 className="text-xl font-bold text-gray-900 mt-3 mb-2 pb-1 border-b border-gray-200" {...props} />,
                              h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-gray-900 mt-3 mb-2" {...props} />,
                              p: ({node, ...props}) => <p className="text-gray-800 mb-3 leading-relaxed text-base" {...props} />,
                              strong: ({node, ...props}) => <strong className="font-bold text-gray-900" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc list-outside mb-3 space-y-1 text-gray-800 ml-5" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal list-outside mb-3 space-y-1 text-gray-800 ml-5" {...props} />,
                              li: ({node, ...props}) => <li className="text-gray-800 leading-relaxed" {...props} />,
                            }}
                          >
                            {(() => {
                              const cleaned = cleanMarkdownForDisplay(preview.revisedMarkdown);
                              return cleaned.length > 3000 
                                ? cleaned.substring(0, 3000) + '...'
                                : cleaned;
                            })()}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-200 px-6 py-4 flex justify-end gap-3 shadow-lg">
          <button
            onClick={onClose}
            className="rounded-lg border-2 border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all"
          >
            닫기
          </button>
          {preview && (
            <button
              onClick={onConfirm}
              className="rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:from-sky-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              수정 진행하기 →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

