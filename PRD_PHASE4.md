# PRD: 영어교육 격차 해소 기능 확장 (Phase 4)

> **문서 버전**: v1.0
> **작성일**: 2026-03-17
> **기반 문서**: EDUCATION_ANALYSIS.md
> **현재 상태**: Phase 3 완료 (Teacher AI Copilot MVP)

---

## 1. 배경 및 목적

### 1.1 현재 앱 상태 (Phase 3 완료)

| 기능 | 상태 |
|---|---|
| AI 교육과정 해석기 | 구현됨 (대시보드 탭) |
| AI 수업 설계 | 구현됨 (/lesson-planner) |
| AI 수능 문항 생성 | 구현됨 (/csat-question-generation) |
| Lexile 진단 + AI 교수전략 | 구현됨 (/lexile-test) |
| 교육과정-CEFR 비교 | 구현됨 (/standards-comparison) |
| 학술 어휘 목록 | 구현됨 (/vocabulary-list) |
| AI 지식 검색 (RAG) | 구현됨 (홈 검색바) |
| 데모 로그인 | 구현됨 (/login) |

### 1.2 EDUCATION_ANALYSIS.md에서 도출된 미구현 핵심 과제

| 순위 | 과제 | 해결하는 격차 |
|---|---|---|
| 1 | 다독 프로그램 (읽기 자료 추천) | 읽기 노출량 44배 격차 |
| 2 | AI 말하기 연습 | 말하기/쓰기 기능 부재 |
| 3 | 학생 학습 추적 대시보드 | 데이터 기반 맞춤 교육 부재 |
| 4 | CEFR Can-Do 루브릭 생성기 | 평가 방식 불일치 |
| 5 | 교사 인증 시스템 | 개인화된 데이터 관리 불가 |
| 6 | 지식 DB 관리 콘솔 | 교육 자료 축적 어려움 |

### 1.3 이 PRD의 목표

EDUCATION_ANALYSIS.md의 **단기 방안 (1~2년)**과 **중기 방안 일부**를 앱에 구현하여, 교사가 실질적으로 영어교육 격차를 줄일 수 있는 도구를 제공합니다.

---

## 2. 기능 요구사항

### 2.1 다독 프로그램 (Extensive Reading Program)

**해결하는 문제**: 한국 학생 읽기 노출량 22만 단어 (미국 대비 1/44)

#### 2.1.1 페이지: `/reading-program`

**기능:**
- Lexile 수준별 읽기 자료 추천 엔진
- AI가 학생 수준에 맞는 지문 자동 생성 (주제, Lexile, 길이 지정)
- 읽기 후 AI 이해도 확인 질문 자동 생성 (3~5문항)
- 누적 읽기량 트래커 (단어 수 자동 카운트)
- 주간/월간 읽기 목표 설정 및 달성률 표시

**AI 기능:**
```
generateReadingMaterial(params):
  - lexileLevel: number (200~1200)
  - topic: string
  - wordCount: number (200~800)
  - genre: 'narrative' | 'expository' | 'persuasive'
  → 지문 + 어휘 하이라이트 + 이해도 질문 3~5개

getReadingRecommendation(studentLevel, interests):
  → Lexile 기반 맞춤 자료 추천 목록
```

**데이터 모델 (Turso):**
```sql
CREATE TABLE reading_materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  lexile_level INTEGER NOT NULL,
  word_count INTEGER NOT NULL,
  topic TEXT,
  genre TEXT,
  questions TEXT,          -- JSON: 이해도 확인 질문
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE reading_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  material_id INTEGER,
  words_read INTEGER NOT NULL,
  score INTEGER,           -- 이해도 점수 (0~100)
  reading_date TEXT DEFAULT (datetime('now'))
);
```

**UI 구성:**
- 탭 1: **오늘의 읽기** — AI 추천 자료 3개 (카드형)
- 탭 2: **자료 생성** — Lexile/주제/길이 설정 → AI 지문 생성
- 탭 3: **읽기 기록** — 누적 단어 수 차트, 주간 목표 진행률
- 사이드바: 현재 Lexile 수준, 총 누적 단어 수, 연속 읽기 일수

**핵심 지표:**
- 누적 읽기 단어 수 (목표: 연간 10만 단어 → 10년 100만 단어)
- Lexile 수준 변화 추이
- 이해도 평균 점수

---

### 2.2 AI 영어 대화 연습 (Speaking Practice)

**해결하는 문제**: 말하기/쓰기 평가 비중 ~15%, 실제 사용 기회 부족

#### 2.2.1 페이지: `/speaking-practice`

**기능:**
- AI 대화 파트너와 텍스트 기반 영어 대화 (Phase 4에서는 텍스트, Phase 5에서 음성)
- 상황별 대화 시나리오 (자기소개, 의견 표현, 토론 등)
- CEFR 수준별 대화 난이도 자동 조절
- AI가 문법/표현 교정 피드백 제공
- 대화 후 성적표: 유창성, 정확성, 어휘 다양성 점수

**AI 기능:**
```
startConversation(params):
  - scenario: string (상황 설명)
  - cefrLevel: 'A1' | 'A2' | 'B1' | 'B2'
  - role: string (AI 역할)
  → 대화 시작 메시지 + 가이드

continueConversation(messages, studentInput):
  → AI 응답 + 실시간 피드백 (교정 사항)

evaluateConversation(messages):
  → 유창성/정확성/어휘/과제완수 점수 + 개선 피드백
```

**UI 구성:**
- 좌측: 시나리오 선택 패널 (카테고리별 10개+)
- 중앙: 채팅 인터페이스 (학생 입력 + AI 응답)
- 우측: 실시간 피드백 패널 (문법 교정, 대체 표현 제안)
- 하단: 대화 종료 후 성적표

**시나리오 예시:**
| 카테고리 | 시나리오 | CEFR |
|---|---|---|
| 일상생활 | 카페에서 주문하기 | A1 |
| 학교생활 | 동아리 가입 상담 | A2 |
| 의견표현 | 교복 착용 찬반 토론 | B1 |
| 학술토론 | 기후변화 해결책 논의 | B2 |

---

### 2.3 학생 학습 추적 대시보드 (Student Analytics)

**해결하는 문제**: 개별 학생 수준 파악 및 맞춤 교육 불가

#### 2.3.1 페이지: `/student-tracker`

**기능:**
- 반별/학생별 Lexile 수준 분포 시각화
- 학생 개인별 성장 곡선 (Lexile 변화 추이)
- 교육과정 성취기준 도달률 히트맵
- AI 기반 학생별 맞춤 학습 처방 생성
- 학급 전체 리포트 PDF 생성 (Phase 5)

**AI 기능:**
```
generateStudentPrescription(studentData):
  - lexileHistory: number[]
  - weakSkills: string[]
  - recentScores: object
  → 맞춤 학습 처방 (추천 활동 3개, 자료 3개, 목표 설정)

generateClassReport(classData):
  → 학급 전체 분석 + 그룹별 교수전략
```

**데이터 모델 (Firebase Firestore):**
```
Collection: students
  - id, name, grade, class
  - lexile_level (현재)
  - lexile_history [{date, level}]
  - skills {reading, writing, listening, speaking} (각 A1~C1)

Collection: assessments
  - id, student_id, type, score, date
  - details (JSON)
```

**UI 구성:**
- 탭 1: **학급 현황** — Lexile 분포 차트, 기능별 평균, 성취기준 도달률
- 탭 2: **개인 분석** — 학생 선택 → 성장 곡선, 강약점 레이더 차트
- 탭 3: **AI 처방** — 학생/그룹별 맞춤 학습 처방 생성
- 탭 4: **리포트** — 학급 리포트 미리보기 및 내보내기

---

### 2.4 CEFR Can-Do 루브릭 생성기 (Assessment Tools)

**해결하는 문제**: 수행평가 루브릭 표준화 부족, CEFR 기반 평가 미도입

#### 2.4.1 페이지: `/assessment-tools`

**기능:**
- CEFR Can-Do 서술문 기반 수행평가 루브릭 자동 생성
- 학년/기능/주제 입력 → 4~5단계 루브릭 테이블 생성
- 성취기준 연계 평가 기준 포함
- 루브릭 복사/수정/저장 기능

**AI 기능:**
```
generateRubric(params):
  - grade: string
  - skill: 'reading' | 'writing' | 'listening' | 'speaking'
  - topic: string
  - cefrTarget: string
  - levels: number (3~5)
  → CEFR Can-Do 기반 루브릭 테이블 (JSON)
```

**UI 구성:**
- 입력 폼: 학년, 기능, 주제, 목표 CEFR, 평가 단계 수
- 결과: 루브릭 테이블 (단계별 기술, 점수, Can-Do 서술문)
- 저장된 루브릭 목록 (검색/필터)

---

### 2.5 교사 인증 시스템 (Firebase Auth)

**해결하는 문제**: 데모 로그인만 존재, 개인화 데이터 관리 불가

#### 2.5.1 구현 범위

**기능:**
- Firebase Authentication (이메일/비밀번호)
- 교사 프로필 관리 (이름, 학교, 담당 학년, 담당 과목)
- 데모 계정 유지 (비로그인 체험용)
- 로그인 후 개인 데이터 분리 (수업 계획, 문항, 학생 데이터)

**데이터 모델 (Firebase Firestore):**
```
Collection: teachers
  - uid (Firebase Auth UID)
  - name, email
  - school, grade, subject
  - created_at
```

**변경 파일:**
- `lib/firebase.ts` — Firebase Auth 추가
- `app/actions/auth.ts` — Firebase Auth로 전환 (쿠키 기반 유지)
- `app/login/page.tsx` — 회원가입 폼 추가
- `middleware.ts` — Firebase ID Token 검증

---

### 2.6 지식 DB 관리 콘솔 (Knowledge Admin)

**해결하는 문제**: 교육 자료 축적 및 관리 도구 부재

#### 2.6.1 페이지: `/admin/knowledge`

**기능:**
- 지식 문서 CRUD 인터페이스 (교육과정, 연구자료, 뉴스, 정책)
- 문서 업로드 → AI 자동 요약/키워드 추출/교육적 함의 생성
- 문서 검색 및 필터링 (유형, 학교급, 기능별)
- 교육과정 성취기준 관리 (추가/수정/삭제)

**UI 구성:**
- 문서 목록 테이블 (필터: 유형, 학교급, 기능)
- 문서 추가 폼 (제목, 내용, 유형, 출처)
- AI 처리 결과 미리보기 (요약, 키워드, 함의)
- 성취기준 편집기

---

## 3. 기술 아키텍처

### 3.1 기술 스택 (변경 없음 + 추가)

| 구분 | 기술 | 비고 |
|---|---|---|
| 프레임워크 | Next.js 15 (App Router) | 유지 |
| UI | React 19, Tailwind CSS, Radix UI | 유지 |
| AI | Claude API (claude-sonnet-4-6) | 유지 |
| AI (보조) | Gemini API | 신규 활용: 읽기 자료 생성, 대화 연습 |
| DB (지식) | Turso (libSQL) | 테이블 추가 |
| DB (사용자) | Firebase Firestore | 컬렉션 추가 |
| 인증 | Firebase Authentication | 신규 |
| 배포 | Vercel | 유지 |

### 3.2 AI 모델 역할 분담

| 기능 | 모델 | 이유 |
|---|---|---|
| 교육과정 해석, 수업 설계, 문항 생성 | Claude | 정확성, 구조화 능력 |
| 읽기 자료 생성, 대화 연습 | Gemini | 빠른 응답, 대량 생성 적합 |
| 학생 처방, 루브릭 생성 | Claude | 교육 전문성 필요 |
| 지식 문서 처리 | Claude | RAG 품질 |

### 3.3 새 Turso 테이블

```sql
-- 읽기 자료
CREATE TABLE reading_materials (...);
CREATE TABLE reading_logs (...);

-- 대화 연습 기록
CREATE TABLE conversation_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id TEXT,
  scenario TEXT NOT NULL,
  cefr_level TEXT NOT NULL,
  messages TEXT NOT NULL,       -- JSON
  evaluation TEXT,              -- JSON (점수, 피드백)
  created_at TEXT DEFAULT (datetime('now'))
);

-- 루브릭
CREATE TABLE rubrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id TEXT,
  grade TEXT NOT NULL,
  skill TEXT NOT NULL,
  topic TEXT NOT NULL,
  cefr_target TEXT,
  content TEXT NOT NULL,        -- JSON (루브릭 테이블)
  created_at TEXT DEFAULT (datetime('now'))
);
```

### 3.4 새 Firebase 컬렉션

```
students/{studentId}
  - name, grade, class, lexile_level
  - lexile_history[], skills{}

assessments/{assessmentId}
  - student_id, type, score, date, details

teachers/{teacherId}
  - name, email, school, grade, subject
```

---

## 4. 구현 우선순위 및 일정

### Phase 4-A: 핵심 격차 해소 (우선)

| 순서 | 기능 | 예상 작업량 | 우선순위 |
|---|---|---|---|
| 1 | 다독 프로그램 (/reading-program) | 대 | 최고 |
| 2 | AI 대화 연습 (/speaking-practice) | 대 | 최고 |
| 3 | CEFR 루브릭 생성기 (/assessment-tools) | 중 | 높음 |

### Phase 4-B: 교사 도구 강화

| 순서 | 기능 | 예상 작업량 | 우선순위 |
|---|---|---|---|
| 4 | 학생 학습 추적 (/student-tracker) | 대 | 높음 |
| 5 | 지식 DB 관리 (/admin/knowledge) | 중 | 보통 |
| 6 | 교사 인증 (Firebase Auth) | 중 | 보통 |

### Phase 5: 고도화 (향후)

| 기능 | 설명 |
|---|---|
| 음성 기반 말하기 연습 | Web Speech API / Whisper 연동 |
| 벡터 검색 (RAG 고도화) | Turso 벡터 인덱스 활성화 |
| PDF 리포트 생성 | 학급 리포트, 루브릭 내보내기 |
| 학부모 뷰 | 학생 성장 리포트 공유 |
| 다중 언어 지원 | 영어 UI 옵션 |

---

## 5. 성공 지표 (KPI)

| 지표 | 현재 | Phase 4 목표 |
|---|---|---|
| 앱 기능 수 | 7개 페이지 | 13개 페이지 |
| AI 기능 수 | 6개 함수 | 12개 함수 |
| 학생 연간 읽기량 | 추적 불가 | 10만 단어 목표 설정 |
| 말하기 연습 제공 | 없음 | CEFR A1~B2 시나리오 20개+ |
| 루브릭 자동 생성 | 없음 | 학년/기능별 즉시 생성 |
| 학생 데이터 추적 | 없음 | Lexile/기능별 성장 추이 |

---

## 6. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|---|---|---|
| AI API 비용 증가 | 대량 지문 생성/대화 시 비용 급증 | Gemini 활용 (무료 티어), 캐싱, 생성 횟수 제한 |
| Lexile 정확도 | AI 생성 지문의 Lexile 수준 부정확 가능 | 단어 수/문장 길이 기반 보정 알고리즘 추가 |
| 학생 개인정보 | 학생 데이터 수집 시 개인정보보호법 이슈 | 익명 ID 사용, 학교 단위 데이터만 저장 |
| Firebase 비용 | 학생 수 증가 시 Firestore 비용 | 읽기 최적화, 캐싱, 필요시 Turso로 이전 |

---

## 7. 페이지 구조 (Phase 4 완료 후)

```
/login                    ← 로그인 (Firebase Auth)
/                         ← 홈 (AI 검색, 기능 카드)
/dashboard                ← 대시보드 (5탭 + 학생추적 연동)
/reading-program          ← [신규] 다독 프로그램
/speaking-practice        ← [신규] AI 대화 연습
/lexile-test              ← Lexile 진단
/lesson-planner           ← AI 수업 설계
/csat-question-generation ← AI 수능 문항 생성
/assessment-tools         ← [신규] CEFR 루브릭 생성
/student-tracker          ← [신규] 학생 학습 추적
/vocabulary-list          ← 학술 어휘 목록
/standards-comparison     ← 교육과정-CEFR 비교
/admin/knowledge          ← [신규] 지식 DB 관리
```
