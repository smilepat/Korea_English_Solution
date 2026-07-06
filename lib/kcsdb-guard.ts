// lib/kcsdb-guard.ts — 공개 검색 엔드포인트 비용/남용 방어 + 계측
import { turso } from "@/lib/turso"
import { headers } from "next/headers"

const WINDOW = 60          // 초
const AI_LIMIT = 25        // IP당 60초 내 S3/S4(AI) 허용 횟수
const GEN_LIMIT = 8        // IP당 60초 내 AI 문항 생성 허용 횟수(생성은 무거워 더 낮게)

export async function getClientIp(): Promise<string> {
  try {
    const h = await headers()
    return (h.get("x-forwarded-for") || h.get("x-real-ip") || "").split(",")[0].trim() || "unknown"
  } catch { return "unknown" }
}

// AI 모드(S3/S4) 레이트리밋: 증가시키고 한도 이내면 true. 초과 시 false → 호출측이 S2로 강등.
export async function checkAiRate(ip: string): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000)
  const win = now - (now % WINDOW)
  try {
    await turso.execute({
      sql: `INSERT INTO kcsdb_rate (ip, window_start, cnt) VALUES (?,?,1)
            ON CONFLICT(ip, window_start) DO UPDATE SET cnt = cnt + 1`,
      args: [ip, win],
    })
    const r = await turso.execute({ sql: `SELECT cnt FROM kcsdb_rate WHERE ip=? AND window_start=?`, args: [ip, win] })
    return Number(r.rows[0]?.cnt ?? 0) <= AI_LIMIT
  } catch { return true }   // 방어 로직 실패가 기능을 막지 않도록
}

// AI 문항 생성 레이트리밋: kcsdb_rate 재사용, 'gen:' 네임스페이스로 검색과 분리. 한도 이내면 true.
export async function checkGenRate(ip: string): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000)
  const win = now - (now % WINDOW)
  const key = "gen:" + ip
  try {
    await turso.execute({
      sql: `INSERT INTO kcsdb_rate (ip, window_start, cnt) VALUES (?,?,1)
            ON CONFLICT(ip, window_start) DO UPDATE SET cnt = cnt + 1`,
      args: [key, win],
    })
    const r = await turso.execute({ sql: `SELECT cnt FROM kcsdb_rate WHERE ip=? AND window_start=?`, args: [key, win] })
    return Number(r.rows[0]?.cnt ?? 0) <= GEN_LIMIT
  } catch { return true }
}

// 쿼리 임베딩 캐시(교사 검색 중복률 높음 → S3 비용 절감)
export function normQuery(q: string) { return q.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 200) }

export async function getCachedEmbedding(q: string): Promise<number[] | null> {
  try {
    const norm = normQuery(q)
    const r = await turso.execute({ sql: `SELECT embedding FROM kcsdb_query_cache WHERE query_norm=?`, args: [norm] })
    const e = r.rows[0]?.embedding as string | undefined
    if (e) {
      turso.execute({ sql: `UPDATE kcsdb_query_cache SET hit_count=hit_count+1 WHERE query_norm=?`, args: [norm] }).catch(() => {})
      return JSON.parse(e)
    }
  } catch {}
  return null
}
export async function setCachedEmbedding(q: string, emb: number[]) {
  try {
    await turso.execute({
      sql: `INSERT OR IGNORE INTO kcsdb_query_cache (query_norm, embedding) VALUES (?, ?)`,
      args: [normQuery(q), JSON.stringify(emb)],
    })
  } catch {}
}

// 검색 로그(0건 쿼리·폴백률 등 개선 계측용, 개인정보 없음)
export async function logSearch(mode: string, query: string, count: number, note: string, latencyMs: number) {
  try {
    await turso.execute({
      sql: `INSERT INTO kcsdb_search_log (mode, query, result_count, note, latency_ms) VALUES (?,?,?,?,?)`,
      args: [mode, query.slice(0, 200), count, (note || "").slice(0, 120), latencyMs],
    })
  } catch {}
}
