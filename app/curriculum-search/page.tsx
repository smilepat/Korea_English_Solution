"use client"
import { useState, useMemo } from "react"
import { curriculumSearch, getStandardDetail, searchReference, type SearchMode, type StdResult, type StandardDetail, type ReferenceResult } from "@/app/actions/curriculum-search"

// 검색어 토큰을 결과 본문에 <mark> 강조(순수 표현 계층). query는 사용자 입력 → React 노드로 안전 렌더.
function highlight(text: string, query: string): React.ReactNode {
  const q = (query || "").trim()
  if (!q || !text) return text
  const toks = Array.from(new Set([q, ...q.split(/\s+/)])).filter((t) => t.length >= 2).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  if (!toks.length) return text
  const parts = text.split(new RegExp(`(${toks.join("|")})`, "gi"))
  return parts.map((p, i) => (i % 2 === 1 ? <mark key={i} style={{ background: "#fef08a", color: "inherit", padding: "0 1px", borderRadius: 2 }}>{p}</mark> : p))
}

const BAND_ORDER: Record<string, number> = { elementary: 0, middle: 1, high: 2 }
const CEFR_ORDER: Record<string, number> = { A1: 0, A2: 1, B1: 2, B2: 3, C1: 4, C2: 5 }
type SortKey = "relevance" | "code" | "band" | "cefr"
const SORTS: { key: SortKey; label: string }[] = [
  { key: "relevance", label: "관련도순" },
  { key: "code", label: "코드순" },
  { key: "band", label: "학교급순" },
  { key: "cefr", label: "CEFR순" },
]
// 자주 쓰는 검색어: 성취기준 본문 실측 빈도 기반(로그가 아닌 코퍼스 등장 횟수). 괄호=매칭 성취기준 수.
const FREQ_GROUPS: { group: string; terms: { term: string; n: number }[] }[] = [
  { group: "읽기·이해", terms: [
    { term: "주제", n: 260 }, { term: "요지", n: 31 }, { term: "추론", n: 58 }, { term: "세부 정보", n: 57 },
    { term: "목적", n: 59 }, { term: "의도", n: 35 }, { term: "심정", n: 30 }, { term: "함축", n: 21 }, { term: "요약", n: 31 },
  ] },
  { group: "표현·소통", terms: [
    { term: "의견", n: 48 }, { term: "발표", n: 11 }, { term: "토론", n: 21 }, { term: "비교", n: 33 }, { term: "감정", n: 28 },
  ] },
  { group: "문화", terms: [{ term: "문화", n: 56 }] },
]

const MODES: { key: SearchMode; label: string; hint: string }[] = [
  { key: "auto", label: "자동", hint: "질문 유형 자동 감지" },
  { key: "structured", label: "코드·필터", hint: "[9영03-04] / 조건" },
  { key: "fulltext", label: "전문검색", hint: "키워드 부분일치" },
  { key: "semantic", label: "의미검색", hint: "뜻으로 찾기(AI)" },
  { key: "nl2sql", label: "자연어", hint: "문장으로 질문(AI)" },
]
const BANDS = [["", "학교급"], ["elementary", "초"], ["middle", "중"], ["high", "고"]]
const DOMAINS = ["", "듣기", "말하기", "읽기", "쓰기", "이해", "표현"]
const CEFRS = ["", "A1", "A2", "B1", "B2", "C1"]

export default function CurriculumSearchPage() {
  const [q, setQ] = useState("")
  const [mode, setMode] = useState<SearchMode>("auto")
  const [ver, setVer] = useState("")
  const [band, setBand] = useState("")
  const [domain, setDomain] = useState("")
  const [cefr, setCefr] = useState("")
  const [rows, setRows] = useState<StdResult[]>([])
  const [note, setNote] = useState("")
  const [sql, setSql] = useState("")
  const [usedMode, setUsedMode] = useState("")
  const [loading, setLoading] = useState(false)
  const [details, setDetails] = useState<Record<string, StandardDetail>>({})
  const [reference, setReference] = useState<ReferenceResult>({ functions: [], grammar: [] })
  const [sortKey, setSortKey] = useState<SortKey>("relevance")
  const [preset, setPreset] = useState("")  // 자주 쓰는 검색어 드롭다운("" = 직접 입력)

  function pickPreset(term: string) {
    if (!term) { setPreset(""); return }        // "직접 입력" 선택 → 입력창 자유 입력
    setQ(term); setPreset("")                    // 드롭다운은 다시 "직접 입력"으로 복귀
    run({ q: term })                             // 상태 비동기 우회 위해 override로 즉시 검색
  }

  const sortedRows = useMemo(() => {
    if (sortKey === "relevance") return rows
    const a = [...rows]
    if (sortKey === "code") a.sort((x, y) => x.standard_id.localeCompare(y.standard_id, "ko"))
    else if (sortKey === "band") a.sort((x, y) => (BAND_ORDER[x.grade_band] ?? 9) - (BAND_ORDER[y.grade_band] ?? 9) || x.standard_id.localeCompare(y.standard_id, "ko"))
    else if (sortKey === "cefr") a.sort((x, y) => (CEFR_ORDER[x.cefr_alignment || ""] ?? 9) - (CEFR_ORDER[y.cefr_alignment || ""] ?? 9) || x.standard_id.localeCompare(y.standard_id, "ko"))
    return a
  }, [rows, sortKey])

  async function run(over?: { q?: string; mode?: SearchMode; ver?: string; band?: string; domain?: string; cefr?: string }) {
    // 상태 업데이트는 비동기라 재검색/자주쓰는검색어에서 넘긴 override를 즉시 반영한다.
    const query = over?.q ?? q
    const m = over?.mode ?? mode
    const v = over?.ver ?? ver, b = over?.band ?? band, dm = over?.domain ?? domain, ce = over?.cefr ?? cefr
    setLoading(true); setNote(""); setSql(""); setReference({ functions: [], grammar: [] })
    try {
      const [r, ref] = await Promise.all([
        curriculumSearch(query, m, {
          version: (v || undefined) as any, band: (b || undefined) as any, domain: dm || undefined, cefr: ce || undefined,
        }),
        searchReference(query, v || undefined).catch(() => ({ functions: [], grammar: [] } as ReferenceResult)),
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
    if (q) { md.push(`검색어: ${q} · 모드 ${usedMode} · ${sortedRows.length}건`); ht.push(`<p>검색어: ${q} · ${sortedRows.length}건</p>`) }
    for (const r of sortedRows) {
      const meta = `${r.curriculum_version}·${r.grade_band}${r.domain_name_ko ? "·" + r.domain_name_ko : ""}${r.cefr_alignment ? "·CEFR " + r.cefr_alignment : ""}`
      md.push("", `## ${r.standard_id} (${meta})`, r.standard_text_ko)
      ht.push(`<p><b>${r.standard_id}</b> <small>(${meta})</small><br>${esc(r.standard_text_ko)}`)
      const d = details[r.standard_id]
      if (d?.levels?.length) { md.push("성취수준:"); ht.push("성취수준:<br>"); for (const l of d.levels) { const t = `${l.level}${l.cut_score ? " (" + l.cut_score + ")" : ""}: ${l.descriptor_ko}`; md.push("- " + t); ht.push("&nbsp;&nbsp;" + esc(t) + "<br>") } }
      if (d?.vocab?.length) { const vs = d.vocab.map((v) => v.word + (v.meaning_ko ? `(${v.meaning_ko})` : "")).join(", "); md.push(`수준별 기본어휘(CEFR ${d.cefr} 등급·내용 연계 아님): ${vs}`); ht.push(`수준별 기본어휘(CEFR ${d.cefr} 등급·내용 연계 아님): ${esc(vs)}`) }
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
      <style>{`
        @media print { .kcs-noprint { display: none !important; } a { color: #000; text-decoration: none; } @page { margin: 14mm; } }
        .kcs-searchrow { display: flex; gap: 8px; flex-wrap: wrap; }
        .kcs-searchrow input { flex: 1 1 200px; min-width: 0; }
        .kcs-filterrow { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
        @media (max-width: 520px) {
          .kcs-searchrow button { flex: 1 1 100%; }
          .kcs-filterrow select { flex: 1 1 30%; }
        }
      `}</style>
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

      <div className="kcs-noprint" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
        <label style={{ fontSize: 12, color: "#64748b" }}>자주 쓰는 검색어</label>
        <select value={preset} onChange={(e) => pickPreset(e.target.value)} style={{ ...selStyle, fontSize: 13, maxWidth: "100%" }} aria-label="자주 쓰는 검색어 선택">
          <option value="">직접 입력</option>
          {FREQ_GROUPS.map((g) => (
            <optgroup key={g.group} label={g.group}>
              {g.terms.map((t) => <option key={t.term} value={t.term}>{t.term} ({t.n})</option>)}
            </optgroup>
          ))}
        </select>
        <span style={{ fontSize: 11, color: "#94a3b8" }}>괄호=전체 성취기준 중 해당 어휘 포함 수(필터 무관)</span>
      </div>

      <div className="kcs-noprint kcs-searchrow">
        <input value={q} onChange={(e) => { setQ(e.target.value); if (preset) setPreset("") }} onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder={mode === "nl2sql" ? "예: 중3 읽기에서 추론 관련 성취기준" : mode === "semantic" ? "예: 필자의 의도를 파악하는 능력" : "코드 [9영03-04] 또는 키워드 '추론'"}
          style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", fontSize: 14 }} />
        <button type="button" onClick={() => run()} disabled={loading}
          style={{ padding: "10px 18px", borderRadius: 8, border: "none", background: "#2563eb", color: "#fff", cursor: "pointer", minHeight: 40 }}>
          {loading ? "검색중…" : "검색"}
        </button>
      </div>

      {(mode === "auto" || mode === "structured" || mode === "fulltext") && (
        <div className="kcs-noprint kcs-filterrow">
          <select value={ver} onChange={(e) => setVer(e.target.value)} style={selStyle}>
            <option value="">교육과정</option><option value="2015">2015</option><option value="2022">2022</option>
          </select>
          <select value={band} onChange={(e) => setBand(e.target.value)} style={selStyle}>
            {BANDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={domain} onChange={(e) => setDomain(e.target.value)} style={selStyle}>
            {DOMAINS.map((d) => <option key={d} value={d}>{d || "영역"}</option>)}
          </select>
          <select value={cefr} onChange={(e) => setCefr(e.target.value)} style={selStyle} aria-label="CEFR 등급 필터" title="CEFR 등급으로 필터(원본·상속·추정 포함)">
            {CEFRS.map((c) => <option key={c} value={c}>{c || "CEFR"}</option>)}
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
          <label style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
            정렬
            <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} style={{ ...selStyle, padding: "6px 8px", fontSize: 12 }} aria-label="결과 정렬 기준">
              {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </label>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>펼친 성취수준·어휘도 함께 포함됩니다</span>
        </div>
      )}
      {note && <p style={{ color: "#b45309", fontSize: 13, marginTop: 8 }}>{note}</p>}
      {sql && <pre style={{ background: "#f6f6f6", padding: 8, borderRadius: 6, fontSize: 11, overflowX: "auto", marginTop: 8 }}>{sql}</pre>}

      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {sortedRows.map((r) => (
          <div key={r.standard_id} style={{ border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <code style={{ background: "#eef2ff", color: "#3730a3", padding: "2px 6px", borderRadius: 5, fontSize: 13 }}>{highlight(r.standard_id, q)}</code>
              <span style={badge}>{r.curriculum_version}</span>
              <span style={badge}>{r.grade_band}</span>
              {r.domain_name_ko && <span style={badge}>{r.domain_name_ko}</span>}
              {r.cefr_alignment && <span style={{ ...badge, background: "#ecfeff", color: "#0e7490" }} title={r.cefr_source === "original" ? "교육과정 원본 CEFR" : r.cefr_source === "inherited" ? "동일 학년군/과목 상속(참고)" : r.cefr_source === "estimated" ? "과목 성격 기반 추정 — 공인 아님" : ""}>
                CEFR {r.cefr_alignment}
                {r.cefr_source && r.cefr_source !== "original" && <span style={{ marginLeft: 4, fontSize: 10, color: "#b45309" }}>{r.cefr_source === "inherited" ? "상속" : "추정"}</span>}
              </span>}
              {typeof r.score === "number" && <span style={{ color: "#94a3b8", fontSize: 11 }}>근접 {r.score.toFixed(3)}</span>}
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 14 }}>{highlight(r.standard_text_ko, q)}</p>
            <button onClick={() => toggleDetail(r.standard_id)} style={{ marginTop: 6, fontSize: 12, color: "#2563eb", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              {details[r.standard_id] ? "상세 접기 ▲" : "성취수준 · 수준별 어휘 보기 ▼"}
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
                {/* 수준별 기본어휘: 성취기준 내용 연계가 아니라 같은 CEFR 등급의 기본어휘를 빈도순으로 제시 */}
                {details[r.standard_id].vocab.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                      수준별 기본어휘 <span style={{ color: "#94a3b8", fontWeight: 400 }} title="성취기준 내용과 직접 연계된 어휘가 아니라, 같은 CEFR 등급의 기본어휘를 빈도순으로 제시합니다.">
                        (CEFR {details[r.standard_id].cefr}{details[r.standard_id].cefrSource && details[r.standard_id].cefrSource !== "original" ? <span style={{ color: "#d97706" }}> ·{details[r.standard_id].cefrSource === "inherited" ? "동일 학년군 상속" : "추정"}</span> : ""} 등급 · 빈도순 {details[r.standard_id].vocab.length}개 · 내용 연계 아님)
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

      {!loading && q && usedMode && rows.length === 0 && (
        <div className="kcs-noprint" style={{ marginTop: 16, padding: 16, borderRadius: 12, background: "#f8fafc", border: "1px dashed #cbd5e1", textAlign: "center" }}>
          <div style={{ fontSize: 14, color: "#475569", marginBottom: 10 }}>‘{q}’에 대한 성취기준을 찾지 못했습니다.</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {mode !== "semantic" && <button type="button" onClick={() => { setMode("semantic"); run({ mode: "semantic" }) }} style={emptyBtn}>🔎 의미로 다시 검색</button>}
            {mode !== "nl2sql" && <button type="button" onClick={() => { setMode("nl2sql"); run({ mode: "nl2sql" }) }} style={emptyBtn}>💬 자연어로 다시 검색</button>}
            {(ver || band || domain || cefr) && <button type="button" onClick={() => { setVer(""); setBand(""); setDomain(""); setCefr(""); run({ ver: "", band: "", domain: "", cefr: "" }) }} style={emptyBtn}>🔄 필터 해제 후 재검색</button>}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 10 }}>코드는 <code>[9영03-04]</code> 형식, 키워드는 2자 이상이 정확합니다.</div>
        </div>
      )}

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
              <div style={{ fontWeight: 700, color: "#92400e", marginBottom: 8 }}>🔤 관련 언어 형식(문법) <span style={{ fontWeight: 400, fontSize: 12, color: "#b45309" }}>(예문 = 교육과정 [별표4] 정본 · 항목명 = 검수/분류 라벨)</span></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {reference.grammar.map((g, i) => (
                  <div key={i} style={{ fontSize: 13, color: "#78350f" }}>
                    <b>{g.item}</b>
                    {g.labelSource === "verified"
                      ? <span title="사람 전수 검수 완료(항목명은 표준 문법 용어 해석)" style={{ color: "#15803d", fontSize: 10, marginLeft: 5, border: "1px solid #86efac", borderRadius: 4, padding: "1px 4px" }}>검수</span>
                      : <span title="AI 분류(미검수) — 참고용" style={{ color: "#b45309", fontSize: 10, marginLeft: 5, border: "1px solid #fdba74", borderRadius: 4, padding: "1px 4px" }}>AI 분류</span>}
                    {g.category ? <span style={{ color: "#a16207", fontSize: 11 }}> · {g.category}</span> : ""}
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
const emptyBtn: React.CSSProperties = { padding: "8px 14px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer", fontSize: 13, minHeight: 40 }
