/**
 * AI SEO, AEO, GEO, AIO 가이드라인 및 개선 가이드
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
 * 점수 기반 개선 우선순위 결정 (실행 가능한 팁 포함)
 */
export function getImprovementPriority(
  aeoScore: number,
  geoScore: number,
  seoScore: number,
  insights?: Array<{ severity: string; category: string; message: string }>
): Array<{ 
  category: string; 
  priority: number; 
  reason: string;
  actionableTips: Array<{ title: string; steps: string[]; expectedImpact: string }>;
}> {
  const priorities: Array<{ 
    category: string; 
    priority: number; 
    reason: string;
    actionableTips: Array<{ title: string; steps: string[]; expectedImpact: string }>;
  }> = [];

  // SEO 개선 팁
  const seoPriority = seoScore < 60 ? 1 : seoScore < 80 ? 2 : 3;
  const seoTips: Array<{ title: string; steps: string[]; expectedImpact: string }> = [];
  
  if (seoScore < 60) {
    seoTips.push({
      title: '기본 SEO 요소 추가',
      steps: [
        'HTML <head> 섹션에 <title> 태그 추가 (50-60자 권장)',
        '<meta name="description"> 태그 추가 (150-160자 권장)',
        '페이지에 단일 <h1> 태그 추가 (주요 제목)',
        '모든 이미지에 <img alt="설명"> 속성 추가',
        '구조화된 데이터(JSON-LD) 추가: <script type="application/ld+json">{...}</script>',
      ],
      expectedImpact: 'SEO 점수 +20~30점 예상',
    });
  } else if (seoScore < 80) {
    seoTips.push({
      title: 'SEO 요소 최적화',
      steps: [
        'Title 태그를 50-60자로 조정 (너무 짧거나 길면 수정)',
        'Meta description을 150-160자로 최적화',
        'H1 태그가 1개인지 확인 (여러 개면 하나만 남기기)',
        'Alt 텍스트를 더 구체적이고 의미있게 작성',
        '구조화된 데이터에 더 많은 정보 추가 (Article, FAQPage 등)',
      ],
      expectedImpact: 'SEO 점수 +10~15점 예상',
    });
  }

  // insights 기반 SEO 팁 추가 (더 상세하게)
  if (insights) {
    const seoInsights = insights.filter(i => i.category === 'SEO');
    
    // H1 태그 관련
    const h1Insight = seoInsights.find(i => i.message.includes('H1'));
    if (h1Insight) {
      if (h1Insight.message.includes('없습니다')) {
        seoTips.push({
          title: 'H1 태그 추가 (필수)',
          steps: [
            '페이지의 주요 제목을 결정하세요',
            'HTML <body> 시작 부분에 <h1>주요 제목</h1> 추가',
            '예시: <h1>2024년 최신 SEO 가이드</h1>',
            'H1은 페이지당 정확히 1개만 사용하세요',
            'H1은 페이지의 핵심 주제를 명확하게 표현해야 합니다',
          ],
          expectedImpact: 'SEO 점수 +8~12점 예상 (필수 요소)',
        });
      } else if (h1Insight.message.includes('개 있습니다')) {
        const h1Count = parseInt(h1Insight.message.match(/\d+/)?.[0] || '0');
        seoTips.push({
          title: `H1 태그 정리 (현재 ${h1Count}개)`,
          steps: [
            `현재 ${h1Count}개의 H1 태그가 있습니다`,
            '가장 중요한 제목 1개만 H1로 유지하세요',
            '나머지 H1 태그는 <h2> 또는 <h3>로 변경하세요',
            'HTML 편집기에서 검색: <h1> 로 모든 H1 태그 찾기',
            '예시: <h1>주제</h1> → <h2>주제</h2>',
          ],
          expectedImpact: 'SEO 점수 +5~10점 예상',
        });
      }
    }

    // Title 태그 관련
    const titleInsight = seoInsights.find(i => i.message.includes('Title'));
    if (titleInsight) {
      if (titleInsight.message.includes('없습니다')) {
        seoTips.push({
          title: 'Title 태그 추가 (필수)',
          steps: [
            'HTML <head> 섹션에 <title> 태그 추가',
            '예시: <title>페이지 제목 - 사이트명</title>',
            'Title은 50-60자 이내로 작성 (검색 결과에서 잘림 방지)',
            '핵심 키워드를 앞부분에 배치하세요',
            '각 페이지마다 고유한 Title을 사용하세요',
          ],
          expectedImpact: 'SEO 점수 +10~15점 예상 (필수 요소)',
        });
      } else if (titleInsight.message.includes('너무 깁니다')) {
        const titleLength = parseInt(titleInsight.message.match(/\d+/)?.[0] || '0');
        seoTips.push({
          title: `Title 태그 길이 조정 (현재 ${titleLength}자)`,
          steps: [
            `현재 Title이 ${titleLength}자로 너무 깁니다`,
            'Title을 50-60자로 줄이세요',
            '핵심 키워드와 메시지만 남기고 불필요한 단어 제거',
            '예시: "2024년 최신 SEO 가이드 - 완벽한 검색 엔진 최적화 방법" → "2024년 SEO 가이드 - 검색 엔진 최적화"',
            'Google 검색 결과에서 Title이 잘리지 않도록 주의',
          ],
          expectedImpact: 'SEO 점수 +3~5점 예상',
        });
      }
    }

    // Meta description 관련
    const metaInsight = seoInsights.find(i => i.message.includes('Meta description') || i.message.includes('description'));
    if (metaInsight && metaInsight.message.includes('없습니다')) {
      seoTips.push({
        title: 'Meta Description 추가 (필수)',
        steps: [
          'HTML <head> 섹션에 <meta name="description"> 태그 추가',
          '예시: <meta name="description" content="페이지에 대한 간단한 설명 (150-160자)">',
          'Description은 150-160자로 작성 (검색 결과 스니펫에 표시)',
          '핵심 내용과 키워드를 자연스럽게 포함하세요',
          '사용자가 클릭하고 싶게 만드는 문구로 작성',
        ],
        expectedImpact: 'SEO 점수 +8~12점 예상 (필수 요소)',
      });
    }

    // Alt 텍스트 관련
    const altInsight = seoInsights.find(i => i.message.includes('Alt') || i.message.includes('alt'));
    if (altInsight) {
      const imageCount = parseInt(altInsight.message.match(/\d+/)?.[0] || '0');
      seoTips.push({
        title: `이미지 Alt 텍스트 추가 (${imageCount}개 이미지)`,
        steps: [
          `현재 ${imageCount}개의 이미지에 Alt 텍스트가 없습니다`,
          '모든 <img> 태그에 alt 속성 추가',
          '예시: <img src="photo.jpg" alt="2024년 봄 꽃 사진">',
          'Alt 텍스트는 이미지의 내용을 정확하게 설명해야 합니다',
          '장식용 이미지는 alt="" (빈 문자열)로 설정 가능',
          'SEO와 접근성(스크린 리더) 모두에 중요합니다',
        ],
        expectedImpact: 'SEO 점수 +5~10점 예상, 접근성 향상',
      });
    }

    // 구조화된 데이터 관련
    const structuredDataInsight = seoInsights.find(i => i.message.includes('구조화') || i.message.includes('JSON-LD'));
    if (structuredDataInsight) {
      seoTips.push({
        title: '구조화된 데이터(JSON-LD) 추가',
        steps: [
          'HTML <head> 또는 <body> 끝에 <script type="application/ld+json"> 추가',
          '콘텐츠 유형에 맞는 스키마 선택 (Article, BlogPosting, FAQPage 등)',
          '예시: Article 스키마',
          'Google의 Structured Data Testing Tool로 검증',
          'schema.org에서 적절한 스키마 타입 찾기',
        ],
        expectedImpact: 'SEO 점수 +10~15점 예상, 리치 스니펫 가능',
      });
    }
  }

  // SEO 점수가 80 이상이어도 기본 최적화 팁 제공
  if (seoTips.length === 0 && seoScore >= 80) {
    seoTips.push({
      title: 'SEO 고급 최적화',
      steps: [
        '구조화된 데이터 확장: Article, BreadcrumbList, Organization 등 추가',
        '내부 링크 최적화: 관련 콘텐츠로 자연스러운 내부 링크 추가',
        '외부 링크 품질: 신뢰할 수 있는 출처로 외부 링크 추가',
        '페이지 속도 최적화: 이미지 압축, CSS/JS 최소화',
        '모바일 최적화 확인: Google Mobile-Friendly Test로 검증',
        '소셜 미디어 메타 태그: Open Graph, Twitter Cards 추가',
      ],
      expectedImpact: 'SEO 점수 +5~10점 예상, 검색 순위 향상',
    });
  }

  priorities.push({
    category: 'SEO',
    priority: seoPriority,
    reason: seoScore < 60 ? '기본 SEO 요소가 부족합니다' : seoScore < 80 ? 'SEO 개선 여지가 있습니다' : 'SEO는 양호합니다',
    actionableTips: seoTips.length > 0 ? seoTips : [{
      title: 'SEO 유지 관리',
      steps: [
        '정기적으로 Google Search Console에서 인덱싱 상태 확인',
        '콘텐츠 업데이트 시 메타 정보도 함께 업데이트',
        '백링크 모니터링: 누가 내 사이트를 링크하고 있는지 확인',
        '경쟁사 분석: 상위 랭킹 페이지의 SEO 요소 분석',
      ],
      expectedImpact: '현재 SEO 점수 유지 및 향상',
    }],
  });

  // AEO 개선 팁
  const aeoPriority = aeoScore < 60 ? 1 : aeoScore < 80 ? 2 : 3;
  const aeoTips: Array<{ title: string; steps: string[]; expectedImpact: string }> = [];
  
  if (aeoScore < 60) {
    aeoTips.push({
      title: '답변 형식 콘텐츠 추가',
      steps: [
        '콘텐츠에 질문 형식 문장 추가 (예: "어떻게 하면...?", "왜...인가요?")',
        'FAQ 섹션 추가: 자주 묻는 질문과 답변을 구조화',
        '명확한 답변 제공: 각 질문에 대해 직접적이고 명확한 답변 작성',
        '단계별 가이드 형식 사용: "1단계: ...", "2단계: ..."',
        '정의와 설명 추가: 전문 용어에 대한 명확한 정의 제공',
      ],
      expectedImpact: 'AEO 점수 +25~35점 예상',
    });
  } else if (aeoScore < 80) {
    aeoTips.push({
      title: 'AEO 요소 강화',
      steps: [
        '기존 질문에 대한 답변을 더 구체적으로 작성',
        'FAQ 섹션 확장: 더 많은 질문과 답변 추가',
        '구조화된 FAQ 데이터 추가: FAQPage 스키마 마크업',
        '답변 형식 개선: "답변: ..." 형식으로 명확하게 구분',
      ],
      expectedImpact: 'AEO 점수 +10~20점 예상',
    });
  }

  // insights 기반 AEO 팁 (더 상세하게)
  if (insights) {
    const aeoInsights = insights.filter(i => i.category === 'AEO');
    
    // 질문 형식 콘텐츠 관련
    const questionInsight = aeoInsights.find(i => i.message.includes('질문'));
    if (questionInsight) {
      aeoTips.push({
        title: '질문 형식 콘텐츠 추가',
        steps: [
          '콘텐츠 본문에 자연스러운 질문 문장 삽입',
          '예시: "많은 분들이 궁금해하시는 질문은 무엇일까요?"',
          '섹션 제목을 질문 형식으로 작성: "어떻게 시작하나요?", "왜 중요한가요?"',
          '소제목에 질문 사용: <h2>어떻게 SEO를 개선할 수 있나요?</h2>',
          '각 질문 바로 아래에 명확한 답변 제공',
          '질문과 답변을 명확하게 구분 (예: Q: ... A: ...)',
        ],
        expectedImpact: 'AEO 점수 +8~12점 예상',
      });
    }

    // FAQ 관련
    const faqInsight = aeoInsights.find(i => i.message.includes('FAQ'));
    if (faqInsight) {
      aeoTips.push({
        title: 'FAQ 섹션 생성 및 최적화',
        steps: [
          '페이지 하단 또는 별도 섹션에 FAQ 추가',
          '자주 묻는 질문 5-10개 수집 (댓글, 이메일, 고객 문의 등에서)',
          '각 질문에 명확하고 구체적인 답변 작성 (최소 2-3문장)',
          'FAQ 구조화: <h2>자주 묻는 질문</h2> 아래 <h3>질문</h3>과 <p>답변</p>',
          'FAQPage 스키마 마크업 추가 (Google 검색에 FAQ 표시 가능)',
          'FAQ 스키마 예시: schema.org/FAQPage 사용',
        ],
        expectedImpact: 'AEO 점수 +12~18점 예상, Google FAQ 리치 스니펫 가능',
      });
    }

    // 답변 구조 관련
    const answerInsight = aeoInsights.find(i => i.message.includes('답변') || i.message.includes('구조'));
    if (answerInsight) {
      aeoTips.push({
        title: '명확한 답변 구조 만들기',
        steps: [
          '각 질문에 대해 직접적이고 명확한 답변 제공',
          '답변 시작 부분에 핵심 답변을 먼저 제시',
          '예시: "답변: SEO를 개선하려면 다음 3가지를 해야 합니다..."',
          '단계별 가이드 형식 사용: "1단계: ...", "2단계: ..."',
          '정의와 설명 추가: 전문 용어에 대한 명확한 정의 제공',
          '예시와 사례 추가로 답변을 더 구체적으로 만들기',
        ],
        expectedImpact: 'AEO 점수 +10~15점 예상',
      });
    }
  }

  // AEO 점수가 80 이상이어도 고급 팁 제공
  if (aeoTips.length === 0 && aeoScore >= 80) {
    aeoTips.push({
      title: 'AEO 고급 최적화',
      steps: [
        'FAQ 섹션 확장: 더 많은 질문과 답변 추가 (10개 이상)',
        'FAQPage 스키마 마크업: Google FAQ 리치 스니펫 표시',
        '단계별 가이드 강화: 더 상세한 단계별 설명 추가',
        '비교 콘텐츠: "A vs B" 형식의 비교 답변 추가',
        '정의 섹션: 전문 용어 사전 형식의 정의 섹션 추가',
        'How-to 가이드: "어떻게 하는가" 형식의 상세 가이드 작성',
      ],
      expectedImpact: 'AEO 점수 +5~10점 예상, AI 인용 확률 증가',
    });
  }

  priorities.push({
    category: 'AEO',
    priority: aeoPriority,
    reason: aeoScore < 60 ? '답변 엔진 최적화가 시급합니다' : aeoScore < 80 ? 'AEO 개선이 필요합니다' : 'AEO는 양호합니다',
    actionableTips: aeoTips.length > 0 ? aeoTips : [{
      title: 'AEO 유지 관리',
      steps: [
        '정기적으로 FAQ 섹션 업데이트',
        '새로운 질문과 답변 추가',
        '사용자 댓글과 문의에서 새로운 FAQ 발견',
        'AI 검색 결과에서 자주 인용되는 부분 확인 및 강화',
      ],
      expectedImpact: '현재 AEO 점수 유지 및 향상',
    }],
  });

  // GEO 개선 팁
  const geoPriority = geoScore < 60 ? 1 : geoScore < 80 ? 2 : 3;
  const geoTips: Array<{ title: string; steps: string[]; expectedImpact: string }> = [];
  
  if (geoScore < 60) {
    geoTips.push({
      title: '생성형 엔진 최적화 시작',
      steps: [
        '콘텐츠 길이 확장: 최소 1,500자 이상 (목표: 2,000자+)',
        '섹션 구조화: H2, H3 태그로 명확한 섹션 구분',
        '다양한 미디어 추가: 이미지, 비디오, 인포그래픽',
        '키워드 다양성: 관련 키워드와 동의어 자연스럽게 포함',
        '최신 정보 표시: 업데이트 날짜, 최신 통계 데이터 포함',
      ],
      expectedImpact: 'GEO 점수 +30~40점 예상',
    });
  } else if (geoScore < 80) {
    geoTips.push({
      title: 'GEO 요소 강화',
      steps: [
        '콘텐츠에 더 많은 섹션 추가 (H2, H3 활용)',
        '이미지와 비디오 추가: 관련 미디어 콘텐츠 포함',
        '표와 리스트 활용: 정보를 구조화된 형태로 제시',
        '관련 키워드 확장: 주제와 관련된 추가 키워드 자연스럽게 포함',
      ],
      expectedImpact: 'GEO 점수 +15~25점 예상',
    });
  }

  // insights 기반 GEO 팁 (더 상세하게)
  if (insights) {
    const geoInsights = insights.filter(i => i.category === 'GEO');
    
    // 콘텐츠 길이 관련
    const lengthInsight = geoInsights.find(i => i.message.includes('길이') || i.message.includes('단어') || i.message.includes('짧습니다'));
    if (lengthInsight) {
      const wordCount = parseInt(lengthInsight.message.match(/\d+/)?.[0] || '0');
      geoTips.push({
        title: `콘텐츠 길이 확장 (현재 약 ${wordCount}자)`,
        steps: [
          `현재 콘텐츠가 ${wordCount}자로 부족합니다`,
          '각 섹션에 더 자세한 설명과 배경 정보 추가',
          '예시와 실제 사례 추가 (각 예시당 100-200자)',
          '관련 통계 데이터와 인용 추가',
          '단계별 가이드 확장: 각 단계에 더 자세한 설명',
          '목표: 최소 1,500자, 권장 2,000자 이상',
          '품질을 유지하면서 길이를 늘리세요 (양보다 질)',
        ],
        expectedImpact: 'GEO 점수 +12~18점 예상',
      });
    }

    // 섹션 구조 관련
    const sectionInsight = geoInsights.find(i => i.message.includes('섹션') || i.message.includes('구조') || i.message.includes('H2') || i.message.includes('H3'));
    if (sectionInsight) {
      geoTips.push({
        title: '콘텐츠 구조화 및 섹션 구분',
        steps: [
          'H2 태그로 주요 섹션 구분 (최소 3-5개 섹션 권장)',
          'H3 태그로 하위 섹션 구분 (각 H2 아래 2-3개)',
          '각 섹션에 명확하고 설명적인 제목 부여',
          '섹션 간 논리적 흐름 유지: 도입 → 본문 → 결론',
          '섹션 제목에 키워드 자연스럽게 포함',
          '예시 구조: <h2>SEO란 무엇인가?</h2> → <h2>SEO 개선 방법</h2> → <h2>결론</h2>',
        ],
        expectedImpact: 'GEO 점수 +8~12점 예상',
      });
    }

    // 미디어 관련
    const mediaInsight = geoInsights.find(i => i.message.includes('이미지') || i.message.includes('비디오') || i.message.includes('미디어'));
    if (mediaInsight) {
      geoTips.push({
        title: '다양한 미디어 콘텐츠 추가',
        steps: [
          '관련 이미지 추가: 설명을 보완하는 이미지 3-5개',
          '인포그래픽 추가: 복잡한 정보를 시각적으로 표현',
          '비디오 삽입: YouTube 등 비디오 콘텐츠 임베드',
          '표(table) 활용: 데이터를 구조화된 형태로 제시',
          '리스트와 불릿 포인트: 정보를 읽기 쉽게 정리',
          '모든 미디어에 적절한 설명과 캡션 추가',
        ],
        expectedImpact: 'GEO 점수 +10~15점 예상',
      });
    }

    // 키워드 다양성 관련
    const keywordInsight = geoInsights.find(i => i.message.includes('키워드') || i.message.includes('다양성'));
    if (keywordInsight) {
      geoTips.push({
        title: '키워드 다양성 확보',
        steps: [
          '주요 키워드의 동의어와 관련 용어 자연스럽게 포함',
          '예시: "SEO" → "검색 엔진 최적화", "검색 최적화" 등',
          '긴 꼬리 키워드 추가: "무료 SEO 도구", "초보자 SEO 가이드" 등',
          '관련 주제 키워드 포함: 주제와 연관된 추가 키워드',
          '키워드 밀도는 1-2% 유지 (과도한 사용은 오히려 역효과)',
          '자연스러운 문맥에서 키워드 사용 (강제 삽입 금지)',
        ],
        expectedImpact: 'GEO 점수 +5~10점 예상',
      });
    }
  }

  // GEO 점수가 80 이상이어도 고급 팁 제공
  if (geoTips.length === 0 && geoScore >= 80) {
    geoTips.push({
      title: 'GEO 고급 최적화',
      steps: [
        '콘텐츠 길이 확장: 3,000자 이상의 심층 콘텐츠 작성',
        '다양한 미디어 확장: 비디오, 인포그래픽, 인터랙티브 콘텐츠 추가',
        '최신 정보 업데이트: 날짜 표시 및 정기적인 업데이트',
        '관련 주제 확장: 주제와 연관된 추가 섹션 작성',
        '사용자 경험 개선: 읽기 쉬운 레이아웃, 목차 추가',
        '소셜 증거 추가: 리뷰, 평점, 사용자 후기 포함',
      ],
      expectedImpact: 'GEO 점수 +5~10점 예상, 생성형 AI 인용 확률 증가',
    });
  }

  priorities.push({
    category: 'GEO',
    priority: geoPriority,
    reason: geoScore < 60 ? '생성형 엔진 최적화가 필요합니다' : geoScore < 80 ? 'GEO 개선 여지가 있습니다' : 'GEO는 양호합니다',
    actionableTips: geoTips.length > 0 ? geoTips : [{
      title: 'GEO 유지 관리',
      steps: [
        '정기적으로 콘텐츠 업데이트 (최소 분기별 1회)',
        '새로운 미디어 콘텐츠 추가 (이미지, 비디오 등)',
        '최신 통계와 데이터로 콘텐츠 보강',
        '사용자 피드백 반영하여 콘텐츠 개선',
      ],
      expectedImpact: '현재 GEO 점수 유지 및 향상',
    }],
  });

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

