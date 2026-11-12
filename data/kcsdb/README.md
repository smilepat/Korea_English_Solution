# data/kcsdb — Korea-curri-standards-db 정본의 사본

이 폴더의 CSV 는 `smilepat/Korea-curri-standards-db` `data/` 의 사본이다. 고칠 것이 있으면 여기가 아니라 정본을 고치고 다시 복사한다.
`scripts/seed-kcsdb.mjs` 가 이 사본을 Turso `kcsdb_*` 테이블에 넣는다.

| 파일 | 정본 판 | 행 |
|---|---|---|
| `curriculum_vocab.csv`, `vocab_curriculum_map.csv` | 6e5e528 (2026-11-11 PR #8, 각 판 3,000) — 2026-11-12 교체 | 6,000 |
| 그 밖의 파일 | 2026-09 복사 당시 판 (교체 안 함) | — |

교육과정 기본어휘 판 기록: 6e5e528 이전 판은 원문 파싱 결함으로 2015 2,977 · 2022 2,862 였다 (able·agree·body 등 161 누락).

**사본을 바꾼 뒤 운영 DB 반영은 따로 한다**: `node scripts/seed-kcsdb.mjs` (`.env.local` 의 Turso 값 필요). 2026-11-12 교체분은 아직 DB 에 넣지 않았다.
