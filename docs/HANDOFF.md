# HANDOFF — Korea English Solution (다른 PC 재개용)

> 이 문서 하나로 다른 PC/세션에서 재개 가능. 마지막 작업: **2026-07-21 · main HEAD `b9a023b`**.
> 운영·env 상세는 [DEPLOYMENT.md](./DEPLOYMENT.md) 참고.

## 0. 한 줄 요약

한국 영어교사 1인용 **통합 앱** — 국가 교육과정 성취기준 기반으로 워크시트·단어장·문항을 만들고, 학생을 **진단→개입**까지 관리(AI). Next.js 15 + Turso + Gemini, Vercel 자동 배포.

- **라이브**: <https://korea-english-solution.vercel.app> (데모 로그인 `demo@korea-english.com` / `demo1234`)
- 레포: `smilepat/Korea_English_Solution` (main), Vercel 팀 `prompt-improvement-dm-pat`
- 코드: `C:\tmp\Korea_English_Solution`

## 1. ⚠️ 다른 PC에서 부트스트랩 (순서대로)

```bash
git clone https://github.com/smilepat/Korea_English_Solution && cd Korea_English_Solution
corepack pnpm install                 # ⚠️ pnpm 은 `corepack pnpm` (9.12.0)
cp .env.local.example .env.local      # 그리고 실제 키 입력 (아래 2절)
node scripts/run-kes-schema.mjs       # kes_ 15테이블 (멱등)
node scripts/seed-content.mjs         # 지문663+어휘9,291+카드6,302 (committed 스냅샷, 원천레포 불필요)
corepack pnpm dev                     # http://localhost:3000
```

- ✅ **시드는 자립적**: `data/passages/*.jsonl`·`data/vocab/*.jsonl`·`data/kcsdb/*.csv` 전부 committed. 원천 레포(lexile_based_reading_textDB 등) 없이 seed 가능.
- `kcsdb_*`(성취기준672·어휘5,839·임베딩)는 이미 원격 Turso 에 적재됨 — 같은 DB 쓰면 재시드 불필요. 새 DB 면 `node scripts/seed-kcsdb.mjs` 추가 실행.

## 2. ⚠️ 자격증명 (여기서 시간 많이 씀)

`.env.local` 에 3개만 있으면 된다 (Firebase·Anthropic 제거됨):

| 변수 | 획득 |
|---|---|
| `TURSO_DATABASE_URL` | `turso db show korea-english-solution-2026` |
| `TURSO_AUTH_TOKEN` | `turso db tokens create korea-english-solution-2026` |
| `GEMINI_API_KEY` | https://aistudio.google.com/app/apikey |

- ⚠️ **Turso DB 는 `connectedu` org 소속**(smilepat 아님). 토큰 발급 전 `turso org switch connectedu`. 이걸 몰라 헤매기 쉬움.
- 기존 PC 의 `.env.local` 에 작동하는 키가 이미 있음(같은 PC면 그대로).

## 3. 현재 상태 (전 기능 동작)

명부 → 진단(어휘CAT+Lexile) → 성취기준 정렬 콘텐츠 → 배정 → 서버채점 → 데이터 기반 처방 → 숙달도 추적, **전 경로 동작·라이브 검증됨**.

| 화면 | 경로 | 비고 |
|---|---|---|
| 학급 명부 | `/roster` | CSV등록→조인카드 + 진단·과제 현황보드 |
| 워크시트·단어장 | `/worksheets` | 반선택→Lexile 자동타겟 + 성취기준 정렬 문항 |
| AI 지문 검토 | `/content-review` | AI생성 지문 승인/거부 |
| 학생 관리 | `/student-tracker` | 진단추적+숙달도+AI처방(맞춤단어장 원클릭) |
| 학생 진입 | `/s/[반코드]` | 무인증, 서버채점(정답 미유출) |

## 4. 핵심 설계 (건드리기 전 알 것)

- **DB**: Turso 단일. `kes_*` 15테이블(앱 데이터) + `kcsdb_*`(교육과정 정본). 스키마 = `scripts/005~009-*.sql`, 러너 `run-kes-schema.mjs`(멱등).
- **AI**: Gemini 단일(`gemini-2.5-flash`). `lib/gemini.ts` `callGemini(prompt, system, {json})` + `parseGeminiJson`(서두 견딤). 구 Claude 경로(`lib/ai.ts`)는 Gemini shim 으로 백킹.
- **정답 미유출**: 어휘CAT·과제 모두 정답을 서버만 보유, 학생엔 보기만 전달, 서버 채점.
- **저작권 방화벽(3중)**: 지문 export 화이트리스트 + `check-no-kichul` CI + saveWorksheet license assert. 수능 기출은 구조적 차단.
- **학생 신원**: 교사 명부에서만 해석(자유입력 금지). ULID + 6자 조인토큰(혼동문자 배제).

## 5. 함정 (실측)

- pnpm 은 `corepack pnpm`(직접 `pnpm` 없음).
- 로컬 빌드 시 node 프로세스 20+ 누적 → webpack OOM. `taskkill //F //IM node.exe` 후 재빌드.
- 성취기준 SQL 린트(T-SQL) 오탐 — `CREATE TABLE IF NOT EXISTS` 는 정상 SQLite.
- Vercel env CLI 함정: 대시보드에서 env 확인 권장.
- ⚠️ **도그푸딩 교훈**: 유닛/타입체크/빌드가 못 잡는 런타임 통합버그(죽은 API모델·LLM출력형식) 존재 → 배포 전 `pnpm dev` + 브라우저로 실제 AI 생성 1회 확인.

## 6. CI·검증

```bash
corepack pnpm test            # vitest 48
corepack pnpm typecheck
corepack pnpm check:no-firebase
corepack pnpm check:no-kichul
corepack pnpm build           # 21 라우트
```

CI(`.github/workflows/ci.yml`)가 PR 마다 위 전부 실행. Vercel 자동 배포.

## 7. 이번 세션 히스토리 (PR #1~#8, 전부 merged)

1. #1~#4 학생척추·진단배선·워크시트/단어장 스튜디오·처방루프·성취기준 정렬·처방 원클릭
2. #5 Gemini 생성 복구(죽은모델 gemini-2.0-flash→2.5 + JSON 서두)
3. #6 지문 중복제거(764→639)+초등 지문 24개
4. #7 성취기준별 숙달도 태그
5. #8 Anthropic 경로 복구(9라우트 Gemini shim)+서술형채점+숙달도UI+검토UI+학생레이아웃+DEPLOYMENT.md

## 8. 다음 작업 후보 (우선순위)

- **실제 반 도그푸딩** (사용자) → 숙달도·적응 기능은 시도 데이터 축적 후 유의미
- 숙달도 대시보드 확장(반 단위 rollup)
- 문항 품질 게이트(ebs-demo criteria-engine 이식, ⚠pnpm workspace 전환 리스크)
- 여러 교사 인증 전환(현재 단일 데모쿠키) — `app/actions/auth.ts` + 반/학생 teacher_id 소유권
- 초등 지문 추가 생성(`npm run gen:elementary`)→`/content-review` 검토
