# 활동 레시피 파일 계약 (M2)

`content/recipes/<id>.json` 한 파일 = 활동 하나. **코드를 고치지 않고 파일만 더해 활동을 늘린다.**

검증: `npm run validate:recipes` — 통과하지 못하면 CI 가 막는다.
검증기 `scripts/validate-recipes.mjs` 는 `lib/` 를 import 하지 않는다. 의도적이다 —
검증 대상과 코드를 나눠 쓰는 검증기는 공유 코드의 버그를 못 잡는다.

## 왜 레시피인가

활동 전체를 AI 에게 시키면 매번 그럴듯하지만 매번 다른 글이 나오고, 같은 지문을 두 번
넣으면 다른 수업이 나온다. 레시피의 뼈대는 사람이 검토한 것이고, AI 는 **빈칸(slot)만**
이 지문의 내용으로 채운다. (`English_learning_games` 의 네 축 분리와 같은 구조)

## 세 갈고리 — 레시피는 무엇에 걸리는가

M0 가 정한 것: 한 지문에 전개 방식 하나를 붙이지 않는다. 그래서 갈고리가 셋이다.

| 갈고리 | 값 | 언제 |
|---|---|---|
| `hooks.forms` | letter · dialogue · notice · advertisement | 겉모양이 잡힌 글. **형식이 활동을 정한다** |
| `hooks.purposes` | narrative · social · informative · argumentative | 목적 4범주 |
| `hooks.methods` | narration · classification · definition · exemplification · comparison · contrast · problem_solution | 판정자 전원이 "있다"고 한 전개 방식 |

**규칙**

- 갈고리 하나가 비어 있으면(`[]`) 그 축은 묻지 않는다. 셋 다 비면 어느 지문에나 거는 범용 레시피다.
- 셋 중 비어 있지 않은 것은 **모두** 맞아야 한다. 한 갈고리 안에서는 **하나만** 맞으면 된다.
- `hooks.methods` 에 `elaboration`·`cause_effect` 는 넣지 못한다. 85~100% 의 글에 있어 아무것도 가르지 못한다(M0 실측). 검증기가 막는다.
- 편지·대화·안내·광고 레시피는 `hooks.forms` 로 건다. 목적으로 걸지 않는다 — 민원 편지든 안부 편지든 답장 쓰기는 같다.

## 파일

```jsonc
{
  "id": "narration-timeline-rebuild",       // 필수, kebab-case, 전 레시피에서 유일, 파일명과 같다
  "titleKo": "사건 순서 다시 세우기",          // 필수
  "titleEn": "Rebuild the timeline",         // 선택
  "stage": "while",                          // 필수: pre | while | post | home
  "skill": "reading",                        // 필수: reading | writing | speaking | listening
  "grades": ["middle1","middle2","middle3","high1","high2","high3"],  // 필수, 1개 이상
  "minutes": 12,                             // 필수, 3~25
  "grouping": "pair",                        // 필수: individual | pair | group | whole
  "materials": ["잘라 쓴 문장 조각"],          // 선택
  "layer": "structure",                      // 필수: activity-inventory 의 13 층위 중 하나
  "hooks": { "forms": [], "purposes": [], "methods": ["narration"] },   // 필수, 셋 다 있어야 함
  "slots": [                                 // 필수 (빈 배열 가능). AI 가 채우는 자리. 이것 말고는 못 건드린다
    { "key": "events", "kind": "sentence_list", "n": 6, "from": "passage",
      "rule": "시간 순서를 담은 문장만. 원문 그대로 옮긴다" }
  ],
  "studentText": "아래 {{events.n}}개 문장을 사건이 일어난 순서대로 놓으세요.",   // 필수
  "teacherNote": "순서를 정한 근거 문장을 말하게 하면 연결어 학습으로 이어진다.",  // 필수
  "selfCheck": "…",                          // stage=home 이면 필수. 학생이 혼자 확인하는 방법
  "source": { "inventoryId": "irc-structure", "repo": "IRC" }   // 선택. 어디서 왔나
}
```

### slots

| kind | 채우는 것 | n |
|---|---|---|
| `sentence_list` | 지문 문장 n 개 (원문 그대로) | 필수 |
| `sentence` | 지문 문장 1 개 | — |
| `phrase_list` | 지문의 어구 n 개 (연결어·표현) | 필수 |
| `word_list` | 지문의 낱말 n 개 | 필수 |
| `question_list` | 지문에 관한 물음 n 개 (생성) | 필수 |
| `text` | 짧은 생성 텍스트 (요약·모범답안 등) | — |

`from` 은 `passage`(원문에서 뽑음 — 결정론 검증 가능) 또는 `generated`(AI 가 씀).
`from: passage` 인 slot 의 채움은 지문에 실재하는지 확인한다.

### 숙제 (`stage: "home"`)

- `grouping` 은 `individual` 이어야 한다 — 짝·모둠 활동은 숙제가 못 된다
- `selfCheck` 가 있어야 한다 — 학생이 스스로 확인할 수 있어야 한다

## 합격선 (검증기가 센다)

- 전개 방식 7종(상세화·인과 제외)마다 레시피 2개 이상
- 형식 4종마다 1개 이상 · 목적 4범주마다 1개 이상
- 단계 pre / while / post / home 마다 3개 이상
- 범용(갈고리 셋 다 빈) 레시피는 6개 이하 — 많으면 유형 판정이 장식이 된다

## 고르기 (`lib/recipes/select.ts`)

지문 판정 결과 + 학년 + 차시 → 갈고리로 후보를 거른 뒤, seed 고정으로 pre 1 · while 1~2 ·
post 1 · home 1 을 고른다. 같은 지문·같은 학년이면 같은 세트가 나온다.
갈고리가 구체적인 레시피(방식·형식)를 범용보다 먼저 고른다.
