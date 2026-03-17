# 수능 영어 기출문항 그래프 DB 구축 지침

> **목적**: 수능 영어 기출문항을 체계적으로 분석하여 그래프 DB에 저장하고,
> 이를 기반으로 난이도 예측 및 신규 문항 생성에 활용한다.

---

## 1. 왜 그래프 DB인가

### 1.1 수능 문항의 본질

수능 영어 문항은 단순한 텍스트가 아니라 **다층 관계의 결합체**이다.

```
하나의 수능 문항 = 지문 + 글의 구조 + 출제 의도 + 요구 능력 + 난이도 변수 + 오답 설계
```

이 요소들은 서로 **독립적이지 않고 연결**되어 있다:
- "빈칸추론"이라는 유형은 "응집성 단절 위치"와 연결된다
- "고난도"라는 특성은 "추상도 + 종속절 비율 + 응집성"의 조합으로 결정된다
- "매력적인 오답"은 "글의 논리 구조"에서 파생된다

관계형 DB나 벡터 DB로는 이런 **다대다 관계와 조건 조합 검색**이 어렵다.

### 1.2 그래프 DB의 강점

| 작업 | RDB | 벡터 DB | 그래프 DB |
|------|:---:|:------:|:--------:|
| "빈칸추론 + 고난도 + 인과관계 구조" 검색 | JOIN 지옥 | 부정확 | **정확** |
| "이 문항과 구조가 같지만 주제가 다른 문항" | 어려움 | 불가능 | **관계 탐색** |
| "오답 패턴이 '부분일치'인 문항만" | 가능 | 불가능 | **가능** |
| "난이도 변수 조합 → 정답률 예측" | 가능 | 불가능 | **관계+속성 결합** |

---

## 2. 노드(Node) 설계

### 2.1 핵심 노드 8종

```
┌──────────────────────────────────────────────────────┐
│  1. Question       — 문항 (2024학년도 수능 31번)      │
│  2. Passage        — 지문 원문 + 텍스트 복잡도 변수    │
│  3. Topic          — 주제 (기후변화, 심리학, 경제학)    │
│  4. Structure      — 글의 논리 구조                    │
│  5. QuestionType   — 문항 유형 (7종)                   │
│  6. Skill          — 요구 인지 능력                    │
│  7. VocabProfile   — 어휘 분포 프로필                  │
│  8. DistractorType — 오답 유형 패턴                    │
│                                                        │
│  [보조 노드]                                           │
│  9. CoherenceProfile  — 응집성 프로필                  │
│  10. AbstractnessMap  — 추상도 맵                      │
│  11. DifficultyModel  — 난이도 예측 모델               │
│  12. Vocabulary       — 개별 핵심 어휘                 │
└──────────────────────────────────────────────────────┘
```

---

### 2.2 각 노드의 속성 상세

#### Node 1: Question (문항)

```
{
  id: "CSAT-2024-31",
  year: 2024,                    // 학년도
  month: 11,                     // 시행월 (6=모의, 9=모의, 11=수능)
  item_number: 31,               // 문항 번호
  correct_answer: 3,             // 정답 번호 (1~5)
  answer_rate: 0.23,             // 실제 정답률
  discrimination: 0.65,          // 변별도 (0~1)
  points: 3,                     // 배점 (2점 또는 3점)
  exam_type: "수능"              // 수능 / 6월모의 / 9월모의
}
```

#### Node 2: Passage (지문)

```
{
  id: "PASS-2024-31",
  text: "원문 전체",

  // ── 텍스트 길이 변수 ──
  word_count: 182,                // 총 단어 수
  sentence_count: 9,              // 총 문장 수

  // ── 문장 복잡도 변수 ──
  avg_sentence_length: 20.2,      // 평균 문장 길이 (단어)
  max_sentence_length: 34,        // 최장 문장 길이
  min_sentence_length: 8,         // 최단 문장 길이
  sentence_length_variance: 42.5, // 문장 길이 분산 (클수록 불규칙)

  // ── 구문 복잡도 변수 ──
  subordinate_clause_ratio: 0.42, // 종속절 비율 (전체 절 중)
  relative_clause_count: 5,       // 관계절 수
  participial_phrase_count: 3,    // 분사구문 수
  appositive_count: 2,           // 동격 구문 수
  nested_clause_depth_max: 3,     // 최대 절 중첩 깊이
  passive_voice_ratio: 0.22,      // 수동태 비율

  // ── Lexile ──
  lexile_estimated: 1050,         // 추정 Lexile 지수

  // ── 종합 산출 점수 ──
  text_complexity_score: 0.78     // 텍스트 복잡도 종합 (0~1)
}
```

#### Node 3: Topic (주제)

```
{
  id: "TOPIC-환경-기후변화",
  domain: "자연과학",             // 대분류: 인문, 사회, 자연과학, 예술, 기술
  category: "환경",              // 중분류
  name: "기후변화",              // 소분류
  frequency: 12                  // 최근 10년 출제 빈도
}
```

#### Node 4: Structure (글의 논리 구조)

```
{
  id: "STRUCT-주장근거반론결론",
  name: "주장-근거-반론-결론",
  pattern: ["주장", "근거", "반론", "결론"],
  category: "논증형",            // 논증형 / 설명형 / 서사형 / 비교대조형
  description: "필자의 주장을 제시한 후 근거를 들고, 반론을 언급한 뒤 최종 결론을 도출"
}

// 주요 구조 유형:
// - 주장-근거-결론
// - 주장-근거-반론-결론
// - 원인-결과
// - 문제-해결
// - 비교-대조
// - 일반-구체 (두괄식)
// - 구체-일반 (미괄식)
// - 시간순서 나열
// - 정의-예시-확장
// - 통념-반박 (역접)
```

#### Node 5: QuestionType (문항 유형)

```
{
  id: "TYPE-빈칸추론",
  name: "빈칸추론",
  description: "지문에서 핵심 내용을 담은 빈칸을 만들고 문맥에 맞는 어구나 문장을 고르는 문항",
  number_range: [31, 34],        // 수능에서 보통 해당하는 문항 번호 범위
  avg_answer_rate: 0.35,         // 유형 평균 정답률 (최근 5년)

  // 수능 영어 7대 문항 유형:
  // 빈칸추론, 순서배열, 요약완성, 심경분위기, 주제요지, 지칭추론, 무관한문장
}
```

#### Node 6: Skill (요구 인지 능력)

```
{
  id: "SKILL-문맥추론",
  name: "문맥추론",
  category: "추론",              // 사실확인 / 추론 / 비판적사고 / 어휘
  bloom_level: "분석",           // Bloom's Taxonomy: 기억/이해/적용/분석/평가/창조
  description: "빈칸 전후 문맥에서 논리적으로 빠진 내용을 추론하는 능력"
}

// 주요 인지 능력:
// - 세부정보 파악 (사실확인)
// - 문맥추론
// - 인과관계 파악
// - 논리적 흐름 파악
// - 요지/주제 추출
// - 어휘 의미 추론
// - 심경/분위기 판단
// - 지시어/지칭 해석
// - 글의 일관성 판단
```

#### Node 7: VocabProfile (어휘 분포)

```
{
  id: "VP-2024-31",
  total_unique_words: 127,

  // ── 수준별 분포 (비율) ──
  elementary_ratio: 0.45,         // 초급 (중학 필수 어휘)
  intermediate_ratio: 0.35,       // 중급 (고교 필수 어휘)
  advanced_ratio: 0.20,           // 고급 (수능 고난도 / 대학 수준)

  // ── 세부 어휘 지표 ──
  academic_word_ratio: 0.18,      // 학술 어휘 비율 (AWL 기준)
  low_frequency_ratio: 0.08,      // 저빈도 어휘 비율 (BNC/COCA 5000위 밖)
  context_clue_ratio: 0.75,       // 고급 어휘 중 문맥 단서 제공률

  // ── 콜로케이션/숙어 ──
  collocation_count: 4,           // 주요 연어 수
  idiom_count: 1,                 // 숙어/관용표현 수

  // ── 어휘 다양도 ──
  type_token_ratio: 0.68          // 어휘 다양도 (TTR)
}
```

#### Node 8: DistractorType (오답 유형)

```
{
  id: "DIST-부분일치",
  name: "부분일치",
  description: "지문의 일부 내용과 일치하지만 핵심 논지를 벗어난 선지",
  effectiveness: 0.82             // 오답 매력도 (이 유형이 얼마나 효과적으로 학생을 유인하는지)
}

// 주요 오답 유형:
// - 부분일치: 지문 일부와 겹치지만 핵심에서 벗어남
// - 반대논지: 지문의 주장과 정반대 내용
// - 과잉일반화: 지문보다 넓은 범위로 확대 해석
// - 범위이탈: 지문에 언급되지 않은 내용
// - 인과혼동: 원인과 결과를 뒤바꿈
// - 시제/조건 왜곡: 사실을 가정으로, 과거를 현재로 바꿈
// - 유사어휘 함정: 지문의 단어와 비슷하지만 다른 의미
```

#### Node 9: CoherenceProfile (응집성)

```
{
  id: "COH-2024-31",

  // ── Kintsch 텍스트 이해 모델 기반 ──
  surface_level: 0.82,            // 표면 구조 응집성 (접속사, 지시어 사용)
  textbase_level: 0.68,           // 명제 수준 응집성 (문장 간 논리 연결)
  situation_model_level: 0.45,    // 상황 모델 수준 (배경지식 요구도)

  // ── 응집성 지표 ──
  connective_density: 0.15,       // 연결어 밀도 (연결어 수 / 총 단어 수)
  referential_overlap: 0.34,      // 지시어 중복률 (인접 문장 간 공유 명사/대명사)

  // ── 응집성 단절 ──
  coherence_gaps: [
    { position: "4→5", type: "논리적 비약", severity: "high" },
    { position: "7→8", type: "주제 전환", severity: "medium" }
  ],

  // ── 독자 요구 수준 ──
  inference_demand: "high",       // 추론 요구: low / medium / high
  background_knowledge_demand: "moderate"  // 배경지식 요구: low / moderate / high
}
```

#### Node 10: AbstractnessMap (추상도)

```
{
  id: "ABS-2024-31",

  // ── 전체 추상도 ──
  overall_score: 0.78,            // 전체 추상도 (0=매우 구체적, 1=매우 추상적)

  // ── 문장별 추상도 흐름 ──
  sentence_scores: [0.3, 0.5, 0.8, 0.9, 0.4, 0.7, 0.85, 0.6, 0.9],
  pattern: "구체→추상→구체→추상",  // 추상도 변화 패턴
  peak_position: 4,               // 가장 추상적인 문장 위치

  // ── 추상화 유형별 비율 ──
  conceptual: 0.40,               // 개념적 추상 (이론, 원리, 정의)
  metaphorical: 0.30,             // 비유적 추상 (은유, 유추, 상징)
  philosophical: 0.30,            // 철학적 추상 (가치, 존재, 의미)

  // ── 구체적 장치 ──
  concrete_example_count: 2,      // 구체적 예시 수
  metaphor_count: 3,              // 비유/은유 수
  anecdote: false                 // 일화 포함 여부
}
```

#### Node 11: DifficultyModel (난이도 예측 모델)

```
{
  id: "MODEL-빈칸추론-v3.2",
  question_type: "빈칸추론",
  version: "v3.2",
  updated: "2025-12-01",
  training_size: 342,             // 학습 문항 수

  // ── 학습된 가중치 ──
  weights: {
    coherence_gap_severity: 0.35,
    abstractness_score: 0.25,
    context_clue_ratio: -0.20,    // 음수: 문맥 단서가 많으면 쉬워짐
    advanced_vocab_ratio: 0.12,
    subordinate_clause_ratio: 0.05,
    avg_sentence_length: 0.03
  },

  // ── 모델 성능 ──
  mae: 3.2,                       // 평균 절대 오차 (정답률 ±3.2%)
  r_squared: 0.84,                // 설명력

  // ── 변수 간 상호작용 ──
  interactions: [
    { vars: ["추상도", "응집성"], effect: "synergy", magnitude: 0.15 },
    { vars: ["고급어휘", "문맥단서"], effect: "cancel", magnitude: -0.08 }
  ]
}
```

#### Node 12: Vocabulary (개별 핵심 어휘)

```
{
  id: "VOCAB-exacerbate",
  word: "exacerbate",
  level: "advanced",              // elementary / intermediate / advanced
  pos: "verb",                    // 품사
  frequency_rank: 4200,           // BNC/COCA 빈도 순위
  csat_appearances: 3,            // 수능 출현 횟수 (최근 10년)
  awl_level: 6,                   // Academic Word List 레벨 (1~10, null이면 비학술)
  korean_meaning: "악화시키다"
}
```

---

## 3. 엣지(Edge/Relationship) 설계

### 3.1 엣지 전체 목록

```
┌─────────────────────────────────────────────────────────────┐
│                     핵심 관계 (필수)                         │
├─────────────────────────────────────────────────────────────┤
│  A. Question ↔ Passage                                      │
│     (Question)-[:HAS_PASSAGE]->(Passage)                    │
│                                                              │
│  B. Question ↔ QuestionType                                 │
│     (Question)-[:IS_TYPE]->(QuestionType)                   │
│                                                              │
│  C. Passage ↔ Topic                                         │
│     (Passage)-[:ABOUT_TOPIC]->(Topic)         // 주제       │
│     (Passage)-[:HAS_SUBTOPIC]->(Topic)        // 하위주제   │
│                                                              │
│  D. Passage ↔ Structure                                     │
│     (Passage)-[:HAS_STRUCTURE]->(Structure)                 │
│                                                              │
│  E. Question ↔ Skill                                        │
│     (Question)-[:REQUIRES_SKILL {                           │
│       importance: "primary" | "secondary"                   │
│     }]->(Skill)                                             │
│                                                              │
│  F. Question ↔ DistractorType                               │
│     (Question)-[:HAS_DISTRACTOR {                           │
│       option_number: 1,                                     │
│       option_text: "선지 내용",                              │
│       selection_rate: 0.28     // 해당 선지 선택률           │
│     }]->(DistractorType)                                    │
│                                                              │
│  G. Passage ↔ VocabProfile                                  │
│     (Passage)-[:HAS_VOCAB_PROFILE]->(VocabProfile)          │
│                                                              │
│  H. Passage ↔ CoherenceProfile                              │
│     (Passage)-[:HAS_COHERENCE]->(CoherenceProfile)          │
│                                                              │
│  I. Passage ↔ AbstractnessMap                               │
│     (Passage)-[:HAS_ABSTRACTNESS]->(AbstractnessMap)        │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                     분석 관계 (권장)                         │
├─────────────────────────────────────────────────────────────┤
│  J. Structure ↔ QuestionType                                │
│     (Structure)-[:EFFECTIVE_FOR {                           │
│       avg_answer_rate: 0.32,                                │
│       sample_size: 45                                       │
│     }]->(QuestionType)                                      │
│     // "이 구조는 이 유형에 효과적이다"                      │
│                                                              │
│  K. QuestionType ↔ DistractorType                           │
│     (QuestionType)-[:COMMON_DISTRACTOR {                    │
│       frequency: 0.68                                       │
│     }]->(DistractorType)                                    │
│     // "이 유형에서 자주 쓰이는 오답 패턴"                   │
│                                                              │
│  L. QuestionType ↔ Skill                                    │
│     (QuestionType)-[:PRIMARY_SKILL]->(Skill)                │
│     // "이 유형이 주로 요구하는 능력"                        │
│                                                              │
│  M. Question ↔ Question                                     │
│     (Question)-[:SIMILAR_TO {                               │
│       similarity_type: "structure" | "topic" | "skill",     │
│       score: 0.85                                           │
│     }]->(Question)                                          │
│     // "이 문항은 저 문항과 유사하다"                        │
│                                                              │
│  N. QuestionType ↔ DifficultyModel                          │
│     (QuestionType)-[:HAS_DIFFICULTY_MODEL]->(DifficultyModel)│
│     // "이 유형의 난이도 예측 모델"                          │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                     어휘 관계 (선택)                         │
├─────────────────────────────────────────────────────────────┤
│  O. Passage ↔ Vocabulary                                    │
│     (Passage)-[:CONTAINS_VOCAB {                            │
│       sentence_position: 3,                                 │
│       context_clue: true,                                   │
│       role: "핵심논지어휘" | "배경어휘" | "전환어휘"         │
│     }]->(Vocabulary)                                        │
│                                                              │
│  P. Vocabulary ↔ Vocabulary                                 │
│     (Vocabulary)-[:SYNONYM]->(Vocabulary)                   │
│     (Vocabulary)-[:ANTONYM]->(Vocabulary)                   │
│     (Vocabulary)-[:CONFUSABLE_WITH]->(Vocabulary)           │
│     // "혼동하기 쉬운 어휘" — 오답 설계에 활용              │
│                                                              │
│  Q. DistractorType ↔ CoherenceProfile                       │
│     (DistractorType)-[:EXPLOITS_GAP {                       │
│       gap_position: "4→5"                                   │
│     }]->(CoherenceProfile)                                  │
│     // "이 오답은 응집성 단절 지점을 이용한다"               │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. 데이터 입력 프로세스

### 4.1 단계별 워크플로우

```
[1단계] 기출문항 원본 수집
  │  수능/모의고사 기출문항 PDF → 텍스트 추출
  │  정답, 정답률, 변별도 데이터 수집 (한국교육과정평가원)
  │
  ▼
[2단계] AI 자동 분석 (1차)
  │  각 지문에 대해 LLM이 자동으로 분석:
  │  - 주제/하위주제 분류
  │  - 글의 논리 구조 판별
  │  - 요구 인지 능력 태깅
  │  - 오답 유형 분류
  │  - 추상도 문장별 점수 산출
  │
  ▼
[3단계] NLP 자동 측정 (정량 변수)
  │  Python/NLP 도구로 자동 계산:
  │  - 단어 수, 문장 수, 문장 길이
  │  - 종속절 비율, 수동태 비율
  │  - 어휘 수준별 분포 (초/중/고)
  │  - 연결어 밀도, 지시어 중복률
  │  - Lexile 추정
  │
  ▼
[4단계] 전문가 검수 (2차)
  │  영어교육 전문가가 AI 분석 결과를 검수:
  │  - 글의 구조 판별 정확성 확인
  │  - 오답 유형 분류 적절성 검토
  │  - 응집성 단절 위치 확인
  │  - 추상도 평가 보정
  │
  ▼
[5단계] 그래프 DB 적재
  │  검수 완료된 데이터를 노드/엣지로 변환하여 저장
  │
  ▼
[6단계] 난이도 모델 학습/업데이트
     실제 정답률 데이터로 난이도 예측 모델 미세조정
```

### 4.2 AI 자동 분석 프롬프트 (2단계용)

```
당신은 수능 영어 출제 전문가입니다.
다음 수능 기출문항을 분석하여 JSON으로 응답하세요.

[문항 정보]
- 학년도: {year}
- 문항번호: {item_number}
- 문항유형: {type}
- 정답: {answer}
- 정답률: {answer_rate}%

[지문]
{passage_text}

[선택지]
① {option_1}
② {option_2}
③ {option_3}
④ {option_4}
⑤ {option_5}

다음을 분석하세요:

{
  "topic": {
    "domain": "대분류 (인문/사회/자연과학/예술/기술)",
    "category": "중분류",
    "name": "소분류 (구체적 주제명)",
    "subtopics": ["하위주제1", "하위주제2"]
  },

  "structure": {
    "name": "글의 구조명",
    "pattern": ["단계1", "단계2", "단계3", ...],
    "category": "논증형/설명형/서사형/비교대조형",
    "sentence_roles": [
      {"sentence": 1, "role": "주장 제시"},
      {"sentence": 2, "role": "근거 1"},
      ...
    ]
  },

  "skills": [
    {"name": "요구능력명", "importance": "primary/secondary", "bloom_level": "Bloom 단계"}
  ],

  "distractors": [
    {
      "option_number": 1,
      "type": "오답유형명",
      "reason": "이 선지가 오답인 이유",
      "attraction_mechanism": "학생이 이 선지를 고르게 되는 심리적 기제"
    },
    ... (오답 선지만)
  ],

  "coherence": {
    "surface_level": 0.0~1.0,
    "textbase_level": 0.0~1.0,
    "situation_model_level": 0.0~1.0,
    "connective_density": 0.0~1.0,
    "gaps": [
      {"position": "N→N+1", "type": "단절유형", "severity": "low/medium/high"}
    ],
    "inference_demand": "low/medium/high",
    "background_knowledge_demand": "low/moderate/high"
  },

  "abstractness": {
    "overall_score": 0.0~1.0,
    "sentence_scores": [0.0~1.0, ...],
    "pattern": "추상도 변화 패턴 설명",
    "types": {
      "conceptual": 0.0~1.0,
      "metaphorical": 0.0~1.0,
      "philosophical": 0.0~1.0
    },
    "concrete_example_count": N,
    "metaphor_count": N
  },

  "key_vocabulary": [
    {
      "word": "단어",
      "level": "elementary/intermediate/advanced",
      "sentence_position": N,
      "context_clue": true/false,
      "role": "핵심논지어휘/배경어휘/전환어휘"
    }
  ]
}
```

### 4.3 NLP 자동 측정 스크립트 (3단계용)

```python
# 필요 라이브러리
# pip install spacy nltk textstat

import spacy
import nltk
from collections import Counter

nlp = spacy.load("en_core_web_sm")

def analyze_passage(text: str) -> dict:
    doc = nlp(text)
    sentences = list(doc.sents)

    # ── 기본 길이 변수 ──
    word_count = len([t for t in doc if not t.is_punct])
    sentence_count = len(sentences)
    sentence_lengths = [len([t for t in s if not t.is_punct]) for s in sentences]

    # ── 구문 복잡도 ──
    clauses = [t for t in doc if t.dep_ in ("advcl", "relcl", "ccomp", "xcomp", "acl")]
    main_clauses = [t for t in doc if t.dep_ == "ROOT"]
    total_clauses = len(clauses) + len(main_clauses)
    subordinate_ratio = len(clauses) / total_clauses if total_clauses > 0 else 0

    relative_clauses = [t for t in doc if t.dep_ == "relcl"]
    passive_count = len([t for t in doc if t.dep_ == "nsubjpass"])

    # ── 어휘 분포 ──
    words = [t.text.lower() for t in doc if t.is_alpha]
    unique_words = set(words)
    ttr = len(unique_words) / len(words) if words else 0

    # ── 연결어 밀도 ──
    connectives = [t for t in doc if t.dep_ in ("cc", "mark", "advmod")
                   and t.text.lower() in CONNECTIVE_LIST]
    connective_density = len(connectives) / word_count if word_count > 0 else 0

    return {
        "word_count": word_count,
        "sentence_count": sentence_count,
        "avg_sentence_length": round(sum(sentence_lengths) / len(sentence_lengths), 1),
        "max_sentence_length": max(sentence_lengths),
        "min_sentence_length": min(sentence_lengths),
        "sentence_length_variance": round(
            sum((x - sum(sentence_lengths)/len(sentence_lengths))**2
                for x in sentence_lengths) / len(sentence_lengths), 1
        ),
        "subordinate_clause_ratio": round(subordinate_ratio, 2),
        "relative_clause_count": len(relative_clauses),
        "passive_voice_ratio": round(passive_count / sentence_count, 2),
        "type_token_ratio": round(ttr, 2),
        "connective_density": round(connective_density, 3),
    }

# 연결어 목록 (일부)
CONNECTIVE_LIST = {
    "however", "therefore", "moreover", "furthermore", "nevertheless",
    "consequently", "meanwhile", "although", "because", "since",
    "while", "whereas", "thus", "hence", "accordingly",
    "in addition", "on the other hand", "in contrast", "for example",
    "specifically", "indeed", "rather", "instead", "otherwise"
}
```

### 4.4 어휘 수준 분류 기준

```
[초급 (Elementary) — 중학 필수 어휘]
- 기준: 교육부 지정 중학 기본어휘 (~1,500단어)
- 대안: BNC/COCA 빈도 1~2,000위

[중급 (Intermediate) — 고교 필수 어휘]
- 기준: 교육부 지정 고교 기본어휘 (~2,500단어)
- 대안: BNC/COCA 빈도 2,001~4,000위

[고급 (Advanced) — 수능 고난도 / 대학 수준]
- 기준: 수능 빈출 고급어휘 + AWL (Academic Word List)
- 대안: BNC/COCA 빈도 4,001위 이상

[판정 우선순위]
1. 교육부 어휘 목록에 있으면 → 해당 수준
2. 없으면 BNC/COCA 빈도로 판정
3. AWL에 있으면 → academic_word로 추가 태깅
```

---

## 5. 난이도 예측 모델 미세조정

### 5.1 기본 원리

```
입력 변수 (그래프 DB에서 추출)
  ├─ 종속절 비율
  ├─ 응집성 점수 (surface, textbase, situation_model)
  ├─ 추상도 점수
  ├─ 고급 어휘 비율
  ├─ 문맥 단서 비율
  ├─ 평균 문장 길이
  ├─ 연결어 밀도
  └─ 배경지식 요구도
        ↓
  회귀 모델 학습
        ↓
  출력: 예측 정답률 (0~1)
```

### 5.2 문항 유형별 별도 모델

각 문항 유형은 난이도를 결정하는 핵심 변수가 다르므로 **유형별 독립 모델**을 학습한다.

```
[빈칸추론 모델]
핵심 변수: 응집성 단절 심각도, 추상도, 빈칸 위치의 논리적 역할

[순서배열 모델]
핵심 변수: 연결어 밀도, 지시어 명확성, 글의 구조 복잡도

[무관한문장 모델]
핵심 변수: 무관한 문장과 주제의 표면적 유사도, 주변 문장과의 응집성

[요약완성 모델]
핵심 변수: 추상도, 글의 구조 복잡도, 요약문의 추상화 수준

[주제요지 모델]
핵심 변수: 주제 명시성, 추상도, 선지 간 의미 거리

[심경분위기 모델]
핵심 변수: 감정 어휘 명시도, 상황 묘사의 간접성

[지칭추론 모델]
핵심 변수: 지칭 대상 수, 문장 간 거리, 구문 복잡도
```

### 5.3 미세조정 절차

```
[매년 수능/모의고사 후]

1. 신규 데이터 수집
   - 새 문항의 정답률, 변별도
   - 선지별 선택률 (한국교육과정평가원 발표)

2. 그래프 DB에 신규 문항 적재
   - 4단계 프로세스 (4.1절) 수행

3. 모델 재학습
   - 기존 데이터 + 신규 데이터로 가중치 업데이트
   - 교차검증으로 성능 확인

4. 가중치 변화 분석
   - "올해 응집성의 중요도가 높아졌다" → 출제 경향 변화 감지
   - 그래프 DB의 DifficultyModel 노드 업데이트

5. 이상치 분석
   - 예측과 실제 정답률의 차이가 큰 문항 → 새로운 난이도 요인 탐색
```

### 5.4 난이도 산출 공식

```
predicted_answer_rate = f(
    w1 × subordinate_clause_ratio,
    w2 × (1 - coherence_textbase),      // 응집성이 낮을수록 어려움
    w3 × abstractness_overall,
    w4 × advanced_vocab_ratio,
    w5 × (1 - context_clue_ratio),      // 문맥 단서가 적을수록 어려움
    w6 × avg_sentence_length / 30,      // 정규화
    w7 × (1 - connective_density),      // 연결어가 적을수록 어려움
    w8 × background_knowledge_demand,   // 배경지식 요구도
    interaction_terms                    // 변수 간 상호작용
)

// 가중치 w1~w8은 기출 정답률로 회귀분석하여 도출
// 문항 유형별로 별도 가중치 세트 유지
```

---

## 6. 활용 시나리오

### 6.1 조건 조합 검색

```cypher
// "기후변화 주제 + 빈칸추론 + 고난도 + 인과관계 구조" 문항 검색

MATCH (q:Question)-[:IS_TYPE]->(qt:QuestionType {name: "빈칸추론"}),
      (q)-[:HAS_PASSAGE]->(p:Passage)-[:ABOUT_TOPIC]->(t:Topic {name: "기후변화"}),
      (p)-[:HAS_STRUCTURE]->(s:Structure {category: "논증형"})
WHERE q.answer_rate < 0.35
RETURN q, p, s
```

### 6.2 유사 문항 탐색

```cypher
// "2024 31번과 구조는 같지만 주제가 다른 문항"

MATCH (q1:Question {id: "CSAT-2024-31"})-[:HAS_PASSAGE]->(p1)-[:HAS_STRUCTURE]->(s),
      (q2:Question)-[:HAS_PASSAGE]->(p2)-[:HAS_STRUCTURE]->(s),
      (p1)-[:ABOUT_TOPIC]->(t1),
      (p2)-[:ABOUT_TOPIC]->(t2)
WHERE t1 <> t2 AND q1 <> q2
RETURN q2, t2, s
```

### 6.3 오답 패턴 분석

```cypher
// "빈칸추론에서 가장 효과적인 오답 유형은?"

MATCH (q:Question)-[:IS_TYPE]->(qt:QuestionType {name: "빈칸추론"}),
      (q)-[d:HAS_DISTRACTOR]->(dt:DistractorType)
WHERE d.selection_rate > 0.15
RETURN dt.name, AVG(d.selection_rate) AS avg_attraction, COUNT(*) AS count
ORDER BY avg_attraction DESC
```

### 6.4 난이도 맞춤 문항 생성 가이드

```cypher
// "정답률 30% 수준 빈칸추론 문항의 변수 조합 조회"

MATCH (q:Question)-[:IS_TYPE]->(qt:QuestionType {name: "빈칸추론"}),
      (q)-[:HAS_PASSAGE]->(p)-[:HAS_COHERENCE]->(c),
      (p)-[:HAS_ABSTRACTNESS]->(a),
      (p)-[:HAS_VOCAB_PROFILE]->(v)
WHERE q.answer_rate >= 0.25 AND q.answer_rate <= 0.35
RETURN AVG(p.subordinate_clause_ratio) AS avg_subord,
       AVG(c.textbase_level) AS avg_coherence,
       AVG(a.overall_score) AS avg_abstract,
       AVG(v.advanced_ratio) AS avg_adv_vocab,
       AVG(p.avg_sentence_length) AS avg_sent_len
```

### 6.5 출제 경향 분석

```cypher
// "최근 5년간 빈칸추론의 응집성 수준 변화"

MATCH (q:Question)-[:IS_TYPE]->(qt:QuestionType {name: "빈칸추론"}),
      (q)-[:HAS_PASSAGE]->(p)-[:HAS_COHERENCE]->(c)
WHERE q.year >= 2020
RETURN q.year,
       AVG(c.textbase_level) AS avg_coherence,
       AVG(q.answer_rate) AS avg_answer_rate
ORDER BY q.year
```

---

## 7. 구축 로드맵

### 7.1 단계별 계획

| 단계 | 기간 | 작업 | 노드/엣지 | 효과 |
|:---:|:---:|------|----------|------|
| **1** | 2주 | 문항 + 유형 + 주제 + 정답률 | Question, QuestionType, Topic | 기본 검색 |
| **2** | 2주 | 글의 구조 + 요구 능력 | Structure, Skill | 구조 기반 검색 |
| **3** | 3주 | 어휘 분포 + 텍스트 복잡도 (NLP 자동) | VocabProfile, Passage 속성 | 정량 분석 |
| **4** | 3주 | 응집성 + 추상도 (AI+전문가) | CoherenceProfile, AbstractnessMap | 정밀 분석 |
| **5** | 2주 | 오답 유형 분류 | DistractorType | 선지 설계 |
| **6** | 2주 | 난이도 모델 학습 | DifficultyModel | 난이도 예측 |
| **7** | 지속 | 신규 문항 추가 + 모델 업데이트 | 전체 | 지속 개선 |

### 7.2 최소 데이터 규모

| 항목 | 최소 권장 | 이상적 |
|------|----------|--------|
| 수능 본시험 | 최근 10년 (약 280문항) | 최근 20년 |
| 6월 모의고사 | 최근 10년 | 최근 15년 |
| 9월 모의고사 | 최근 10년 | 최근 15년 |
| **합계** | **약 840문항** | **약 2,000문항** |

### 7.3 기술 스택 권장

```
[그래프 DB]
- Neo4j (가장 성숙한 그래프 DB, Cypher 쿼리 언어)
- 대안: Amazon Neptune, ArangoDB

[NLP 자동 분석]
- spaCy (구문 분석, 종속절 탐지)
- NLTK (기본 텍스트 통계)
- 커스텀 어휘 분류기 (교육부 어휘 목록 기반)

[AI 분석]
- Claude API (구조, 응집성, 추상도, 오답 유형 분석)

[난이도 모델]
- scikit-learn (Ridge, GradientBoosting)
- 데이터 충분 시: XGBoost, LightGBM

[시각화]
- Neo4j Browser (그래프 탐색)
- Streamlit/Dash (분석 대시보드)
```

---

## 8. 품질 관리 기준

### 8.1 AI 분석 정확도 목표

| 분석 항목 | 목표 정확도 | 검증 방법 |
|----------|:---------:|----------|
| 주제 분류 | 95% | 전문가 교차 검증 |
| 글의 구조 판별 | 85% | 전문가 교차 검증 |
| 오답 유형 분류 | 80% | 전문가 교차 검증 |
| 응집성 평가 | ±0.1 오차 | 전문가 평가와 상관분석 |
| 추상도 평가 | ±0.15 오차 | 전문가 평가와 상관분석 |

### 8.2 난이도 예측 모델 목표

| 지표 | 1단계 목표 | 최종 목표 |
|------|:---------:|:--------:|
| MAE (평균절대오차) | ±8% | ±3% |
| R² (설명력) | 0.60 | 0.85 |
| 유형별 최저 R² | 0.50 | 0.75 |

---

## 부록: 수능 영어 문항 유형별 핵심 분석 포인트

| 유형 | 빈칸 위치/대상 | 핵심 변수 | 주요 오답 패턴 |
|------|-------------|----------|-------------|
| **빈칸추론** | 핵심 논지 위치 | 응집성 단절, 추상도 | 부분일치, 반대논지 |
| **순서배열** | 문단 간 연결 | 연결어, 지시어, 구조 | 표면적 연결 함정 |
| **요약완성** | 요약문 빈칸 | 추상화 수준, 글 구조 | 과잉일반화, 부분일치 |
| **심경분위기** | 감정/분위기 | 묘사 간접성, 감정 어휘 | 유사감정 혼동 |
| **주제요지** | 중심 생각 | 주제 명시도, 추상도 | 세부내용 오인, 확대해석 |
| **지칭추론** | 대명사/표현 | 지칭 대상 수, 구문 거리 | 인접 명사 혼동 |
| **무관한문장** | 이탈 문장 | 주제 표면 유사도 | 주제어 공유 함정 |
