# 인계장 — 지문에서 수업으로 (2026-09-14, 갱신 2026-11-05)

이 한 장으로 다른 PC·다른 세션에서 이어서 할 수 있게 쓴다. 정본은 이 파일 하나다.

> **세션 종료 2026-11-05.** 코드는 전부 커밋·푸시됨. draft PR [#11](https://github.com/smilepat/Korea_English_Solution/pull/11) 이 열려 있다.
> 11-05 에 화면 확인 **사전 점검**(검사 재실행 + 표본 3편 실호출)을 끝냈고 따옴표 버그 1건을 고쳤다(§3-1).
> **남은 것은 사람이 화면을 눈으로 보는 것 하나다.** 그 답이 오기 전에는 draft 를 풀지 않는다. 재개 프롬프트:
> `docs/HANDOFF-lesson-from-text.md 읽고 §3 화면 확인부터 이어서 하자 (브랜치 feat/m0-text-type)`

## 한 문장

**영어 교사가 지문을 붙여 넣으면 그 글이 어떤 종류인지 판정하고, 그 종류에 맞는 45분 수업 활동(도입·전개·정리)과 숙제를 채워 학생지·교사지로 인쇄해 준다.** `Korea_English_Solution`(KES) 의 `app/lesson-planner` 에 '지문으로 시작' 탭으로 붙였다. 새 앱은 만들지 않았다.

## 어디까지 왔나

| 단계 | 상태 | 있는 곳 |
|---|---|---|
| 계획 | 완료 09-12 | `docs/PLAN-lesson-from-text.md` · 아티팩트 "지문에서 수업으로" v2 |
| M0 축 확정 + K1 | 완료 09-13 | `experiments/M0-text-type/RESULTS.md` |
| M1 판정 엔진 + 지문 탭 | 완료 09-14 | `lib/text-type/` · `components/text-type-panel.tsx` |
| M2 레시피 원장 33개 + K2 | 완료 09-14 | `content/recipes/` · `docs/RECIPE-SPEC.md` · `lib/recipes/select.ts` |
| M3 빈칸 채우기·조립·인쇄 | 완료 09-14 | `lib/recipes/fill.ts` · `app/actions/lesson-build.ts` · `app/lesson-planner/print` |
| 화면 확인 사전 점검 | 완료 11-05 (실호출 3편, 버그 1건 수리) | 아래 §3-1 |
| **화면 확인** | **대기 — 사람 눈으로 한 번도 안 봄** | 아래 §3 |
| M4 자료실 저장 | 미착수 | |
| main PR | draft #11 열림. 화면 확인 뒤 draft 해제, 머지는 사람이 "머지해줘" 할 때만 | 브랜치 `feat/m0-text-type`. main 이 1커밋 앞섬(09-19 `7c0d8b7` curriculum-search 수정) — 머지 전 브랜치 갱신 후 CI 재확인 |
| M5 배정·루브릭 · M6 실사용 K3 | 미착수 | 계획서 §8 |

빌드·검사: `validate:recipes` 33 · `vitest` 87/87 · `tsc` · `next build` 22쪽 — 전부 통과 (09-14).

## 1. 지문 하나가 지나가는 길

```text
지문 붙여넣기 (영어 40낱말 이상, 6000자 이하)
  ① measure   재기        낱말·문장·FK, grade-bounds 대조 (Lexile 은 안 잼)        AI 없음
  ② forms     겉모양      편지·대화·안내·광고를 표지로                             AI 없음
  ③ judge     판정자 3인  목적 하나 고르기 + 전개 방식 있다/없다 ×9                 AI
              (2.5-flash · 2.5-pro · 3.8-flash, 서로 못 봄, 선택지 순서 판정자마다 섞음)
  ④ aggregate 모으기      목적 다수결 · 방식 전원 동의 집합 · 근거는 지문에 실재하는 것만   AI 없음
  ⑤ select    고르기      레시피 33개에서 seed(지문 해시) 고정으로 도입1·전개1~2·정리1·숙제1   AI 없음
  ⑥ fill      채우기      from:passage 는 채운 뒤 지문 실재 검증, from:generated 만 AI 작문   AI
  → 교사 보기 / 학생 보기 → /lesson-planner/print?view=student|teacher (Ctrl+P → PDF)
```

**지문 원문은 어디에도 저장하지 않는다.** 해시와 결과만. 인쇄용 데이터는 브라우저 sessionStorage.

## 2. 설계에서 정해진 것 (바꾸려면 근거가 필요하다)

1. **축은 고시가 정한다.** 2022 개정 별책14(2024-3호) p.48·55. 축 A = 목적 4범주, 축 B = 전개 방식 9종. `lib/text-type/text-types.json`. 축 B 파악은 그 자체가 성취기준([10공영1-01-06] 외 5건).
2. **축 B 를 한 지문에 하나로 붙이지 않는다.** 판정자 3인 κ 가 표본 넷(수능 30·KES 청정 30·교과서 견본 9·개방 27)에서 전부 0.45~0.57. 첫 표본의 0.692 는 재현 안 됨. → **전원 동의 집합**으로 쓴다. 상세화·인과는 85~100% 늘 있어 갈고리로 못 쓴다(검증기가 막음).
3. **축 A(목적)는 쓴다** — 편지·안내가 든 표본에서 κ 0.71~0.80.
4. **편지·대화·안내·광고는 겉모양이 활동을 정한다.** 겉모양이 잡히면 목적이 갈려도 되묻지 않는다. 민원 편지든 안부 편지든 답장 쓰기는 같다. 표지 없는 편지는 AI 목적 판정이 뒷그물.
5. **되물음은 축 A 가 갈리고 겉모양이 없을 때만** (a/b 두 후보를 교사가 고름).
6. **유형으로 난이도를 말하지 않는다.** 난이도는 ① 에서만 (AKU 실측: 집단 내 상관 0.071).
7. **AI 는 빈칸만 채운다.** 레시피는 만들지 않는다. 생성≠검증 — 옮긴 문장이 지문에 없으면 싣지 않는다.
8. **판정 프롬프트는 M0 의 것 그대로**(`lib/text-type/judge.ts`). 바꾸면 M0 수치가 보증하지 않는다.

## 3. 지금 당장 할 일 — 화면 확인 (10분, 사람)

```bash
cd C:/tmp/Korea_English_Solution && npm run dev      # http://localhost:3000
```

- 모든 페이지가 로그인 벽 뒤에 있다. `/login` → **데모 계정으로 로그인** (또는 `demo@korea-english.com` / `demo1234`). 외부 사이트가 아니라 KES 자체 화면이다.
- `/lesson-planner` → '지문으로 시작' 탭 → 지문 붙여넣기 → 학년 → **유형 판정하기**(30초) → **이 판정으로 활동 만들기**(30초) → 교사/학생 보기 → **학생지 / 교사지** 인쇄.
- 표본 지문(공유영역 3편) = `C:/tmp/kes-lesson-from-text/sample-passages.md`. 없으면 `experiments/M0-text-type/data/gold-set-4.json` 을 `build_gold_set_4` 산출물에서(에이전트 보고서에 본문 있음) 다시 만든다.

볼 것 셋: ⓐ 활동지 문장이 **지문에 있는 문장인가** ⓑ 그 지문으로 **실제 수업에 쓸 만한가**(K3 의 첫 감) ⓒ 편지형에서 목적이 갈려도 **되묻지 않고 넘어가는가**.

### 3-1. 사전 점검 결과 (2026-11-05, 사람 화면 확인을 대신하지 않는다)

에이전트는 이 환경에서 브라우저를 열지 못해 화면 자체는 보지 못했다. 대신 화면이 부르는 것과 같은 경로(`analyzePassage` → `selectLesson` → `fillRecipe`)를 표본 3편에 실제로 돌렸다.

- 검사: `validate:recipes` 33 · `vitest` 88/88 · `tsc` 통과. `npm run dev` 기동, `/login` 200, `/lesson-planner` 는 로그인으로 넘김(정상).
- 실호출: 판정자 3인 전부 응답(모델 살아 있음). 편당 판정 23~26초 · 채우기 12~18초.

| 표본 | 겉모양 | 목적 | 활동 5개 중 complete | 메모 |
|---|---|---|---|---|
| 편지형 (VOA) · 중3 | letter | informative 3/3, formLed | 3 (수리 전) | 벤 다이어그램 6개 중 5개가 따옴표 버그로 버려짐 · 답장 쓰기는 부탁 1개라 미완성 |
| 설명문 (NASA) · 중2 | none | informative 3/3 | 5 | |
| 주장문 (오바마) · 고1 | none | argumentative 3/3 | 5 | |

- **ⓐ** 실린 문장은 전부 지문에 있었다. **ⓒ** 편지는 겉모양으로 잡혀 되묻지 않았다 — 다만 세 판정자의 목적이 갈리지 않아 "갈려도 넘어가는" 경우는 **시험되지 않았다**. **ⓑ** 는 사람 몫, 안 봄.
- **고친 것**: `fill.ts` 의 `norm` 이 굽은/곧은 따옴표만 맞추고 작은/큰 따옴표는 다르게 봤다. 모델이 `"nearby"` 를 `'nearby'` 로 옮기면 지문에 있는 문장이 버려졌다. 따옴표 종류를 가리지 않게 고침 + `fill.test.ts` 에 실제 문장으로 검사 1개(수정을 되돌리면 실패하는 것 확인). 수리 뒤 편지형을 **다시 실호출하지는 않았다** — 화면에서 편지형 벤 다이어그램에 특징이 여러 개 차는지로 확인한다.
- **안 고친 것 (결정 필요)**: `letter-reply` 의 `asks` 는 규칙이 "1~3개"인데 `isComplete` 는 n(3)의 절반=2개 이상을 요구한다. 부탁이 하나뿐인 편지는 쓸 수 있는데도 "미완성"으로 뜬다. a) 최소 개수를 slot 에 따로 두어 1개로 / c) 그대로. 에이전트 권장 a, 사용자 답 대기.
- 사전 점검을 다시 돌리려면: 임시 `lib/__tests__/_tmp-*.test.ts` 를 만들어 `node --env-file=.env.local node_modules/vitest/vitest.mjs run <파일>` (vitest 는 `.env.local` 을 스스로 읽지 않는다). 끝나면 지운다.

## 4. 파일 지도

```text
lib/text-type/
  text-types.json   ★정본. 축 A·B, 고시 쪽수, 연결 성취기준
  grade-bounds.json abc-english-framework 사본 (초3~고1). 고2·3 은 고1 기준 + approximated 표시
  measure.ts forms.ts judge.ts aggregate.ts fit.ts standards.ts index.ts
lib/recipes/
  types.ts select.ts load.ts fill.ts
content/recipes/*.json          레시피 33개 (파일 = 활동). 계약 docs/RECIPE-SPEC.md
scripts/validate-recipes.mjs    무의존 검증기. npm run validate:recipes
app/actions/text-type.ts        analyzeTextType (레이트리밋 kcsdb-guard)
app/actions/lesson-build.ts     buildLesson
app/actions/lessons.ts          기존 '주제' 모드 — 죽은 Anthropic 키 직접 호출을 provider 경유로 수리(09-13)
components/text-type-panel.tsx  지문 탭 화면
components/lesson-build-view.tsx 활동 세트 화면 (교사/학생)
app/lesson-planner/print/page.tsx 인쇄
lib/__tests__/text-type.test.ts recipes.test.ts fill.test.ts   (실패할 수 있는 검사만)
experiments/M0-text-type/       M0 원자료·스크립트·RESULTS.md. 지문 본문은 gitignore (seed 로 재현)
docs/PLAN-lesson-from-text.md   계획서 (M0 반영판)
docs/RECIPE-SPEC.md             레시피 계약
```

## 5. 실측 기록 (수치는 원자료에서 다시 셀 수 있다)

| 무엇 | 결과 | 어디 |
|---|---|---|
| 순서만 바꿔 같은 모델에 재질문 | 답 27% 바뀜 (자기와 73%) | RESULTS §2 |
| 축 A κ (표본 넷) | 0.62 / **0.71 / 0.75 / 0.80** | `compare_sets.py` |
| 축 B 직접 고르기 / 따진 뒤 대표 | 0.46~0.57 / 0.45~0.69 | 〃 |
| 형식 탐지 | 2차 편지 7/8, 4차 친교 9/9, 산문 none | `forms.ts` 실측 09-14 |
| 근거 실재율 | 95% 이상 (162/162 등) | `agreement_multi.py` |
| K2 서사 vs 논증 활동 세트 | Jaccard < 0.5 통과 | `recipes.test.ts` |
| 빈칸 채우기 실호출 | 9개 중 8개 완전, 없는 문장 걸러짐 | 09-14 (임시 테스트, 삭제) |

## 6. 아직 모르는 것 · 함정

- **사람 판단 0.** 일치는 타당성이 아니다. K3(교사 수정률)는 M6 몫.
- 교과서 견본 표본은 9편뿐. 판정자가 전부 Gemini 계열(gemma 타임아웃).
- aku 기출 본문에 ①~⑤ 문장삽입 표지가 섞여 있다. 문장 분리기는 이를 경계로 본다.
- `next build` 가 webpack WasmHash `undefined.length` 로 죽은 적 있음 → `rm -rf .next` 후 재빌드.
- gemini-2.5-flash 는 생각 토큰이 출력 상한을 갉아먹는다. `maxOutputTokens` 200 에서 JSON 이 잘렸다 → 4096.
- Anthropic 키는 죽어 있다(`authentication_error`). `models.ts` 가 Gemini 로 백킹.
- `kes_passages.genre` 는 AI 라벨 — 믿지 말 것.
- Playwright MCP 가 이 환경에서 연결 실패 → 화면 자동 확인 못 함. (11-05 세션도 브라우저 도구 없음.)
- 실재 검증은 글자 비교다. 모델이 따옴표·기호를 바꿔 옮기면 있는 문장도 버려진다 — `dropped` 가 많으면 지어낸 것인지 표기만 다른 것인지 먼저 본다(11-05 따옴표 건).
- 살아남은 항목은 **모델이 옮긴 표기**로 실린다(예: 원문 큰따옴표 → 작은따옴표). 원문 표기로 되돌려 싣지는 않는다.

## 7. 지문 공급원 (Fable 5 조사 09-13)

- **못 씀**: exam4you · 족보닷컴 · 황인영카페(회원제, 약관 재배포 금지). 학평·EBS·학업성취도(재사용 불가).
- **씀**: 미래엔 22txbook 샘플 e-book(epub) · NE Teacher '본문 텍스트.hwp'(1단원씩, 로그인 없음) · **VOA Learning English**(공유영역, 4범주 다 있음) · NPS/NASA(안내·공지) · Gutenberg · KES Turso `kes_passages` 663편(license 청정).
- 어떤 표본이든 **본문은 저장소에 넣지 않는다.**

## 8. 다음

1. §3 화면 확인(사람). 편지형 표본을 꼭 한 번 — 벤 다이어그램에 특징이 여러 개 차면 11-05 따옴표 수리가 화면에서도 확인된 것이다. 어긋난 곳이 있으면 수리.
2. §3-1 의 `letter-reply` 미완성 표시 — 사용자 답(a/c) 받아 처리.
3. 사용자가 "괜찮다"고 하면 PR #11 브랜치를 main 최신으로 갱신 → CI 초록 확인 → draft 해제. **머지는 "머지해줘" 가 있을 때만.**
4. M4: 만든 활동 저장·다시 열기 (`lesson_cases` 확장 또는 새 표, 지문은 해시만)
5. M5: 학생 배정(`assignments.ts`) · 루브릭 축(`rubric-maker-v2`)
6. M6: 본인 수업 2차시 실사용 → 활동당 수정률(K3). 절반 넘는 레시피는 원장에서 뺀다.

## 9. 재현 명령

```bash
npm run validate:recipes && npm test && npm run typecheck && npm run build
cd experiments/M0-text-type && python scripts/compare_sets.py        # M0 표본 넷 한 표
```
