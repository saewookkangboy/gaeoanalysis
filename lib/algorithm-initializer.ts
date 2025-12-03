/**
 * 알고리즘 초기화 시스템
 * 
 * 1. 초기 알고리즘 버전 생성
 * 2. 초기 리서치 데이터 삽입
 */

import { createAlgorithmVersion, saveResearchFinding } from './algorithm-learning';
import db from './db';

// ============================================
// 1. 초기 알고리즘 버전 생성
// ============================================

/**
 * 현재 하드코딩된 가중치를 추출하여 초기 알고리즘 버전 생성
 */
export function initializeAlgorithmVersions(): void {
  console.log('🚀 [Algorithm Initializer] 초기 알고리즘 버전 생성 시작...');
  
  // 테이블 존재 여부 확인
  try {
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='algorithm_versions'").get();
    if (!tableCheck) {
      console.error('❌ [Algorithm Initializer] algorithm_versions 테이블이 없습니다. 마이그레이션 v12가 먼저 실행되어야 합니다.');
      return;
    }
  } catch (error) {
    console.error('❌ [Algorithm Initializer] 테이블 확인 실패:', error);
    return;
  }

  // SEO 알고리즘 초기 가중치
  const seoWeights = {
    h1_tag: 20,
    title_tag: 15,
    meta_description: 15,
    alt_text: 10,
    structured_data: 10,
    meta_keywords: 5,
    og_tags: 10,
    canonical_url: 5,
    internal_links: 5,
    heading_structure: 5,
  };

  // AEO 알고리즘 초기 가중치
  const aeoWeights = {
    question_format: 20,
    faq_section: 15,
    clear_answer_structure: 20,
    keyword_density: 10,
    structured_answer: 15,
    content_freshness: 10,
    term_explanation: 10,
    statistics_bonus: 5,
    quotations_bonus: 3,
  };

  // GEO 알고리즘 초기 가중치
  const geoWeights = {
    content_length_2000: 20,
    content_length_1500: 18,
    content_length_1000: 15,
    content_length_500: 10,
    multimedia_optimal: 15,
    multimedia_good: 10,
    section_structure_optimal: 15,
    section_structure_basic: 10,
    keyword_diversity: 15,
    update_date_optimal: 10,
    update_date_partial: 7,
    social_meta_optimal: 10,
    social_meta_partial: 6,
    structured_data_optimal: 15,
    structured_data_basic: 10,
    voice_search_bonus: 5,
  };

  // AIO 알고리즘 초기 가중치 (기본 점수 계산 가중치)
  const aioWeights = {
    chatgpt_seo_weight: 0.4,
    chatgpt_aeo_weight: 0.35,
    chatgpt_geo_weight: 0.25,
    perplexity_geo_weight: 0.45,
    perplexity_seo_weight: 0.30,
    perplexity_aeo_weight: 0.25,
    gemini_geo_weight: 0.40,
    gemini_seo_weight: 0.35,
    gemini_aeo_weight: 0.25,
    claude_aeo_weight: 0.40,
    claude_geo_weight: 0.35,
    claude_seo_weight: 0.25,
  };

  try {
    // 기존 버전이 없을 때만 생성
    const existingSEO = db.prepare(`
      SELECT COUNT(*) as count FROM algorithm_versions WHERE algorithm_type = 'seo'
    `).get() as { count: number };

    if (existingSEO.count === 0) {
      createAlgorithmVersion('seo', seoWeights, {
        description: '초기 SEO 알고리즘 버전 (하드코딩된 가중치 기반)',
      });
      console.log('✅ [Algorithm Initializer] SEO 초기 버전 생성 완료');
    }

    const existingAEO = db.prepare(`
      SELECT COUNT(*) as count FROM algorithm_versions WHERE algorithm_type = 'aeo'
    `).get() as { count: number };

    if (existingAEO.count === 0) {
      createAlgorithmVersion('aeo', aeoWeights, {
        description: '초기 AEO 알고리즘 버전 (하드코딩된 가중치 기반)',
      });
      console.log('✅ [Algorithm Initializer] AEO 초기 버전 생성 완료');
    }

    const existingGEO = db.prepare(`
      SELECT COUNT(*) as count FROM algorithm_versions WHERE algorithm_type = 'geo'
    `).get() as { count: number };

    if (existingGEO.count === 0) {
      createAlgorithmVersion('geo', geoWeights, {
        description: '초기 GEO 알고리즘 버전 (하드코딩된 가중치 기반)',
      });
      console.log('✅ [Algorithm Initializer] GEO 초기 버전 생성 완료');
    }

    const existingAIO = db.prepare(`
      SELECT COUNT(*) as count FROM algorithm_versions WHERE algorithm_type = 'aio'
    `).get() as { count: number };

    if (existingAIO.count === 0) {
      createAlgorithmVersion('aio', aioWeights, {
        description: '초기 AIO 알고리즘 버전 (하드코딩된 가중치 기반)',
      });
      console.log('✅ [Algorithm Initializer] AIO 초기 버전 생성 완료');
    }

    console.log('✨ [Algorithm Initializer] 모든 알고리즘 초기 버전 생성 완료');
  } catch (error) {
    console.error('❌ [Algorithm Initializer] 초기 버전 생성 실패:', error);
    throw error;
  }
}

// ============================================
// 2. 초기 리서치 데이터 삽입
// ============================================

/**
 * 기존 연구 결과를 기반으로 초기 리서치 데이터 삽입
 */
export function initializeResearchFindings(): void {
  console.log('🚀 [Algorithm Initializer] 초기 리서치 데이터 삽입 시작...');

  const initialResearchFindings = [
    {
      title: 'FAQPage 스키마가 AI 인용 확률을 최대화 (Highest AI citation probability)',
      source: 'Google Research / Claude Skill SEO/GEO Optimizer',
      url: 'https://github.com/199-biotechnologies/claude-skill-seo-geo-optimizer',
      publishedDate: '2025-01-01',
      findings: [
        {
          algorithmType: 'aeo' as const,
          factor: 'faq_schema',
          impact: 0.4, // 40% 증가
          confidence: 0.95,
          description: 'FAQPage 스키마 사용 시 AI 인용 확률 40% 증가',
        },
        {
          algorithmType: 'aio' as const,
          factor: 'faq_schema',
          impact: 0.4,
          confidence: 0.95,
          description: 'FAQPage 스키마가 ChatGPT 인용 확률에 가장 큰 영향',
        },
      ],
    },
    {
      title: 'H2→H3→bullets 구조가 Perplexity 인용을 40% 증가',
      source: 'Perplexity Research / Claude Skill SEO/GEO Optimizer',
      url: 'https://github.com/199-biotechnologies/claude-skill-seo-geo-optimizer',
      publishedDate: '2025-01-01',
      findings: [
        {
          algorithmType: 'geo' as const,
          factor: 'h2_h3_bullets_structure',
          impact: 0.4, // 40% 증가
          confidence: 0.9,
          description: 'H2→H3→bullets 구조 사용 시 Perplexity 인용 40% 증가',
        },
        {
          algorithmType: 'aeo' as const,
          factor: 'h2_h3_bullets_structure',
          impact: 0.35,
          confidence: 0.9,
          description: 'H2→H3→bullets 구조가 명확한 답변 구조에 기여',
        },
      ],
    },
    {
      title: '콘텐츠 신선도(30일 이내 업데이트)가 Perplexity 인용을 3.2배 증가',
      source: 'Perplexity Research / Claude Skill SEO/GEO Optimizer',
      url: 'https://github.com/199-biotechnologies/claude-skill-seo-geo-optimizer',
      publishedDate: '2025-01-01',
      findings: [
        {
          algorithmType: 'geo' as const,
          factor: 'content_freshness_30days',
          impact: 2.2, // 3.2배 = 220% 증가
          confidence: 0.85,
          description: '30일 이내 업데이트된 콘텐츠가 Perplexity 인용을 3.2배 증가',
        },
        {
          algorithmType: 'aeo' as const,
          factor: 'content_freshness_30days',
          impact: 1.5,
          confidence: 0.85,
          description: '최신 정보가 답변 엔진에서 더 높은 신뢰도',
        },
      ],
    },
    {
      title: '통계 및 인용이 AI 인용 확률을 크게 증가 (+41% statistics, +28% quotations)',
      source: 'Claude Skill SEO/GEO Optimizer',
      url: 'https://github.com/199-biotechnologies/claude-skill-seo-geo-optimizer',
      publishedDate: '2025-01-01',
      findings: [
        {
          algorithmType: 'aeo' as const,
          factor: 'statistics',
          impact: 0.41, // 41% 증가
          confidence: 0.9,
          description: '통계 데이터 포함 시 AI 인용 확률 41% 증가',
        },
        {
          algorithmType: 'aeo' as const,
          factor: 'quotations',
          impact: 0.28, // 28% 증가
          confidence: 0.9,
          description: '인용 포함 시 AI 인용 확률 28% 증가',
        },
      ],
    },
    {
      title: '작성자 자격 증명이 ChatGPT 인용을 40% 증가 (+40% citation boost)',
      source: 'Google Research / Claude Skill SEO/GEO Optimizer',
      url: 'https://github.com/199-biotechnologies/claude-skill-seo-geo-optimizer',
      publishedDate: '2025-01-01',
      findings: [
        {
          algorithmType: 'aio' as const,
          factor: 'author_credentials',
          impact: 0.4, // 40% 증가
          confidence: 0.9,
          description: '작성자 자격 증명이 ChatGPT 인용 확률을 40% 증가',
        },
        {
          algorithmType: 'aeo' as const,
          factor: 'author_credentials',
          impact: 0.3,
          confidence: 0.9,
          description: 'E-E-A-T 신호로 답변 엔진 신뢰도 향상',
        },
      ],
    },
    {
      title: 'Claude는 주요 출처만 사용 시 91.2% 정확한 출처 표시',
      source: 'Anthropic Research',
      url: 'https://www.anthropic.com',
      publishedDate: '2025-01-01',
      findings: [
        {
          algorithmType: 'aio' as const,
          factor: 'primary_sources_only',
          impact: 0.3, // 30% 증가
          confidence: 0.95,
          description: '주요 출처(Primary sources)만 사용 시 Claude 인용 정확도 91.2%',
        },
        {
          algorithmType: 'aeo' as const,
          factor: 'primary_sources',
          impact: 0.25,
          confidence: 0.95,
          description: 'PubMed, arXiv 등 주요 출처 인용이 신뢰도 향상',
        },
      ],
    },
  ];

  try {
    // 기존 리서치 데이터 확인
    const existingCount = db.prepare(`
      SELECT COUNT(*) as count FROM research_findings
    `).get() as { count: number };

    if (existingCount.count > 0) {
      console.log(`ℹ️ [Algorithm Initializer] 이미 ${existingCount.count}개의 리서치 데이터가 존재합니다.`);
      return;
    }

    // 초기 리서치 데이터 삽입
    for (const finding of initialResearchFindings) {
      saveResearchFinding(finding);
    }

    console.log(`✅ [Algorithm Initializer] ${initialResearchFindings.length}개의 초기 리서치 데이터 삽입 완료`);
  } catch (error) {
    console.error('❌ [Algorithm Initializer] 초기 리서치 데이터 삽입 실패:', error);
    throw error;
  }
}

/**
 * 전체 초기화 실행
 */
export function initializeAlgorithms(): void {
  try {
    initializeAlgorithmVersions();
    initializeResearchFindings();
    console.log('✨ [Algorithm Initializer] 전체 초기화 완료');
  } catch (error) {
    console.error('❌ [Algorithm Initializer] 초기화 실패:', error);
    throw error;
  }
}

