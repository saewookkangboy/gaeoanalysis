import * as cheerio from 'cheerio';

/**
 * 인용 소스 정보
 */
export interface CitationSource {
  url: string;
  domain: string;
  anchorText: string;
  position: number; // 문서 내 위치 (0-100)
  isTargetUrl: boolean; // 타겟 URL인지 여부
  linkType: 'internal' | 'external' | 'citation' | 'reference';
  context?: string; // 링크 주변 텍스트
}

/**
 * 인용 소스 추출 결과
 */
export interface CitationExtractionResult {
  sources: CitationSource[];
  totalLinks: number;
  externalLinks: number;
  internalLinks: number;
  citationLinks: number;
  targetUrlCitations: number; // 타겟 URL이 인용된 횟수
}

/**
 * HTML에서 인용 소스를 추출합니다.
 * 
 * @param html HTML 콘텐츠
 * @param targetUrl 분석 대상 URL (타겟 URL 인용 여부 확인용)
 * @returns 인용 소스 추출 결과
 */
export function extractCitationSources(html: string, targetUrl: string): CitationExtractionResult {
  const $ = cheerio.load(html);
  const sources: CitationSource[] = [];
  
  // 타겟 URL의 도메인 추출
  let targetDomain = '';
  try {
    const targetUrlObj = new URL(targetUrl);
    targetDomain = targetUrlObj.hostname.replace('www.', '');
  } catch (error) {
    console.warn('⚠️ [Citation Extractor] 타겟 URL 파싱 실패:', error);
  }

  // 모든 링크 추출
  const allLinks = $('a[href]');
  const totalLinks = allLinks.length;
  let externalLinks = 0;
  let internalLinks = 0;
  let citationLinks = 0;
  let targetUrlCitations = 0;

  // 전체 텍스트 길이 (위치 계산용)
  const bodyText = $('body').text();
  const totalTextLength = bodyText.length;

  allLinks.each((index, element) => {
    const $link = $(element);
    const href = $link.attr('href');
    if (!href) return;

    let fullUrl = '';
    let domain = '';
    let isTargetUrl = false;
    let linkType: CitationSource['linkType'] = 'external';

    try {
      // 절대 URL
      if (href.startsWith('http://') || href.startsWith('https://')) {
        fullUrl = href;
        const urlObj = new URL(href);
        domain = urlObj.hostname.replace('www.', '');
        
        // 타겟 URL인지 확인
        if (targetDomain && domain === targetDomain) {
          isTargetUrl = true;
          targetUrlCitations++;
        }
        
        // 내부 링크인지 확인
        if (targetDomain && domain === targetDomain) {
          linkType = 'internal';
          internalLinks++;
        } else {
          linkType = 'external';
          externalLinks++;
        }
      } 
      // 상대 URL
      else if (href.startsWith('/') || href.startsWith('./') || href.startsWith('../')) {
        try {
          const baseUrl = new URL(targetUrl);
          fullUrl = new URL(href, baseUrl.origin).toString();
          domain = baseUrl.hostname.replace('www.', '');
          linkType = 'internal';
          internalLinks++;
        } catch (error) {
          // 상대 URL 파싱 실패 시 스킵
          return;
        }
      } else {
        // 기타 (mailto:, tel: 등)는 스킵
        return;
      }

      // 앵커 텍스트 추출
      const anchorText = $link.text().trim() || href;
      
      // 링크 주변 컨텍스트 추출 (부모 요소의 텍스트 일부)
      let context = '';
      const parent = $link.parent();
      if (parent.length > 0) {
        const parentText = parent.text();
        const linkIndex = parentText.indexOf(anchorText);
        if (linkIndex >= 0) {
          const start = Math.max(0, linkIndex - 50);
          const end = Math.min(parentText.length, linkIndex + anchorText.length + 50);
          context = parentText.substring(start, end).trim();
        }
      }

      // 인용/참고 링크인지 확인
      const linkTextLower = anchorText.toLowerCase();
      const contextLower = context.toLowerCase();
      const isCitation = 
        linkTextLower.includes('참고') ||
        linkTextLower.includes('출처') ||
        linkTextLower.includes('reference') ||
        linkTextLower.includes('citation') ||
        linkTextLower.includes('source') ||
        linkTextLower.includes('인용') ||
        contextLower.includes('참고') ||
        contextLower.includes('출처') ||
        contextLower.includes('reference') ||
        contextLower.includes('citation');

      if (isCitation) {
        linkType = 'citation';
        citationLinks++;
      }

      // 링크 위치 계산 (0-100)
      const linkText = $link.text();
      const linkTextIndex = bodyText.indexOf(linkText);
      const position = linkTextIndex >= 0 
        ? Math.round((linkTextIndex / totalTextLength) * 100)
        : Math.round((index / totalLinks) * 100);

      sources.push({
        url: fullUrl,
        domain,
        anchorText,
        position,
        isTargetUrl,
        linkType,
        context: context || undefined,
      });
    } catch (error) {
      console.warn('⚠️ [Citation Extractor] 링크 처리 실패:', { href, error });
    }
  });

  return {
    sources,
    totalLinks,
    externalLinks,
    internalLinks,
    citationLinks,
    targetUrlCitations,
  };
}

/**
 * 도메인별 통계 계산
 */
export interface DomainStatistics {
  domain: string;
  citationCount: number;
  averagePosition: number;
  linkTypes: {
    citation: number;
    external: number;
    internal: number;
  };
  isTargetUrl: boolean;
}

export function calculateDomainStatistics(
  sources: CitationSource[],
  targetDomain: string
): DomainStatistics[] {
  const domainMap = new Map<string, {
    citations: CitationSource[];
    linkTypes: { citation: number; external: number; internal: number };
  }>();

  sources.forEach(source => {
    if (!domainMap.has(source.domain)) {
      domainMap.set(source.domain, {
        citations: [],
        linkTypes: { citation: 0, external: 0, internal: 0 },
      });
    }

    const domainData = domainMap.get(source.domain)!;
    domainData.citations.push(source);
    
    if (source.linkType === 'citation') domainData.linkTypes.citation++;
    else if (source.linkType === 'external') domainData.linkTypes.external++;
    else if (source.linkType === 'internal') domainData.linkTypes.internal++;
  });

  const statistics: DomainStatistics[] = [];

  domainMap.forEach((data, domain) => {
    const positions = data.citations.map(c => c.position);
    const averagePosition = positions.length > 0
      ? Math.round(positions.reduce((a, b) => a + b, 0) / positions.length)
      : 0;

    statistics.push({
      domain,
      citationCount: data.citations.length,
      averagePosition,
      linkTypes: data.linkTypes,
      isTargetUrl: domain === targetDomain,
    });
  });

  // 인용 횟수 내림차순 정렬
  return statistics.sort((a, b) => b.citationCount - a.citationCount);
}

