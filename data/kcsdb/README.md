# data/kcsdb — Korea-curri-standards-db 정본의 사본

이 폴더의 CSV 는 `smilepat/Korea-curri-standards-db` `data/` 의 사본이다. 고칠 것이 있으면 여기가 아니라 정본을 고치고 다시 복사한다.
`scripts/seed-kcsdb.mjs` 가 이 사본을 Turso `kcsdb_*` 테이블에 넣는다.

표의 "정본 판" 은 이 사본과 바이트까지 같은 정본 파일이 들어온 커밋이다 (2026-11-28 확인: 아래 사본 11개 모두 정본 master `45f1270` 의 같은 파일과 같다).

| 파일 | 정본 판 | 사본을 바꾼 KES 커밋 |
|---|---|---|
| `achievement_standards.csv` | 45f1270 (2026-11-28 PR #15, 2022 성취기준 영어 번역 빈칸 108줄 채움) | 2026-11-28 이 사본 갱신 PR |
| `comm_functions.csv`, `comm_function_examples.csv` | 3b93477 (2026-11-27 PR #13, 2022 기능 id 에 영역 순번 — 213개·예시문 1,011) | f27890b (#16) |
| `curriculum_vocab.csv`, `vocab_curriculum_map.csv` | 6e5e528 (2026-11-11 PR #8 병합, 각 판 3,000) | 55d53bd |
| `achievement_levels.csv` | b9f6eeb (2026-09-08) | 5454227 |
| `level_gate.csv` | 07b16a9 (2026-09-08) | 6d8ebb8 |
| `achievement_standards_stas.csv` | 4c1d880 (2026-07-04) | e789294 |
| `grammar_items.csv` | e72ab72 (2026-07-04) | e789294 |
| `source_registry.csv` | 95522cb (2026-07-05) | e789294 |

정본에 없는 이 레포 고유 파일 (정본 사본 아님):

| 파일 | 쓰는 곳 |
|---|---|
| `grammar_verified.csv` | `scripts/classify-grammar.mjs` — 문법 40건 사람 검수 오버라이드 (a21631f) |
| `cefr_hs_refine.csv` | `scripts/backfill-cefr.mjs` — 고교 과목별 CEFR 정교화 근거표 (320abaf) |

교육과정 기본어휘 판 기록: 6e5e528 이전 판은 원문 파싱 결함으로 2015 2,977 · 2022 2,862 였다 (able·agree·body 등 161 누락).

**사본을 바꾼 뒤 운영 DB 반영은 따로 한다**: `node scripts/seed-kcsdb.mjs` (`.env.local` 의 Turso 값 필요). 2026-11-12 교체분은 같은 날 `kcsdb_vocab` 표만 다시 넣었다 (5,839 → 6,000, 다른 표는 그대로). 바꾸기 전 내용 백업 = 그 PC `C:/Users/eltko/backups/kes_turso_kcsdb_vocab_before_2026-11-12.json`.
단, `seed-kcsdb.mjs` 는 성취기준의 영어 칸(`standard_text_en`)을 넣지 않는다 (`kcsdb_standards` 에 그 칸이 없다). 그래서 2026-11-28 성취기준 갱신(영어 칸만 바뀜)은 운영 DB 다시 넣기가 필요 없다. 2026-11-27 #16 의 의사소통 기능 갱신(188 → 213)은 운영 DB 에 다시 넣었다는 기록이 이 레포에 없다 — 운영 화면에 반영하려면 다시 넣어야 한다.
