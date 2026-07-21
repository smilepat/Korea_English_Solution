-- ============================================================
-- kes_cat_sessions — 어휘 CAT 진행 상태 (서버 측 채점용)
--
-- 왜 필요한가: Cloud Run CAT API 의 respond 엔드포인트는 is_correct(불리언)를
-- 받는다. 즉 "정답 여부"를 우리 쪽이 판정해서 넘겨야 한다. Cloud Run 이
-- 문항과 함께 correct_answer 를 돌려주지만, 그것을 학생 브라우저로 내려보내면
-- 커닝이 된다. 따라서:
--   - 현재 문항의 correct_answer 를 이 테이블에 서버 측으로만 보관하고
--   - 학생은 word + options(보기)만 받고
--   - 학생이 고른 보기 텍스트를 correct_answer 와 대조해 is_correct 를 계산한 뒤
--   - Cloud Run 에 전달하고 다음 문항을 받아 다시 여기에 저장한다.
--
-- 서버리스 콜드스타트에도 살아남도록 인메모리가 아니라 Turso 에 둔다.
-- 완료된 세션의 최종 측정은 kes_diagnosis_snapshots 로 승격된다.
-- ============================================================

CREATE TABLE IF NOT EXISTS kes_cat_sessions (
  session_id     TEXT PRIMARY KEY,        -- Cloud Run 이 발급한 session_id
  student_id     TEXT REFERENCES kes_students(id) ON DELETE CASCADE,
  remote_user_id TEXT,                     -- Cloud Run 측 user_id (익명)
  grade          TEXT,                     -- 시작 시 학년(초3-4 … 고3)
  status         TEXT NOT NULL DEFAULT 'active',  -- active | complete | abandoned
  -- 현재 대기 문항: 학생에게 내려간 문항의 정답을 서버가 쥐고 있는다
  current_item   TEXT,                     -- JSON {item_id, word, correct_answer, options}
  items_done     INTEGER NOT NULL DEFAULT 0,
  current_theta  REAL,
  started_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_kes_cat_student
  ON kes_cat_sessions (student_id, status, started_at DESC);
