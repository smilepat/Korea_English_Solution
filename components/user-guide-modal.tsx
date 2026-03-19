"use client"

import { useState } from "react"
import { X, BookOpen, Sparkles, MessageCircle, ClipboardList, Users, BarChart2, GraduationCap, Search, FileText, Database, Download, ArrowRight } from "lucide-react"

export default function UserGuideModal({ onClose }: { onClose: () => void }) {
  const [activeSection, setActiveSection] = useState("overview")

  const sections = [
    { id: "overview", label: "개요" },
    { id: "features", label: "주요 기능" },
    { id: "ai", label: "AI 기능" },
    { id: "howto", label: "사용법" },
    { id: "tech", label: "기술 스택" },
  ]

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">사용자 가이드</h2>
              <p className="text-white/70 text-xs">대한민국 영어교육 개선 시스템 v5.0</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="border-b px-6 flex gap-1 overflow-x-auto">
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveSection(s.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeSection === s.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* 콘텐츠 */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {activeSection === "overview" && <OverviewSection />}
          {activeSection === "features" && <FeaturesSection />}
          {activeSection === "ai" && <AISection />}
          {activeSection === "howto" && <HowToSection />}
          {activeSection === "tech" && <TechSection />}
        </div>
      </div>
    </div>
  )
}

function OverviewSection() {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">앱 개요</h3>
        <p className="text-slate-600 text-sm leading-relaxed">
          <strong>대한민국 영어교육 개선 시스템</strong>은 대한민국 영어교육의 구조적 문제를 데이터로 진단하고,
          AI 기술을 활용하여 교사와 학생에게 실질적인 해결 도구를 제공하는 플랫폼입니다.
        </p>
      </div>

      <div className="bg-blue-50 rounded-xl p-4 space-y-2">
        <h4 className="font-semibold text-blue-800 text-sm">핵심 문제 인식</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>&#8226; 한국 학생의 영어 읽기 노출량은 미국 학생의 <strong>1/44 수준</strong></li>
          <li>&#8226; 누적 영어 수업 시간 980시간 — CEFR B1 달성에 <strong>220~1,020시간 부족</strong></li>
          <li>&#8226; 수능 요구 Lexile 1,000~1,200L vs 다수 학생 <strong>800L 이하</strong></li>
          <li>&#8226; 말하기/쓰기 평가 비중 약 15%로 <strong>생산적 기능 평가 부족</strong></li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-emerald-50 rounded-lg p-3">
          <h5 className="font-semibold text-emerald-800 text-sm mb-1">교사를 위한</h5>
          <p className="text-xs text-emerald-700">AI 수업 설계, 문항 생성, 루브릭 자동 생성, 학생 추적</p>
        </div>
        <div className="bg-violet-50 rounded-lg p-3">
          <h5 className="font-semibold text-violet-800 text-sm mb-1">학생을 위한</h5>
          <p className="text-xs text-violet-700">Lexile 진단, 다독 프로그램, AI 영어 대화 연습</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-3">
          <h5 className="font-semibold text-amber-800 text-sm mb-1">데이터 기반</h5>
          <p className="text-xs text-amber-700">교육과정 분석, CEFR 비교, 읽기량 추적, 난이도 예측</p>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-slate-700 text-sm mb-2">주요 수치</h4>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "페이지", value: "13개" },
            { label: "AI 기능", value: "12개" },
            { label: "DB 테이블", value: "12개" },
            { label: "AI 모델", value: "2종" },
          ].map((item) => (
            <div key={item.label} className="text-center bg-slate-50 rounded-lg p-2">
              <div className="text-lg font-bold text-slate-800">{item.value}</div>
              <div className="text-xs text-slate-500">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FeaturesSection() {
  const features = [
    {
      icon: <BarChart2 className="h-4 w-4" />,
      name: "영어교육 현황 대시보드",
      path: "/dashboard",
      color: "purple",
      desc: "한국-미국 Lexile 격차, 수업시간 분석, 교육과정-CEFR 비교를 시각화합니다.",
    },
    {
      icon: <Sparkles className="h-4 w-4" />,
      name: "AI 교육과정 분석",
      path: "/dashboard",
      color: "purple",
      desc: "2022 개정 교육과정 성취기준에 대해 AI에게 자유롭게 질문할 수 있습니다.",
    },
    {
      icon: <GraduationCap className="h-4 w-4" />,
      name: "AI 수업 설계",
      path: "/lesson-planner",
      color: "teal",
      desc: "학년, 기능, 주제를 입력하면 AI가 1~2차시 수업 지도안을 자동 생성합니다.",
    },
    {
      icon: <FileText className="h-4 w-4" />,
      name: "수능 문항 생성 AI",
      path: "/csat-question-generation",
      color: "blue",
      desc: "7가지 유형 × 3단계 난이도로 수능 스타일 문항을 AI가 생성합니다. 구조 분석 및 난이도 예측도 지원합니다.",
    },
    {
      icon: <Search className="h-4 w-4" />,
      name: "Lexile 독해 수준 진단",
      path: "/lexile-test",
      color: "green",
      desc: "BR~1200L 13단계 적응형 테스트로 학생의 영어 독해 수준을 측정합니다.",
    },
    {
      icon: <BookOpen className="h-4 w-4" />,
      name: "다독 프로그램",
      path: "/reading-program",
      color: "emerald",
      desc: "Lexile 수준에 맞는 읽기 자료를 AI가 생성하고, 이해도 퀴즈와 읽기량을 추적합니다.",
    },
    {
      icon: <MessageCircle className="h-4 w-4" />,
      name: "AI 영어 대화 연습",
      path: "/speaking-practice",
      color: "violet",
      desc: "CEFR 수준별 10가지 시나리오로 AI와 영어 대화를 연습하고 평가받습니다.",
    },
    {
      icon: <ClipboardList className="h-4 w-4" />,
      name: "CEFR 루브릭 생성",
      path: "/assessment-tools",
      color: "amber",
      desc: "학년/기능/주제를 입력하면 CEFR Can-Do 기반 수행평가 루브릭을 AI가 생성합니다.",
    },
    {
      icon: <Users className="h-4 w-4" />,
      name: "학생 학습 추적",
      path: "/student-tracker",
      color: "cyan",
      desc: "학생별 Lexile/CEFR 수준을 추적하고 AI가 맞춤 학습 처방을 생성합니다.",
    },
    {
      icon: <Database className="h-4 w-4" />,
      name: "지식 DB 관리",
      path: "/admin/knowledge",
      color: "slate",
      desc: "교육과정 문서, 연구자료, 정책 등을 등록하면 AI가 자동 요약하고 RAG 검색에 활용합니다.",
    },
    {
      icon: <BookOpen className="h-4 w-4" />,
      name: "학술 어휘 목록",
      path: "/vocabulary-list",
      color: "orange",
      desc: "AWL 570단어와 수능 핵심 콜로케이션을 학과 분야별로 정리한 목록입니다.",
    },
    {
      icon: <BarChart2 className="h-4 w-4" />,
      name: "교육과정-CEFR 비교",
      path: "/standards-comparison",
      color: "indigo",
      desc: "한국 교육과정과 CEFR 수준을 학년별로 비교하고 격차 요인을 분석합니다.",
    },
  ]

  return (
    <div className="space-y-3">
      <h3 className="text-xl font-bold text-slate-800">전체 기능 (13개 페이지)</h3>
      <div className="space-y-2">
        {features.map((f) => (
          <div key={f.name} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
            <div className="bg-slate-100 p-2 rounded-lg shrink-0">{f.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm text-slate-800">{f.name}</h4>
                <code className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{f.path}</code>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AISection() {
  return (
    <div className="space-y-5">
      <h3 className="text-xl font-bold text-slate-800">AI 기능 상세</h3>

      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4">
        <h4 className="font-semibold text-slate-800 text-sm mb-3">AI 모델 2종 지원</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Claude Sonnet</span>
            </div>
            <p className="text-xs text-slate-600">교육과정 해석, 수능 문항 생성/분석, 난이도 예측, 지식 문서 처리</p>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Gemini Flash</span>
            </div>
            <p className="text-xs text-slate-600">읽기 자료 생성, 대화 연습, 루브릭 생성, 임베딩 벡터 검색</p>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2">각 AI 기능 페이지에서 모델을 자유롭게 전환할 수 있습니다.</p>
      </div>

      <div>
        <h4 className="font-semibold text-slate-700 text-sm mb-2">AI 기능 12개</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          {[
            { name: "교육과정 Q&A (RAG)", model: "Claude" },
            { name: "수업 지도안 생성", model: "Claude/Gemini" },
            { name: "수능 문항 생성 (7유형)", model: "Claude/Gemini" },
            { name: "수능 문항 구조 분석", model: "Claude" },
            { name: "난이도 예측", model: "Claude" },
            { name: "Lexile 교수전략 생성", model: "Claude" },
            { name: "읽기 자료 AI 생성", model: "Gemini" },
            { name: "AI 영어 대화 연습", model: "Gemini" },
            { name: "대화 평가 성적표", model: "Gemini" },
            { name: "CEFR 루브릭 생성", model: "Gemini" },
            { name: "학생 AI 학습 처방", model: "Gemini" },
            { name: "학급 AI 리포트", model: "Gemini" },
          ].map((f) => (
            <div key={f.name} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
              <span className="text-slate-700">{f.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                f.model === "Claude" ? "bg-purple-100 text-purple-700" :
                f.model === "Gemini" ? "bg-blue-100 text-blue-700" :
                "bg-gray-100 text-gray-700"
              }`}>{f.model}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-emerald-50 rounded-xl p-4">
        <h4 className="font-semibold text-emerald-800 text-sm mb-2">벡터 검색 (RAG)</h4>
        <p className="text-xs text-emerald-700">
          지식 DB에 등록된 문서는 Gemini Embedding API로 벡터 임베딩이 자동 생성됩니다.
          교육과정 Q&A 시 키워드 검색 + 벡터 유사도 검색을 결합한 하이브리드 검색으로 정확한 답변을 제공합니다.
        </p>
      </div>

      <div className="bg-amber-50 rounded-xl p-4">
        <h4 className="font-semibold text-amber-800 text-sm mb-2">PDF 내보내기</h4>
        <p className="text-xs text-amber-700">
          루브릭, 수업 계획, 학생 리포트, 읽기 통계를 PDF로 다운로드할 수 있습니다.
          각 페이지의 <Download className="inline h-3 w-3" /> 버튼을 클릭하세요.
        </p>
      </div>
    </div>
  )
}

function HowToSection() {
  const steps = [
    {
      title: "1. 로그인",
      desc: "\"데모로 바로 시작하기\" 버튼을 클릭하면 즉시 앱에 입장합니다. 별도 회원가입이 필요 없습니다.",
    },
    {
      title: "2. Lexile 진단 (첫 사용 추천)",
      desc: "홈 화면의 \"Lexile 테스트\" 버튼을 클릭하여 학생의 현재 영어 독해 수준을 측정하세요. 결과에 따라 AI가 맞춤 교수 전략을 제안합니다.",
    },
    {
      title: "3. AI 수업 설계",
      desc: "수업 설계 페이지에서 학년, 기능(읽기/쓰기/듣기/말하기), 주제를 입력하면 AI가 수업 지도안을 자동 생성합니다. Claude 또는 Gemini 중 선택 가능합니다.",
    },
    {
      title: "4. 수능 문항 생성",
      desc: "7가지 문항 유형(빈칸추론, 순서배열 등)과 3단계 난이도를 선택하여 수능 스타일 문항을 생성합니다. 생성된 문항은 자동으로 구조 분석과 난이도 예측이 가능합니다.",
    },
    {
      title: "5. 다독 프로그램",
      desc: "학생의 Lexile 수준에 맞는 영어 읽기 자료를 AI가 생성합니다. 이해도 퀴즈 후 자동 채점되며, 누적 읽기량이 추적됩니다. 연간 목표: 100,000 단어.",
    },
    {
      title: "6. AI 영어 대화 연습",
      desc: "CEFR 수준(A1~B2)을 선택하고 상황 시나리오를 골라 AI와 영어로 대화합니다. 실시간 문법 교정과 대화 종료 후 성적표를 받을 수 있습니다.",
    },
    {
      title: "7. CEFR 루브릭 생성",
      desc: "수행평가용 루브릭을 AI가 자동 생성합니다. 학년, 기능, 주제, 목표 CEFR 수준을 입력하면 3~5단계 평가 기준표가 만들어집니다. PDF로 출력 가능합니다.",
    },
    {
      title: "8. 학생 학습 추적",
      desc: "학생을 등록하고 Lexile/CEFR 수준을 업데이트하면 성장 추이를 확인할 수 있습니다. AI가 학생별 맞춤 학습 처방과 학급 리포트를 생성합니다.",
    },
    {
      title: "9. 지식 DB 관리",
      desc: "교육과정 문서, 연구자료, 정책 등을 등록하면 AI가 자동으로 요약, 키워드 추출, 교육적 함의를 생성합니다. 등록된 문서는 교육과정 Q&A의 검색 소스로 활용됩니다.",
    },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-slate-800">사용 가이드</h3>
      <div className="space-y-3">
        {steps.map((step) => (
          <div key={step.title} className="border border-slate-100 rounded-lg p-3">
            <h4 className="font-semibold text-sm text-slate-800 mb-1">{step.title}</h4>
            <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 rounded-xl p-4">
        <h4 className="font-semibold text-blue-800 text-sm mb-1">데모 계정</h4>
        <p className="text-xs text-blue-700">이메일: demo@korea-english.com / 비밀번호: demo1234</p>
        <p className="text-xs text-blue-600 mt-1">또는 \"데모로 바로 시작하기\" 버튼으로 즉시 입장</p>
      </div>
    </div>
  )
}

function TechSection() {
  return (
    <div className="space-y-5">
      <h3 className="text-xl font-bold text-slate-800">기술 스택</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {[
          { category: "프레임워크", items: "Next.js 15.5 (App Router), React 19, TypeScript" },
          { category: "UI", items: "Tailwind CSS 3.4, Radix UI, Lucide Icons" },
          { category: "AI (분석)", items: "Claude Sonnet 4.6 (Anthropic API)" },
          { category: "AI (생성)", items: "Gemini 2.0 Flash (Google AI)" },
          { category: "AI (검색)", items: "Gemini Text Embedding 004 + 벡터 검색" },
          { category: "DB (지식)", items: "Turso (libSQL) — 12 테이블" },
          { category: "DB (사용자)", items: "Firebase Firestore — 2 컬렉션" },
          { category: "인증", items: "쿠키 기반 데모 로그인" },
          { category: "배포", items: "Vercel (프로덕션)" },
          { category: "PDF", items: "jsPDF + html2canvas (클라이언트)" },
        ].map((t) => (
          <div key={t.category} className="flex gap-2 bg-slate-50 rounded-lg p-2.5">
            <span className="font-semibold text-slate-700 whitespace-nowrap">{t.category}:</span>
            <span className="text-slate-600">{t.items}</span>
          </div>
        ))}
      </div>

      <div>
        <h4 className="font-semibold text-slate-700 text-sm mb-2">DB 구조</h4>
        <div className="bg-slate-900 text-slate-300 rounded-lg p-4 text-xs font-mono leading-relaxed">
          <p className="text-emerald-400">Turso (libSQL) — 12 테이블:</p>
          <p>knowledge_documents, curriculum_standards, csat_items,</p>
          <p>teacher_sessions, lesson_cases, reading_materials,</p>
          <p>reading_logs, conversation_sessions, rubrics,</p>
          <p>question_similarities</p>
          <p className="mt-2 text-amber-400">Firebase Firestore — 2 컬렉션:</p>
          <p>problems, lexile_test_results, students</p>
        </div>
      </div>

      <div className="text-xs text-slate-400 border-t pt-3">
        <p>Version 5.0 | Phase 3-5 완료 | 2026-03-19</p>
        <p>GitHub: github.com/smilepat/Korea_English_Solution</p>
      </div>
    </div>
  )
}
