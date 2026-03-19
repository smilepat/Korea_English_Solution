-- ============================================================
-- Phase 5 스키마 - 수능 문항 구조 분석 + 벡터 검색
-- Turso SQL Console에서 실행 또는 node scripts/run-phase5-schema.mjs
-- ============================================================

-- 1. csat_items 테이블에 분석 컬럼 추가
ALTER TABLE csat_items ADD COLUMN passage_metrics TEXT;
ALTER TABLE csat_items ADD COLUMN coherence_profile TEXT;
ALTER TABLE csat_items ADD COLUMN abstractness_map TEXT;
ALTER TABLE csat_items ADD COLUMN vocab_profile TEXT;
ALTER TABLE csat_items ADD COLUMN structure_analysis TEXT;
ALTER TABLE csat_items ADD COLUMN skills TEXT;
ALTER TABLE csat_items ADD COLUMN distractor_analysis TEXT;

-- 2. 문항 유사도 테이블
CREATE TABLE IF NOT EXISTS question_similarities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL,
  similar_question_id INTEGER NOT NULL,
  similarity_type TEXT NOT NULL,
  score REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 3. 인덱스
CREATE INDEX IF NOT EXISTS idx_similarity_question ON question_similarities (question_id);
CREATE INDEX IF NOT EXISTS idx_similarity_similar ON question_similarities (similar_question_id);
