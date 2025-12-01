'use client';

import { useState } from 'react';
import { AnalysisResult } from '@/lib/analyzer';
import { useToast } from './Toast';

interface CopyButtonProps {
  analysisData: AnalysisResult | null;
  url: string;
}

export default function CopyButton({ analysisData, url }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleCopy = async () => {
    if (!analysisData) return;

    const aioSection = analysisData.aioAnalysis
      ? `\n## AI 모델별 인용 확률
- **ChatGPT**: ${analysisData.aioAnalysis.scores.chatgpt}/100
- **Perplexity**: ${analysisData.aioAnalysis.scores.perplexity}/100
- **Gemini**: ${analysisData.aioAnalysis.scores.gemini}/100
- **Claude**: ${analysisData.aioAnalysis.scores.claude}/100
`
      : '';

    const markdown = `# GAEO Analysis by allrounder 분석 결과

## URL
${url}

## 점수
- **AEO 점수**: ${analysisData.aeoScore}/100
- **GEO 점수**: ${analysisData.geoScore}/100
- **SEO 점수**: ${analysisData.seoScore}/100
- **종합 점수**: ${analysisData.overallScore}/100${aioSection}

## 개선 가이드

${analysisData.insights
  .map(
    (insight) => `### ${insight.severity} - ${insight.category}
${insight.message}`
  )
  .join('\n\n')}
`;

    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      showToast('결과가 클립보드에 복사되었습니다!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('복사 실패:', error);
      showToast('복사에 실패했습니다.', 'error');
    }
  };

  return (
    <button
      onClick={handleCopy}
      disabled={!analysisData}
      data-allow-copy="true"
      className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-black hover:bg-black hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      aria-label="분석 결과 복사"
      onContextMenu={(e) => e.stopPropagation()}
    >
      {copied ? (
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
          결과 복사
        </>
      )}
    </button>
  );
}

