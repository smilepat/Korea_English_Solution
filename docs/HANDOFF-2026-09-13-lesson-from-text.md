# 인계장 — 지문에서 수업으로 (2026-09-13)

이 한 장으로 다른 PC·다른 세션에서 이어서 할 수 있게 쓴다.

## 한 문장

**영어 교사가 지문을 붙여 넣으면 그 글이 어떤 종류인지 판정하고, 그 종류에 맞는 45분 수업 계획·교실 활동·숙제를 뽑아 주는 기능을 `app/lesson-planner` 에 붙인다.** 새 앱을 만들지 않는다.

## 어디까지 왔나

| 단계 | 상태 | 결과물 |
|---|---|---|
| 계획 | 완료 2026-09-12 | `docs/PLAN-lesson-from-text.md` · 아티팩트 "지문에서 수업으로" (v2, M0 반영) |
| **M0** 축 확정 + K1 킬 실험 | **완료 2026-09-13** | `experiments/M0-text-type/RESULTS.md` ← **재개는 이것부터** |
| M1 판정 엔진 | 첫 커밋만 | `lessons.ts` 죽은 키 경로 수리 (아래) |
| M2~M6 | 미착수 | 계획서 §8 |

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
1. lib/text-type.ts  — 판정 엔진. experiments/M0-text-type/scripts/raters_multi.py 의
   프롬프트를 그대로 옮긴다. 3인 호출(2.5-flash·2.5-pro·3.8-flash), 선택지 순서 섞기.
   축 A 다수결 / 축 B 교집합 / 근거 문장 결정론 검증(지문에 실재하는지 substr 확인).
2. lib/grade-fit.ts  — abc-english-framework grade-bounds 로 학년 적합성. AI 없음.
3. 성취기준 후보 — kcsdb 미러에서 verified 만. 문구는 DB 원문 그대로.
4. app/lesson-planner 에 '지문' 탭 (기존 '주제' 탭은 그대로).
```

M2(레시피 원장) 시작 전에 사람에게 물을 것 하나 — **"민원·요청 편지를 친교글과 같은 활동으로 다루십니까, 정보글과 같은 활동으로 다루십니까?"** 갈래의 정답이 아니라 활동을 가를 기준을 묻는 것이다.

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
