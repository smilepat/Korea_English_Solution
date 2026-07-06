import Link from "next/link"

export const metadata = {
  title: "성취기준 검색 사용 가이드",
  description: "대한민국 영어 교육과정 성취기준 검색 사용법 안내",
}

// 순수 서버 컴포넌트(정적 안내). 로그인 불필요 공개 가이드.
export default function CurriculumSearchGuide() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px", fontFamily: "system-ui, sans-serif", color: "#1e293b", lineHeight: 1.65 }}>
      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <Link href="/" style={{ fontSize: 13, color: "#4f46e5", textDecoration: "none" }}>← 홈으로</Link>
        <Link href="/curriculum-search" style={{ fontSize: 13, fontWeight: 700, color: "#fff", background: "#4f46e5", padding: "8px 16px", borderRadius: 8, textDecoration: "none" }}>🔎 검색 열기</Link>
      </div>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: "6px 0 4px" }}>성취기준 검색 사용 가이드</h1>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>
        2015·2022 개정 영어 교육과정 <b>성취기준 672개</b>와 성취수준·어휘·문항 생성까지, 이 페이지 하나로 사용법을 익힐 수 있습니다.
      </p>

      {/* 30초 요약 */}
      <Box bg="#eef2ff" border="#c7d2fe">
        <H2>⏱️ 30초 요약</H2>
        <ol style={{ margin: "6px 0 0", paddingLeft: 20 }}>
          <li>검색창에 <b>키워드</b>(예: 추론)나 <b>성취기준 코드</b>(예: [9영03-04])를 입력 → <b>검색</b>.</li>
          <li>무엇을 칠지 모르면 <b>‘자주 쓰는 검색어’</b> 드롭다운에서 고르세요.</li>
          <li>결과의 <b>상세 보기</b>로 성취수준·수준별 어휘를 확인하고, <b>‘✏️ 문항 만들기’</b>로 평가 문항을 자동 생성합니다.</li>
          <li><b>복사</b>·<b>인쇄/PDF</b> 버튼으로 결과를 바로 활용하세요.</li>
        </ol>
      </Box>

      {/* 4가지 검색 방법 */}
      <H2>1. 4가지 검색 방법</H2>
      <p style={{ color: "#475569", fontSize: 14 }}>화면 상단의 모드 버튼으로 선택합니다. 기본값 <b>‘자동’</b>은 입력을 보고 알아서 적절한 방법을 고릅니다.</p>
      <Table
        head={["모드", "언제 쓰나", "입력 예시"]}
        rows={[
          ["자동(기본)", "그냥 검색하고 싶을 때 — 코드·질문·키워드를 자동 감지", "추론 / [9영03-04] / 중3 읽기 성취기준"],
          ["코드·필터", "성취기준 코드를 정확히 알 때 + 조건 필터", "[9영03-04]"],
          ["전문검색", "본문에 들어간 키워드 부분일치", "세부 정보"],
          ["의미검색(AI)", "표현이 달라도 뜻이 비슷한 성취기준 찾기", "필자의 의도를 파악하는 능력"],
          ["자연어(AI)", "문장으로 질문하기", "중3 읽기에서 추론 관련 성취기준"],
        ]}
      />
      <Note>💡 <b>코드 형식</b>은 <code>[9영03-04]</code>처럼 대괄호로 감쌉니다. <b>키워드</b>는 2자 이상이 정확합니다. AI 모드(의미·자연어)는 사용량이 많으면 잠시 전문검색으로 자동 전환됩니다.</Note>

      {/* 자주 쓰는 검색어 */}
      <H2>2. 자주 쓰는 검색어 · 직접 입력</H2>
      <p style={{ color: "#475569", fontSize: 14 }}>
        검색창 위 <b>‘자주 쓰는 검색어’</b> 드롭다운에는 성취기준 본문에 실제로 자주 나오는 핵심어(주제·추론·목적·문화 등)가 들어 있습니다.
        괄호 안 숫자는 <b>그 어휘가 나오는 성취기준 수(전체 기준)</b>입니다. 원하는 어휘를 고르면 바로 검색됩니다.
        직접 치고 싶으면 <b>‘직접 입력’</b>을 선택하고 검색창에 입력하세요.
      </p>

      {/* 필터 */}
      <H2>3. 조건 필터</H2>
      <p style={{ color: "#475569", fontSize: 14 }}>자동·코드·전문검색 모드에서 아래 필터로 범위를 좁힐 수 있습니다.</p>
      <ul style={{ color: "#475569", fontSize: 14, margin: "4px 0 0", paddingLeft: 20 }}>
        <li><b>교육과정</b>: 2015 / 2022 개정</li>
        <li><b>학교급</b>: 초 / 중 / 고</li>
        <li><b>영역</b>: 듣기·말하기·읽기·쓰기(2015) / 이해·표현(2022)</li>
        <li><b>CEFR</b>: A1~C1 등급으로 필터</li>
      </ul>

      {/* 결과 읽기 */}
      <H2>4. 결과 읽기</H2>
      <ul style={{ color: "#475569", fontSize: 14, margin: "4px 0 0", paddingLeft: 20 }}>
        <li>검색어는 결과 본문에 <mark style={{ background: "#fef08a" }}>노란색</mark>으로 강조됩니다.</li>
        <li><b>정렬</b> 드롭다운으로 관련도·코드·학교급·CEFR 순으로 재정렬할 수 있습니다.</li>
        <li>각 결과에는 개정·학교급·영역·<b>CEFR 배지</b>가 붙습니다.</li>
      </ul>
      <Box bg="#f0fdf4" border="#bbf7d0">
        <b style={{ fontSize: 14 }}>✅ CEFR 배지의 출처 표기 — 정본과 추정을 구분합니다</b>
        <ul style={{ margin: "6px 0 0", paddingLeft: 20, fontSize: 13, color: "#166534" }}>
          <li><b>(표기 없음)</b> = 교육과정 원본 CEFR</li>
          <li><b>상속</b> = 동일 학년군/과목에서 물려받은 값(참고)</li>
          <li><b>추정</b> = 과목 성격 기반 추정 — <b>공인 아님</b></li>
        </ul>
      </Box>

      {/* 상세 보기 */}
      <H2>5. 상세 보기 — 성취수준 · 어휘 · 참고자료</H2>
      <p style={{ color: "#475569", fontSize: 14 }}>결과의 <b>‘성취수준 · 수준별 어휘 보기’</b>를 누르면 펼쳐집니다.</p>
      <ul style={{ color: "#475569", fontSize: 14, margin: "4px 0 0", paddingLeft: 20 }}>
        <li><b>성취수준</b> A~E / 상·중·하 기술</li>
        <li><b>수준별 기본어휘</b>: 같은 CEFR 등급의 기본어휘를 빈도순으로 제시 — <b>성취기준 내용과 직접 연계된 어휘는 아닙니다</b>(등급 매칭).</li>
        <li><b>관련 수능 유형</b>: 규칙 기반 <b>참고</b> — 공인 매핑이 아닙니다.</li>
        <li>하단에 <b>관련 의사소통 표현([별표2])</b>과 <b>언어 형식(문법, [별표4])</b>이 함께 표시됩니다.</li>
      </ul>

      {/* 문항 만들기 */}
      <H2>6. ✏️ 이 성취기준으로 문항 만들기</H2>
      <p style={{ color: "#475569", fontSize: 14 }}>
        각 결과의 <b>‘✏️ 문항 만들기’</b>를 열고 유형·난이도를 골라 <b>생성</b>하면, 그 성취기준을 평가하는 문항을 AI가 만들어 줍니다. 생성된 문항은 저장되어 다시 볼 수 있습니다.
      </p>
      <Table
        head={["유형", "설명"]}
        rows={[
          ["선택형 4지선다", "초·중·고 범용 독해·어휘 등"],
          ["선택형 5지선다(수능형)", "수능 스타일 지문·선택지"],
          ["서술형 단답", "발문 + 모범답안 + 채점 포인트"],
          ["서술형 논술·영작", "과제 + 작성 안내 + 채점 루브릭"],
        ]}
      />
      <Box bg="#fffbeb" border="#fde68a">
        <b style={{ fontSize: 14, color: "#b45309" }}>⚠️ AI 생성 문항입니다 — 반드시 교사 검수</b>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#92400e" }}>정답·선택지·채점기준에 오류가 있을 수 있습니다. 교육과정 고시 정본이 아니며, 수업·평가에 쓰기 전 반드시 확인하세요.</p>
      </Box>

      {/* 내보내기 */}
      <H2>7. 복사 · 인쇄 / PDF</H2>
      <p style={{ color: "#475569", fontSize: 14 }}>
        결과가 나오면 <b>📋 결과 복사</b>(한글·HWP 붙여넣기 지원)와 <b>🖨️ 인쇄 / PDF로 저장</b> 버튼이 나타납니다. 펼쳐 놓은 성취수준·어휘도 함께 포함됩니다.
      </p>

      {/* 정직성 */}
      <H2>8. 정본과 추정의 구분(중요)</H2>
      <p style={{ color: "#475569", fontSize: 14 }}>
        이 검색은 <b>교육부 고시 원문(정본)</b>과 시스템이 보완한 자료를 항상 구분해 표기합니다. <b>‘추정 · 상속 · AI 분류 · AI 생성 · 참고(공인 아님)’</b> 표기가 붙은 항목은 정본이 아니므로, 공식 문서에 인용할 때는 원문을 확인하세요.
      </p>

      <div style={{ marginTop: 28, textAlign: "center" }}>
        <Link href="/curriculum-search" style={{ fontSize: 15, fontWeight: 700, color: "#fff", background: "#4f46e5", padding: "12px 28px", borderRadius: 10, textDecoration: "none", display: "inline-block" }}>
          🔎 성취기준 검색 시작하기
        </Link>
      </div>
      <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 12, marginTop: 16 }}>
        출처: 대한민국 영어과 교육과정(교육부 고시) · Korea-curri-standards-db
      </p>
    </div>
  )
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: 18, fontWeight: 700, margin: "26px 0 8px", paddingBottom: 6, borderBottom: "1px solid #e2e8f0" }}>{children}</h2>
}
function Box({ children, bg, border }: { children: React.ReactNode; bg: string; border: string }) {
  return <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: 14, margin: "12px 0" }}>{children}</div>
}
function Note({ children }: { children: React.ReactNode }) {
  return <p style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#475569", margin: "10px 0" }}>{children}</p>
}
function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: "auto", margin: "10px 0" }}>
      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13, minWidth: 480 }}>
        <thead>
          <tr>{head.map((h, i) => <th key={i} style={{ textAlign: "left", background: "#f1f5f9", color: "#334155", padding: "8px 10px", border: "1px solid #e2e8f0", fontWeight: 700 }}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j} style={{ padding: "8px 10px", border: "1px solid #e2e8f0", color: j === 0 ? "#1e293b" : "#475569", fontWeight: j === 0 ? 600 : 400 }}>{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
