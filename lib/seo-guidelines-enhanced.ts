/**
 * 향상된 SEO/GEO 가이드라인
 * Claude Skill SEO/GEO Optimizer 기준으로 업데이트
 * 참고: https://github.com/199-biotechnologies/claude-skill-seo-geo-optimizer
 */

/**
 * AI 플랫폼별 최적화 전략
 * 2025년 연구 기반 (41M AI 검색 결과 분석, 680M 인용 분석)
 */
export const PLATFORM_STRATEGIES = {
  chatgpt: {
    name: 'ChatGPT',
    trafficShare: '40-60%',
    citationBoost: '+40%',
    keyFactors: [
      'Authority and credentials (+40% citation boost)',
      '1500-2500 words comprehensive coverage',
      'Primary source citations (PubMed, arXiv)',
      'Answer-first structure',
      'FAQPage schema (highest AI citation probability)',
      'Article schema with E-E-A-T signals (credentials, dates)',
    ],
    recommendations: [
      '작성자 자격 증명 및 전문성 표시 (Author schema with credentials)',
      '1500-2500자 포괄적인 콘텐츠 작성',
      '주요 출처 인용 (PubMed, arXiv 등)',
      '답변 우선 구조: 핵심 답변을 먼저 제시',
      'FAQPage 스키마 추가 (가장 높은 AI 인용 확률)',
      'Article 스키마에 날짜 및 자격 증명 포함',
    ],
  },
  perplexity: {
    name: 'Perplexity',
    trafficShare: 'Freshness-focused',
    citationBoost: '3.2x (when fresh)',
    keyFactors: [
      'Content updated within 30 days (3.2x citations)',
      'Inline citations with [1], [2] format',
      'H2→H3→bullets structure (40% more citations)',
      'Update frequency: 2-3 days (aggressive) or 90 days (minimum)',
    ],
    recommendations: [
      '30일 이내 콘텐츠 업데이트 (3.2배 인용 증가)',
      '인라인 인용 형식 사용: [1], [2] 형식',
      'H2→H3→불릿 구조 (40% 더 많은 인용)',
      '업데이트 주기: 공격적(2-3일) 또는 최소(90일)',
      '최신 정보 표시: 날짜, "최근 업데이트" 명시',
      '출처 링크 명확히 표시',
    ],
  },
  claude: {
    name: 'Claude',
    trafficShare: 'Accuracy-focused',
    citationBoost: '91.2% attribution accuracy',
    keyFactors: [
      'Primary sources only (91.2% attribution accuracy)',
      '5-8 citations with publisher and year',
      'Transparent methodology',
      'Acknowledged limitations',
    ],
    recommendations: [
      '주요 출처만 사용 (91.2% 정확한 출처 표시)',
      '5-8개 인용 (출판사 및 연도 포함)',
      '투명한 방법론 설명',
      '인정된 한계점 명시',
      '상세한 설명과 배경 정보 제공',
      '2000자 이상의 포괄적인 콘텐츠',
    ],
  },
  gemini: {
    name: 'Gemini',
    trafficShare: 'Community-focused',
    citationBoost: 'Local + Authority',
    keyFactors: [
      'Google Business Profile integration',
      'User reviews and testimonials',
      'Local citations (NAP consistency)',
      'Traditional authority signals',
    ],
    recommendations: [
      'Google Business Profile 통합',
      '사용자 리뷰 및 추천 포함',
      '로컬 인용 (NAP 일관성: Name, Address, Phone)',
      '전통적인 권위 신호 (도메인 권위, 백링크)',
      '다양한 미디어 콘텐츠 (이미지, 비디오, 표)',
      '구조화된 데이터 (Schema.org)',
    ],
  },
  grokipedia: {
    name: 'Grokipedia (xAI)',
    trafficShare: 'Launched Oct 2025',
    citationBoost: '20-30% better factual consistency',
    keyFactors: [
      'RAG-based citations (20-30% better factual consistency)',
      'Transparent version history and licensing',
      'Primary source attribution (publisher + year)',
      'Wikipedia-derived content requires CC-BY-SA attribution',
    ],
    recommendations: [
      'RAG 기반 인용 (20-30% 더 나은 사실 일관성)',
      '투명한 버전 이력 및 라이선스 표시',
      '주요 출처 표시 (출판사 + 연도)',
      'Wikipedia 기반 콘텐츠는 CC-BY-SA 표기 필요',
      '버전 관리 및 업데이트 이력 명시',
    ],
  },
};

/**
 * 키워드 타입 정의
 */
export interface KeywordAnalysis {
  primary: string[]; // 주요 키워드
  semantic: string[]; // 의미론적 키워드 (동의어, 관련어)
  lsi: string[]; // LSI 키워드 (공기어)
  longTail: string[]; // 긴 꼬리 키워드 (3-8단어)
  question: string[]; // 질문 형식 키워드 (Who/what/where/when/why/how)
}

/**
 * 스키마 타입 정의
 */
export const SCHEMA_TYPES = {
  FAQPage: {
    priority: 'Highest',
    citationBoost: 'Highest AI citation probability',
    description: 'FAQ 섹션을 위한 스키마',
  },
  Article: {
    priority: 'High',
    citationBoost: 'E-E-A-T signals (credentials, dates)',
    description: '기사/블로그 포스트용 스키마',
  },
  HowTo: {
    priority: 'High',
    citationBoost: 'Voice search optimized (ISO 8601 durations)',
    description: '단계별 가이드용 스키마',
  },
  BreadcrumbList: {
    priority: 'Medium',
    citationBoost: 'Site hierarchy',
    description: '사이트 구조 표시용 스키마',
  },
  Organization: {
    priority: 'Medium',
    citationBoost: 'Entity recognition',
    description: '조직 정보용 스키마',
  },
  LocalBusiness: {
    priority: 'Medium',
    citationBoost: 'Local SEO',
    description: '로컬 비즈니스용 스키마',
  },
  Person: {
    priority: 'Medium',
    citationBoost: 'Author profiles with credentials',
    description: '작성자 프로필용 스키마',
  },
  Speakable: {
    priority: 'Medium',
    citationBoost: 'Voice assistant optimization',
    description: '음성 검색 최적화용 스키마',
  },
};

/**
 * 음성 검색 최적화 가이드
 */
export const VOICE_SEARCH_GUIDE = {
  featuredSnippet: {
    length: '30-40 words',
    description: 'Featured snippet 최적화 (40.7% of voice answers)',
    recommendations: [
      '30-40단어로 핵심 답변 작성',
      '질문에 직접 답변하는 구조',
      'H2 태그로 섹션 구분',
      '리스트 형식 활용 (번호 매기기, 불릿)',
    ],
  },
  speakable: {
    segments: '20-30 second segments',
    description: 'Speakable schema (20-30초 세그먼트)',
    recommendations: [
      '20-30초 분량의 답변 세그먼트 생성',
      'Speakable 스키마 마크업',
      '자연스러운 대화 형식',
      '간결하고 명확한 답변',
    ],
  },
  faq: {
    format: 'Natural language questions',
    description: 'FAQ 스키마 (자연어 질문)',
    recommendations: [
      '자연스러운 질문 형식 사용',
      'FAQPage 스키마 적용',
      'Who/what/where/when/why/how 질문 포함',
    ],
  },
};

/**
 * 소셜 미디어 최적화 가이드
 */
export const SOCIAL_MEDIA_GUIDE = {
  openGraph: {
    platforms: ['Facebook', 'LinkedIn', 'WhatsApp', 'Instagram Stories'],
    imageSize: '1200×630px optimal',
    recommendations: [
      'og:title, og:description, og:image 설정',
      '이미지 크기: 1200×630px (최적)',
      'Instagram Stories: 1080×1920px',
      'og:type, og:url 설정',
    ],
  },
  twitter: {
    cardTypes: ['summary', 'summary_large_image'],
    imageSize: '1200×630px',
    recommendations: [
      'twitter:card 설정',
      'twitter:title, twitter:description 설정',
      'twitter:image 설정 (1200×630px)',
      'twitter:site, twitter:creator 설정',
    ],
  },
  instagram: {
    support: 'Limited OG support (Stories only)',
    recommendations: [
      'Instagram Stories: OG 태그 사용',
      '바이오 링크 최적화',
      '85%+ 모바일 사용자 고려',
      '이미지 중심 콘텐츠',
    ],
  },
};

/**
 * 신선도(Freshness) 최적화
 * Perplexity 최적화에 중요 (3.2x citations when fresh)
 */
export const FRESHNESS_OPTIMIZATION = {
  updateFrequency: {
    aggressive: '2-3 days',
    minimum: '90 days',
    recommended: '30 days (3.2x citations)',
  },
  indicators: [
    '업데이트 날짜 표시 (<time> 태그, [datetime] 속성)',
    '최신 연도 표시 (2024, 2025 등)',
    '"최근 업데이트", "Updated" 텍스트',
    '버전 번호 또는 수정 이력',
  ],
  schema: {
    datePublished: 'Article.datePublished',
    dateModified: 'Article.dateModified',
    lastReviewed: 'MedicalEntity.lastReviewed (의료 콘텐츠)',
  },
};

/**
 * 통계 및 인용 최적화
 * 연구 결과: +41% improvement (statistics), +28% improvement (quotations)
 */
export const STATISTICS_QUOTATIONS_GUIDE = {
  statistics: {
    improvement: '+41%',
    source: 'Princeton/Georgia Tech study',
    recommendations: [
      '관련 통계 데이터 포함',
      '출처 명시 (연구 기관, 연도)',
      '숫자와 백분율 사용',
      '최신 통계 우선 (2024-2025)',
      '신뢰할 수 있는 출처 (정부, 학술기관)',
    ],
  },
  quotations: {
    improvement: '+28%',
    source: 'Research findings',
    recommendations: [
      '전문가 인용 추가',
      '인용 형식: "인용문" - 출처',
      '인용 스타일 일관성 유지',
      '인용 출처 명확히 표시',
      '관련 인용 3-5개 권장',
    ],
  },
};

/**
 * 키워드 분석 가이드
 */
export const KEYWORD_ANALYSIS_GUIDE = {
  primary: {
    description: '주요 키워드 (1-2단어)',
    location: 'Title, H1, 첫 문단',
    density: '1-2%',
  },
  semantic: {
    description: '의미론적 키워드 (동의어, 관련어)',
    location: '본문 전체',
    examples: ['SEO → 검색 엔진 최적화, 검색 최적화'],
  },
  lsi: {
    description: 'LSI 키워드 (공기어, 자연어)',
    location: '본문 전체',
    examples: ['SEO와 함께 자주 사용되는 단어들'],
  },
  longTail: {
    description: '긴 꼬리 키워드 (3-8단어)',
    location: 'FAQ, H3',
    examples: ['무료 SEO 도구', '초보자 SEO 가이드'],
  },
  question: {
    description: '질문 형식 키워드',
    location: 'FAQ, H2, H3',
    examples: ['SEO란 무엇인가?', '어떻게 SEO를 개선하나요?'],
  },
};

/**
 * H2→H3→bullets 구조 최적화
 * Perplexity 최적화: 40% more citations
 */
export const CONTENT_STRUCTURE_GUIDE = {
  hierarchy: {
    pattern: 'H2 → H3 → Bullets',
    citationBoost: '40% more citations',
    recommendations: [
      'H2로 주요 섹션 구분',
      'H3로 하위 섹션 구분',
      '불릿 포인트로 핵심 정보 정리',
      '논리적 계층 구조 유지',
    ],
  },
  answerFirst: {
    description: '답변 우선 구조',
    recommendations: [
      '첫 문단에 핵심 답변 제시',
      '그 다음 상세 설명',
      'FAQ 섹션으로 보완',
    ],
  },
};

/**
 * 엔티티 SEO 가이드
 * Knowledge Graph 최적화
 */
export const ENTITY_SEO_GUIDE = {
  organization: {
    schema: 'Organization',
    fields: ['name', 'url', 'logo', 'sameAs (소셜 미디어)'],
  },
  person: {
    schema: 'Person',
    fields: ['name', 'jobTitle', 'worksFor', 'sameAs'],
  },
  localBusiness: {
    schema: 'LocalBusiness',
    fields: ['name', 'address', 'telephone', 'openingHours'],
  },
};

export default {
  PLATFORM_STRATEGIES,
  SCHEMA_TYPES,
  VOICE_SEARCH_GUIDE,
  SOCIAL_MEDIA_GUIDE,
  FRESHNESS_OPTIMIZATION,
  STATISTICS_QUOTATIONS_GUIDE,
  KEYWORD_ANALYSIS_GUIDE,
  CONTENT_STRUCTURE_GUIDE,
  ENTITY_SEO_GUIDE,
};

