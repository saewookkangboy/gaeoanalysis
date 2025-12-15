-- ============================================
-- GAEO Analysis Database Schema
-- 확장 가능한 데이터베이스 설계
-- ============================================

-- ============================================
-- 1. 사용자 관리 (Users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  image TEXT,
  blog_url TEXT,
  provider TEXT, -- 'google', 'github'
  role TEXT DEFAULT 'user', -- 'user', 'admin'
  is_active INTEGER DEFAULT 1, -- 0: 비활성, 1: 활성
  last_login_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Provider별 독립적인 사용자 관리를 위한 복합 UNIQUE 인덱스
-- 같은 이메일이라도 Provider가 다르면 다른 사용자로 취급
-- provider가 NULL인 경우도 고려하여 COALESCE 사용
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_provider ON users(email, COALESCE(provider, ''));

-- ============================================
-- 2. 인증 로그 (Authentication Logs)
-- ============================================
CREATE TABLE IF NOT EXISTS auth_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  provider TEXT NOT NULL, -- 'google', 'github'
  action TEXT NOT NULL, -- 'login', 'logout', 'signup'
  ip_address TEXT,
  user_agent TEXT,
  success INTEGER DEFAULT 1, -- 0: 실패, 1: 성공
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- 3. 분석 이력 (Analyses)
-- ============================================
CREATE TABLE IF NOT EXISTS analyses (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  url TEXT NOT NULL,
  aeo_score INTEGER NOT NULL CHECK(aeo_score >= 0 AND aeo_score <= 100),
  geo_score INTEGER NOT NULL CHECK(geo_score >= 0 AND geo_score <= 100),
  seo_score INTEGER NOT NULL CHECK(seo_score >= 0 AND seo_score <= 100),
  overall_score REAL NOT NULL CHECK(overall_score >= 0 AND overall_score <= 100),
  insights TEXT NOT NULL, -- JSON 문자열
  chatgpt_score INTEGER CHECK(chatgpt_score IS NULL OR (chatgpt_score >= 0 AND chatgpt_score <= 100)),
  perplexity_score INTEGER CHECK(perplexity_score IS NULL OR (perplexity_score >= 0 AND perplexity_score <= 100)),
  gemini_score INTEGER CHECK(gemini_score IS NULL OR (gemini_score >= 0 AND gemini_score <= 100)),
  claude_score INTEGER CHECK(claude_score IS NULL OR (claude_score >= 0 AND claude_score <= 100)),
  ai_visibility_score INTEGER CHECK(ai_visibility_score IS NULL OR (ai_visibility_score >= 0 AND ai_visibility_score <= 100)),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 4. 채팅 대화 (Chat Conversations)
-- ============================================
CREATE TABLE IF NOT EXISTS chat_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  analysis_id TEXT,
  messages TEXT NOT NULL, -- JSON 문자열
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
);

-- ============================================
-- 5. AI Agent 사용 이력 (AI Agent Usage)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_agent_usage (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  analysis_id TEXT,
  conversation_id TEXT,
  agent_type TEXT NOT NULL, -- 'chatgpt', 'perplexity', 'gemini', 'claude'
  action TEXT NOT NULL, -- 'query', 'response', 'error'
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cost REAL DEFAULT 0.0,
  response_time_ms INTEGER,
  success INTEGER DEFAULT 1, -- 0: 실패, 1: 성공
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE SET NULL,
  FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE SET NULL
);

-- ============================================
-- 6. 사이트 통계 (Site Statistics)
-- ============================================
CREATE TABLE IF NOT EXISTS site_statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL UNIQUE,
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  total_analyses INTEGER DEFAULT 0,
  new_analyses INTEGER DEFAULT 0,
  total_chat_conversations INTEGER DEFAULT 0,
  new_chat_conversations INTEGER DEFAULT 0,
  total_ai_agent_usage INTEGER DEFAULT 0,
  total_ai_agent_cost REAL DEFAULT 0.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 7. 어드민 활동 로그 (Admin Logs)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_logs (
  id TEXT PRIMARY KEY,
  admin_user_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'user_management', 'analysis_management', 'statistics_view', 'settings_update'
  target_type TEXT, -- 'user', 'analysis', 'conversation', 'system'
  target_id TEXT,
  details TEXT, -- JSON 문자열
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 8. 스키마 마이그레이션 (Schema Migrations)
-- ============================================
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

-- ============================================
-- 트리거 생성
-- ============================================

-- Users updated_at 자동 업데이트
CREATE TRIGGER IF NOT EXISTS update_users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Chat Conversations updated_at 자동 업데이트
CREATE TRIGGER IF NOT EXISTS update_chat_conversations_updated_at
AFTER UPDATE ON chat_conversations
FOR EACH ROW
BEGIN
  UPDATE chat_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Site Statistics updated_at 자동 업데이트
CREATE TRIGGER IF NOT EXISTS update_site_statistics_updated_at
AFTER UPDATE ON site_statistics
FOR EACH ROW
BEGIN
  UPDATE site_statistics SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ============================================
-- 뷰 생성 (통계 및 조회 최적화)
-- ============================================

-- 사용자 통계 뷰
CREATE VIEW IF NOT EXISTS user_statistics AS
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
LEFT JOIN auth_logs al ON u.id = al.user_id AND al.action = 'login' AND al.success = 1
GROUP BY u.id;

-- 일별 통계 뷰
CREATE VIEW IF NOT EXISTS daily_statistics AS
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) as total_count
FROM analyses
GROUP BY DATE(created_at);

