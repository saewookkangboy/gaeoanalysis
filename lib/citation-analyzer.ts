import { CitationSource, DomainStatistics } from './citation-extractor';

/**
 * 도메인 권위성 점수 (0-100)
 */
export interface DomainAuthority {
  domain: string;
  authorityScore: number; // 0-100
  factors: {
    citationCount: number;
    averagePosition: number; // 낮을수록 좋음 (상단 인용)
    citationType: number; // citation 링크 비율
    targetUrlCitation: boolean;
  };
}

/**
 * 도메인 권위성 평가
 * 
 * 평가 기준:
 * 1. 인용 횟수 (40%)
 * 2. 평균 인용 위치 (30%) - 상단 인용일수록 높은 점수
 * 3. 인용 타입 (20%) - citation/reference 링크 비율
 * 4. 타겟 URL 인용 여부 (10%)
 */
export function calculateDomainAuthority(
  domain: string,
  sources: CitationSource[],
  domainStats: DomainStatistics
): DomainAuthority {
  const domainSources = sources.filter(s => s.domain === domain);
  
  if (domainSources.length === 0) {
    return {
      domain,
      authorityScore: 0,
      factors: {
        citationCount: 0,
        averagePosition: 100,
        citationType: 0,
        targetUrlCitation: false,
      },
    };
  }

  // 1. 인용 횟수 점수 (40점)
  const citationCountScore = Math.min(40, (domainStats.citationCount / 10) * 40);

  // 2. 평균 인용 위치 점수 (30점) - 상단 인용일수록 높은 점수
  // 위치가 0-30이면 30점, 30-60이면 20점, 60-100이면 10점
  const avgPosition = domainStats.averagePosition;
  let positionScore = 0;
  if (avgPosition <= 30) {
    positionScore = 30;
  } else if (avgPosition <= 60) {
    positionScore = 20;
  } else {
    positionScore = 10;
  }

  // 3. 인용 타입 점수 (20점) - citation/reference 링크 비율
  const citationTypeRatio = domainStats.linkTypes.citation / domainStats.citationCount;
  const citationTypeScore = citationTypeRatio * 20;

  // 4. 타겟 URL 인용 여부 (10점)
  const targetUrlScore = domainStats.isTargetUrl ? 10 : 0;

  const authorityScore = Math.round(
    citationCountScore + positionScore + citationTypeScore + targetUrlScore
  );

  return {
    domain,
    authorityScore: Math.min(100, Math.max(0, authorityScore)),
    factors: {
      citationCount: domainStats.citationCount,
      averagePosition: avgPosition,
      citationType: Math.round(citationTypeRatio * 100),
      targetUrlCitation: domainStats.isTargetUrl,
    },
  };
}

/**
 * 모든 도메인의 권위성 평가
 */
export function calculateAllDomainAuthorities(
  sources: CitationSource[],
  domainStats: DomainStatistics[]
): DomainAuthority[] {
  return domainStats.map(stats => 
    calculateDomainAuthority(stats.domain, sources, stats)
  ).sort((a, b) => b.authorityScore - a.authorityScore);
}

/**
 * 인용 획득 기회 발견
 */
export interface CitationOpportunity {
  domain: string;
  authorityScore: number;
  opportunityScore: number; // 0-100, 인용 획득 가능성
  reasons: string[];
  recommendations: string[];
}

/**
 * 고권위 도메인 중 타겟이 인용되지 않은 도메인 식별
 */
export function findCitationOpportunities(
  domainAuthorities: DomainAuthority[],
  targetDomain: string
): CitationOpportunity[] {
  const opportunities: CitationOpportunity[] = [];

  domainAuthorities.forEach(authority => {
    // 타겟 도메인이 아니고, 권위성 점수가 50 이상인 도메인
    if (authority.domain !== targetDomain && authority.authorityScore >= 50) {
      const opportunityScore = Math.min(100, authority.authorityScore + 20); // 기회 점수는 권위성 + 20
      
      const reasons: string[] = [];
      const recommendations: string[] = [];

      reasons.push(`고권위 도메인 (점수: ${authority.authorityScore})`);
      
      if (authority.factors.averagePosition <= 30) {
        reasons.push('상단 인용 (높은 가시성)');
        recommendations.push('해당 도메인에 콘텐츠를 제공하여 상단 인용을 목표로 하세요');
      }

      if (authority.factors.citationType >= 50) {
        reasons.push('인용 링크 비율이 높음');
        recommendations.push('학술적이거나 전문적인 콘텐츠를 작성하여 인용 링크로 연결되도록 하세요');
      }

      if (authority.factors.citationCount >= 5) {
        reasons.push('다수의 인용 발생');
        recommendations.push('해당 도메인과의 관계를 구축하여 인용 기회를 늘리세요');
      }

      opportunities.push({
        domain: authority.domain,
        authorityScore: authority.authorityScore,
        opportunityScore,
        reasons,
        recommendations,
      });
    }
  });

  return opportunities.sort((a, b) => b.opportunityScore - a.opportunityScore);
}

/**
 * 품질 관리: 오래된 소스 감지
 */
export interface QualityIssue {
  type: 'outdated' | 'inaccurate' | 'negative';
  source: CitationSource;
  severity: 'high' | 'medium' | 'low';
  message: string;
  recommendation: string;
}

/**
 * 오래된 소스 감지 (기본 구현)
 * 실제로는 URL의 콘텐츠를 확인해야 하지만, 여기서는 기본적인 패턴 매칭만 수행
 */
export function detectQualityIssues(sources: CitationSource[]): QualityIssue[] {
  const issues: QualityIssue[] = [];

  sources.forEach(source => {
    // 오래된 URL 패턴 감지 (예: 2020년 이전 날짜가 포함된 URL)
    const oldYearPattern = /(201[0-9]|2020|2021)/;
    if (oldYearPattern.test(source.url)) {
      issues.push({
        type: 'outdated',
        source,
        severity: 'medium',
        message: '오래된 소스로 보입니다 (2021년 이전)',
        recommendation: '최신 소스로 업데이트하거나 콘텐츠를 갱신하세요',
      });
    }

    // 부정적 키워드 감지 (기본)
    const negativeKeywords = ['scam', 'fraud', 'complaint', 'negative', 'bad', 'worst'];
    const urlLower = source.url.toLowerCase();
    const anchorLower = source.anchorText.toLowerCase();
    
    if (negativeKeywords.some(keyword => urlLower.includes(keyword) || anchorLower.includes(keyword))) {
      issues.push({
        type: 'negative',
        source,
        severity: 'high',
        message: '부정적 소스로 보입니다',
        recommendation: '해당 소스를 제거하거나 대체하세요',
      });
    }
  });

  return issues;
}

