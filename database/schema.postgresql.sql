-- ============================================
-- GAEO Analysis Database Schema (PostgreSQL)
-- 확장 가능한 데이터베이스 설계
-- ============================================

-- ============================================
-- 1. 사용자 관리 (Users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  image TEXT,
  blog_url TEXT,
  provider VARCHAR(50), -- 'google', 'github'
  role VARCHAR(50) DEFAULT 'user', -- 'user', 'admin'
  is_active BOOLEAN DEFAULT TRUE, -- false: 비활성, true: 활성
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Provider별 독립적인 사용자 관리를 위한 복합 UNIQUE 인덱스
-- 같은 이메일이라도 Provider가 다르면 다른 사용자로 취급
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_provider 
ON users(email, COALESCE(provider, ''));

-- ============================================
-- 2. 인증 로그 (Authentication Logs)
-- ============================================
CREATE TABLE IF NOT EXISTS auth_logs (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255),
  provider VARCHAR(50) NOT NULL, -- 'google', 'github'
  action VARCHAR(50) NOT NULL, -- 'login', 'logout', 'signup'
  ip_address VARCHAR(255),
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE, -- false: 실패, true: 성공
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- 3. 분석 이력 (Analyses)
-- ============================================
CREATE TABLE IF NOT EXISTS analyses (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255),
  url TEXT NOT NULL,
  aeo_score INTEGER NOT NULL CHECK(aeo_score >= 0 AND aeo_score <= 100),
  geo_score INTEGER NOT NULL CHECK(geo_score >= 0 AND geo_score <= 100),
  seo_score INTEGER NOT NULL CHECK(seo_score >= 0 AND seo_score <= 100),
  overall_score REAL NOT NULL CHECK(overall_score >= 0 AND overall_score <= 100),
  insights TEXT NOT NULL, -- JSON 문자열
  chatgpt_score INTEGER CHECK(chatgpt_score IS NULL OR (chatgpt_score >= 0 AND chatgpt_score <= 100)),
  perplexity_score INTEGER CHECK(perplexity_score IS NULL OR (perplexity_score >= 0 AND perplexity_score <= 100)),
  grok_score INTEGER CHECK(grok_score IS NULL OR (grok_score >= 0 AND grok_score <= 100)),
  gemini_score INTEGER CHECK(gemini_score IS NULL OR (gemini_score >= 0 AND gemini_score <= 100)),
  claude_score INTEGER CHECK(claude_score IS NULL OR (claude_score >= 0 AND claude_score <= 100)),
  ai_visibility_score INTEGER CHECK(ai_visibility_score IS NULL OR (ai_visibility_score >= 0 AND ai_visibility_score <= 100)),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 4. 인용 소스 (Citations)
-- ============================================
CREATE TABLE IF NOT EXISTS citations (
  id TEXT PRIMARY KEY,
  analysis_id TEXT NOT NULL,
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  anchor_text TEXT,
  position INTEGER CHECK(position >= 0 AND position <= 100),
  is_target_url BOOLEAN DEFAULT false,
  link_type TEXT CHECK(link_type IN ('internal', 'external', 'citation', 'reference')),
  context TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_citations_analysis_id ON citations(analysis_id);
CREATE INDEX IF NOT EXISTS idx_citations_domain ON citations(domain);
CREATE INDEX IF NOT EXISTS idx_citations_is_target_url ON citations(is_target_url);
CREATE INDEX IF NOT EXISTS idx_citations_link_type ON citations(link_type);

-- ============================================
-- 5. 채팅 대화 (Chat Conversations)
-- ============================================
CREATE TABLE IF NOT EXISTS chat_conversations (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255),
  analysis_id VARCHAR(255),
  messages TEXT NOT NULL, -- JSON 문자열
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
);

-- ============================================
-- 5. AI Agent 사용 이력 (AI Agent Usage)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_agent_usage (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255),
  analysis_id VARCHAR(255),
  conversation_id VARCHAR(255),
  agent_type VARCHAR(50) NOT NULL, -- 'chatgpt', 'perplexity', 'grok', 'gemini', 'claude'
  action VARCHAR(50) NOT NULL, -- 'query', 'response', 'error'
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cost REAL DEFAULT 0.0,
  response_time_ms INTEGER,
  success BOOLEAN DEFAULT TRUE, -- false: 실패, true: 성공
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE SET NULL,
  FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE SET NULL
);

-- ============================================
-- 6. 사이트 통계 (Site Statistics)
-- ============================================
CREATE TABLE IF NOT EXISTS site_statistics (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  total_analyses INTEGER DEFAULT 0,
  new_analyses INTEGER DEFAULT 0,
  total_chat_conversations INTEGER DEFAULT 0,
  new_chat_conversations INTEGER DEFAULT 0,
  total_ai_agent_usage INTEGER DEFAULT 0,
  total_ai_agent_cost REAL DEFAULT 0.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 7. 어드민 활동 로그 (Admin Logs)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_logs (
  id VARCHAR(255) PRIMARY KEY,
  admin_user_id VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL, -- 'user_management', 'analysis_management', 'statistics_view', 'settings_update'
  target_type VARCHAR(50), -- 'user', 'analysis', 'conversation', 'system'
  target_id VARCHAR(255),
  details TEXT, -- JSON 문자열
  ip_address VARCHAR(255),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 8. 공지사항 (Announcements)
-- ============================================
CREATE TABLE IF NOT EXISTS announcements (
  id VARCHAR(255) PRIMARY KEY,
  message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- 9. 스키마 마이그레이션 (Schema Migrations)
-- ============================================
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 인덱스 생성
-- ============================================

-- Users 인덱스
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_provider_email ON users(provider, email);

-- Auth Logs 인덱스
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id ON auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_provider ON auth_logs(provider);
CREATE INDEX IF NOT EXISTS idx_auth_logs_action ON auth_logs(action);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON auth_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_created ON auth_logs(user_id, created_at DESC);

-- Analyses 인덱스
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at);
CREATE INDEX IF NOT EXISTS idx_analyses_url ON analyses(url);
CREATE INDEX IF NOT EXISTS idx_analyses_user_created ON analyses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_url_created ON analyses(url, created_at DESC);

-- Chat Conversations 인덱스
CREATE INDEX IF NOT EXISTS idx_chat_user_id ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_analysis_id ON chat_conversations(analysis_id);
CREATE INDEX IF NOT EXISTS idx_chat_user_updated ON chat_conversations(user_id, updated_at DESC);

-- AI Agent Usage 인덱스
CREATE INDEX IF NOT EXISTS idx_ai_agent_user_id ON ai_agent_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_analysis_id ON ai_agent_usage(analysis_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_conversation_id ON ai_agent_usage(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_type ON ai_agent_usage(agent_type);
CREATE INDEX IF NOT EXISTS idx_ai_agent_created_at ON ai_agent_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_agent_user_created ON ai_agent_usage(user_id, created_at DESC);

-- Site Statistics 인덱스
CREATE INDEX IF NOT EXISTS idx_site_stats_date ON site_statistics(date);

-- Admin Logs 인덱스
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_user_id ON admin_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON admin_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);

-- Announcements 인덱스
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);

-- ============================================
-- 트리거 생성 (updated_at 자동 업데이트)
-- ============================================

-- Users updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_users_updated_at();

-- Chat Conversations updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_chat_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_chat_conversations_updated_at ON chat_conversations;
CREATE TRIGGER update_chat_conversations_updated_at
BEFORE UPDATE ON chat_conversations
FOR EACH ROW
EXECUTE FUNCTION update_chat_conversations_updated_at();

-- Site Statistics updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_site_statistics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_site_statistics_updated_at ON site_statistics;
CREATE TRIGGER update_site_statistics_updated_at
BEFORE UPDATE ON site_statistics
FOR EACH ROW
EXECUTE FUNCTION update_site_statistics_updated_at();

-- Announcements updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_announcements_updated_at ON announcements;
CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON announcements
FOR EACH ROW
EXECUTE FUNCTION update_announcements_updated_at();

-- ============================================
-- 뷰 생성 (통계 및 조회 최적화)
-- ============================================

-- 사용자 통계 뷰
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
  u.id,
  u.email,
  u.name,
  u.provider,
  u.role,
  u.created_at as user_created_at,
  u.last_login_at,
  COUNT(DISTINCT a.id) as total_analyses,
  COUNT(DISTINCT c.id) as total_conversations,
  COUNT(DISTINCT al.id) as total_login_count,
  MAX(al.created_at) as last_login_log_at
FROM users u
LEFT JOIN analyses a ON u.id = a.user_id
LEFT JOIN chat_conversations c ON u.id = c.user_id
LEFT JOIN auth_logs al ON u.id = al.user_id AND al.action = 'login' AND al.success = TRUE
GROUP BY u.id;

-- 일별 통계 뷰
CREATE OR REPLACE VIEW daily_statistics AS
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) as total_count
FROM analyses
GROUP BY DATE(created_at);

-- ============================================
-- 10. Agent Lightning 학습 데이터 스키마
-- SEO, AIO, AEO, GEO 학습에 필요한 데이터 저장
-- ============================================

-- ============================================
-- 9.1 Agent Spans (이벤트 추적)
-- ============================================
CREATE TABLE IF NOT EXISTS agent_spans (
  id VARCHAR(255) PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- 'prompt', 'response', 'tool_call', 'reward'
  agent_type VARCHAR(50) NOT NULL, -- 'seo', 'aeo', 'geo', 'aio', 'chat'
  user_id VARCHAR(255),
  analysis_id VARCHAR(255),
  conversation_id VARCHAR(255),
  data TEXT NOT NULL, -- JSON 문자열
  metadata TEXT, -- JSON 문자열
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE SET NULL,
  FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE SET NULL
);

-- ============================================
-- 9.2 Prompt Templates (프롬프트 템플릿)
-- ============================================
CREATE TABLE IF NOT EXISTS prompt_templates (
  id VARCHAR(255) PRIMARY KEY,
  agent_type VARCHAR(50) NOT NULL, -- 'seo', 'aeo', 'geo', 'aio', 'chat'
  template TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  avg_score REAL DEFAULT 0.0,
  total_uses INTEGER DEFAULT 0,
  success_rate REAL DEFAULT 0.0,
  variables TEXT, -- JSON 문자열 (템플릿 변수 목록)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agent_type, version)
);

-- ============================================
-- 9.3 Agent Rewards (품질 평가)
-- ============================================
CREATE TABLE IF NOT EXISTS agent_rewards (
  id VARCHAR(255) PRIMARY KEY,
  span_id VARCHAR(255),
  agent_type VARCHAR(50) NOT NULL, -- 'seo', 'aeo', 'geo', 'aio', 'chat'
  score INTEGER NOT NULL CHECK(score >= 0 AND score <= 100),
  relevance REAL NOT NULL CHECK(relevance >= 0 AND relevance <= 1),
  accuracy REAL NOT NULL CHECK(accuracy >= 0 AND accuracy <= 1),
  usefulness REAL NOT NULL CHECK(usefulness >= 0 AND usefulness <= 1),
  user_satisfaction REAL CHECK(user_satisfaction IS NULL OR (user_satisfaction >= 0 AND user_satisfaction <= 1)),
  feedback TEXT,
  user_id VARCHAR(255),
  analysis_id VARCHAR(255),
  conversation_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (span_id) REFERENCES agent_spans(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE SET NULL,
  FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE SET NULL
);

-- ============================================
-- 9.4 Learning Metrics (학습 메트릭)
-- ============================================
CREATE TABLE IF NOT EXISTS learning_metrics (
  id SERIAL PRIMARY KEY,
  agent_type VARCHAR(50) NOT NULL, -- 'seo', 'aeo', 'geo', 'aio', 'chat'
  date DATE NOT NULL,
  total_spans INTEGER DEFAULT 0,
  avg_reward REAL DEFAULT 0.0,
  improvement_rate REAL DEFAULT 0.0, -- 개선율 (%)
  best_prompt_version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agent_type, date)
);

-- Agent Lightning 인덱스
CREATE INDEX IF NOT EXISTS idx_agent_spans_type ON agent_spans(type);
CREATE INDEX IF NOT EXISTS idx_agent_spans_agent_type ON agent_spans(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_spans_user_id ON agent_spans(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_spans_analysis_id ON agent_spans(analysis_id);
CREATE INDEX IF NOT EXISTS idx_agent_spans_conversation_id ON agent_spans(conversation_id);
CREATE INDEX IF NOT EXISTS idx_agent_spans_created_at ON agent_spans(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_spans_agent_created ON agent_spans(agent_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prompt_templates_agent_type ON prompt_templates(agent_type);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_version ON prompt_templates(version);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_agent_version ON prompt_templates(agent_type, version DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_avg_score ON prompt_templates(avg_score DESC);

CREATE INDEX IF NOT EXISTS idx_agent_rewards_span_id ON agent_rewards(span_id);
CREATE INDEX IF NOT EXISTS idx_agent_rewards_agent_type ON agent_rewards(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_rewards_score ON agent_rewards(score DESC);
CREATE INDEX IF NOT EXISTS idx_agent_rewards_user_id ON agent_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_rewards_analysis_id ON agent_rewards(analysis_id);
CREATE INDEX IF NOT EXISTS idx_agent_rewards_created_at ON agent_rewards(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_rewards_agent_created ON agent_rewards(agent_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_learning_metrics_agent_type ON learning_metrics(agent_type);
CREATE INDEX IF NOT EXISTS idx_learning_metrics_date ON learning_metrics(date);
CREATE INDEX IF NOT EXISTS idx_learning_metrics_agent_date ON learning_metrics(agent_type, date DESC);

-- Agent Lightning 트리거
CREATE OR REPLACE FUNCTION update_prompt_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_prompt_templates_updated_at ON prompt_templates;
CREATE TRIGGER update_prompt_templates_updated_at
BEFORE UPDATE ON prompt_templates
FOR EACH ROW
EXECUTE FUNCTION update_prompt_templates_updated_at();

CREATE OR REPLACE FUNCTION update_learning_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_learning_metrics_updated_at ON learning_metrics;
CREATE TRIGGER update_learning_metrics_updated_at
BEFORE UPDATE ON learning_metrics
FOR EACH ROW
EXECUTE FUNCTION update_learning_metrics_updated_at();

-- Agent Lightning 뷰 (PostgreSQL JSON 함수 사용)
CREATE OR REPLACE VIEW agent_type_statistics AS
SELECT 
  agent_type,
  COUNT(DISTINCT id) as total_spans,
  COUNT(DISTINCT user_id) as unique_users,
  AVG((data::json->>'score')::real) as avg_score,
  MAX(created_at) as last_activity
FROM agent_spans
WHERE type = 'reward'
GROUP BY agent_type;

CREATE OR REPLACE VIEW prompt_template_performance AS
SELECT 
  pt.agent_type,
  pt.version,
  pt.avg_score,
  pt.total_uses,
  pt.success_rate,
  pt.last_updated,
  COUNT(DISTINCT ar.id) as total_rewards,
  AVG(ar.score) as recent_avg_score
FROM prompt_templates pt
LEFT JOIN agent_rewards ar ON pt.agent_type = ar.agent_type 
  AND ar.created_at >= pt.last_updated
GROUP BY pt.id
ORDER BY pt.agent_type, pt.version DESC;
