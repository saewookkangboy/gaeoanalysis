/**
 * 알고리즘 자동 학습 파이프라인
 * 
 * 3. 분석 결과를 기반으로 자동 학습 수행
 */

import db from './db';
import {
  getActiveAlgorithmVersion,
  learnWeights,
  updateAlgorithmPerformance,
  createABTest,
} from './algorithm-learning';
import * as cheerio from 'cheerio';

// ============================================
// 특징 추출 함수
// ============================================

/**
 * SEO 특징 추출
 */
export function extractSEOFeatures($: cheerio.CheerioAPI): Record<string, number> {
  const h1Count = $('h1').length;
  const title = $('title').text().trim();
  const metaDesc = $('meta[name="description"]').attr('content') || '';
  const images = $('img');
  const imagesWithAlt = images.filter((_, el) => !!$(el).attr('alt')).length;
  const altRatio = images.length > 0 ? imagesWithAlt / images.length : 0;
  const structuredData = $('script[type="application/ld+json"]').length;
  const metaKeywords = $('meta[name="keywords"]').attr('content');
  const ogTitle = $('meta[property="og:title"]').attr('content');
  const canonical = $('link[rel="canonical"]').attr('href');
  const internalLinks = $('a[href^="/"], a[href^="./"]').length;
  const hasH2 = $('h2').length > 0 ? 1 : 0;

  return {
    h1_tag: h1Count === 1 ? 1 : 0,
    title_tag: title.length > 0 && title.length <= 60 ? 1 : 0,
    meta_description: metaDesc.length > 0 && metaDesc.length <= 160 ? 1 : 0,
    alt_text: altRatio >= 0.8 ? 1 : 0,
    structured_data: structuredData > 0 ? 1 : 0,
    meta_keywords: metaKeywords ? 1 : 0,
    og_tags: ogTitle ? 1 : 0,
    canonical_url: canonical ? 1 : 0,
    internal_links: internalLinks > 0 ? 1 : 0,
    heading_structure: hasH2,
  };
}

/**
 * AEO 특징 추출
 */
export function extractAEOFeatures($: cheerio.CheerioAPI): Record<string, number> {
  const text = $('body').text();
  const hasQuestions = /[?？]/.test(text) || /\b(what|how|why|when|where|who|어떻게|왜|언제|어디서|누가)\b/i.test(text) ? 1 : 0;
  const hasFAQ = $('*:contains("FAQ"), *:contains("자주 묻는 질문"), [class*="faq"], [id*="faq"]').length > 0 ? 1 : 0;
  const hasFAQSchema = $('script[type="application/ld+json"]').text().includes('FAQPage') ? 1 : 0;
  const hasH2 = $('h2').length > 0 ? 1 : 0;
  const hasH3 = $('h3').length > 0 ? 1 : 0;
  const hasList = $('ul, ol').length > 0 ? 1 : 0;
  const hasParagraphs = $('p').length > 3 ? 1 : 0;
  const hasH2H3Bullets = (hasH2 && hasH3 && hasList) ? 1 : 0;
  const wordCount = text.split(/\s+/).length;
  const hasDefinitionList = $('dl').length > 0 ? 1 : 0;
  const hasTable = $('table').length > 0 ? 1 : 0;
  const hasDate = $('time, [datetime], [class*="date"], [class*="updated"]').length > 0 ? 1 : 0;
  const hasRecentYear = /(202[4-9]|최근|recent|updated|latest)/i.test(text) ? 1 : 0;
  const hasAbbr = $('abbr, dfn').length > 0 ? 1 : 0;
  const hasStatistics = /\d+%|\d+\.\d+%|통계|statistics|연구|study/i.test(text) ? 1 : 0;
  const hasQuotations = /["'"]|인용|quotation|citation|출처/i.test(text) ? 1 : 0;

  return {
    question_format: hasQuestions,
    faq_section: (hasFAQ || hasFAQSchema) ? 1 : 0,
    faq_schema: hasFAQSchema,
    clear_answer_structure: (hasH2H3Bullets || (hasList && hasParagraphs)) ? 1 : 0,
    h2_h3_bullets_structure: hasH2H3Bullets,
    keyword_density: wordCount >= 300 ? 1 : 0,
    structured_answer: (hasDefinitionList || hasTable) ? 1 : 0,
    content_freshness: (hasDate || hasRecentYear) ? 1 : 0,
    content_freshness_30days: (hasDate && hasRecentYear) ? 1 : 0,
    term_explanation: hasAbbr,
    statistics: hasStatistics,
    quotations: hasQuotations,
  };
}

/**
 * GEO 특징 추출
 */
export function extractGEOFeatures($: cheerio.CheerioAPI): Record<string, number> {
  const text = $('body').text();
  const wordCount = text.split(/\s+/).length;
  const images = $('img').length;
  const videos = $('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length;
  const sections = $('section, article, [class*="section"], [class*="article"]').length;
  const hasH2 = $('h2').length > 0 ? 1 : 0;
  const hasH3 = $('h3').length > 0 ? 1 : 0;
  const hasBullets = $('ul, ol').length > 0 ? 1 : 0;
  const hasH2H3Bullets = (hasH2 && hasH3 && hasBullets) ? 1 : 0;
  const words = text.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  const diversity = uniqueWords.size / words.length;
  const hasUpdateDate = $('time, [datetime], [class*="date"], [class*="updated"]').length > 0 ? 1 : 0;
  const hasRecentYear = /(202[4-9]|최근|recent|updated|latest)/i.test(text) ? 1 : 0;
  const ogTags = $('meta[property^="og:"]').length;
  const twitterTags = $('meta[name^="twitter:"]').length;
  const structuredData = $('script[type="application/ld+json"]').length;
  const structuredDataText = $('script[type="application/ld+json"]').text();
  const hasFAQSchema = structuredDataText.includes('FAQPage');
  const hasArticleSchema = structuredDataText.includes('"Article"') || structuredDataText.includes('"BlogPosting"');
  const hasHowToSchema = structuredDataText.includes('HowTo');
  const hasSpeakable = structuredDataText.includes('Speakable');

  return {
    content_length: wordCount,
    content_length_2000: wordCount >= 2000 ? 1 : 0,
    content_length_1500: wordCount >= 1500 ? 1 : 0,
    content_length_1000: wordCount >= 1000 ? 1 : 0,
    content_length_500: wordCount >= 500 ? 1 : 0,
    images_count: images,
    videos_count: videos,
    multimedia_optimal: (images >= 3 || videos > 0) ? 1 : 0,
    multimedia_good: images >= 1 ? 1 : 0,
    sections_count: sections,
    section_structure_optimal: hasH2H3Bullets ? 1 : 0,
    section_structure_basic: (sections > 0 || hasH2) ? 1 : 0,
    h2_h3_bullets_structure: hasH2H3Bullets,
    keyword_diversity: diversity > 0.3 ? 1 : 0,
    update_date_optimal: (hasUpdateDate && hasRecentYear) ? 1 : 0,
    update_date_partial: (hasUpdateDate || hasRecentYear) ? 1 : 0,
    content_freshness_30days: (hasUpdateDate && hasRecentYear) ? 1 : 0,
    social_meta_optimal: (ogTags >= 3 && twitterTags >= 2) ? 1 : 0,
    social_meta_partial: (ogTags > 0 || twitterTags > 0) ? 1 : 0,
    structured_data_optimal: (structuredData > 0 && (hasFAQSchema || hasArticleSchema || hasHowToSchema)) ? 1 : 0,
    structured_data_basic: structuredData > 0 ? 1 : 0,
    voice_search_bonus: (hasSpeakable) ? 1 : 0,
  };
}

// ============================================
// 자동 학습 함수
// ============================================

/**
 * 분석 결과를 기반으로 자동 학습 수행
 */
export function autoLearnFromAnalysis(
  analysisId: string,
  url: string,
  html: string,
  predictedScores: {
    aeo: number;
    geo: number;
    seo: number;
  },
  actualScores?: {
    aeo?: number;
    geo?: number;
    seo?: number;
  }
): void {
  try {
    const $ = cheerio.load(html);

    // SEO 학습
    if (predictedScores.seo !== undefined) {
      const seoFeatures = extractSEOFeatures($);
      const seoActual = actualScores?.seo ?? predictedScores.seo; // 실제 점수가 없으면 예상 점수 사용
      
      const seoVersion = getActiveAlgorithmVersion('seo');
      if (seoVersion) {
        // 가중치 학습
        const adjustedWeights = learnWeights('seo', seoFeatures, seoActual, predictedScores.seo);
        
        // 성능 업데이트
        updateAlgorithmPerformance(seoVersion.id, seoActual, predictedScores.seo);
        
        console.log('✅ [Auto Learning] SEO 학습 완료:', {
          analysisId,
          predicted: predictedScores.seo,
          actual: seoActual,
          error: Math.abs(seoActual - predictedScores.seo),
        });
      }
    }

    // AEO 학습
    if (predictedScores.aeo !== undefined) {
      const aeoFeatures = extractAEOFeatures($);
      const aeoActual = actualScores?.aeo ?? predictedScores.aeo;
      
      const aeoVersion = getActiveAlgorithmVersion('aeo');
      if (aeoVersion) {
        const adjustedWeights = learnWeights('aeo', aeoFeatures, aeoActual, predictedScores.aeo);
        updateAlgorithmPerformance(aeoVersion.id, aeoActual, predictedScores.aeo);
        
        console.log('✅ [Auto Learning] AEO 학습 완료:', {
          analysisId,
          predicted: predictedScores.aeo,
          actual: aeoActual,
          error: Math.abs(aeoActual - predictedScores.aeo),
        });
      }
    }

    // GEO 학습
    if (predictedScores.geo !== undefined) {
      const geoFeatures = extractGEOFeatures($);
      const geoActual = actualScores?.geo ?? predictedScores.geo;
      
      const geoVersion = getActiveAlgorithmVersion('geo');
      if (geoVersion) {
        const adjustedWeights = learnWeights('geo', geoFeatures, geoActual, predictedScores.geo);
        updateAlgorithmPerformance(geoVersion.id, geoActual, predictedScores.geo);
        
        console.log('✅ [Auto Learning] GEO 학습 완료:', {
          analysisId,
          predicted: predictedScores.geo,
          actual: geoActual,
          error: Math.abs(geoActual - predictedScores.geo),
        });
      }
    }
  } catch (error) {
    console.error('❌ [Auto Learning] 학습 실패:', error);
    // 학습 실패해도 분석은 계속 진행
  }
}

/**
 * 이전 분석과 비교하여 개선 여부 확인 및 학습
 */
export function learnFromImprovement(
  analysisId: string,
  currentScores: { aeo: number; geo: number; seo: number },
  previousScores?: { aeo: number; geo: number; seo: number }
): void {
  if (!previousScores) return;

  try {
    // 개선된 항목에 대해 더 높은 가중치 부여
    const improvements = {
      aeo: currentScores.aeo > previousScores.aeo,
      geo: currentScores.geo > previousScores.geo,
      seo: currentScores.seo > previousScores.seo,
    };

    // 개선된 알고리즘에 대해 보상 (성능 향상)
    if (improvements.aeo) {
      const aeoVersion = getActiveAlgorithmVersion('aeo');
      if (aeoVersion) {
        const improvement = currentScores.aeo - previousScores.aeo;
        // 개선율을 성능에 반영
        updateAlgorithmPerformance(
          aeoVersion.id,
          currentScores.aeo,
          previousScores.aeo + improvement * 0.5 // 보수적 추정
        );
      }
    }

    if (improvements.geo) {
      const geoVersion = getActiveAlgorithmVersion('geo');
      if (geoVersion) {
        const improvement = currentScores.geo - previousScores.geo;
        updateAlgorithmPerformance(
          geoVersion.id,
          currentScores.geo,
          previousScores.geo + improvement * 0.5
        );
      }
    }

    if (improvements.seo) {
      const seoVersion = getActiveAlgorithmVersion('seo');
      if (seoVersion) {
        const improvement = currentScores.seo - previousScores.seo;
        updateAlgorithmPerformance(
          seoVersion.id,
          currentScores.seo,
          previousScores.seo + improvement * 0.5
        );
      }
    }

    console.log('✅ [Auto Learning] 개선 기반 학습 완료:', {
      analysisId,
      improvements,
    });
  } catch (error) {
    console.error('❌ [Auto Learning] 개선 기반 학습 실패:', error);
  }
}

