# 인계장 — 지문에서 수업으로 (2026-09-13)

이 한 장으로 다른 PC·다른 세션에서 이어서 할 수 있게 쓴다.

## 한 문장

**영어 교사가 지문을 붙여 넣으면 그 글이 어떤 종류인지 판정하고, 그 종류에 맞는 45분 수업 계획·교실 활동·숙제를 뽑아 주는 기능을 `app/lesson-planner` 에 붙인다.** 새 앱을 만들지 않는다.

## 어디까지 왔나

| 단계 | 상태 | 결과물 |
|---|---|---|
| 계획 | 완료 2026-09-12 | `docs/PLAN-lesson-from-text.md` · 아티팩트 "지문에서 수업으로" (v2, M0 반영) |
| **M0** 축 확정 + K1 킬 실험 | **완료 2026-09-13** | `experiments/M0-text-type/RESULTS.md` ← **재개는 이것부터** |
| M1 판정 엔진 + UI | **완료 2026-09-14** | `lib/text-type/` (아래) · `app/actions/text-type.ts` · `components/text-type-panel.tsx` · lesson-planner '지문으로 시작' 탭 |
| M2 레시피 원장 | **완료 2026-09-14**, K2 통과 | `content/recipes/` 32개 · `docs/RECIPE-SPEC.md` · `scripts/validate-recipes.mjs` · `lib/recipes/` |
| M3~M6 | 미착수 | 계획서 §8 |

## M2 (2026-09-14) — 레시피 원장

세 갈고리(`forms` / `purposes` / `methods`)로 건다. 상세화·인과는 검증기가 막는다.
`npm run validate:recipes` 가 계약·커버리지(방식 7종×2, 형식 4, 목적 4, 단계별 3, 범용 ≤6)를 센다.
`lib/recipes/select.ts` 는 AI 없이 seed 고정으로 pre 1 · while 1~2 · post 1 · home 1 을 고른다.
K2: 서사문 vs 논증문 세트 Jaccard < 0.5 통과. 방식 집합이 빈 편지도 편지 활동으로 채워진다.
아직 없는 것: **slot 채우기(M3)** — 레시피의 빈칸을 지문 내용으로 채우는 AI 단계와 인쇄.

## M1 엔진 (2026-09-14) — `lib/text-type/`

```text
measure.ts    ① 재기      낱말·문장·FK. AI 없음.  (①~⑤ 문장삽입 표지도 문장 경계로 본다)
forms.ts      ② 겉모양    편지·대화·안내·광고를 표지로 잡는다. AI 없음.
judge.ts      ③ 판정자    3인(2.5-flash·2.5-pro·3.8-flash), 서로 못 봄, 선택지 순서 섞음. M0 프롬프트 그대로.
aggregate.ts  ④ 모으기    목적 다수결 · 전개 방식 전원 동의 집합 · 근거는 지문에 실재하는 것만. AI 없음.
fit.ts        ⑤ 적합성    grade-bounds(abc framework 사본) 대조. AI 없음. Lexile 은 안 잼.
standards.ts  성취기준     kcsdb_standards 에서 verified 만, 읽기·이해, 문구는 원문 그대로.
index.ts      analyzePassage(text, {grade}) → 전부
```

권장안 그대로다: **편지·대화·안내·광고는 겉모양이 활동을 정하고, 겉모양이 잡히면 목적이
갈려도 되묻지 않는다.** 표지 없는 편지는 AI 목적 판정이 뒷그물.

실측(2026-09-14): 형식 탐지 — 2차 편지 층 8편 중 7, 4차 친교 9편 중 9(편지 7·대화 2),
수능·교과서 산문은 none. 실호출 3편 — 편지 form-led·되물음 없음, 대화 social 3/3,
산문 argumentative 3/3 + 방식 집합 4개. 편지·대화는 방식 집합이 비었다(예상대로 → 축 A 활동).
단위 테스트 `lib/__tests__/text-type.test.ts` 18개. tsc·vitest 66/66.

`callGemini` 에 `model` 옵션이 생겼다(판정자별 모델).

브랜치 `feat/m0-text-type` (main 에서 분기). main 에는 아직 아무것도 안 들어갔다.

## M0 가 정한 것 (계획서보다 이것이 우선)

1. **축은 고시가 정한다.** 2022 개정 별책14(2024-3호) p.48·55 —
   축 A = 목적 4범주(이야기·서사 / 친교·사회 / 정보전달 / 의견·주장) × 학교급 예시.
   축 B = 전개 방식 9종(서사·분류·인과·정의·상세화·예시·비교·대조·문제와 해결).
   정본 파일 `experiments/M0-text-type/data/text-types.json`. 축 B 파악은 그 자체가 성취기준([10공영1-01-06] 외 5건).
   AKU 8종은 AI(fable-5) 라벨이라 폐기.
2. **축 A 는 쓴다.** 판정자 3인 κ — 편지·안내가 든 표본 셋에서 0.71 / 0.75 / 0.80 (합격선 0.67).
3. **축 B 를 한 지문에 하나로 붙이지 않는다.** 어떻게 물어도 0.45~0.57. 첫 표본의 0.692 는 나머지 셋에서 재현 안 됨.
4. **축 B 는 '전원 동의 집합'.** 방식마다 있다/없다 → 3인 다 "있다"인 것만 활동에 건다.
   상세화(85~100% 늘 있음)·인과는 변별 없음. 집합이 빈 지문(편지·안내)은 축 A 활동으로.
5. **되물음은 축 A 갈림에만**(지문의 22~37%).
6. 검사는 정답지 대조가 아니라 **판정자 일치도**로 했다. 이유·표·한계 전부 RESULTS.md.

## 이번 세션에 고친 코드

- `app/actions/lessons.ts` — `anthropic` 직접 호출(`claude-sonnet-4-6` 하드코딩) 제거 → `getProvider().generateJSON`. **Anthropic 키는 죽어 있음을 실제 호출로 확인**(`authentication_error`). 이전 배포본의 수업 설계 기능은 죽어 있었다.
- `lib/models.ts` — `GeminiProvider.generateJSON` 이 `json:true` 를 안 넘기던 것 수정.
- `maxTokens` 4096 — 2.5-flash 는 생각 토큰이 상한을 갉아먹어 200 에서는 JSON 이 잘렸다(실측).
- 검증: `npx tsc --noEmit` 통과 · `npx vitest run` 48/48 · 두 provider 실호출 JSON 확인(임시 테스트, 삭제함).

## 지문 공급원 (Fable 5 조사, 2026-09-13)

- **못 씀**: exam4you · 족보닷컴 · 황인영카페 (회원제, 약관이 재배포 금지). 한국 공공자료(학평·EBS·학업성취도)도 재사용 불가.
- **씀**: 미래엔 22txbook 샘플 e-book(epub 텍스트) · NE능률 NE Teacher '본문 텍스트.hwp' (로그인 없음, 1단원씩) · **VOA Learning English**(공유영역, 4범주 다 있음) · NPS/NASA(안내·공지) · Gutenberg.
- KES Turso `kes_passages` 663편이 저작권 청정(초181/중225/고208). `genre` 컬럼은 AI 라벨 — 믿지 말 것.
- **지문 본문은 저장소에 넣지 않는다.** `experiments/M0-text-type/.gitignore`. seed·id·출처만 커밋, 스크립트로 재생성.

## 다음에 할 일 (M1)

```text
1. (완료) lib/text-type/ 판정 엔진 · fit · standards · 서버 액션 analyzeTextType
2. (완료) lesson-planner '지문으로 시작' 탭 — 기존 '주제' 탭은 그대로.
   아직 안 한 것: 브라우저에서 실제로 눌러 본 적이 없다(next build 만 통과).
   로컬 npm run dev 로 편지 1편·산문 1편 붙여 넣어 화면을 한 번 확인할 것.
3. (완료) M2 레시피 원장 32개 + 검증기 + select.ts. K2 통과.
4. M3 조립: lib/recipes/fill.ts — slot 을 지문으로 채운다. from:passage 는 채운 뒤
   지문에 실재하는지 결정론 검증(isGrounded 재사용), from:generated 만 AI 가 쓴다.
   그 다음 서버 액션 buildLesson(analysis → selectLesson → fill) 과
   lesson-planner 지문 탭에 '활동 만들기' 버튼 + 학생지/교사지 인쇄(print 라우트).
5. main 머지는 화면 확인 뒤 PR 로.
```

편지 질문은 답이 났다 — 겉모양(편지)이 활동을 정한다. 교사에게 묻지 않는다.

## 재현 명령

```bash
cd C:/tmp/Korea_English_Solution/experiments/M0-text-type
python scripts/build_gold_set.py                       # 1차 (aku.db 필요)
node scripts/build_gold_set_2.mjs                      # 2차 (KES Turso, .env.local)
python scripts/build_gold_set_3.py <passages.txt>      # 3차 (에이전트 산출물)
GOLD_SET=gold-set-2.json SET_TAG=set2 python scripts/raters.py
GOLD_SET=gold-set-2.json SET_TAG=set2 python scripts/raters_multi.py
python scripts/compare_sets.py                         # 표본 넷 한 표
```

## 아직 모르는 것

사람 판단 0 · 교과서 견본 9편뿐 · 판정자 전부 Gemini 계열 · '전원 동의 집합'이 교실에서 맞는 자리인지는 K2·K3 몫.
