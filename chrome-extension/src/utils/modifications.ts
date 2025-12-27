import { AnalysisResult } from '@/types/analysis';
import { ContentModification, ModificationHistory } from '@/types/modifications';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://gaeoanalysis.vercel.app'
  : 'http://localhost:3000';

const STORAGE_KEY = 'modifications';

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

// AI를 통한 수정안 생성
export async function generateModifications(
  analysisData: AnalysisResult,
  aioAnalysis: any,
  _url: string
): Promise<ContentModification[]> {
  try {
    const sessionCookie = await getSessionCookie();
    
    if (!sessionCookie) {
      throw new Error('로그인이 필요합니다.');
    }

    // 수정안 생성 프롬프트
    const prompt = `다음 분석 결과를 바탕으로 구체적인 콘텐츠 수정안을 생성해주세요.

**분석 결과:**
- 종합 점수: ${analysisData.overallScore}/100
- AEO: ${analysisData.aeoScore}/100
- GEO: ${analysisData.geoScore}/100
- SEO: ${analysisData.seoScore}/100

**주요 인사이트:**
${analysisData.insights.slice(0, 5).map(insight => `- [${insight.severity}] ${insight.category}: ${insight.message}`).join('\n')}

**요구사항:**
1. 각 수정안은 다음 형식으로 제공:
   - type: 수정 유형 (meta-description, meta-title, h1-tag, h2-tag, image-alt, structured-data, keyword-optimization, content-structure, other)
   - title: 수정안 제목
   - before: 현재 내용 (실제 예시)
   - after: 개선된 내용 (구체적인 예시)
   - reason: 수정 이유
   - expectedImpact: 예상 효과

2. 최대 5개의 가장 중요한 수정안만 생성
3. 실행 가능하고 구체적인 내용으로 작성
4. JSON 형식으로 응답

**응답 형식:**
\`\`\`json
[
  {
    "type": "meta-description",
    "title": "메타 설명 개선",
    "before": "현재 메타 설명 내용",
    "after": "개선된 메타 설명 내용",
    "reason": "SEO 점수 향상을 위해...",
    "expectedImpact": "검색 결과 클릭률 20% 증가 예상"
  }
]
\`\`\``;

    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie,
      },
      body: JSON.stringify({
        message: prompt,
        analysisData,
        aioAnalysis,
        conversationHistory: [],
      }),
    });

    if (!response.ok) {
      throw new Error('수정안 생성 중 오류가 발생했습니다.');
    }

    const data = await response.json();
    const responseText = data.response || '';

    // JSON 추출
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      const modifications = JSON.parse(jsonMatch[1]);
      return modifications.map((mod: any, index: number) => ({
        id: `mod-${Date.now()}-${index}`,
        type: mod.type || 'other',
        title: mod.title || '수정안',
        before: mod.before || '',
        after: mod.after || '',
        reason: mod.reason || '',
        expectedImpact: mod.expectedImpact || '',
        applied: false,
      }));
    }

    // JSON이 없으면 기본 수정안 생성
    return generateDefaultModifications(analysisData);
  } catch (error) {
    console.error('수정안 생성 오류:', error);
    // 에러 발생 시 기본 수정안 반환
    return generateDefaultModifications(analysisData);
  }
}

// 기본 수정안 생성 (에러 시 사용)
function generateDefaultModifications(analysisData: AnalysisResult): ContentModification[] {
  const modifications: ContentModification[] = [];

  // High 우선순위 인사이트 기반 수정안
  const highPriorityInsights = analysisData.insights
    .filter(insight => insight.severity === 'High')
    .slice(0, 3);

  highPriorityInsights.forEach((insight, index) => {
    modifications.push({
      id: `default-mod-${Date.now()}-${index}`,
      type: 'other',
      title: `${insight.category} 개선`,
      before: '현재 상태',
      after: insight.message,
      reason: insight.message,
      expectedImpact: '점수 향상 예상',
      applied: false,
    });
  });

  return modifications;
}

// 수정안 저장
export async function saveModifications(
  analysisId: string,
  url: string,
  modifications: ContentModification[]
): Promise<void> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const histories: Record<string, ModificationHistory> = result[STORAGE_KEY] || {};
    
    histories[analysisId] = {
      analysisId,
      url,
      modifications,
      createdAt: histories[analysisId]?.createdAt || Date.now(),
      lastUpdated: Date.now(),
    };
    
    await chrome.storage.local.set({ [STORAGE_KEY]: histories });
  } catch (error) {
    console.error('수정안 저장 오류:', error);
  }
}

// 수정안 불러오기
export async function loadModifications(analysisId: string): Promise<ContentModification[]> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const histories: Record<string, ModificationHistory> = result[STORAGE_KEY] || {};
    
    const history = histories[analysisId];
    return history?.modifications || [];
  } catch (error) {
    console.error('수정안 불러오기 오류:', error);
    return [];
  }
}

// 수정안 복사
export async function copyModificationToClipboard(modification: ContentModification): Promise<void> {
  const text = `제목: ${modification.title}\n\n수정 전:\n${modification.before}\n\n수정 후:\n${modification.after}\n\n이유: ${modification.reason}\n\n예상 효과: ${modification.expectedImpact}`;
  
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error('클립보드 복사 오류:', error);
    throw error;
  }
}

