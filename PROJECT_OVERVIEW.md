# 대한민국 영어교육 개선 시스템

## Teacher AI Copilot - 교사 AI 코파일럿

**Live URL:** https://korea-english-solution.vercel.app
**Repository:** https://github.com/smilepat/Korea_English_Solution

---

## 프로젝트 개요

대한민국 중·고등학교 영어 교사를 위한 AI 기반 교수·학습 지원 시스템입니다.
2022 개정 교육과정 성취기준, Lexile 프레임워크, CEFR 국제 표준을 통합하여 교사의 수업 설계, 문항 생성, 학생 진단을 AI로 지원합니다.

---

## 기술 스택

| 구분 | 기술 |
|---|---|
| 프레임워크 | Next.js 15.5 (App Router, Server Actions) |
| UI | React 19, TypeScript, Tailwind CSS, Radix UI |
| AI 엔진 | Claude API (claude-sonnet-4-6) |
| DB (지식) | Turso (libSQL) — 5 테이블, 7 인덱스 |
| DB (사용자) | Firebase Firestore — 2 컬렉션 |
| 인증 | 쿠키 기반 데모 로그인 |
| 배포 | Vercel |
| 검색 | 키워드 기반 RAG (Phase 1) |

---

## 페이지 구성

| 경로 | 페이지명 | 주요 기능 |
|---|---|---|
| `/login` | 로그인 | 데모 원클릭 입장, 이메일/비밀번호 로그인 |
| `/` | 메인 홈 | AI 지식 검색, 교육 문제점 관리, 기능 카드 네비게이션 |
| `/dashboard` | 분석 대시보드 | 5탭 (문제진단, AI 교육과정 분석, 학습궤적, 로드맵, 교사리포트) |
| `/lexile-test` | Lexile 테스트 | 영어 읽기 수준 측정 (13단계), AI 교수전략 자동 분석 |
| `/csat-question-generation` | 수능 문항 생성 | AI 문항 생성 (7유형, 3난이도), 저장/관리, 출제 원칙 가이드 |
| `/lesson-planner` | AI 수업 설계 | 학년/기능별 수업 계획 자동 생성, Lexile 범위 설정 |
| `/vocabulary-list` | 어휘 목록 | 학술 어휘(AWL), 분야별 어휘, 콜로케이션 |
| `/standards-comparison/cefr` | 교육과정 비교 | 한국 교육과정 vs CEFR 국제 표준 비교 |

---

## AI 기능

### 1. 교육과정 해석 (Curriculum Interpreter)
- 2022 개정 교육과정 성취기준 Q&A
- RAG 기반 지식 검색 + Claude 해석
- 대화 이력 세션 저장

### 2. 수업 설계 AI (Lesson Planning)
- 학년(중1~고3), 기능(읽기/쓰기/듣기/말하기) 선택
- 1차시/2차시 수업 계획 자동 생성
- 목표, 활동, 교재, 성과, 교사 노트 구조화

### 3. 수능 문항 생성 (Assessment Builder)
- 7가지 문항 유형: 빈칸추론, 순서배열, 요약완성, 심경분위기, 주제요지, 지칭추론, 무관한문장
- 3단계 난이도: 쉬움(Lexile 600~800), 보통(800~1000), 어려움(1000~1200)
- AI 해설 및 정답 분석 포함

### 4. Lexile 교수전략
- 학생 Lexile 측정 결과 기반 AI 교수전략 생성
- 교사용 전략, 추천 교재, 다음 단계 팁 제공

### 5. 지식 검색 (Knowledge Search)
- 교육과정, 연구, 정책 문서 키워드 RAG 검색
- AI 요약 답변 생성

---

## 데이터베이스 구조

### Turso (libSQL) — 지식 DB

| 테이블 | 용도 |
|---|---|
| `knowledge_documents` | 교육 지식 문서 (RAG용), 벡터 임베딩 지원 |
| `curriculum_standards` | 2022 개정 교육과정 성취기준 (9개 초기 데이터) |
| `csat_items` | AI 생성 수능 문항 |
| `lesson_cases` | AI 생성 수업 계획 |
| `teacher_sessions` | AI 대화 이력 |

### Firebase Firestore — 사용자 DB

| 컬렉션 | 용도 |
|---|---|
| `problems` | 영어교육 문제점 목록 (CRUD) |
| `lexile_test_results` | Lexile 테스트 결과 저장 |

---

## 프로젝트 구조

```
Korea_English_Solution/
├── app/
│   ├── actions/          # Server Actions
│   │   ├── auth.ts         # 데모 로그인/로그아웃
│   │   ├── ai-chat.ts      # AI 교육과정 Q&A
│   │   ├── csat.ts         # 수능 문항 CRUD
│   │   ├── knowledge.ts    # 지식 문서 CRUD + RAG 검색
│   │   ├── lessons.ts      # 수업 계획 생성/저장
│   │   ├── lexile.ts       # Lexile 결과 저장 (Firebase)
│   │   ├── lexile-ai.ts    # Lexile 교수전략 AI
│   │   └── problems.ts     # 문제점 CRUD (Firebase)
│   ├── login/page.tsx
│   ├── dashboard/page.tsx
│   ├── lexile-test/page.tsx
│   ├── csat-question-generation/page.tsx
│   ├── lesson-planner/page.tsx
│   ├── vocabulary-list/page.tsx
│   ├── standards-comparison/cefr/page.tsx
│   ├── layout.tsx          # 루트 레이아웃 (로그아웃 버튼)
│   └── page.tsx            # 메인 홈
├── components/
│   ├── ui/                 # Radix UI 컴포넌트
│   └── curriculum-ai-tab.tsx  # AI 교육과정 분석 탭
├── lib/
│   ├── ai.ts               # Claude API 클라이언트 + RAG
│   ├── firebase.ts          # Firebase Firestore 클라이언트
│   ├── turso.ts             # Turso 클라이언트 + 타입 정의
│   └── utils.ts             # 유틸리티
├── scripts/
│   └── 002-turso-schema.sql  # Turso 스키마 + 초기 데이터
├── middleware.ts            # 인증 미들웨어
├── vercel.json              # Vercel 배포 설정
└── .env.local.example       # 환경변수 템플릿
```

---

## 환경변수

| 변수 | 용도 |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API 키 |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth 도메인 |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase 프로젝트 ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase 앱 ID |
| `TURSO_DATABASE_URL` | Turso DB URL |
| `TURSO_AUTH_TOKEN` | Turso 인증 토큰 |
| `ANTHROPIC_API_KEY` | Claude API 키 |
| `GEMINI_API_KEY` | Gemini API 키 (미래 사용) |

---

## 데모 접속

- **URL:** https://korea-english-solution.vercel.app
- **데모 로그인:** "데모로 바로 시작하기" 버튼 클릭
- **계정 로그인:** demo@korea-english.com / demo1234

---

## 향후 계획 (Phase 4)

- [ ] 어휘 목록 검색/필터 기능
- [ ] Gemini API 통합 (대체/보조 AI)
- [ ] Firebase Authentication 실제 인증
- [ ] 벡터 임베딩 검색 (RAG Phase 2)
- [ ] PDF 내보내기 (수업 계획, 문항)
- [ ] 정책 인사이트 대시보드
