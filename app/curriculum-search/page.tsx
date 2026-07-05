"use client"
import { useState } from "react"
import { curriculumSearch, getStandardDetail, searchReference, type SearchMode, type StdResult, type StandardDetail, type ReferenceResult } from "@/app/actions/curriculum-search"

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
  const [details, setDetails] = useState<Record<string, StandardDetail>>({})
  const [reference, setReference] = useState<ReferenceResult>({ functions: [], grammar: [] })

  async function run() {
    setLoading(true); setNote(""); setSql(""); setReference({ functions: [], grammar: [] })
    try {
      const [r, ref] = await Promise.all([
        curriculumSearch(q, mode, {
          version: (ver || undefined) as any, band: (band || undefined) as any, domain: domain || undefined,
        }),
        searchReference(q, ver || undefined).catch(() => ({ functions: [], grammar: [] } as ReferenceResult)),
      ])
      setRows(r.results); setNote(r.note || ""); setSql(r.sql || ""); setUsedMode(r.mode)
      setReference(ref)
    } catch (e: any) { setNote("오류: " + (e?.message ?? "")) }
    setLoading(false)
  }
  async function toggleDetail(id: string) {
    if (details[id]) { const n = { ...details }; delete n[id]; setDetails(n); return }
    const d = await getStandardDetail(id); setDetails({ ...details, [id]: d })
  }

  const [copied, setCopied] = useState(false)
  function serialize(): { md: string; html: string } {
    const md: string[] = ["# 영어 교육과정 성취기준 검색 결과"]
    const ht: string[] = ["<h3>영어 교육과정 성취기준 검색 결과</h3>"]
    if (q) { md.push(`검색어: ${q} · 모드 ${usedMode} · ${rows.length}건`); ht.push(`<p>검색어: ${q} · ${rows.length}건</p>`) }
    for (const r of rows) {
      const meta = `${r.curriculum_version}·${r.grade_band}${r.domain_name_ko ? "·" + r.domain_name_ko : ""}${r.cefr_alignment ? "·CEFR " + r.cefr_alignment : ""}`
      md.push("", `## ${r.standard_id} (${meta})`, r.standard_text_ko)
      ht.push(`<p><b>${r.standard_id}</b> <small>(${meta})</small><br>${esc(r.standard_text_ko)}`)
      const d = details[r.standard_id]
      if (d?.levels?.length) { md.push("성취수준:"); ht.push("성취수준:<br>"); for (const l of d.levels) { const t = `${l.level}${l.cut_score ? " (" + l.cut_score + ")" : ""}: ${l.descriptor_ko}`; md.push("- " + t); ht.push("&nbsp;&nbsp;" + esc(t) + "<br>") } }
      if (d?.vocab?.length) { const vs = d.vocab.map((v) => v.word + (v.meaning_ko ? `(${v.meaning_ko})` : "")).join(", "); md.push(`연계 어휘(CEFR ${d.cefr}): ${vs}`); ht.push(`연계 어휘(CEFR ${d.cefr}): ${esc(vs)}`) }
      if (d?.csatTypes?.length) { const cs = d.csatTypes.map((c) => c.csat_type).join(", "); md.push(`관련 수능 유형(참고): ${cs}`); ht.push(`관련 수능 유형(참고): ${esc(cs)}`) }
      ht.push("</p>")
    }
    if (reference.functions.length) { md.push("", "## 관련 의사소통 표현"); ht.push("<p><b>관련 의사소통 표현</b><br>"); for (const f of reference.functions) { const t = `${f.description}: ${f.examples.join(" / ")}`; md.push("- " + t); ht.push(esc(t) + "<br>") } ht.push("</p>") }
    if (reference.grammar.length) { md.push("", "## 관련 언어 형식(문법)"); ht.push("<p><b>관련 언어 형식(문법)</b><br>"); for (const g of reference.grammar) { const t = `${g.item}: ${g.example}`; md.push("- " + t); ht.push(esc(t) + "<br>") } ht.push("</p>") }
    const src = "출처: 대한민국 영어과 교육과정(교육부 고시) · Korea-curri-standards-db"
    md.push("", src); ht.push(`<p><small>${src}</small></p>`)
    return { md: md.join("\n"), html: ht.join("\n") }
  }
  async function copyResults() {
    const { md, html } = serialize()
    try {
      if (navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([new (window as any).ClipboardItem({
          "text/plain": new Blob([md], { type: "text/plain" }),
          "text/html": new Blob([html], { type: "text/html" }),
        })])
      } else await navigator.clipboard.writeText(md)
      setCopied(true); setTimeout(() => setCopied(false), 1800)
    } catch { try { await navigator.clipboard.writeText(md); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch {} }
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px", fontFamily: "system-ui, sans-serif" }}>
      <style>{`@media print { .kcs-noprint { display: none !important; } a { color: #000; text-decoration: none; } @page { margin: 14mm; } }`}</style>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>영어 교육과정 성취기준 검색</h1>
      <p style={{ color: "#666", marginBottom: 16, fontSize: 14 }}>
        성취기준 672 · 성취수준(A~E/상·중·하) · 기본어휘 5,839 — 4가지 방법으로 검색 (2015·2022 개정)
      </p>

      <div className="kcs-noprint" style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {MODES.map((m) => (
          <button key={m.key} onClick={() => setMode(m.key)} title={m.hint}
            style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #ddd", cursor: "pointer",
              background: mode === m.key ? "#2563eb" : "#fff", color: mode === m.key ? "#fff" : "#333", fontSize: 13 }}>
            {m.label}
          </button>
        ))}
      </div>

      <div className="kcs-noprint" style={{ display: "flex", gap: 8 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder={mode === "nl2sql" ? "예: 중3 읽기에서 추론 관련 성취기준" : mode === "semantic" ? "예: 필자의 의도를 파악하는 능력" : "코드 [9영03-04] 또는 키워드 '추론'"}
          style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", fontSize: 14 }} />
        <button onClick={run} disabled={loading}
          style={{ padding: "10px 18px", borderRadius: 8, border: "none", background: "#2563eb", color: "#fff", cursor: "pointer" }}>
          {loading ? "검색중…" : "검색"}
        </button>
      </div>

      {(mode === "auto" || mode === "structured" || mode === "fulltext") && (
        <div className="kcs-noprint" style={{ display: "flex", gap: 8, marginTop: 10 }}>
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
      {rows.length > 0 && (
        <div className="kcs-noprint" style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={copyResults} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #ddd", background: copied ? "#dcfce7" : "#fff", cursor: "pointer", fontSize: 13 }}>
            {copied ? "✓ 복사됨" : "📋 결과 복사"}
          </button>
          <button onClick={() => window.print()} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: 13 }}>
            🖨️ 인쇄 / PDF로 저장
          </button>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>펼친 성취수준·어휘도 함께 포함됩니다</span>
        </div>
      )}
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
            <button onClick={() => toggleDetail(r.standard_id)} style={{ marginTop: 6, fontSize: 12, color: "#2563eb", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              {details[r.standard_id] ? "상세 접기 ▲" : "성취수준 · 연계 어휘 보기 ▼"}
            </button>
            {details[r.standard_id] && (
              <div style={{ marginTop: 8, fontSize: 13 }}>
                {/* 성취수준 A~E / 상·중·하 */}
                <div style={{ fontWeight: 600, color: "#334155", marginBottom: 2 }}>성취수준</div>
                {details[r.standard_id].levels.length === 0 ? <span style={{ color: "#999" }}>등록된 성취수준 없음</span> :
                  details[r.standard_id].levels.map((l, i) => (
                    <div key={i} style={{ padding: "3px 0", borderTop: "1px dashed #eee" }}>
                      <b style={{ color: "#2563eb" }}>{l.level}</b>{l.cut_score ? <span style={{ color: "#999" }}> ({l.cut_score})</span> : ""} {l.descriptor_ko}
                    </div>
                  ))}
                {/* 연계 어휘(같은 CEFR, 빈도순) */}
                {details[r.standard_id].vocab.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                      연계 어휘 <span style={{ color: "#94a3b8", fontWeight: 400 }}>
                        (CEFR {details[r.standard_id].cefr}{details[r.standard_id].cefrSource && details[r.standard_id].cefrSource !== "original" ? <span style={{ color: "#d97706" }}> ·{details[r.standard_id].cefrSource === "inherited" ? "동일 학년군 상속" : "추정"}</span> : ""} · 빈도순 {details[r.standard_id].vocab.length}개)
                      </span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {details[r.standard_id].vocab.map((v, i) => (
                        <span key={i} title={v.meaning_ko || ""} style={{ background: "#f0fdf4", color: "#166534", padding: "3px 8px", borderRadius: 6, fontSize: 12 }}>
                          {v.word}{v.meaning_ko ? <span style={{ color: "#4d7c5a" }}> · {v.meaning_ko}</span> : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {/* 관련 수능 유형(참고·공인 아님) */}
                {details[r.standard_id].csatTypes?.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                      관련 수능 유형 <span style={{ color: "#dc2626", fontWeight: 400, fontSize: 11 }}>(규칙 기반 참고 — 공인 매핑 아님)</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {details[r.standard_id].csatTypes.map((c, i) => (
                        <span key={i} style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af", padding: "2px 8px", borderRadius: 6, fontSize: 12 }}>
                          {c.csat_type}{c.confidence === "high" ? "" : " ?"}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {details[r.standard_id].vocab.length === 0 && !details[r.standard_id].cefr && (
                  <div style={{ marginTop: 8, color: "#94a3b8", fontSize: 12 }}>CEFR 미지정 성취기준이라 연계 어휘가 없습니다.</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {(reference.functions.length > 0 || reference.grammar.length > 0) && (
        <div style={{ marginTop: 20, padding: 14, borderRadius: 12, background: "#fffbeb", border: "1px solid #fde68a" }}>
          {reference.functions.length > 0 && (
            <>
              <div style={{ fontWeight: 700, color: "#92400e", marginBottom: 8 }}>📚 관련 의사소통 표현 <span style={{ fontWeight: 400, fontSize: 12, color: "#b45309" }}>(교육과정 [별표2] · 바로 쓰는 영어 표현)</span></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {reference.functions.map((f, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 13, color: "#78350f" }}><b>{f.description}</b> <span style={{ color: "#a16207", fontSize: 11 }}>· {f.category} · {f.version}</span></div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 3 }}>
                      {f.examples.map((e, j) => (<span key={j} style={{ background: "#fff", border: "1px solid #fde68a", color: "#713f12", padding: "2px 8px", borderRadius: 6, fontSize: 12 }}>{e}</span>))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {reference.grammar.length > 0 && (
            <div style={{ marginTop: reference.functions.length ? 12 : 0 }}>
              <div style={{ fontWeight: 700, color: "#92400e", marginBottom: 8 }}>🔤 관련 언어 형식(문법) <span style={{ fontWeight: 400, fontSize: 12, color: "#b45309" }}>(교육과정 [별표4] · AI 분류)</span></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {reference.grammar.map((g, i) => (
                  <div key={i} style={{ fontSize: 13, color: "#78350f" }}>
                    <b>{g.item}</b>{g.category ? <span style={{ color: "#a16207", fontSize: 11 }}> · {g.category}</span> : ""}
                    <span style={{ background: "#fff", border: "1px solid #fde68a", color: "#713f12", padding: "2px 8px", borderRadius: 6, fontSize: 12, marginLeft: 6 }}>{g.example}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
function esc(s: string) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") }
const selStyle: React.CSSProperties = { padding: "8px 10px", borderRadius: 8, border: "1px solid #ccc", fontSize: 13 }
const badge: React.CSSProperties = { background: "#f1f5f9", color: "#475569", padding: "2px 7px", borderRadius: 5, fontSize: 12 }
