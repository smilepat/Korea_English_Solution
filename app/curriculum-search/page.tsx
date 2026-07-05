"use client"
import { useState } from "react"
import { curriculumSearch, getLevels, type SearchMode, type StdResult } from "@/app/actions/curriculum-search"

const MODES: { key: SearchMode; label: string; hint: string }[] = [
  { key: "auto", label: "자동", hint: "질문 유형 자동 감지" },
  { key: "structured", label: "코드·필터", hint: "[9영03-04] / 조건" },
  { key: "fulltext", label: "전문검색", hint: "키워드 부분일치" },
  { key: "semantic", label: "의미검색", hint: "뜻으로 찾기(AI)" },
  { key: "nl2sql", label: "자연어", hint: "문장으로 질문(AI)" },
]
const BANDS = [["", "학교급"], ["elementary", "초"], ["middle", "중"], ["high", "고"]]
const DOMAINS = ["", "듣기", "말하기", "읽기", "쓰기", "이해", "표현"]

export default function CurriculumSearchPage() {
  const [q, setQ] = useState("")
  const [mode, setMode] = useState<SearchMode>("auto")
  const [ver, setVer] = useState("")
  const [band, setBand] = useState("")
  const [domain, setDomain] = useState("")
  const [rows, setRows] = useState<StdResult[]>([])
  const [note, setNote] = useState("")
  const [sql, setSql] = useState("")
  const [usedMode, setUsedMode] = useState("")
  const [loading, setLoading] = useState(false)
  const [levels, setLevels] = useState<Record<string, any[]>>({})

  async function run() {
    setLoading(true); setNote(""); setSql("")
    try {
      const r = await curriculumSearch(q, mode, {
        version: (ver || undefined) as any, band: (band || undefined) as any, domain: domain || undefined,
      })
      setRows(r.results); setNote(r.note || ""); setSql(r.sql || ""); setUsedMode(r.mode)
    } catch (e: any) { setNote("오류: " + (e?.message ?? "")) }
    setLoading(false)
  }
  async function toggleLevels(id: string) {
    if (levels[id]) { const n = { ...levels }; delete n[id]; setLevels(n); return }
    const lv = await getLevels(id); setLevels({ ...levels, [id]: lv })
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>영어 교육과정 성취기준 검색</h1>
      <p style={{ color: "#666", marginBottom: 16, fontSize: 14 }}>
        성취기준 672 · 성취수준(A~E/상·중·하) · 기본어휘 5,839 — 4가지 방법으로 검색 (2015·2022 개정)
      </p>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {MODES.map((m) => (
          <button key={m.key} onClick={() => setMode(m.key)} title={m.hint}
            style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #ddd", cursor: "pointer",
              background: mode === m.key ? "#2563eb" : "#fff", color: mode === m.key ? "#fff" : "#333", fontSize: 13 }}>
            {m.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder={mode === "nl2sql" ? "예: 중3 읽기에서 추론 관련 성취기준" : mode === "semantic" ? "예: 필자의 의도를 파악하는 능력" : "코드 [9영03-04] 또는 키워드 '추론'"}
          style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", fontSize: 14 }} />
        <button onClick={run} disabled={loading}
          style={{ padding: "10px 18px", borderRadius: 8, border: "none", background: "#2563eb", color: "#fff", cursor: "pointer" }}>
          {loading ? "검색중…" : "검색"}
        </button>
      </div>

      {(mode === "auto" || mode === "structured" || mode === "fulltext") && (
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <select value={ver} onChange={(e) => setVer(e.target.value)} style={selStyle}>
            <option value="">교육과정</option><option value="2015">2015</option><option value="2022">2022</option>
          </select>
          <select value={band} onChange={(e) => setBand(e.target.value)} style={selStyle}>
            {BANDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={domain} onChange={(e) => setDomain(e.target.value)} style={selStyle}>
            {DOMAINS.map((d) => <option key={d} value={d}>{d || "영역"}</option>)}
          </select>
        </div>
      )}

      {usedMode && <p style={{ color: "#888", fontSize: 12, marginTop: 12 }}>모드: {usedMode} · {rows.length}건</p>}
      {note && <p style={{ color: "#b45309", fontSize: 13, marginTop: 8 }}>{note}</p>}
      {sql && <pre style={{ background: "#f6f6f6", padding: 8, borderRadius: 6, fontSize: 11, overflowX: "auto", marginTop: 8 }}>{sql}</pre>}

      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map((r) => (
          <div key={r.standard_id} style={{ border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <code style={{ background: "#eef2ff", color: "#3730a3", padding: "2px 6px", borderRadius: 5, fontSize: 13 }}>{r.standard_id}</code>
              <span style={badge}>{r.curriculum_version}</span>
              <span style={badge}>{r.grade_band}</span>
              {r.domain_name_ko && <span style={badge}>{r.domain_name_ko}</span>}
              {r.cefr_alignment && <span style={{ ...badge, background: "#ecfeff", color: "#0e7490" }}>{r.cefr_alignment}</span>}
              {typeof r.score === "number" && <span style={{ color: "#94a3b8", fontSize: 11 }}>근접 {r.score.toFixed(3)}</span>}
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 14 }}>{r.standard_text_ko}</p>
            <button onClick={() => toggleLevels(r.standard_id)} style={{ marginTop: 6, fontSize: 12, color: "#2563eb", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              {levels[r.standard_id] ? "성취수준 접기 ▲" : "성취수준 보기 ▼"}
            </button>
            {levels[r.standard_id] && (
              <div style={{ marginTop: 6, fontSize: 13 }}>
                {levels[r.standard_id].length === 0 ? <span style={{ color: "#999" }}>등록된 성취수준 없음</span> :
                  levels[r.standard_id].map((l: any, i: number) => (
                    <div key={i} style={{ padding: "3px 0", borderTop: "1px dashed #eee" }}>
                      <b style={{ color: "#2563eb" }}>{l.level}</b> {l.cut_score ? <span style={{ color: "#999" }}>({l.cut_score})</span> : ""} {l.descriptor_ko}
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
const selStyle: React.CSSProperties = { padding: "8px 10px", borderRadius: 8, border: "1px solid #ccc", fontSize: 13 }
const badge: React.CSSProperties = { background: "#f1f5f9", color: "#475569", padding: "2px 7px", borderRadius: 5, fontSize: 12 }
