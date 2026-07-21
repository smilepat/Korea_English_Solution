-- ============================================================
-- kes_passages 검토 상태 — AI 생성 콘텐츠 거버넌스
--
-- 원본 창작 지문(reading_textdb)은 검증된 것으로 'approved',
-- AI 생성 지문(ai-generated-*)은 교사 검토 전이라 'pending'.
-- 워크시트 피커는 'rejected' 는 숨기고, 'pending' 은 "미검토" 배지로 노출.
-- ============================================================

ALTER TABLE kes_passages ADD COLUMN review_status TEXT NOT NULL DEFAULT 'approved';

-- AI 생성 lane 은 검토 대기로 표시(멱등: 이미 조정됐어도 안전)
UPDATE kes_passages SET review_status = 'pending'
  WHERE source LIKE 'ai-generated%' AND review_status = 'approved';

CREATE INDEX IF NOT EXISTS idx_kes_passages_review ON kes_passages (review_status, source);
