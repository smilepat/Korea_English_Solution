-- ============================================================
-- Phase 4 스키마 추가 - 다독 프로그램, 대화 연습, 루브릭
-- Turso SQL Console에서 실행
-- ============================================================

-- 1. 읽기 자료
CREATE TABLE IF NOT EXISTS reading_materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  lexile_level INTEGER NOT NULL,
  word_count INTEGER NOT NULL,
  topic TEXT,
  genre TEXT,
  questions TEXT,
  vocabulary TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 2. 읽기 기록
CREATE TABLE IF NOT EXISTS reading_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL DEFAULT 'demo',
  material_id INTEGER,
  words_read INTEGER NOT NULL,
  score INTEGER,
  reading_date TEXT DEFAULT (datetime('now'))
);

-- 3. 대화 연습 세션
CREATE TABLE IF NOT EXISTS conversation_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id TEXT DEFAULT 'demo',
  scenario TEXT NOT NULL,
  cefr_level TEXT NOT NULL,
  messages TEXT NOT NULL,
  evaluation TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 4. 루브릭
CREATE TABLE IF NOT EXISTS rubrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id TEXT DEFAULT 'demo',
  grade TEXT NOT NULL,
  skill TEXT NOT NULL,
  topic TEXT NOT NULL,
  cefr_target TEXT,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_reading_materials_lexile ON reading_materials (lexile_level);
CREATE INDEX IF NOT EXISTS idx_reading_logs_student ON reading_logs (student_id);
CREATE INDEX IF NOT EXISTS idx_conversation_cefr ON conversation_sessions (cefr_level);
CREATE INDEX IF NOT EXISTS idx_rubrics_grade_skill ON rubrics (grade, skill);
