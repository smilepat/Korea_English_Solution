"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, BookOpen, BarChart2, GraduationCap, ArrowRight } from "lucide-react"

export default function Home() {
  const [showProblemsList, setShowProblemsList] = useState(false)
  const [newProblem, setNewProblem] = useState("")
  const [problems, setProblems] = useState<Array<{ id: number; text: string; checked: boolean }>>([
    { id: 1, text: "교육과정 목표와 실제 교육 여건의 격차가 큼 (목표 달성률 62%)", checked: false },
    { id: 2, text: "학습자 주도적 언어 사용 기회 부족 (주당 평균 발화 시간 4.2분)", checked: false },
    { id: 3, text: "영어 수업시간 부족 (누적 980시간, CEFR B1 달성 필요 1,200시간)", checked: false },
    { id: 4, text: "초중고 영어 교육의 연계성 부족 (중1의 42%가 초등 필수 어휘 미달성)", checked: false },
    { id: 5, text: "학습자 간 격차 확대 문제 (상위 10%와 하위 10% 간 Lexile 격차 450L)", checked: false },
    { id: 6, text: "수능 시험과 교과서 난이도 차이 (수능 지문 평균 1200L vs 교과서 800L)", checked: false },
    { id: 7, text: "기초학력 부족 학생 개인별 해결 (개인별 학습궤적 진단 및 추천도구 필요)", checked: false },
  ])

  // 컴포넌트 마운트 시 로컬 스토리지에서 문제점 목록 불러오기
  useEffect(() => {
    const savedProblems = localStorage.getItem("englishEduProblems")
    if (savedProblems) {
      setProblems(JSON.parse(savedProblems))
    }
  }, [])

  // problems 상태가 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem("englishEduProblems", JSON.stringify(problems))
  }, [problems])

  const toggleProblemsList = () => {
    setShowProblemsList(!showProblemsList)
  }

  const handleCheckboxChange = (id: number) => {
    const updatedProblems = problems.map((problem) =>
      problem.id === id ? { ...problem, checked: !problem.checked } : problem,
    )
    setProblems(updatedProblems)
  }

  const addNewProblem = () => {
    if (newProblem.trim() !== "") {
      const newId = problems.length > 0 ? Math.max(...problems.map((p) => p.id)) + 1 : 1
      const updatedProblems = [...problems, { id: newId, text: newProblem, checked: false }]
      setProblems(updatedProblems)
      setNewProblem("")

      // 문제점 추가 후 목록이 보이도록 합니다
      if (!showProblemsList) {
        setShowProblemsList(true)
      }
    }
  }

  // 입력 필드의 키 이벤트 처리를 위한 함수를 추가합니다
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addNewProblem()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-700 via-teal-600 to-teal-500">
      <header className="bg-gradient-to-r from-teal-500 to-cyan-500 border-b shadow-sm">
        <div className="container mx-auto py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">대한민국 영어교육 개선 시스템</h1>
              <p className="text-white mt-1 opacity-90">데이터 기반 영어교육 혁신 플랫폼</p>
            </div>
            <div className="flex gap-4">
              <Button
                className="bg-yellow-400 text-teal-800 hover:bg-yellow-300 font-bold border-2 border-yellow-500"
                asChild
              >
                <a href="/lexile-test">Lexile 테스트</a>
              </Button>
              <Button variant="outline" className="border-white text-teal-400 hover:bg-white/10 font-bold">
                로그인
              </Button>
              <Button className="bg-white text-teal-600 hover:bg-gray-100">시작하기</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card className="shadow-sm border overflow-hidden bg-white">
              <CardHeader className="pb-4 bg-gradient-to-r from-purple-50 to-white">
                <CardTitle className="text-2xl text-gray-900">영어교육 현황 대시보드</CardTitle>
                <CardDescription className="text-gray-600">
                  대한민국 영어교육 과정의 현황과 문제점 데이터 기반으로 분석합니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md overflow-hidden border">
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/gap-chart-%EA%B0%AD-image-Gex0TRIo1OTko81rgESsQi3NomhdkZ.png"
                    alt="한국과 미국의 영어 교육과정 Lexile 지수 비교 차트"
                    className="w-full h-auto"
                  />
                  <div className="p-4 bg-white">
                    <h3 className="font-medium text-sm mb-2">한국-미국 영어 교육과정 Lexile 지수 격차 분석</h3>
                    <p className="text-xs text-gray-600">
                      '한국 영어교과서의 Lexile 지수'와 '미국 Textbook의 Lexile지수 격차를 보여줍니다. 수능 문항
                      난이도와 영어교과서의 수준을 볼 때 가장 높은 수준의 지문은 거의 원어민 학생에 버금가는 읽기 능력을
                      요구합니다.
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-400">출처: [1], [2]</span>
                      <Button size="sm" variant="outline">
                        자세히 보기
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 border-b pb-2">주요 기능</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="shadow-sm border hover:shadow-md transition-all bg-white">
                  <CardHeader className="pb-2">
                    <div className="bg-purple-100 w-10 h-10 rounded-full flex items-center justify-center mb-2">
                      <BarChart2 className="h-5 w-5 text-purple-700" />
                    </div>
                    <CardTitle className="text-lg">영어교육 과정 분석</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-teal-800">대한민국 영어교육 과정을 분석하고 문제점을 진단합니다</p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white border-2 border-white shadow-sm"
                      asChild
                    >
                      <a href="/dashboard">기능 사용하기</a>
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="shadow-sm border hover:shadow-md transition-all bg-white">
                  <CardHeader className="pb-2">
                    <div className="bg-purple-100 w-10 h-10 rounded-full flex items-center justify-center mb-2">
                      <BarChart2 className="h-5 w-5 text-purple-700" />
                    </div>
                    <CardTitle className="text-lg">데이터 분석</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-gray-600">
                      영어교육 과정의 문제점을 데이터 기반으로 분석하고 시각화합니다
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white border-2 border-white shadow-sm"
                      asChild
                    >
                      <a href="/data-analysis">기능 사용하기</a>
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="shadow-sm border hover:shadow-md transition-all bg-white">
                  <CardHeader className="pb-2">
                    <div className="bg-purple-100 w-10 h-10 rounded-full flex items-center justify-center mb-2">
                      <BookOpen className="h-5 w-5 text-purple-700" />
                    </div>
                    <CardTitle className="text-lg">학습 궤적</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-gray-600">
                      학생별 영어 능력 발달 궤적을 추적하고 맞춤형 학습 계획을 제공합니다
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white border-2 border-white shadow-sm"
                      asChild
                    >
                      <a href="/lexile-test">기능 사용하기</a>
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="shadow-sm border hover:shadow-md transition-all bg-white">
                  <CardHeader className="pb-2">
                    <div className="bg-purple-100 w-10 h-10 rounded-full flex items-center justify-center mb-2">
                      <GraduationCap className="h-5 w-5 text-purple-700" />
                    </div>
                    <CardTitle className="text-lg">교사 지원</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-gray-600">교사들에게 학생 데이터와 맞춤형 교육 자료를 제공합니다</p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white border-2 border-white shadow-sm"
                      asChild
                    >
                      <a href="/teacher-support">기능 사용하기</a>
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="shadow-sm border hover:shadow-md transition-all bg-white">
                  <CardHeader className="pb-2">
                    <div className="bg-purple-100 w-10 h-10 rounded-full flex items-center justify-center mb-2">
                      <BookOpen className="h-5 w-5 text-purple-700" />
                    </div>
                    <CardTitle className="text-lg">수능영어문항 생성 방법</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-gray-600">수능영어문항 생성의 지침, 원칙 및 전략을 제공합니다</p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white border-2 border-white shadow-sm"
                      asChild
                    >
                      <a href="/csat-question-generation">기능 사용하기</a>
                    </Button>
                  </CardFooter>
                </Card>
                <Card className="shadow-sm border hover:shadow-md transition-all bg-white">
                  <CardHeader className="pb-2">
                    <div className="bg-purple-100 w-10 h-10 rounded-full flex items-center justify-center mb-2">
                      <BookOpen className="h-5 w-5 text-purple-700" />
                    </div>
                    <CardTitle className="text-lg">학습자 독해수준 진단 테스트</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-gray-600">
                      학습자의 현재 영어 독해 수준을 정확히 진단하고 맞춤형 학습 계획을 제공합니다
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white border-2 border-white shadow-sm"
                      asChild
                    >
                      <a href="/lexile-test/index.tsx">테스트 시작하기</a>
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </div>

          <div>
            <Card className="shadow-sm border bg-white">
              <CardHeader>
                <CardTitle>해결해야 할 문제점</CardTitle>
                <CardDescription>대한민국 영어교육에서 개선이 필요한 문제점들을 관리합니다</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={toggleProblemsList}
                  className="w-full flex items-center justify-center gap-2 bg-white text-purple-600 border-4 border-teal-900 font-bold hover:bg-purple-50"
                  variant="outline"
                >
                  <PlusCircle className="h-4 w-4" />
                  해결해야할 문제점 추가하기
                </Button>

                {showProblemsList && (
                  <div className="mt-4 space-y-4">
                    <div className="space-y-3">
                      {problems.map((problem) => (
                        <div key={problem.id} className="flex items-start space-x-2">
                          <Checkbox
                            id={`problem-${problem.id}`}
                            checked={problem.checked}
                            onCheckedChange={() => handleCheckboxChange(problem.id)}
                            className="border-purple-300 text-purple-600"
                          />
                          <Label
                            htmlFor={`problem-${problem.id}`}
                            className={`text-sm ${problem.checked ? "line-through text-gray-400" : ""}`}
                          >
                            {problem.text}
                          </Label>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center space-x-2 pt-2 border-t">
                      <Input
                        placeholder="새로운 문제점 입력..."
                        value={newProblem}
                        onChange={(e) => setNewProblem(e.target.value)}
                        onKeyDown={handleKeyPress}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={addNewProblem}
                        title="시스템에 저장됩니다"
                      >
                        추가
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="text-xs text-gray-500 flex justify-between">
                <span>선택된 문제점: {problems.filter((p) => p.checked).length}</span>
                <span>총 문제점: {problems.length}</span>
              </CardFooter>
              <div className="px-6 pb-3 text-xs text-gray-400">출처: [3]</div>
            </Card>

            <Card className="shadow-sm border bg-white mt-6">
              <CardHeader>
                <CardTitle>문제해결 사례/자료</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="news">
                  <TabsList className="grid w-full grid-cols-2 bg-purple-100">
                    <TabsTrigger value="news" className="data-[state=active]:bg-white">
                      사례
                    </TabsTrigger>
                    <TabsTrigger value="events" className="data-[state=active]:bg-white">
                      자료
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="news" className="space-y-4 mt-4">
                    <div className="border-b pb-2">
                      <h3 className="font-medium">해남 교회 어린이 영어교육 성공</h3>
                      <p className="text-sm text-gray-600">
                        학원 불모지역 해남 교회에서 자기주도영어학습으로 도심에 뒤떨어지지 않아.
                      </p>
                      <p className="text-xs text-gray-400 mt-1">2025년 5월 15일</p>
                    </div>
                    <div className="border-b pb-2">
                      <h3 className="font-medium">영어 학습 데이터 분석 결과</h3>
                      <p className="text-sm text-gray-600">최근 5년간의 영어 학습 데이터 분석 결과가 공개되었습니다.</p>
                      <p className="text-xs text-gray-400 mt-1">2025년 5월 10일</p>
                    </div>
                  </TabsContent>
                  <TabsContent value="events" className="space-y-4 mt-4">
                    <div className="border-b pb-2">
                      <h3 className="font-medium">영어교사를 위한 프람트 엔지니어링 활용</h3>
                      <p className="text-sm text-gray-600">영어교사를 위한 혁신 포럼이 개최됩니다.</p>
                      <p className="text-xs text-gray-400 mt-1">2025년 10월 25일</p>
                    </div>
                    <div className="border-b pb-2">
                      <h3 className="font-medium">교사 워크샵</h3>
                      <p className="text-sm text-gray-600">데이터 기반 영어교육 방법론 워크샵이 진행됩니다.</p>
                      <p className="text-xs text-gray-400 mt-1">2025년 6월 5일</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card className="shadow-sm border bg-white mt-6">
              <CardHeader>
                <CardTitle>영어성취 기준(standards) 비교표</CardTitle>
                <CardDescription>국제 기준과 한국 교육과정의 성취 기준을 비교합니다</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  <div className="border-2 border-blue-800 rounded-md p-3 bg-white hover:bg-purple-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">CEFR vs 교육과정</span>
                      <Button size="sm" variant="ghost" className="text-purple-600 hover:text-purple-700" asChild>
                        <a href="/standards-comparison/cefr">보기</a>
                      </Button>
                    </div>
                  </div>
                  <div className="border-2 border-blue-800 rounded-md p-3 bg-white hover:bg-purple-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">CEFR 어휘기준 vs 교육과정</span>
                      <Button size="sm" variant="ghost" className="text-purple-600 hover:text-purple-700" asChild>
                        <a href="/standards-comparison">보기</a>
                      </Button>
                    </div>
                  </div>
                  <div className="border-2 border-blue-800 rounded-md p-3 bg-white hover:bg-purple-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Lexile 지수 vs 교육과정</span>
                      <Button size="sm" variant="ghost" className="text-purple-600 hover:text-purple-700" asChild>
                        <a href="/standards-comparison">보기</a>
                      </Button>
                    </div>
                  </div>
                  <div className="border-2 border-blue-800 rounded-md p-3 bg-white hover:bg-purple-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">미국 vs 한국 교육과정</span>
                      <Button size="sm" variant="ghost" className="text-purple-600 hover:text-purple-700" asChild>
                        <a href="/standards-comparison">보기</a>
                      </Button>
                    </div>
                  </div>
                  <div className="border-2 border-blue-800 rounded-md p-3 bg-white hover:bg-purple-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">수능 vs 국제 영어시험</span>
                      <Button size="sm" variant="ghost" className="text-purple-600 hover:text-purple-700" asChild>
                        <a href="/standards-comparison">보기</a>
                      </Button>
                    </div>
                  </div>
                  <div className="border-2 border-blue-800 rounded-md p-3 bg-white hover:bg-purple-50 transition-colors mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">어휘 기준</span>
                      <Button size="sm" variant="ghost" className="text-purple-600 hover:text-purple-700" asChild>
                        <a href="/vocabulary-standards">보기</a>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <div className="px-6 pb-3 text-xs text-gray-400">출처: [4], [5]</div>
            </Card>
          </div>
        </div>
      </main>

      <section className="bg-black text-white py-16 mt-12">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <span className="text-yellow-300 text-2xl">✨</span>
              <h2 className="text-2xl font-bold">혁신적인 영어교육 솔루션</h2>
            </div>
            <Button variant="outline" className="text-white border-white hover:bg-white/10">
              모두 보기 <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white text-black">
              <CardHeader>
                <CardTitle className="text-xl">새로운 학습 경험 제공</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  데이터 기반 맞춤형 학습 경로로 학생들의 영어 능력을 효과적으로 향상시킵니다.
                </p>
              </CardContent>
              <CardFooter>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  자세히 보기 <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-white text-black">
              <CardHeader>
                <CardTitle className="text-xl">AI 기반 학습 분석</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  인공지능 기술을 활용하여 학생들의 학습 패턴을 분석하고 최적의 학습 방법을 제시합니다.
                </p>
              </CardContent>
              <CardFooter>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  자세히 보기 <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-white text-black">
              <CardHeader>
                <CardTitle className="text-xl">교사 역량 강화</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  교사들에게 필요한 도구와 자료를 제공하여 효과적인 영어 교육을 지원합니다.
                </p>
              </CardContent>
              <CardFooter>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  자세히 보기 <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      <div className="container mx-auto py-4 border-t mt-8 mb-8 bg-white rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-3">출처 및 참고자료</h3>
        <ul className="text-xs text-gray-600 space-y-2">
          <li id="source-1">
            1. 한국-미국 영어 교육과정 Lexile 지수 비교 차트: 한국교육과정평가원(KICE), "영어과 교육과정 성취기준 적정화
            연구", 2023
          </li>
          <li id="source-2">
            2. 수능 문항 난이도 분석: 한국교육과정평가원, "대학수학능력시험 영어 영역 문항 분석", 2022-2024
          </li>
          <li id="source-3">3. 영어 수업시간 부족 데이터: 교육부, "초중고 영어교육 현황 조사", 2024</li>
          <li id="source-4">
            4. CEFR 기준 및 Lexile 지수 정보: MetaMetrics Inc., "The Lexile Framework for Reading", 2023
          </li>
          <li id="source-5">
            5. 미국 교육과정 데이터: U.S. Department of Education, "English Language Arts Standards", 2023
          </li>
        </ul>
      </div>

      <footer className="bg-gradient-to-b from-purple-900 to-black text-white py-12">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">대한민국 영어교육 개선 시스템</h3>
              <p className="text-sm text-gray-300">
                데이터 기반으로 영어교육의 문제점을 분석하고 해결책을 제시하는 플랫폼입니다.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">주요 링크</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>대시보드</li>
                <li>학습 궤적 분석</li>
                <li>교사 리소스</li>
                <li>연구 자료</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">문의</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>이메일: contact@englishedu.kr</li>
                <li>전화: 02-123-4567</li>
                <li>주소: 서울시 강남구 테헤란로 123</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">소셜 미디어</h3>
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-purple-700 rounded-full"></div>
                <div className="w-8 h-8 bg-purple-700 rounded-full"></div>
                <div className="w-8 h-8 bg-purple-700 rounded-full"></div>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-purple-800 text-center text-sm text-gray-400">
            © 2025 대한민국 영어교육 개선 시스템. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
