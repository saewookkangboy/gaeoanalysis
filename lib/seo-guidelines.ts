/**
 * AI SEO, AEO, GEO, AIO 가이드라인 및 개선 가이드
 * 참고: https://github.com/saewookkangboy/ai-seo-blogger
 */

export interface ContentGuideline {
  category: 'AI SEO' | 'AEO' | 'GEO' | 'AIO';
  title: string;
  description: string;
  keyPoints: string[];
  bestPractices: string[];
  commonMistakes: string[];
  implementationSteps: string[];
}

export const SEO_GUIDELINES: Record<string, ContentGuideline> = {
  ai_seo: {
    category: 'AI SEO',
    title: 'AI SEO (AI Search Engine Optimization)',
    description: 'AI 검색 엔진에 최적화된 콘텐츠 작성 가이드라인',
    keyPoints: [
      'AI 모델이 이해하기 쉬운 구조화된 콘텐츠 작성',
      '명확하고 정확한 정보 제공',
      '키워드 자연스러운 배치 및 밀도 최적화',
      '신뢰할 수 있는 출처 및 참고 자료 명시',
      '사용자 의도에 맞는 답변 중심 콘텐츠',
    ],
    bestPractices: [
      'H1, H2, H3 등 계층적 헤딩 구조 사용',
      'FAQ 섹션을 통한 질문-답변 형식 제공',
      '구조화된 데이터(JSON-LD) 마크업 적용',
      '명확한 메타 설명과 제목 태그 작성',
      '내부 링크를 통한 콘텐츠 연결성 강화',
      '이미지에 의미 있는 Alt 텍스트 제공',
      '모바일 친화적 반응형 디자인',
    ],
    commonMistakes: [
      '키워드 스터핑 (과도한 키워드 반복)',
      '중복 콘텐츠 생성',
      '메타 태그 누락 또는 부정확한 정보',
      '구조화된 데이터 오류',
      '느린 페이지 로딩 속도',
      '접근성 문제 (Alt 텍스트 누락 등)',
    ],
    implementationSteps: [
      '1. 키워드 리서치 및 사용자 의도 분석',
      '2. 콘텐츠 구조 설계 (헤딩, 섹션 분할)',
      '3. 구조화된 데이터 스키마 작성',
      '4. 메타 태그 최적화 (Title, Description)',
      '5. 내부/외부 링크 전략 수립',
      '6. 이미지 최적화 및 Alt 텍스트 작성',
      '7. 모바일 최적화 확인',
      '8. 성능 테스트 및 개선',
    ],
  },
  aeo: {
    category: 'AEO',
    title: 'AEO (Answer Engine Optimization)',
    description: '답변 엔진에 최적화된 콘텐츠 작성 가이드라인',
    keyPoints: [
      '질문에 직접적으로 답변하는 콘텐츠 구조',
      '명확하고 간결한 답변 제공',
      'FAQ 형식의 질문-답변 섹션 포함',
      '단계별 가이드 및 튜토리얼 형식 활용',
      '정확한 사실과 데이터 기반 정보 제공',
    ],
    bestPractices: [
      '콘텐츠 시작 부분에 핵심 답변 요약 제공',
      '질문 형식의 헤딩 사용 (예: "어떻게...?", "왜...?")',
      '번호가 매겨진 리스트나 단계별 가이드 제공',
      '표, 차트, 그래프를 통한 정보 시각화',
      '정의 목록(dl) 태그 활용',
      '전문 용어에 대한 명확한 정의 제공',
      '최신 정보 및 업데이트 날짜 표시',
    ],
    commonMistakes: [
      '질문에 대한 직접적인 답변 부재',
      '과도하게 긴 서론으로 핵심 답변 지연',
      '모호하거나 불명확한 설명',
      'FAQ 섹션 누락',
      '단계별 가이드 구조 부재',
      '전문 용어 설명 없이 사용',
    ],
    implementationSteps: [
      '1. 타겟 질문 및 사용자 의도 파악',
      '2. 핵심 답변을 첫 문단에 배치',
      '3. FAQ 섹션 작성 (최소 5-10개 질문)',
      '4. 단계별 가이드 또는 튜토리얼 구조화',
      '5. 표와 리스트를 활용한 정보 정리',
      '6. 전문 용어 정의 및 설명 추가',
      '7. 답변의 정확성 검증 및 출처 명시',
      '8. 콘텐츠 업데이트 주기 설정',
    ],
  },
  geo: {
    category: 'GEO',
    title: 'GEO (Generative Engine Optimization)',
    description: '생성형 AI 엔진에 최적화된 콘텐츠 작성 가이드라인',
    keyPoints: [
      '다양한 미디어 형식의 콘텐츠 포함',
      '포괄적이고 깊이 있는 정보 제공',
      '키워드 다양성 및 자연스러운 언어 사용',
      '최신 트렌드 및 데이터 반영',
      '다양한 관점과 맥락 정보 제공',
    ],
    bestPractices: [
      '이미지, 비디오, 인포그래픽 등 다양한 미디어 활용',
      '2000단어 이상의 상세한 콘텐츠 작성',
      '섹션별로 명확하게 구분된 구조',
      '키워드 변형 및 동의어 자연스럽게 사용',
      '최신 통계, 데이터, 연구 결과 포함',
      '소셜 미디어 공유 최적화 (Open Graph 태그)',
      '다국어 지원 고려',
      '구조화된 데이터(Schema.org) 마크업',
    ],
    commonMistakes: [
      '짧고 얕은 콘텐츠 (500단어 미만)',
      '미디어 콘텐츠 부재',
      '단일 키워드에만 집중',
      '구식 정보 또는 오래된 데이터 사용',
      '구조화된 데이터 누락',
      '소셜 미디어 메타 태그 부재',
    ],
    implementationSteps: [
      '1. 주제에 대한 포괄적 리서치 수행',
      '2. 다양한 미디어 콘텐츠 제작 계획',
      '3. 섹션별 상세 콘텐츠 작성 (최소 2000단어)',
      '4. 키워드 변형 및 자연스러운 언어 사용',
      '5. 최신 데이터 및 통계 포함',
      '6. 이미지, 비디오, 표 등 시각적 요소 추가',
      '7. Open Graph 및 Twitter Card 메타 태그 설정',
      '8. 구조화된 데이터 마크업 적용',
      '9. 다국어 버전 고려 (선택사항)',
      '10. 정기적인 콘텐츠 업데이트',
    ],
  },
  aio: {
    category: 'AIO',
    title: 'AIO (AI Optimization)',
    description: '모든 AI 모델에 통합 최적화된 콘텐츠 작성 가이드라인',
    keyPoints: [
      'ChatGPT, Perplexity, Gemini, Claude 등 모든 AI 모델 고려',
      'AI 모델별 특성을 반영한 통합 전략',
      '신뢰성과 정확성 우선',
      '구조화된 데이터와 명확한 정보 제공',
      '지속적인 모니터링 및 개선',
    ],
    bestPractices: [
      'ChatGPT: 구조화된 데이터, FAQ, 단계별 가이드',
      'Perplexity: 최신 정보, 출처 링크, 날짜 표시',
      'Gemini: 다양한 미디어, 표/리스트, 구조화된 정보',
      'Claude: 상세한 설명, 배경 정보, 포괄적 내용',
      '모든 모델: 정확한 사실, 신뢰할 수 있는 출처',
      '정기적인 AI 인용 확률 모니터링',
      '피드백 기반 콘텐츠 개선',
    ],
    commonMistakes: [
      '단일 AI 모델에만 최적화',
      'AI 모델 특성 무시',
      '부정확한 정보 제공',
      '출처 미명시',
      '구조화된 데이터 오류',
      '업데이트 부재',
    ],
    implementationSteps: [
      '1. AI 모델별 선호도 분석',
      '2. 통합 최적화 전략 수립',
      '3. 구조화된 데이터 마크업 (JSON-LD)',
      '4. FAQ 및 단계별 가이드 포함',
      '5. 최신 정보 및 출처 명시',
      '6. 다양한 미디어 콘텐츠 추가',
      '7. 상세하고 포괄적인 설명 작성',
      '8. AI 인용 확률 테스트 및 모니터링',
      '9. 피드백 수집 및 개선',
      '10. 정기적인 콘텐츠 업데이트',
    ],
  },
};

/**
 * 점수 기반 개선 우선순위 결정
 */
export function getImprovementPriority(
  aeoScore: number,
  geoScore: number,
  seoScore: number
): { category: string; priority: number; reason: string }[] {
  const priorities = [
    {
      category: 'SEO',
      priority: seoScore < 60 ? 1 : seoScore < 80 ? 2 : 3,
      reason: seoScore < 60 ? '기본 SEO 요소가 부족합니다' : seoScore < 80 ? 'SEO 개선 여지가 있습니다' : 'SEO는 양호합니다',
    },
    {
      category: 'AEO',
      priority: aeoScore < 60 ? 1 : aeoScore < 80 ? 2 : 3,
      reason: aeoScore < 60 ? '답변 엔진 최적화가 시급합니다' : aeoScore < 80 ? 'AEO 개선이 필요합니다' : 'AEO는 양호합니다',
    },
    {
      category: 'GEO',
      priority: geoScore < 60 ? 1 : geoScore < 80 ? 2 : 3,
      reason: geoScore < 60 ? '생성형 엔진 최적화가 필요합니다' : geoScore < 80 ? 'GEO 개선 여지가 있습니다' : 'GEO는 양호합니다',
    },
  ];

  return priorities.sort((a, b) => a.priority - b.priority);
}

/**
 * 콘텐츠 작성 시 유의사항 생성
 */
export function getContentWritingGuidelines(
  aeoScore: number,
  geoScore: number,
  seoScore: number
): string[] {
  const guidelines: string[] = [];

  // SEO 관련
  if (seoScore < 80) {
    guidelines.push('✅ H1 태그는 페이지당 1개만 사용하세요');
    guidelines.push('✅ Title 태그는 50-60자 이내로 작성하세요');
    guidelines.push('✅ Meta Description은 150-160자로 명확하게 작성하세요');
    guidelines.push('✅ 모든 이미지에 의미 있는 Alt 텍스트를 추가하세요');
    guidelines.push('✅ 구조화된 데이터(JSON-LD)를 반드시 포함하세요');
  }

  // AEO 관련
  if (aeoScore < 80) {
    guidelines.push('✅ 콘텐츠 시작 부분에 핵심 답변을 요약하세요');
    guidelines.push('✅ FAQ 섹션을 추가하여 질문에 직접 답변하세요');
    guidelines.push('✅ 단계별 가이드나 번호가 매겨진 리스트를 활용하세요');
    guidelines.push('✅ 전문 용어는 반드시 정의와 함께 설명하세요');
  }

  // GEO 관련
  if (geoScore < 80) {
    guidelines.push('✅ 콘텐츠는 최소 2000단어 이상으로 작성하세요');
    guidelines.push('✅ 이미지, 비디오, 표 등 다양한 미디어를 포함하세요');
    guidelines.push('✅ 최신 정보와 통계 데이터를 포함하세요');
    guidelines.push('✅ Open Graph 태그를 설정하여 소셜 공유를 최적화하세요');
  }

  // 공통
  guidelines.push('✅ 정확한 사실과 신뢰할 수 있는 출처를 명시하세요');
  guidelines.push('✅ 콘텐츠 업데이트 날짜를 명확히 표시하세요');
  guidelines.push('✅ 내부 링크를 통해 관련 콘텐츠와 연결하세요');
  guidelines.push('✅ 모바일 환경에서도 최적화된 레이아웃을 사용하세요');

  return guidelines;
}

