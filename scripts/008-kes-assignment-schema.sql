-- ============================================================
-- kes_ 과제/처방 루프 — 진단 → 처방 → 배정 → 시도 → 다음 진단
--
-- 190개 레포 어디서도 닫힌 적 없는 사슬을 여기서 닫는다.
--  - kes_assignments: 교사가 워크시트/단어장을 반 또는 개인에게 배정
--  - kes_attempts: append-only 시도 원장(학생이 문항을 푼 기록)
--  - kes_assignment_status: (과제,학생)별 진행 상태 — 완료/점수
--
-- 채점은 서버가 한다. 과제 payload 는 정답을 포함하지만, 학생 브라우저에는
-- 보기만 내려간다(CAT 프록시와 동일 철학 — 정답 미유출).
-- ============================================================

-- 1. 과제 -----------------------------------------------------
CREATE TABLE IF NOT EXISTS kes_assignments (
  id          TEXT PRIMARY KEY,            -- ULID
  class_id    TEXT NOT NULL REFERENCES kes_classes(id) ON DELETE CASCADE,
  student_id  TEXT REFERENCES kes_students(id) ON DELETE CASCADE,  -- NULL = 반 전체
  kind        TEXT NOT NULL,               -- worksheet | wordlist
  ref_id      TEXT,                        -- kes_worksheets.id
  title       TEXT NOT NULL,
  payload     TEXT NOT NULL,               -- JSON 스냅샷(정답 포함, 서버 채점용)
  origin      TEXT NOT NULL DEFAULT 'manual',  -- manual | recommendation:<rule>
  assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
  due_at      TEXT,
  archived    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_kes_assign_class ON kes_assignments (class_id, archived, assigned_at DESC);
CREATE INDEX IF NOT EXISTS idx_kes_assign_student ON kes_assignments (student_id);

-- 2. 시도 (append-only) --------------------------------------
CREATE TABLE IF NOT EXISTS kes_attempts (
  id            TEXT PRIMARY KEY,          -- ULID
  assignment_id TEXT NOT NULL REFERENCES kes_assignments(id) ON DELETE CASCADE,
  student_id    TEXT NOT NULL REFERENCES kes_students(id) ON DELETE CASCADE,
  item_index    INTEGER NOT NULL,          -- payload.items 내 문항 순번
  item_ref      TEXT,                       -- 문항 식별(있으면)
  skill_tags    TEXT,                       -- JSON: 성취기준/문항유형 태그
  correct       INTEGER,                    -- 1|0|NULL(서술형 등 비채점)
  response      TEXT,                        -- 학생 입력(보기 텍스트/서술)
  time_ms       INTEGER,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_kes_attempts_assign  ON kes_attempts (assignment_id, student_id);
CREATE INDEX IF NOT EXISTS idx_kes_attempts_student ON kes_attempts (student_id, created_at DESC);

-- 3. 과제 진행 상태 (과제 × 학생) ----------------------------
CREATE TABLE IF NOT EXISTS kes_assignment_status (
  assignment_id TEXT NOT NULL REFERENCES kes_assignments(id) ON DELETE CASCADE,
  student_id    TEXT NOT NULL REFERENCES kes_students(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'assigned',  -- assigned | started | completed | excused
  score         REAL,                       -- 0..1 정답률
  completed_at  TEXT,
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (assignment_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_kes_status_student ON kes_assignment_status (student_id, status);
