-- ============================================
-- Agent Lightning 학습 데이터 스키마
-- SEO, AIO, AEO, GEO 학습에 필요한 데이터 저장
-- ============================================

-- ============================================
-- 1. Agent Spans (이벤트 추적)
-- ============================================
CREATE TABLE IF NOT EXISTS agent_spans (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'prompt', 'response', 'tool_call', 'reward'
  agent_type TEXT NOT NULL, -- 'seo', 'aeo', 'geo', 'aio', 'chat'
  user_id TEXT,
  analysis_id TEXT,
  conversation_id TEXT,
  data TEXT NOT NULL, -- JSON 문자열
  metadata TEXT, -- JSON 문자열
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE SET NULL,
  FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE SET NULL
);

-- ============================================
-- 2. Prompt Templates (프롬프트 템플릿)
-- ============================================
CREATE TABLE IF NOT EXISTS prompt_templates (
  id TEXT PRIMARY KEY,
  agent_type TEXT NOT NULL, -- 'seo', 'aeo', 'geo', 'aio', 'chat'
  template TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  avg_score REAL DEFAULT 0.0,
  total_uses INTEGER DEFAULT 0,
  success_rate REAL DEFAULT 0.0,
  variables TEXT, -- JSON 문자열 (템플릿 변수 목록)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agent_type, version)
);

-- ============================================
-- 3. Agent Rewards (품질 평가)
-- ============================================
CREATE TABLE IF NOT EXISTS agent_rewards (
  id TEXT PRIMARY KEY,
  span_id TEXT,
  agent_type TEXT NOT NULL, -- 'seo', 'aeo', 'geo', 'aio', 'chat'
  score INTEGER NOT NULL CHECK(score >= 0 AND score <= 100),
  relevance REAL NOT NULL CHECK(relevance >= 0 AND relevance <= 1),
  accuracy REAL NOT NULL CHECK(accuracy >= 0 AND accuracy <= 1),
  usefulness REAL NOT NULL CHECK(usefulness >= 0 AND usefulness <= 1),
  user_satisfaction REAL CHECK(user_satisfaction IS NULL OR (user_satisfaction >= 0 AND user_satisfaction <= 1)),
  feedback TEXT,
  user_id TEXT,
  analysis_id TEXT,
  conversation_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (span_id) REFERENCES agent_spans(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE SET NULL,
  FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE SET NULL
);

-- ============================================
-- 4. Learning Metrics (학습 메트릭)
-- ============================================
CREATE TABLE IF NOT EXISTS learning_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_type TEXT NOT NULL, -- 'seo', 'aeo', 'geo', 'aio', 'chat'
  date DATE NOT NULL,
  total_spans INTEGER DEFAULT 0,
  avg_reward REAL DEFAULT 0.0,
  improvement_rate REAL DEFAULT 0.0, -- 개선율 (%)
  best_prompt_version INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agent_type, date)
);

-- ============================================
-- 인덱스 생성
-- ============================================

-- Agent Spans 인덱스
CREATE INDEX IF NOT EXISTS idx_agent_spans_type ON agent_spans(type);
CREATE INDEX IF NOT EXISTS idx_agent_spans_agent_type ON agent_spans(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_spans_user_id ON agent_spans(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_spans_analysis_id ON agent_spans(analysis_id);
CREATE INDEX IF NOT EXISTS idx_agent_spans_conversation_id ON agent_spans(conversation_id);
CREATE INDEX IF NOT EXISTS idx_agent_spans_created_at ON agent_spans(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_spans_agent_created ON agent_spans(agent_type, created_at DESC);

-- Prompt Templates 인덱스
CREATE INDEX IF NOT EXISTS idx_prompt_templates_agent_type ON prompt_templates(agent_type);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_version ON prompt_templates(version);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_agent_version ON prompt_templates(agent_type, version DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_avg_score ON prompt_templates(avg_score DESC);

-- Agent Rewards 인덱스
CREATE INDEX IF NOT EXISTS idx_agent_rewards_span_id ON agent_rewards(span_id);
CREATE INDEX IF NOT EXISTS idx_agent_rewards_agent_type ON agent_rewards(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_rewards_score ON agent_rewards(score DESC);
CREATE INDEX IF NOT EXISTS idx_agent_rewards_user_id ON agent_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_rewards_analysis_id ON agent_rewards(analysis_id);
CREATE INDEX IF NOT EXISTS idx_agent_rewards_created_at ON agent_rewards(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_rewards_agent_created ON agent_rewards(agent_type, created_at DESC);

-- Learning Metrics 인덱스
CREATE INDEX IF NOT EXISTS idx_learning_metrics_agent_type ON learning_metrics(agent_type);
CREATE INDEX IF NOT EXISTS idx_learning_metrics_date ON learning_metrics(date);
CREATE INDEX IF NOT EXISTS idx_learning_metrics_agent_date ON learning_metrics(agent_type, date DESC);

-- ============================================
-- 트리거 생성
-- ============================================

-- Prompt Templates last_updated 자동 업데이트
CREATE TRIGGER IF NOT EXISTS update_prompt_templates_updated_at
AFTER UPDATE ON prompt_templates
FOR EACH ROW
BEGIN
  UPDATE prompt_templates SET last_updated = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Learning Metrics updated_at 자동 업데이트
CREATE TRIGGER IF NOT EXISTS update_learning_metrics_updated_at
AFTER UPDATE ON learning_metrics
FOR EACH ROW
BEGIN
  UPDATE learning_metrics SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ============================================
-- 뷰 생성
-- ============================================

-- Agent Type별 통계 뷰
CREATE VIEW IF NOT EXISTS agent_type_statistics AS
SELECT 
  agent_type,
  COUNT(DISTINCT id) as total_spans,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(CAST(JSON_EXTRACT(data, '$.score') AS REAL)) as avg_score,
  MAX(created_at) as last_activity
FROM agent_spans
WHERE type = 'reward'
GROUP BY agent_type;

-- 프롬프트 템플릿 성능 뷰
CREATE VIEW IF NOT EXISTS prompt_template_performance AS
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

