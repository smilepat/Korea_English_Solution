-- ============================================================
-- kes_ 콘텐츠 테이블 — 워크시트·단어장의 원천 데이터
--
-- 저작권 방화벽(구조적):
--  - kes_passages 는 lexile_based_reading_textDB 의 reading_text(창작 지문)만
--    담는다. 같은 파일 안의 csat_questions(635 기출)는 절대 반입하지 않는다.
--    export 스크립트가 reading_text 만 화이트리스트로 읽고, CI 가드가
--    kes_passages 에 csat_ 흔적이 0건임을 강제한다.
--  - source/license 를 행마다 기록해, 워크시트 출력 전에 license ∈
--    {original, kogl, generated} 임을 assert 할 수 있게 한다.
-- ============================================================

-- 1. 지문 (저작권 청정 창작 지문 764) -----------------------
CREATE TABLE IF NOT EXISTS kes_passages (
  text_id          TEXT PRIMARY KEY,       -- L300-EXP-125-001
  lexile_score     INTEGER,
  lexile_band      TEXT,                    -- '300-500'
  age_group        TEXT,                    -- 'Upper Elementary'
  grade_hint       TEXT,                    -- '초3-4'
  grade_band       TEXT,                    -- elementary|middle|high (grade_hint 에서 파생)
  genre            TEXT,
  topic            TEXT,
  word_count       INTEGER,
  sentence_count   INTEGER,
  vocabulary_band  TEXT,
  intended_use     TEXT,
  text_body        TEXT NOT NULL,
  source           TEXT NOT NULL DEFAULT 'lexile_textdb_original',
  license          TEXT NOT NULL DEFAULT 'original'   -- ∈ {original, kogl, generated}
);
CREATE INDEX IF NOT EXISTS idx_kes_passages_lexile ON kes_passages (lexile_score);
CREATE INDEX IF NOT EXISTS idx_kes_passages_band   ON kes_passages (grade_band, lexile_score);

-- 2. 어휘 마스터 (9,291 canonical) ---------------------------
CREATE TABLE IF NOT EXISTS kes_vocab_master (
  word_id          TEXT PRIMARY KEY,
  word             TEXT NOT NULL,
  pos              TEXT,
  meaning_ko       TEXT,
  cefr             TEXT,                    -- A1..C2
  kr_curriculum    TEXT,                    -- 교육과정 등급(초등/중등/…) 또는 비교육과정
  grade_range_norm TEXT,                    -- '중1-중2'
  lexile_band      TEXT,                    -- '700L-900L'
  us_grade         TEXT,
  in_curriculum    INTEGER NOT NULL DEFAULT 0,  -- kr_curriculum 존재 여부
  irt              TEXT,                    -- JSON D1..D5 {b,a}
  source           TEXT DEFAULT 'vocab-graph-db@efl-data-hub'
);
CREATE INDEX IF NOT EXISTS idx_kes_vocab_cefr  ON kes_vocab_master (cefr);
CREATE INDEX IF NOT EXISTS idx_kes_vocab_word  ON kes_vocab_master (word);
CREATE INDEX IF NOT EXISTS idx_kes_vocab_curr  ON kes_vocab_master (in_curriculum, cefr);

-- 3. 설계맥락 카드 (6,302, headword 로 조인) -----------------
-- 커버되는 단어는 API 비용 0으로 단어장 콘텐츠를 채운다. LLM 은 빈칸만.
CREATE TABLE IF NOT EXISTS kes_vocab_cards (
  headword   TEXT PRIMARY KEY,
  gloss_ko   TEXT,
  colloc_en  TEXT,
  colloc_kr  TEXT,
  ex_en      TEXT,
  ex_kr      TEXT,
  level      TEXT                           -- elementary|middle|high (tags 에서)
);

-- 4. 워크시트/단어장 산출물 ---------------------------------
-- 모든 산출물은 성취기준을 인용하고(standard_ids), 기여한 소스의 license 를
-- source_provenance 에 기록한다(출력 전 검증).
CREATE TABLE IF NOT EXISTS kes_worksheets (
  id                TEXT PRIMARY KEY,       -- ULID
  class_id          TEXT REFERENCES kes_classes(id) ON DELETE SET NULL,
  title             TEXT NOT NULL,
  kind              TEXT NOT NULL,          -- worksheet | wordlist
  grade_band        TEXT,
  target_lexile_min INTEGER,
  target_lexile_max INTEGER,
  spec              TEXT NOT NULL,          -- JSON: 지문·문항·단어 구성
  standard_ids      TEXT,                   -- JSON array of kcsdb standard_id
  source_provenance TEXT,                   -- JSON: [{source, license}]
  status            TEXT NOT NULL DEFAULT 'draft',
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_kes_worksheets_class ON kes_worksheets (class_id, created_at DESC);
