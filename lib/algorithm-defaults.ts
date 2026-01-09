export const DEFAULT_SEO_WEIGHTS = {
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
} as const;

export const DEFAULT_AEO_WEIGHTS = {
  question_format: 20,
  faq_section: 15,
  clear_answer_structure: 20,
  keyword_density: 10,
  structured_answer: 15,
  content_freshness: 10,
  term_explanation: 10,
  statistics_bonus: 5,
  quotations_bonus: 3,
} as const;

export const DEFAULT_GEO_WEIGHTS = {
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
} as const;

export const DEFAULT_AIO_WEIGHTS = {
  chatgpt_seo_weight: 0.4,
  chatgpt_aeo_weight: 0.35,
  chatgpt_geo_weight: 0.25,
  perplexity_geo_weight: 0.45,
  perplexity_seo_weight: 0.3,
  perplexity_aeo_weight: 0.25,
  grok_geo_weight: 0.45,
  grok_seo_weight: 0.3,
  grok_aeo_weight: 0.25,
  gemini_geo_weight: 0.4,
  gemini_seo_weight: 0.35,
  gemini_aeo_weight: 0.25,
  claude_aeo_weight: 0.4,
  claude_geo_weight: 0.35,
  claude_seo_weight: 0.25,
} as const;

export type SEOWeights = typeof DEFAULT_SEO_WEIGHTS;
export type AEOWeights = typeof DEFAULT_AEO_WEIGHTS;
export type GEOWeights = typeof DEFAULT_GEO_WEIGHTS;
export type AIOWeights = typeof DEFAULT_AIO_WEIGHTS;
