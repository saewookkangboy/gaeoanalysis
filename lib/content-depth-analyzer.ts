/**
 * 깊이 있는 콘텐츠 분석 모듈
 * 
 * 일반 사이트의 구조적 특성과 신뢰도 신호를 깊이 있게 분석합니다.
 * - 콘텐츠 구조 분석
 * - E-E-A-T 신호 분석
 * - 비즈니스 신뢰도 분석
 * - 상호작용 요소 분석
 */

import * as cheerio from 'cheerio';
import type { Insight } from './analyzer';

export interface TextContext {
  text: string;
  words: string[];
  wordCount: number;
}

/**
 * 콘텐츠 구조 분석 결과
 */
export interface ContentStructureAnalysis {
  hierarchy: {
    h1Count: number;
    h2Count: number;
    h3Count: number;
    h4Count: number;
    hierarchyScore: number; // 0-100
  };
  sections: {
    count: number;
    averageLength: number;
    connectivity: number; // 내부 링크 연결성 (0-100)
  };
  contentTypes: {
    informational: boolean;
    guide: boolean;
    comparison: boolean;
    news: boolean;
    faq: boolean;
  };
}

/**
 * E-E-A-T 신호 분석 결과
 */
export interface TrustSignalsAnalysis {
  eaat: {
    experience: number; // 0-100
    expertise: number; // 0-100
    authoritativeness: number; // 0-100
    trustworthiness: number; // 0-100
    overall: number; // 0-100
  };
  business: {
    companyInfo: boolean;
    contactInfo: boolean;
    legalPages: boolean;
    certifications: boolean;
    reviews: boolean;
  };
  security: {
    hasSSL: boolean;
    hasSecurityBadge: boolean;
    hasPrivacyPolicy: boolean;
  };
}

/**
 * 상호작용 요소 분석 결과
 */
export interface InteractionAnalysis {
  forms: number;
  calculators: number;
  comments: boolean;
  socialShare: boolean;
  subscription: boolean;
}

/**
 * 콘텐츠 구조 분석
 */
export function analyzeContentStructure($: cheerio.CheerioAPI): ContentStructureAnalysis {
  // 계층 구조 분석
  const h1Count = $('h1').length;
  const h2Count = $('h2').length;
  const h3Count = $('h3').length;
  const h4Count = $('h4').length;
  
  // 계층 구조 점수 계산
  let hierarchyScore = 0;
  if (h1Count === 1) hierarchyScore += 30; // H1은 1개만
  if (h2Count >= 3) hierarchyScore += 30; // H2는 3개 이상 권장
  if (h3Count >= 5) hierarchyScore += 20; // H3는 5개 이상 권장
  if (h4Count > 0) hierarchyScore += 20; // H4 사용 시 추가 점수
  
  // 섹션 분석
  const sections = $('section, article, [class*="section"], [class*="article"]');
  const sectionCount = sections.length;
  
  // 섹션별 평균 길이 계산
  let totalSectionLength = 0;
  sections.each((_, el) => {
    const sectionText = $(el).text().trim();
    totalSectionLength += sectionText.length;
  });
  const averageLength = sectionCount > 0 ? totalSectionLength / sectionCount : 0;
  
  // 내부 링크 연결성 계산
  const internalLinks = $('a[href^="/"], a[href^="./"], a[href^="#"]').length;
  const totalLinks = $('a[href]').length;
  const connectivity = totalLinks > 0 ? Math.min(100, (internalLinks / totalLinks) * 100) : 0;
  
  // 콘텐츠 타입 분석
  const text = $('body').text();
  const contentTypes = {
    informational: /정보|information|소개|about|개요|overview/i.test(text),
    guide: /가이드|guide|튜토리얼|tutorial|방법|how|절차|process/i.test(text),
    comparison: /비교|compare|vs|versus|대안|alternative|차이|difference/i.test(text),
    news: /뉴스|news|업데이트|update|최신|latest|보도|press/i.test(text),
    faq: /FAQ|자주 묻는 질문|질문|question|답변|answer/i.test(text),
  };
  
  return {
    hierarchy: { h1Count, h2Count, h3Count, h4Count, hierarchyScore },
    sections: { count: sectionCount, averageLength, connectivity },
    contentTypes,
  };
}

/**
 * E-E-A-T 신호 분석
 */
export function analyzeTrustSignals($: cheerio.CheerioAPI, url: string): TrustSignalsAnalysis {
  const text = $('body').text();
  const structuredDataText = $('script[type="application/ld+json"]').text();
  
  // Experience 분석
  const experience = analyzeExperience($, text);
  
  // Expertise 분석
  const expertise = analyzeExpertise($, text, structuredDataText);
  
  // Authoritativeness 분석
  const authoritativeness = analyzeAuthoritativeness($, text);
  
  // Trustworthiness 분석
  const trustworthiness = analyzeTrustworthiness($, text, url);
  
  const eaatOverall = (experience + expertise + authoritativeness + trustworthiness) / 4;
  
  // 비즈니스 신호
  const business = {
    companyInfo: /회사|company|기업|corporation|회사 소개|about us|회사명/i.test(text),
    contactInfo: /연락처|contact|전화|phone|이메일|email|주소|address|문의|inquiry/i.test(text),
    legalPages: hasLegalPages($, url, text),
    certifications: /인증|certification|ISO|수상|award|인정|recognition/i.test(text),
    reviews: /후기|review|평점|rating|리뷰|testimonial|추천|recommendation/i.test(text),
  };
  
  // 보안 신호
  let urlObj: URL | null = null;
  try {
    urlObj = new URL(url);
  } catch {
    // URL 파싱 실패 시 기본값 사용
  }
  const security = {
    hasSSL: urlObj?.protocol === 'https:',
    hasSecurityBadge: $('[class*="security"], [class*="ssl"], [class*="trust"], [class*="verified"]').length > 0,
    hasPrivacyPolicy: hasPrivacyPolicy($, url, text),
  };
  
  return {
    eaat: {
      experience,
      expertise,
      authoritativeness,
      trustworthiness,
      overall: eaatOverall,
    },
    business,
    security,
  };
}

/**
 * Experience 분석 (실제 경험 기반 콘텐츠)
 */
function analyzeExperience($: cheerio.CheerioAPI, text: string): number {
  let score = 0;
  
  // 실제 경험 기반 콘텐츠 지표
  if (/경험|experience|실제|actual|사례|case|체험|trial/i.test(text)) score += 30;
  if (/사용|use|이용|utilize|적용|apply|운용|operate/i.test(text)) score += 20;
  if (/테스트|test|시험|trial|검증|verify|실험|experiment/i.test(text)) score += 20;
  if (/결과|result|성과|outcome|효과|effect|성공|success/i.test(text)) score += 20;
  if ($('[class*="testimonial"], [class*="review"], [class*="case-study"]').length > 0) score += 10;
  
  return Math.min(100, score);
}

/**
 * Expertise 분석 (전문성)
 */
function analyzeExpertise($: cheerio.CheerioAPI, text: string, structuredDataText: string): number {
  let score = 0;
  
  // 전문성 지표
  const hasAuthor = structuredDataText.includes('author') ||
                   $('[rel="author"], [class*="author"], [id*="author"]').length > 0;
  if (hasAuthor) score += 30;
  
  if (/자격|credential|전문가|expert|박사|Ph\.D|인증|certification/i.test(text)) score += 25;
  if (/학위|degree|학력|education|경력|career|경험|experience/i.test(text)) score += 20;
  if (/연구|research|논문|paper|저널|journal|학술|academic/i.test(text)) score += 15;
  if ($('[class*="expert"], [class*="specialist"], [class*="professional"]').length > 0) score += 10;
  
  return Math.min(100, score);
}

/**
 * Authoritativeness 분석 (권위성)
 */
function analyzeAuthoritativeness($: cheerio.CheerioAPI, text: string): number {
  let score = 0;
  
  // 권위성 지표
  if (/인용|citation|출처|source|참고|reference|근거|evidence/i.test(text)) score += 25;
  if (/수상|award|인정|recognition|인증|certification|상|prize/i.test(text)) score += 20;
  if (/언론|media|보도|press|기사|article|인터뷰|interview/i.test(text)) score += 15;
  if ($('[class*="award"], [class*="certification"], [class*="recognition"]').length > 0) score += 20;
  if ($('a[href*=".edu"], a[href*=".gov"], a[href*=".ac.kr"]').length > 0) score += 20;
  
  return Math.min(100, score);
}

/**
 * Trustworthiness 분석 (신뢰성)
 */
function analyzeTrustworthiness($: cheerio.CheerioAPI, text: string, url: string): number {
  let score = 0;
  
  // 신뢰성 지표
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol === 'https:') score += 30;
  } catch {
    // URL 파싱 실패 시 무시
  }
  
  if (/개인정보처리방침|privacy policy|이용약관|terms|약관|policy/i.test(text)) score += 25;
  if (/투명|transparent|공개|open|명확|clear|공정|fair/i.test(text)) score += 15;
  if ($('[class*="trust"], [class*="security"], [class*="verified"]').length > 0) score += 15;
  if ($('time, [datetime]').length > 0) score += 15; // 최신성 표시
  if (/보장|guarantee|환불|refund|교환|exchange|AS|after service/i.test(text)) score += 5;
  
  return Math.min(100, score);
}

/**
 * 법적 페이지 존재 여부 확인
 */
function hasLegalPages($: cheerio.CheerioAPI, url: string, text: string): boolean {
  // 텍스트에서 법적 페이지 언급 확인
  const hasLegalMention = /이용약관|terms|개인정보처리방침|privacy|약관|policy|법적|legal/i.test(text);
  
  // 링크에서 법적 페이지 확인
  const legalLinks = $('a[href*="terms"], a[href*="privacy"], a[href*="policy"], a[href*="약관"], a[href*="개인정보"]').length;
  
  return hasLegalMention || legalLinks > 0;
}

/**
 * 개인정보처리방침 존재 여부 확인
 */
function hasPrivacyPolicy($: cheerio.CheerioAPI, url: string, text: string): boolean {
  // 텍스트에서 개인정보처리방침 언급 확인
  const hasPrivacyMention = /개인정보처리방침|privacy policy|개인정보|privacy/i.test(text);
  
  // 링크에서 개인정보처리방침 확인
  const privacyLinks = $('a[href*="privacy"], a[href*="개인정보"]').length;
  
  return hasPrivacyMention || privacyLinks > 0;
}

/**
 * 상호작용 요소 분석
 */
export function analyzeInteractions($: cheerio.CheerioAPI): InteractionAnalysis {
  return {
    forms: $('form').length,
    calculators: $('[class*="calculator"], [class*="calc"], [id*="calculator"], [id*="calc"]').length,
    comments: $('[class*="comment"], [id*="comment"], [class*="reply"], [id*="reply"]').length > 0,
    socialShare: $('[class*="share"], [class*="social"], [id*="share"], [id*="social"]').length > 0,
    subscription: $('[class*="subscribe"], [class*="newsletter"], [id*="subscribe"], [id*="newsletter"]').length > 0,
  };
}

/**
 * 일반 사이트 특화 인사이트 생성
 */
export function generateWebsiteInsights(
  contentStructure: ContentStructureAnalysis,
  trustSignals: TrustSignalsAnalysis,
  interactions: InteractionAnalysis
): Insight[] {
  const insights: Insight[] = [];
  
  // 콘텐츠 구조 인사이트
  if (contentStructure.hierarchy.hierarchyScore < 60) {
    insights.push({
      severity: 'Medium',
      category: '구조',
      message: `콘텐츠 계층 구조를 개선하세요. H1 1개, H2 3개 이상, H3 5개 이상을 권장합니다. (현재: H1 ${contentStructure.hierarchy.h1Count}개, H2 ${contentStructure.hierarchy.h2Count}개, H3 ${contentStructure.hierarchy.h3Count}개)`,
    });
  }
  
  if (contentStructure.sections.connectivity < 30) {
    insights.push({
      severity: 'Low',
      category: '구조',
      message: '내부 링크 연결성을 높이세요. 섹션 간 연결을 통해 사용자 탐색을 개선할 수 있습니다.',
    });
  }
  
  // E-E-A-T 인사이트
  if (trustSignals.eaat.overall < 70) {
    insights.push({
      severity: 'High',
      category: '신뢰도',
      message: `E-E-A-T 신호가 부족합니다 (현재: ${Math.round(trustSignals.eaat.overall)}점). 작성자 정보, 전문성 증명, 출처 명시를 강화하세요.`,
    });
  }
  
  if (trustSignals.eaat.expertise < 60) {
    insights.push({
      severity: 'Medium',
      category: '전문성',
      message: '작성자 정보와 전문성을 명시하세요. 자격증명, 경력, 교육 배경을 추가하면 신뢰도가 향상됩니다.',
    });
  }
  
  if (trustSignals.eaat.authoritativeness < 60) {
    insights.push({
      severity: 'Medium',
      category: '권위성',
      message: '출처와 인용을 추가하세요. 신뢰할 수 있는 소스(.edu, .gov, 학술지 등)를 인용하면 권위성이 향상됩니다.',
    });
  }
  
  // 비즈니스 신뢰도 인사이트
  if (!trustSignals.business.companyInfo) {
    insights.push({
      severity: 'Medium',
      category: '비즈니스',
      message: '회사 정보가 없습니다. 회사 소개 페이지와 연락처 정보를 추가하세요.',
    });
  }
  
  if (!trustSignals.business.contactInfo) {
    insights.push({
      severity: 'High',
      category: '비즈니스',
      message: '연락처 정보가 없습니다. 전화번호, 이메일, 주소 등 연락처를 명시하세요.',
    });
  }
  
  if (!trustSignals.business.legalPages) {
    insights.push({
      severity: 'Medium',
      category: '비즈니스',
      message: '이용약관 및 개인정보처리방침 페이지를 추가하세요. 법적 신뢰도를 높일 수 있습니다.',
    });
  }
  
  // 보안 인사이트
  if (!trustSignals.security.hasSSL) {
    insights.push({
      severity: 'High',
      category: '보안',
      message: 'HTTPS를 사용하세요. SSL 인증서를 적용하여 보안을 강화하고 사용자 신뢰를 높이세요.',
    });
  }
  
  if (!trustSignals.security.hasPrivacyPolicy) {
    insights.push({
      severity: 'Medium',
      category: '보안',
      message: '개인정보처리방침을 추가하세요. 사용자 데이터 보호에 대한 투명성을 높일 수 있습니다.',
    });
  }
  
  // 상호작용 요소 인사이트
  if (interactions.forms === 0) {
    insights.push({
      severity: 'Low',
      category: '상호작용',
      message: '문의 양식이나 연락 폼을 추가하면 사용자와의 소통을 개선할 수 있습니다.',
    });
  }
  
  if (!interactions.socialShare) {
    insights.push({
      severity: 'Low',
      category: '상호작용',
      message: '소셜 공유 버튼을 추가하면 콘텐츠 확산에 도움이 됩니다.',
    });
  }
  
  return insights;
}