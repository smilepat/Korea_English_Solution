# HANDOFF — 교육과정 성취기준 검색(/curriculum-search) 통합

> 이 문서 하나로 다른 PC/세션에서 재개 가능. 마지막 작업: 2026-07-06 · main HEAD `4ec7f69`.

## 0. 한 줄 요약
기존 교사 앱 **Korea_English_Solution**(Next.js15 + Turso + Vercel)에 **대한민국 영어 교육과정 성취기준 4모드 검색**을 추가해 배포. 정본 데이터는 `smilepat/Korea-curri-standards-db`에서 가져와 Turso `kcsdb_*` 테이블로 시드.

- **라이브(공개)**: <https://korea-english-solution.vercel.app/curriculum-search>
- 레포: `smilepat/Korea_English_Solution` (main 브랜치, Vercel 팀 `prompt-improvement-dm-pat`)
- 홈 `/`·`standards-comparison`에 검색 링크(로그인 뒤), 검색 페이지 자체는 미들웨어 공개(`OPEN_PREFIXES`).

---

## 1. ⚠️ 자격증명 (가장 중요 — 여기서 시간 많이 씀)

### Turso DB
- DB 이름: **`korea-english-solution-2026`**, URL `libsql://korea-english-solution-2026-connectedu.aws-ap-northeast-1.turso.io`
- ⚠️ **이 DB는 `connectedu` 조직에 있음**(개인 `smilepat` 아님). 토큰 발급:
  ```bash
  # WSL 안에서 (~/.turso/turso 설치됨). 윈도우 네이티브 turso CLI 바이너리는 존재하지 않음.
  ~/.turso/turso auth login --headless      # WSL엔 브라우저 없어 --headless 필수
  ~/.turso/turso org switch connectedu       # ← 반드시 org 전환
  ~/.turso/turso db tokens create korea-english-solution-2026 > /mnt/c/tmp/token.txt
  ```
  - scoop의 `turso`는 **다른 도구**(`tursodb` 로컬엔진). 대시보드 <https://app.turso.tech> 에서 발급도 가능(단 org 선택 주의).
- Vercel 저장 값은 stale해질 수 있음. `.env.local`은 `vercel env pull --environment=production`로 취득하되, **값에 리터럴 `\r\n` 섞여 오는 버그** 있으니 사용 전 정제: `tr -cd 'A-Za-z0-9._-'`(토큰), URL은 알려진 값으로 하드코딩 권장.

### API 키
- **GEMINI_API_KEY**: 앱 원본 키가 무효(만료)라 **`C:\tmp\csat-reasoning-bridge-builder\.env.local`의 Gemini 키로 교체**함(사용자 소유). 모델: **gemini-embedding-001**(768d, S3), **gemini-2.5-flash**(S4·문법분류). ⚠️ `text-embedding-004`·`gemini-2.0-flash`는 이 키로 안 됨.
- **ANTHROPIC_API_KEY**: 앱 원본 무효. 현재 기능은 Anthropic 미사용(전부 Gemini).
- Vercel production/preview env에 위 값들 반영됨. 재배포 전 유효성 확인.

---

## 2. 데이터 (Turso `kcsdb_*` 테이블)
| 테이블 | 행 | 내용 |
|---|---|---|
| kcsdb_standards | 672 | 성취기준(2015 360+2022 312). cefr_alignment 672/672(원본334+상속86+추정252), **cefr_source** 컬럼. 고교 추정 과목별 정교화 완료(A2/B1/B2, 근거표 `data/kcsdb/cefr_hs_refine.csv`) |
| kcsdb_levels | 2313 | 성취수준 A~E/상중하 + cut_score |
| kcsdb_vec | 672 | 768d 임베딩(gemini-embedding-001) |
| kcsdb_vocab | 5839 | 기본어휘 + cefr·freq_rank·meaning_ko |
| kcsdb_comm_functions / _examples | 188 / 1107 | 의사소통 기능 + 영어 예시문 |
| kcsdb_grammar | 40 | 언어형식(2015). **item_name_ko·category**. 40건 전수 사람검수 완료 → **label_source=verified**(정본 오버라이드 `data/kcsdb/grammar_verified.csv`). 예문은 [별표4] 정본, 항목명은 검수된 표준용어 라벨 |
| kcsdb_csat_type_map | 91 | 성취기준↔수능유형(규칙, 참고·공인아님) |
| kcsdb_sources | 42 | provenance |
| kcsdb_standards_fts | 672 | FTS5(trigram) 전문검색 |
| kcsdb_query_cache / _search_log / _rate | — | 운영(임베딩캐시·로그·레이트리밋) |

정본 CSV는 `data/kcsdb/*.csv`(git 커밋됨). 시드 원천.

---

## 3. 코드 지도
- `app/curriculum-search/page.tsx` — 검색 UI(모드토글·필터·결과·상세펼침·복사/인쇄). 공개 페이지. **UX: 검색어 하이라이트(highlight)·정렬(관련도/코드/학교급/CEFR, sortedRows)·빈결과 재검색 안내·모바일 반응형(.kcs-searchrow/.kcs-filterrow)**. run(over?)는 재검색 시 setState 비동기 우회용 override 인자.
- `app/actions/curriculum-search.ts` — 서버액션:
  - `curriculumSearch(q, mode, filters)` — 4모드 파사드(+레이트리밋·강등·로깅)
  - `getStandardDetail(id)` — 성취수준+연계어휘(CEFR)+수능유형
  - `searchReference(q, ver)` — 관련 의사소통표현 + 문법
- `lib/kcsdb-ai.ts` — Gemini 호출(embedQuery=gemini-embedding-001, geminiGenerate=gemini-2.5-flash)
- `lib/kcsdb-guard.ts` — IP·레이트리밋·임베딩캐시·검색로그
- `middleware.ts` — `OPEN_PREFIXES=["/curriculum-search"]` 공개
- `scripts/` — schema-kcsdb.sql · seed-kcsdb.mjs · embed-kcsdb.mjs · backfill-cefr.mjs · classify-grammar.mjs · build-csat-map.mjs

## 4. 검색 4모드 + 부가
- **S1 구조화**: 코드조회([9영03-04]) + version/band/domain/cefr 필터
- **S2 전문**: FTS5(trigram, 3자+) → 2자 등은 LIKE 폴백
- **S3 의미**: 질의 임베딩(캐시) → `vector_distance_cos`
- **S4 자연어**: Gemini가 **JSON조건 추출**→파라미터쿼리→0건시 조건완화→의미검색 폴백 (raw SQL 아님, 인젝션 없음)
- 상세: 성취수준·연계어휘·수능유형(참고). 하단: 의사소통표현·문법. 복사(HWP)·PDF(print).

---

## 5. 재현 파이프라인 (DB 재시드 시)
```bash
# .env.local 준비(TURSO_DATABASE_URL/AUTH_TOKEN, GEMINI_API_KEY)
npm install                                    # @libsql/client 등
node scripts/seed-kcsdb.mjs                     # kcsdb_* 코어 시드(CSV→Turso, FTS 포함)
GEMINI_KEY 불필요 (env에서 읽음)
node scripts/embed-kcsdb.mjs                    # S3 벡터 672(gemini-embedding-001)
node scripts/backfill-cefr.mjs                  # CEFR 결측 백필(+cefr_source)
node scripts/classify-grammar.mjs              # 문법 40 LLM 분류
node scripts/build-csat-map.mjs                # 수능유형 규칙 매핑
# 운영 테이블(query_cache/search_log/rate)은 schema-kcsdb.sql에 포함, seed가 생성
```
> ⚠️ 재시드는 kcsdb_standards를 DELETE+INSERT하므로 `cefr_source`가 초기화됨 → **backfill-cefr.mjs 재실행 필수**(Stage4가 `cefr_hs_refine.csv` overlay 자동 재적용). 마찬가지로 grammar 분류(검수는 `grammar_verified.csv` 자동 보존)·csat맵도 재실행.

## 6. 배포
```bash
cd Korea_English_Solution
vercel --prod --yes        # 로컬 브랜치 → production(빌드는 Vercel). 실패해도 라이브 유지
```
- next.config: `eslint.ignoreDuringBuilds=true`, `typescript.ignoreBuildErrors=true` (인라인스타일/타입 경고 무시).

---

## 7. 정직성 원칙 (일관 준수)
heuristic·추정·AI·규칙 산출물은 **출처 컬럼 + UI 표기**로 고시 원문 정본과 구분:
- CEFR 상속/추정 → "동일 학년군 상속"/"추정" 표기 (cefr_source)
- 문법 분류 → "[별표4]·AI 분류" 표기 (label_source=llm)
- 수능 유형 → **"규칙 기반 참고 — 공인 매핑 아님"** 필수 표기

## 8. 알려진 한계 · 다음 단계
- `csat_items`(앱 원본) = 1행(샘플) → 수능 **예시 문항** 표시 불가. 실물 필요 시 별도 시딩.
- kcsdb_grammar 40 = 2015 [별표4] 부분 커버(●학교급 마커 미복원). 학년군 단위 연계가 정직한 한계. LLM 라벨 **전수 검수 완료**(2026-07-06, label_source=verified, 정정 4건: GR-024/035/019/027). 정본 오버라이드=`data/kcsdb/grammar_verified.csv` → 재시드 후에도 `classify-grammar.mjs`가 자동 보존.
- CEFR estimated 252(고교 일반/진로 선택 B1 유지분+심화 B2). 2026-07-06 과목별 정교화 완료: 심화·독해작문→B2, 기본영어→A2 상속, 근거표 `data/kcsdb/cefr_hs_refine.csv`. 남은 estimated 87건(일반/진로 선택)은 앵커 부재로 B1 유지 — 추가 근거 확보 시 정교화 여지.
- **다음 개선은 `kcsdb_search_log` 데이터 기반으로**: 0건 쿼리·S4 폴백률 분석 → 동의어 사전/규칙 보강. (Fable5 계획 `docs/IMPROVEMENT_PLAN.md` 참조)

## 9. 커밋 이력(이 통합)
4모드검색 → 홈/비교 링크·공개 → S4 재설계 → 성취수준+어휘 → 의사소통표현 → main 머지 → 복사/PDF+비용방어+CEFR백필 → 문법+수능유형. 상세는 `git log`.

## 10. 관련 정본 레포
- `smilepat/Korea-curri-standards-db` — 성취기준 정본 DB(이 데이터의 원천). `data/*.csv`.
- `smilepat/efl-data-hub` — SSoT 허브(achievement_standards_kr pin).
