"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, BookOpen, BarChart2, GraduationCap } from "lucide-react"

export default function Home() {
  const [showProblemsList, setShowProblemsList] = useState(false)
  const [newProblem, setNewProblem] = useState("")
  const [problems, setProblems] = useState([
    { id: 1, text: "교육과정 목표와 실제 교육 여건의 격차가 큼 (목표 달성률 62%)", checked: false },
    { id: 2, text: "학습자 주도적 언어 사용 기회 부족 (주당 평균 발화 시간 4.2분)", checked: false },
    { id: 3, text: "영어 수업시간 부족 (누적 980시간, CEFR B1 달성 필요 1,200시간)", checked: false },
    { id: 4, text: "초중고 영어 교육의 연계성 부족 (중1의 42%가 초등 필수 어휘 미달성)", checked: false },
    { id: 5, text: "학습자 간 격차 확대 문제 (상위 10%와 하위 10% 간 Lexile 격차 450L)", checked: false },
    { id: 6, text: "수능 시험과 교과서 난이도 차이 (수능 지문 평균 1200L vs 교과서 800L)", checked: false },
  ])

  const toggleProblemsList = () => {
    setShowProblemsList(!showProblemsList)
  }

  const handleCheckboxChange = (id: number) => {
    setProblems(problems.map((problem) => (problem.id === id ? { ...problem, checked: !problem.checked } : problem)))
  }

  const addNewProblem = () => {
    if (newProblem.trim() !== "") {
      setProblems([...problems, { id: problems.length + 1, text: newProblem, checked: false }])
      setNewProblem("")
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="container mx-auto py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">대한민국 영어교육 개선 시스템</h1>
              <p className="text-slate-600 mt-1">데이터 기반 영어교육 혁신 플랫폼</p>
            </div>
            <div className="flex gap-4">
              <Button variant="outline">로그인</Button>
              <Button>시작하기</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl">영어교육 현황 대시보드</CardTitle>
                <CardDescription>대한민국 영어교육 과정의 현황과 문제점 데이터 기반으로 분석합니다</CardDescription>
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
                    <p className="text-xs text-slate-600">
                      '한국 영어교과서의 Lexile 지수'와 '미국 Textbook의 Lexile지수 격차를 보여줍니다. 수능 문항
                      난이도와 영어교과서의 수준을 볼 때 가장 높은 수준의 지문은 거의 원어민 학생에 버금가는 읽기 능력을
                      요구합니다.
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-slate-400">출처: [1], [2]</span>
                      <Button size="sm" variant="outline">
                        자세히 보기
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">주요 기능</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center mb-2">
                      <BarChart2 className="h-5 w-5 text-blue-700" />
                    </div>
                    <CardTitle className="text-lg">데이터 분석</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-slate-600">
                      영어교육 과정의 문제점을 데이터 기반으로 분석하고 시각화합니다
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" asChild>
                      <a href="/data-analysis">기능 사용하기</a>
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="bg-green-100 w-10 h-10 rounded-full flex items-center justify-center mb-2">
                      <BookOpen className="h-5 w-5 text-green-700" />
                    </div>
                    <CardTitle className="text-lg">학습 궤적</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-slate-600">
                      학생별 영어 능력 발달 궤적을 추적하고 맞춤형 학습 계획을 제공합니다
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" asChild>
                      <a href="/learning-trajectory">기능 사용하기</a>
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="bg-purple-100 w-10 h-10 rounded-full flex items-center justify-center mb-2">
                      <GraduationCap className="h-5 w-5 text-purple-700" />
                    </div>
                    <CardTitle className="text-lg">교사 지원</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-slate-600">교사들에게 학생 데이터와 맞춤형 교육 자료를 제공합니다</p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" asChild>
                      <a href="/teacher-support">기능 사용하기</a>
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </div>

          <div>
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>해결해야 할 문제점</CardTitle>
                <CardDescription>대한민국 영어교육에서 개선이 필요한 문제점들을 관리합니다</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={toggleProblemsList}
                  className="w-full flex items-center justify-center gap-2"
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
                          />
                          <Label
                            htmlFor={`problem-${problem.id}`}
                            className={`text-sm ${problem.checked ? "line-through text-slate-400" : ""}`}
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
                        className="flex-1"
                      />
                      <Button size="sm" onClick={addNewProblem}>
                        추가
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="text-xs text-slate-500 flex justify-between">
                <span>선택된 문제점: {problems.filter((p) => p.checked).length}</span>
                <span>총 문제점: {problems.length}</span>
              </CardFooter>
              <div className="px-6 pb-3 text-xs text-slate-400">출처: [3]</div>
            </Card>

            <Card className="shadow-sm mt-6">
              <CardHeader>
                <CardTitle>문제해결 사례/자료</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="news">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="news">사례</TabsTrigger>
                    <TabsTrigger value="events">자료</TabsTrigger>
                  </TabsList>
                  <TabsContent value="news" className="space-y-4 mt-4">
                    <div className="border-b pb-2">
                      <h3 className="font-medium">해남 교회 어린이 영어교육 성공</h3>
                      <p className="text-sm text-slate-600">
                        학원 불모지역 해남 교회에서 자기주도영어학습으로 도심에 뒤떨어지지 않아.
                      </p>
                      <p className="text-xs text-slate-400 mt-1">2025년 5월 15일</p>
                    </div>
                    <div className="border-b pb-2">
                      <h3 className="font-medium">영어 학습 데이터 분석 결과</h3>
                      <p className="text-sm text-slate-600">
                        최근 5년간의 영어 학습 데이터 분석 결과가 공개되었습니다.
                      </p>
                      <p className="text-xs text-slate-400 mt-1">2025년 5월 10일</p>
                    </div>
                  </TabsContent>
                  <TabsContent value="events" className="space-y-4 mt-4">
                    <div className="border-b pb-2">
                      <h3 className="font-medium">영어교사를 위한 프람트 엔지니어링 활용</h3>
                      <p className="text-sm text-slate-600">영어교사를 위한 혁신 포럼이 개최됩니다.</p>
                      <p className="text-xs text-slate-400 mt-1">2025년 10월 25일</p>
                    </div>
                    <div className="border-b pb-2">
                      <h3 className="font-medium">교사 워크샵</h3>
                      <p className="text-sm text-slate-600">데이터 기반 영어교육 방법론 워크샵이 진행됩니다.</p>
                      <p className="text-xs text-slate-400 mt-1">2025년 6월 5일</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card className="shadow-sm mt-6">
              <CardHeader>
                <CardTitle>영어성취 기준(standards) 비교표</CardTitle>
                <CardDescription>국제 기준과 한국 교육과정의 성취 기준을 비교합니다</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  <div className="border rounded-md p-3 bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">CEFR vs 교육과정</span>
                      <Button size="sm" variant="ghost" asChild>
                        <a href="/standards-comparison">보기</a>
                      </Button>
                    </div>
                  </div>
                  <div className="border rounded-md p-3 bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">CEFR 어휘기준 vs 교육과정</span>
                      <Button size="sm" variant="ghost" asChild>
                        <a href="/standards-comparison">보기</a>
                      </Button>
                    </div>
                  </div>
                  <div className="border rounded-md p-3 bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Lexile 지수 vs 교육과정</span>
                      <Button size="sm" variant="ghost" asChild>
                        <a href="/standards-comparison">보기</a>
                      </Button>
                    </div>
                  </div>
                  <div className="border rounded-md p-3 bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">미국 vs 한국 교육과정</span>
                      <Button size="sm" variant="ghost" asChild>
                        <a href="/standards-comparison">보기</a>
                      </Button>
                    </div>
                  </div>
                  <div className="border rounded-md p-3 bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">수능 vs 국제 영어시험</span>
                      <Button size="sm" variant="ghost" asChild>
                        <a href="/standards-comparison">보기</a>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <div className="px-6 pb-3 text-xs text-slate-400">출처: [4], [5]</div>
            </Card>
          </div>
        </div>
      </main>

      <div className="container mx-auto py-4 border-t mt-8 mb-8">
        <h3 className="text-lg font-semibold mb-3">출처 및 참고자료</h3>
        <ul className="text-xs text-slate-600 space-y-2">
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

      <footer className="bg-white border-t py-8">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">대한민국 영어교육 개선 시스템</h3>
              <p className="text-sm text-slate-600">
                데이터 기반으로 영어교육의 문제점을 분석하고 해결책을 제시하는 플랫폼입니다.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">주요 링크</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>대시보드</li>
                <li>학습 궤적 분석</li>
                <li>교사 리소스</li>
                <li>연구 자료</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">문의</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>이메일: contact@englishedu.kr</li>
                <li>전화: 02-123-4567</li>
                <li>주소: 서울시 강남구 테헤란로 123</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">소셜 미디어</h3>
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t text-center text-sm text-slate-500">
            © 2025 대한민국 영어교육 개선 시스템. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
