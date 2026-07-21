# 운영 배포 가이드 (DEPLOYMENT)

Korea English Solution — 교사 AI 코파일럿. 실제 반 운영 전 점검·전환 절차.

## 1. 아키텍처 요약

- **Next.js 15.5** App Router + Server Actions, Vercel 자동 배포
  (main 머지 → korea-english-solution.vercel.app)
- **DB: Turso(libSQL) 단일 백엔드.** DB 는 `connectedu` org 소속
  (`korea-english-solution-2026`). ⚠️ 토큰 발급 시 org 전환 필요.
- **AI: Gemini 단일.** `gemini-2.5-flash`(생성) + `text-embedding-004`/
  `gemini-embedding-001`(임베딩). Anthropic/Firebase 의존성 완전 제거됨.

## 2. 환경변수 (Vercel + .env.local)

| 변수 | 필수 | 설명 |
|---|---|---|
| `TURSO_DATABASE_URL` | ✅ | libsql://…connectedu.turso.io |
| `TURSO_AUTH_TOKEN` | ✅ | connectedu org 토큰 |
| `GEMINI_API_KEY` | ✅ | 모든 AI 생성·채점·임베딩 |
| `GEMINI_MODEL` | – | 기본 `gemini-2.5-flash`. 모델 교체 시만 |
| `AI_DEFAULT_MODEL` | – | 기본 `gemini-flash`. `claude-sonnet`도 내부적으로 Gemini 백킹 |

- ❌ 더 이상 불필요: `NEXT_PUBLIC_FIREBASE_*`, `ANTHROPIC_API_KEY`
- env 미설정 시 `lib/turso.ts` 는 dev 에서 `file:./local.db` 로 폴백,
  운영에선 쿼리 시점 명확한 에러(로드 시점 아님).

## 3. 인증 현황과 전환

- **현재: 단일 교사 데모 쿠키**(`kes_session=demo`, 비번 `demo1234`).
  단일 교사 개인 도구로는 충분.
- **여러 교사로 확장 시**: `app/actions/auth.ts` 의 `loginWithCredentials`
  를 실제 사용자 저장소로 교체(Turso `kes_teachers` 테이블 등) + 반/학생에
  teacher_id 소유권 추가. 현재 스키마는 단일 교사 가정.
- 학생 진입(`/s/[classCode]`)은 무인증(교실 감독 하). 신원은 교사 명부에서만
  해석되고 학생은 정답을 볼 수 없다(CAT·과제 모두 서버 채점).

## 4. DB 스키마·시드 (신규 환경 부트스트랩)

```bash
# 1) 스키마 적용 (멱등, kes_ 15테이블)
npm run db:schema            # node scripts/run-kes-schema.mjs

# 2) 콘텐츠 시드 (지문 663 + 어휘 9,291 + 카드 6,302)
npm run export:content       # 원천 → data/ 스냅샷 (원천 클론 필요)
npm run db:seed-content      # 스냅샷 → Turso, COUNT 검증

# 3) (선택) 초등 지문 추가 생성 → 검토
npm run gen:elementary       # AI 생성 → data/passages/generated_elementary.jsonl
# /content-review 에서 교사 승인/거부
```

- `kcsdb_*`(교육과정 성취기준 672 + 어휘 5,839 + 임베딩)는 별도 시드
  (`scripts/seed-kcsdb.mjs`) — 이미 적재됨.

## 5. 저작권 방화벽 (배포 전 필수 확인)

- 지문 풀은 **창작 지문 + AI 생성만**. 수능·모의고사 기출은 구조적으로 차단.
- CI 게이트: `npm run check:no-kichul` (지문 스냅샷에 문항구조·미허가
  license/source 0건 강제) + `npm run check:no-firebase`.
- AI 생성 지문은 `review_status='pending'` → `/content-review` 교사 검토 후
  워크시트에 노출. 거부분은 피커에서 자동 제외.

## 6. 운영 데이터 백업

- Turso 백업: `turso db shell <db> .dump > backup.sql` 정기 실행 권장.
  (학생 명부·진단·시도·과제가 모두 Turso 에 있음)
- 콘텐츠(지문·어휘)는 `data/` 스냅샷 + 재시드로 언제든 복원 가능.

## 7. 배포 파이프라인

- **CI (`.github/workflows/ci.yml`)**: typecheck + vitest(48) +
  no-firebase + no-kichul. main PR 필수 통과.
- **Vercel**: main 머지 → 자동 빌드·배포. 프리뷰는 PR 마다.
- ⚠️ 로컬 빌드 시 메모리 주의: node 프로세스 20+ 누적 시 webpack OOM.
  `taskkill /F /IM node.exe` 후 재빌드.

## 8. 알려진 한계 / 다음

- 숙달도 대시보드는 학생이 과제를 풀어 **시도 데이터가 쌓여야** 채워짐.
- 초등 저학년(<300L) 지문 62개 — 필요 시 `gen:elementary` 로 추가 생성.
- 서술형 문항 AI 채점은 관대 채점(핵심 의미 기준) — 고부담 평가엔 교사 확인.
- 문항 품질 게이트(criteria-engine)는 미도입 — 생성 문항은 "검토" 배너로 안내.
