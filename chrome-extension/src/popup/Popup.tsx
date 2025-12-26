import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { AnalysisResult } from '@/types/analysis';
import { analyzeUrl, checkAuthStatus } from '@/utils/api';
import { saveScoreHistory, getScoreHistory } from '@/utils/storage';
import ScoreDashboard from './components/ScoreDashboard';
import ScoreHistoryChart from './components/ScoreHistoryChart';
import ChecklistView from './components/ChecklistView';
import './index.css';

function Popup() {
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [scoreHistory, setScoreHistory] = useState<any[]>([]);

  // 현재 탭 URL 가져오기
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        const url = tabs[0].url;
        // 특수 URL 필터링
        if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('about:')) {
          setError('이 페이지는 분석할 수 없습니다.');
          return;
        }
        setCurrentUrl(url);
      }
    });
  }, []);

  // 인증 상태 확인
  useEffect(() => {
    checkAuthStatus().then(setIsAuthenticated);
  }, []);

  // 분석 시작
  const handleAnalyze = async () => {
    if (!currentUrl.trim()) {
      setError('URL을 입력해주세요.');
      return;
    }

    if (!isAuthenticated) {
      setError('로그인이 필요합니다. 웹 서비스에서 로그인해주세요.');
      // 로그인 페이지로 이동
      chrome.tabs.create({ url: 'https://gaeoanalysis.vercel.app/login' });
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisData(null);

    try {
      const result = await analyzeUrl(currentUrl);
      setAnalysisData(result);

      // 점수 히스토리 저장
      if (result) {
        await saveScoreHistory({
          url: currentUrl,
          timestamp: Date.now(),
          scores: {
            overall: result.overallScore,
            aeo: result.aeoScore,
            geo: result.geoScore,
            seo: result.seoScore,
            aio: result.aioAnalysis?.scores,
          },
        });

        // 히스토리 로드
        const history = await getScoreHistory(currentUrl);
        setScoreHistory(history);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.';
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 전체 결과 보기
  const handleViewFullResults = () => {
    if (analysisData?.id) {
      chrome.tabs.create({ 
        url: `https://gaeoanalysis.vercel.app/?analysisId=${analysisData.id}` 
      });
    } else {
      chrome.tabs.create({ url: 'https://gaeoanalysis.vercel.app' });
    }
  };

  return (
    <div className="w-[400px] min-h-[600px] bg-white">
      {/* 헤더 */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-sky-500 to-indigo-500 p-4 text-white">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">GAEO Analysis</h1>
          <button
            onClick={() => chrome.tabs.create({ url: 'https://gaeoanalysis.vercel.app' })}
            className="text-xs hover:underline"
          >
            설정
          </button>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="p-4 space-y-4">
        {/* URL 입력 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            현재 페이지
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={currentUrl}
              onChange={(e) => setCurrentUrl(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="URL을 입력하세요"
            />
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !currentUrl.trim()}
              className="rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? '분석 중...' : '🚀 분석'}
            </button>
          </div>
        </div>

        {/* 인증 상태 */}
        {!isAuthenticated && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
            로그인이 필요합니다. 웹 서비스에서 로그인해주세요.
          </div>
        )}

        {/* 에러 표시 */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* 점수 대시보드 */}
        <ScoreDashboard analysisData={analysisData} isLoading={isAnalyzing} />

        {/* 체크리스트 */}
        {analysisData && (
          <ChecklistView analysisData={analysisData} url={currentUrl} />
        )}

        {/* 점수 히스토리 */}
        {scoreHistory.length > 0 && (
          <ScoreHistoryChart history={scoreHistory} />
        )}

        {/* 전체 결과 보기 버튼 */}
        {analysisData && (
          <button
            onClick={handleViewFullResults}
            className="w-full rounded-lg border-2 border-sky-500 bg-white px-4 py-2 text-sm font-semibold text-sky-600 transition-all hover:bg-sky-50"
          >
            📊 전체 결과 보기
          </button>
        )}
      </div>
    </div>
  );
}

// React 앱 마운트
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}

