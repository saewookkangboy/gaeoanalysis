export interface AnalysisResult {
  id?: string;
  aeoScore: number;
  geoScore: number;
  seoScore: number;
  overallScore: number;
  insights: Insight[];
  aioAnalysis?: AIOCitationAnalysis;
  improvementPriorities?: Array<{
    category: string;
    priority: number;
    reason: string;
    actionableTips?: Array<{
      title: string;
      steps: string[];
      expectedImpact: string;
    }>;
  }>;
  contentGuidelines?: string[];
  createdAt?: string;
}

export interface Insight {
  severity: 'High' | 'Medium' | 'Low';
  category: string;
  message: string;
}

export interface AIOCitationAnalysis {
  scores: {
    chatgpt: number;
    perplexity: number;
    gemini: number;
    claude: number;
  };
  insights: Array<{
    model: 'chatgpt' | 'perplexity' | 'gemini' | 'claude';
    score: number;
    level: 'High' | 'Medium' | 'Low';
    recommendations: string[];
  }>;
}

export interface ScoreHistory {
  url: string;
  timestamp: number;
  scores: {
    overall: number;
    aeo: number;
    geo: number;
    seo: number;
    aio?: {
      chatgpt: number;
      perplexity: number;
      gemini: number;
      claude: number;
    };
  };
}

