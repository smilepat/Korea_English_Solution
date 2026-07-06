-- ============================================================
-- Korea-curri-standards-db 정본 통합 스키마 (kcsdb_*)
-- 기존 앱 테이블(curriculum_standards 등)과 충돌 없이 별도 네임스페이스로 추가.
-- 실행: turso db shell <db> < scripts/schema-kcsdb.sql
--        또는 node scripts/seed-kcsdb.mjs 가 자동 적용
-- ============================================================

-- 1. 성취기준 (정본 672)
CREATE TABLE IF NOT EXISTS kcsdb_standards (
  standard_id         TEXT PRIMARY KEY,   -- [9영03-04], [10공영1-01-01] ...
  curriculum_version  TEXT,               -- 2015 | 2022
  grade_band          TEXT,               -- elementary | middle | high
  grade_level         TEXT,
  subject_name_ko     TEXT,               -- 영어 / 공통영어1 / 심화영어 ...
  domain_code         TEXT,               -- L|S|R|W|UND|EXP
  domain_name_ko      TEXT,               -- 듣기/말하기/읽기/쓰기/이해/표현
  standard_text_ko    TEXT NOT NULL,
  cefr_alignment      TEXT,
  verification_status TEXT                -- verified | kice_verified | stas_import ...
);
CREATE INDEX IF NOT EXISTS idx_kcsdb_std_ver_band ON kcsdb_standards (curriculum_version, grade_band);
CREATE INDEX IF NOT EXISTS idx_kcsdb_std_domain   ON kcsdb_standards (domain_name_ko);

-- 2. 성취수준 (성취기준별 A~E / 상·중·하)
CREATE TABLE IF NOT EXISTS kcsdb_levels (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  standard_id   TEXT,
  scale_type    TEXT,   -- achievement_level(A~E) | eval_criteria(상/중/하)
  level         TEXT,
  descriptor_ko TEXT,
  cut_score     TEXT
);
CREATE INDEX IF NOT EXISTS idx_kcsdb_levels_std ON kcsdb_levels (standard_id);

-- 3. 교육과정 기본어휘 (+CEFR·빈도)
CREATE TABLE IF NOT EXISTS kcsdb_vocab (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  word               TEXT,
  curriculum_version TEXT,
  level_marker       TEXT,   -- * 초등권장 | ** 진로선택
  cefr               TEXT,
  freq_rank          TEXT,
  meaning_ko         TEXT
);
CREATE INDEX IF NOT EXISTS idx_kcsdb_vocab_word ON kcsdb_vocab (word);
CREATE INDEX IF NOT EXISTS idx_kcsdb_vocab_cefr ON kcsdb_vocab (cefr);

-- 4. 의사소통 기능 / 언어형식 (참조)
CREATE TABLE IF NOT EXISTS kcsdb_comm_functions (
  id                 TEXT PRIMARY KEY,
  category_l1        TEXT,
  description_ko     TEXT,
  curriculum_version TEXT
);
CREATE TABLE IF NOT EXISTS kcsdb_comm_function_examples (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  function_id            TEXT,
  example_en             TEXT,
  elementary_recommended INTEGER
);
CREATE INDEX IF NOT EXISTS idx_kcsdb_cfe_fid ON kcsdb_comm_function_examples (function_id);
CREATE TABLE IF NOT EXISTS kcsdb_grammar (
  id                 TEXT PRIMARY KEY,
  example_en         TEXT,
  curriculum_version TEXT
);

-- 5. S2 전문검색 — FTS5 (한국어 부분검색: trigram)
DROP TABLE IF EXISTS kcsdb_standards_fts;
CREATE VIRTUAL TABLE kcsdb_standards_fts USING fts5(
  standard_id, standard_text, subject, domain, grade_band, curriculum_version,
  tokenize = 'trigram'
);

-- 6. S3 의미검색 — 벡터 (Gemini gemini-embedding-001, 768차원)
CREATE TABLE IF NOT EXISTS kcsdb_vec (
  standard_id TEXT PRIMARY KEY,
  embedding   F32_BLOB(768)
);
-- 벡터 인덱스는 임베딩 적재 후 활성화:
-- CREATE INDEX IF NOT EXISTS idx_kcsdb_vec ON kcsdb_vec (libsql_vector_idx(embedding));

-- 7. 소스 provenance (라이선스 추적)
CREATE TABLE IF NOT EXISTS kcsdb_sources (
  source_id     TEXT PRIMARY KEY,
  title         TEXT,
  url           TEXT,
  license       TEXT,
  commercial_ok INTEGER
);

-- 8. 운영: 쿼리 임베딩 캐시(S3 비용 절감) · 검색 로그 · 레이트리밋
CREATE TABLE IF NOT EXISTS kcsdb_query_cache (
  query_norm TEXT PRIMARY KEY,
  embedding  TEXT,
  hit_count  INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS kcsdb_search_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  mode          TEXT,
  query         TEXT,
  result_count  INTEGER,
  note          TEXT,
  latency_ms    INTEGER,
  created_at    TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS kcsdb_rate (
  ip           TEXT,
  window_start INTEGER,
  cnt          INTEGER,
  PRIMARY KEY (ip, window_start)
);

-- 9. 문법 분류(LLM, classify-grammar.mjs로 채움) + 수능 유형 참고매핑(build-csat-map.mjs)
-- kcsdb_grammar 에 item_name_ko/category/label_source 컬럼(스크립트가 ALTER로 추가)
CREATE TABLE IF NOT EXISTS kcsdb_csat_type_map (
  standard_id  TEXT,
  csat_type    TEXT,
  confidence   TEXT,
  rationale_ko TEXT,
  PRIMARY KEY (standard_id, csat_type)
);

-- 10. 성취기준 기반 AI 생성 문항(교사 검수 필요, source='ai'). 고시 정본 아님.
CREATE TABLE IF NOT EXISTS kcsdb_generated_items (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  standard_id        TEXT,
  curriculum_version TEXT,
  grade_band         TEXT,
  domain_name_ko     TEXT,
  cefr               TEXT,
  item_type          TEXT,   -- mcq4 | mcq5 | short | essay
  difficulty         TEXT,   -- easy | medium | hard
  payload            TEXT,   -- 유형별 JSON(지문/발문/선지/정답/해설 또는 모범답안/루브릭)
  model              TEXT,   -- gemini-2.5-flash
  source             TEXT DEFAULT 'ai',
  created_at         TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_kcsdb_geni_std ON kcsdb_generated_items(standard_id, created_at DESC);
