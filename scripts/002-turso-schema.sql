-- ============================================================
-- Turso (libSQL) 스키마 - 영어교육 교사 지원 AI 시스템
-- 실행: turso db shell <db-name> < scripts/002-turso-schema.sql
-- ============================================================

-- 1. 지식 문서 (RAG 핵심 테이블)
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  type            TEXT NOT NULL,
  -- 'curriculum' | 'research' | 'news' | 'lesson' | 'policy' | 'csat'
  title           TEXT NOT NULL,
  content         TEXT NOT NULL,
  source          TEXT,
  date            TEXT,
  keywords        TEXT,           -- JSON array string
  edu_level       TEXT,           -- 'elementary' | 'middle' | 'high' | 'all'
  skill           TEXT,           -- 'reading' | 'writing' | 'listening' | 'speaking' | 'all'
  ai_summary      TEXT,           -- AI가 자동 생성한 요약
  ai_implications TEXT,           -- AI가 생성한 교육적 함의
  embedding       F32_BLOB(1536), -- Claude/OpenAI 임베딩 벡터
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now'))
);

-- 2. 교육과정 성취기준
CREATE TABLE IF NOT EXISTS curriculum_standards (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  curriculum   TEXT NOT NULL, -- '2022개정' | '2015개정'
  grade        TEXT NOT NULL, -- 'middle1' | 'middle2' | 'middle3' | 'high1' | 'high2' | 'high3'
  skill        TEXT NOT NULL, -- 'reading' | 'writing' | 'listening' | 'speaking'
  description  TEXT NOT NULL,
  cefr_level   TEXT,          -- 'A1' | 'A2' | 'B1' | 'B2' | 'C1'
  lexile_min   INTEGER,
  lexile_max   INTEGER,
  keywords     TEXT,          -- JSON array string
  created_at   TEXT DEFAULT (datetime('now'))
);

-- 3. 수능 문항
CREATE TABLE IF NOT EXISTS csat_items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  year         INTEGER,
  item_number  INTEGER,
  type         TEXT NOT NULL,
  -- '빈칸추론' | '순서배열' | '요약완성' | '심경분위기' | '주제요지' | '지칭추론' | '무관한문장'
  passage      TEXT NOT NULL,
  question     TEXT NOT NULL,
  options      TEXT NOT NULL, -- JSON array string
  answer       INTEGER,       -- 1~5
  lexile_level INTEGER,
  difficulty   TEXT,          -- 'easy' | 'medium' | 'hard'
  ai_analysis  TEXT,          -- AI 문항 분석 및 풀이 해설
  created_at   TEXT DEFAULT (datetime('now'))
);

-- 4. 수업 사례
CREATE TABLE IF NOT EXISTS lesson_cases (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  grade         TEXT NOT NULL,
  skill         TEXT NOT NULL,
  topic         TEXT NOT NULL,
  objectives    TEXT,    -- 수업 목표 (성취기준 연계)
  activity      TEXT,    -- 활동 내용 (JSON or text)
  material      TEXT,    -- 활용 자료
  lexile_range  TEXT,    -- 권장 Lexile 범위 (예: '600-800')
  duration      TEXT,    -- '1차시' | '2차시'
  outcome       TEXT,
  teacher_notes TEXT,
  created_at    TEXT DEFAULT (datetime('now'))
);

-- 5. 교사 AI 대화 이력
CREATE TABLE IF NOT EXISTS teacher_sessions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT NOT NULL,
  feature     TEXT NOT NULL,
  -- 'curriculum' | 'lesson' | 'assessment' | 'search' | 'policy' | 'lexile'
  messages    TEXT NOT NULL, -- JSON array
  created_at  TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- 인덱스
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_knowledge_type
  ON knowledge_documents (type);

CREATE INDEX IF NOT EXISTS idx_knowledge_skill
  ON knowledge_documents (skill);

CREATE INDEX IF NOT EXISTS idx_knowledge_edu_level
  ON knowledge_documents (edu_level);

CREATE INDEX IF NOT EXISTS idx_curriculum_grade_skill
  ON curriculum_standards (grade, skill);

CREATE INDEX IF NOT EXISTS idx_csat_type
  ON csat_items (type);

CREATE INDEX IF NOT EXISTS idx_csat_year
  ON csat_items (year);

CREATE INDEX IF NOT EXISTS idx_lesson_grade_skill
  ON lesson_cases (grade, skill);

-- Vector 인덱스 (임베딩 생성 후 활성화)
-- CREATE INDEX IF NOT EXISTS idx_knowledge_embedding
--   ON knowledge_documents (libsql_vector_idx(embedding));

-- ============================================================
-- 초기 데이터: 2022 개정 교육과정 성취기준 (중·고등학교)
-- ============================================================
INSERT OR IGNORE INTO curriculum_standards (curriculum, grade, skill, description, cefr_level, lexile_min, lexile_max, keywords)
VALUES
  ('2022개정', 'middle1', 'reading', '일상생활과 친숙한 주제에 관한 글을 읽고 세부 정보를 파악할 수 있다.', 'A1', 200, 400, '["세부정보","일상생활","읽기"]'),
  ('2022개정', 'middle2', 'reading', '일반적 주제에 관한 글을 읽고 주제나 요지를 파악할 수 있다.', 'A2', 400, 600, '["주제","요지","파악","읽기"]'),
  ('2022개정', 'middle3', 'reading', '다양한 주제에 관한 글을 읽고 내용의 논리적 관계를 파악할 수 있다.', 'A2', 500, 700, '["논리적관계","읽기","다양한주제"]'),
  ('2022개정', 'high1', 'reading', '비교적 다양한 주제에 관한 글을 읽고 주요 내용을 파악할 수 있다.', 'B1', 700, 900, '["주요내용","다양한주제","고등학교"]'),
  ('2022개정', 'high2', 'reading', '친숙하거나 일반적 주제에 관한 글을 읽고 필자의 의도나 목적을 파악할 수 있다.', 'B1', 800, 1000, '["의도","목적","필자","읽기"]'),
  ('2022개정', 'high3', 'reading', '다양한 주제에 관한 글을 읽고 함축적 의미를 추론할 수 있다.', 'B2', 900, 1200, '["함축적의미","추론","수능"]'),
  ('2022개정', 'middle1', 'listening', '일상생활과 친숙한 주제에 관한 말을 듣고 세부 정보를 파악할 수 있다.', 'A1', NULL, NULL, '["듣기","세부정보","일상생활"]'),
  ('2022개정', 'high1', 'writing', '비교적 다양한 주제에 관해 자신의 생각이나 의견을 쓸 수 있다.', 'B1', NULL, NULL, '["쓰기","의견","생각"]'),
  ('2022개정', 'high1', 'speaking', '비교적 다양한 주제에 관해 자신의 의견을 말할 수 있다.', 'B1', NULL, NULL, '["말하기","의견","표현"]');
