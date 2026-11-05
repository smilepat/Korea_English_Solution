// build_gold_set_2.mjs — 2차 표본: 교과서급·저작권 청정 지문 30편 (중·고)
//
// 왜 2차인가
//   1차 표본(수능 기출 30편)에는 친교·사회적 글이 0편이었다. 축 A(목적 4갈래)의
//   낮은 κ 가 축의 한계인지 표본의 한계인지 갈리지 않았다. 그래서 편지·안내문이
//   실제로 들어 있는 표본으로 다시 잰다.
//
// 어디서
//   KES Turso `kes_passages` — license ∈ {original, kogl, generated} 만 있는 청정 풀.
//   teacheros 도 같은 풀을 같은 게이트로 읽는다(lib/passages.ts).
//
// 주의
//   genre 컬럼은 AI 가 붙인 라벨이라 층화 기준으로만 쓰고 표지 문자열을 우선한다.
//   ("Narrative" 로 적힌 편지, "Procedural" 로 적힌 설명문이 실제로 있다.)
//
// 실행 (KES 루트에서):  node experiments/M0-text-type/scripts/build_gold_set_2.mjs
// 출력:  data/gold-set-2.json (지문 본문 포함 · gitignore) · data/gold-set-2-ids.json (id 만 · 커밋)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";

const HERE = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const REPO = path.dirname(path.dirname(HERE));
const SEED = 20260913;

const env = Object.fromEntries(
  fs.readFileSync(path.join(REPO, ".env.local"), "utf8").split(/\r?\n/)
    .filter(l => l.includes("=")).map(l => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, "")]; }));
const db = createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN });

// 결정론적 RNG (mulberry32)
function rng(seed) { let a = seed >>> 0; return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rand = rng(SEED);
const sample = (arr, n) => { const a = [...arr].sort((x, y) => x.text_id < y.text_id ? -1 : 1); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };
const words = t => (t.match(/[A-Za-z][A-Za-z'-]*/g) || []).length;

const BASE = `FROM kes_passages WHERE grade_band IN ('middle','high') AND license IN ('original','kogl','generated')
  AND word_count BETWEEN 60 AND 400 AND text_body IS NOT NULL`;
const SOCIAL = `(text_body LIKE 'Dear %' OR text_body LIKE 'To whom it may concern%' OR text_body LIKE '%I am writing%' OR text_body LIKE '%Sincerely%' OR text_body LIKE '%Best regards%' OR text_body LIKE 'Hi %' OR text_body LIKE 'Hello %')`;
const NOTICE = `(text_body LIKE '%will be held%' OR text_body LIKE '%For more information%' OR text_body LIKE '%registration%' OR text_body LIKE '%Deadline%' OR text_body LIKE '%Admission%' OR text_body LIKE '%Please %')`;

const rows = async sql => (await db.execute(sql)).rows;
const pick = { social: [], notice: [], narrative: [], argumentative: [], expository: [] };
pick.social = await rows(`SELECT * ${BASE} AND ${SOCIAL}`);
const socialIds = new Set(pick.social.map(r => r.text_id));
pick.notice = (await rows(`SELECT * ${BASE} AND ${NOTICE}`)).filter(r => !socialIds.has(r.text_id));
const used = new Set([...socialIds, ...pick.notice.map(r => r.text_id)]);
for (const [k, g] of [["narrative", "Narrative"], ["argumentative", "Argumentative"], ["expository", "Expository"]])
  pick[k] = (await rows(`SELECT * ${BASE} AND genre='${g}'`)).filter(r => !used.has(r.text_id));

// 할당: 친교 8 · 안내 7 · 서사 5 · 주장 5 · 설명 5 = 30
const QUOTA = { social: 8, notice: 7, narrative: 5, argumentative: 5, expository: 5 };
const chosen = [];
for (const [k, n] of Object.entries(QUOTA)) {
  const pool = pick[k];
  if (pool.length < n) console.log(`  ! ${k}: 후보 ${pool.length}편뿐`);
  for (const r of sample(pool, Math.min(n, pool.length))) chosen.push({ stratum: k, r });
}
// 층 순서가 드러나지 않게 섞는다
for (let i = chosen.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [chosen[i], chosen[j]] = [chosen[j], chosen[i]]; }

const passages = chosen.map((c, i) => ({ gid: `H${String(i + 1).padStart(2, "0")}`, words: words(c.r.text_body), text: c.r.text_body.replace(/\s+/g, " ").trim() }));
const hidden = chosen.map((c, i) => ({ gid: `H${String(i + 1).padStart(2, "0")}`, kes_text_id: c.r.text_id, stratum: c.stratum, grade_band: c.r.grade_band, genre_ai: c.r.genre, lexile: c.r.lexile_score, license: c.r.license }));

const D = path.join(HERE, "data");
fs.writeFileSync(path.join(D, "gold-set-2.json"), JSON.stringify({ seed: SEED, n: passages.length, source: "KES kes_passages (license-clean)", passages }, null, 2));
fs.writeFileSync(path.join(D, "gold-set-2-ids.json"), JSON.stringify({ _note: "표본의 id 와 층만. 본문은 gold-set-2.json (gitignore) — 이 파일과 seed 로 재현한다.", seed: SEED, labels: hidden }, null, 2));
console.log(`[gold-set-2] ${passages.length}편 · seed=${SEED}`);
console.log("  층:", Object.fromEntries(Object.keys(QUOTA).map(k => [k, hidden.filter(h => h.stratum === k).length])));
console.log("  학년:", Object.fromEntries(["middle", "high"].map(g => [g, hidden.filter(h => h.grade_band === g).length])));
console.log("  낱말수:", passages.map(p => p.words).sort((a, b) => a - b).join(" "));
