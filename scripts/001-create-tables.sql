-- 문제점 관리 테이블
CREATE TABLE IF NOT EXISTS problems (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  checked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 테이블 (향후 확장용)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lexile 테스트 결과 테이블
CREATE TABLE IF NOT EXISTS lexile_test_results (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  score INTEGER,
  level TEXT,
  test_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  answers JSONB
);

-- 학습 진도 테이블
CREATE TABLE IF NOT EXISTS learning_progress (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  subject TEXT,
  progress_data JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lexile_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;

-- 공개 읽기/쓰기 정책 (problems 테이블)
CREATE POLICY IF NOT EXISTS "Anyone can read problems" ON problems
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Anyone can insert problems" ON problems
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Anyone can update problems" ON problems
  FOR UPDATE USING (true);

-- 기본 문제점 데이터 삽입 (중복 방지)
INSERT INTO problems (text) 
SELECT * FROM (VALUES
  ('교육과정 목표와 실제 교육 여건의 격차가 큼 (목표 달성률 62%)'),
  ('학습자 주도적 언어 사용 기회 부족 (주당 평균 발화 시간 4.2분)'),
  ('영어 수업시간 부족 (누적 980시간, CEFR B1 달성 필요 1,200시간)'),
  ('초중고 영어 교육의 연계성 부족 (중1의 42%가 초등 필수 어휘 미달성)'),
  ('학습자 간 격차 확대 문제 (상위 10%와 하위 10% 간 Lexile 격차 450L)'),
  ('수능 시험과 교과서 난이도 차이 (수능 지문 평균 1200L vs 교과서 800L)'),
  ('기초학력 부족 학생 개인별 해결 (개인별 학습궤적 진단 및 추천도구 필요)')
) AS t(text)
WHERE NOT EXISTS (SELECT 1 FROM problems WHERE problems.text = t.text);
