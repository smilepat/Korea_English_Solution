-- ============================================================
-- kes_* 학생 기록 척추 (Korea English Solution core spine)
--
-- 교사 → 반 → 학생 → 진단 → (Phase 4: 과제 → 시도) 사슬의 앞부분.
-- 기존 kcsdb_* (교육과정 정본) 및 무접두 레거시 테이블과 충돌하지 않는
-- 별도 네임스페이스.
--
-- 실행: turso db shell <db> < scripts/005-kes-core-schema.sql
--        또는 node scripts/run-kes-schema.mjs
--
-- 설계 원칙
--  1. 학생 신원은 교사가 소유한다. 학생이 자유 입력한 닉네임으로 행을
--     만들지 않는다 (4개 레포에서 신원 파편화를 일으킨 패턴).
--  2. kes_diagnosis_snapshots 는 append-only 측정 원장이다.
--     "현재 Lexile" 같은 값은 최신 행에서 파생될 뿐 따로 저장하지 않는다.
--  3. 척도(scale)를 명시적으로 기록한다. theta / lexile / cefr 를 절대
--     같은 컬럼에서 섞지 않는다.
-- ============================================================

-- 1. 반 -------------------------------------------------------
CREATE TABLE IF NOT EXISTS kes_classes (
  id          TEXT PRIMARY KEY,            -- ULID
  name        TEXT NOT NULL,               -- '2학년 3반', '수요일 중등반'
  grade_band  TEXT NOT NULL,               -- elementary | middle | high
                                           -- 초·중·고 전부 가르치므로 기본값 없음
  grade_label TEXT,                        -- '중2', '고1' — 교사 표기 그대로
  class_num   TEXT,                        -- '3'
  class_code  TEXT NOT NULL UNIQUE,        -- 6자 조인 코드 (학생 진입용)
  school_year INTEGER NOT NULL,
  archived    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_kes_classes_band ON kes_classes (grade_band, archived);

-- 2. 학생 -----------------------------------------------------
CREATE TABLE IF NOT EXISTS kes_students (
  id             TEXT PRIMARY KEY,         -- ULID — 이 앱의 정본 학생 식별자
  display_name   TEXT NOT NULL,
  student_number TEXT,                     -- 학번/출석번호
  join_token     TEXT NOT NULL UNIQUE,     -- 6자, 조인 카드에 인쇄. 회전 가능
  note           TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 3. 수강 (반 ↔ 학생) ----------------------------------------
CREATE TABLE IF NOT EXISTS kes_enrollments (
  class_id   TEXT NOT NULL REFERENCES kes_classes(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES kes_students(id) ON DELETE CASCADE,
  seat_no    INTEGER,
  active     INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (class_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_kes_enroll_student ON kes_enrollments (student_id);

-- 4. 진단 스냅샷 (append-only 측정 원장) ----------------------
-- base64 URL 파라미터 핸드오프를 대체한다. 30명 학급에서 유일하게 성립하는 방식.
CREATE TABLE IF NOT EXISTS kes_diagnosis_snapshots (
  id         TEXT PRIMARY KEY,             -- ULID
  student_id TEXT NOT NULL REFERENCES kes_students(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL,                -- lexile | vocab_cat | skill_cefr
  dimension  TEXT,                         -- skill_cefr 일 때 reading|writing|listening|speaking
  scale      TEXT NOT NULL,                -- lexile | theta_2pl | cefr  ← 척도를 절대 섞지 않는다
  value_num  REAL,                         -- 850 (L), -0.42 (theta)
  value_text TEXT,                         -- 'B1'
  detail     TEXT,                         -- JSON: 응답·SE·문항수·엔진버전
  source     TEXT NOT NULL,                -- in-app-lexile | vocab-cat-api | teacher-manual
  taken_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_kes_snap_student
  ON kes_diagnosis_snapshots (student_id, kind, taken_at DESC);
CREATE INDEX IF NOT EXISTS idx_kes_snap_dim
  ON kes_diagnosis_snapshots (student_id, kind, dimension, taken_at DESC);

-- 5. Lexile 테스트 원본 기록 ---------------------------------
-- 스냅샷이 "측정값"이라면 이쪽은 "원 응답"이다. 재채점·재보정을 위해 보존한다.
-- student_id 는 nullable: Phase 2 에서 학생 컨텍스트가 붙기 전까지는
-- 교사가 시연용으로 혼자 풀어보는 경우가 있다. 단 NULL 인 기록은
-- 어느 학생의 것도 아니므로 스냅샷으로 승격되지 않는다.
CREATE TABLE IF NOT EXISTS kes_lexile_results (
  id         TEXT PRIMARY KEY,             -- ULID
  student_id TEXT REFERENCES kes_students(id) ON DELETE CASCADE,
  score      REAL,
  level      TEXT,
  answers    TEXT,                         -- JSON
  test_date  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_kes_lexile_student
  ON kes_lexile_results (student_id, test_date DESC);

-- 6. 문제 해결 체크리스트 (Firestore 'problems' 대체) ---------
CREATE TABLE IF NOT EXISTS kes_problems (
  id         TEXT PRIMARY KEY,             -- ULID
  text       TEXT NOT NULL,
  checked    INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
