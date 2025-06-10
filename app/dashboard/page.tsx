import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { BarChart, LineChart, RadarChart } from "@/components/charts"
import { GapAnalysis } from "@/components/gap-analysis"
import { LearningTrajectory } from "@/components/learning-trajectory"
import { PersonalizedRoadmap } from "@/components/personalized-roadmap"
import { TeacherReport } from "@/components/teacher-report"
import { Home } from "lucide-react"

export default function Dashboard() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="bg-slate-50 border-b">
        <div className="container py-6 relative">
          <h1 className="text-3xl font-bold">대한민국 영어교육 과정 분석 대시보드</h1>
          <p className="text-slate-600 mt-2">
            교육과정 목표와 실제 성취도 간의 격차를 데이터 기반으로 분석하고 해결책을 제시합니다
          </p>
          <a
            href="/"
            className="absolute bottom-2 right-6 flex items-center gap-1 bg-white px-3 py-1.5 rounded-md border shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Home className="h-4 w-4" />
            <span className="text-sm font-medium">Home</span>
          </a>
        </div>
      </header>

      <div className="container py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">문제 진단</TabsTrigger>
            <TabsTrigger value="trajectory">학습 궤적</TabsTrigger>
            <div className="flex flex-col items-center">
              <span className="text-sm text-red-600 mb-1 border border-red-400 rounded px-2 py-1 font-medium">
                성취기준을 제대로 측정할 수 있는 도구가 필요
              </span>
              <TabsTrigger value="roadmap" className="w-full">
                개인화 로드맵
              </TabsTrigger>
            </div>
            <TabsTrigger value="teacher">교사용 리포트</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>교육과정-능력 격차 분석</CardTitle>
                  <CardDescription>교육과정 목표와 실제 성취도 간의 격차를 시각화합니다</CardDescription>
                </CardHeader>
                <CardContent>
                  <GapAnalysis />
                  <div className="mt-4 p-3 bg-slate-50 rounded-md border border-slate-200">
                    <p className="text-sm text-slate-600">
                      <strong>격차 수치 설명:</strong> 각 영역별 수치는 교육과정에서 목표로 하는 성취 수준과 실제
                      학생들의 평균 성취도 간의 차이를 백분율(%)로 나타냅니다. 높은 수치일수록 목표 대비 실제 성취도가
                      낮음을 의미하며, 해당 영역에서 더 집중적인 교육적 개입이 필요함을 시사합니다.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>학년별 핵심 문제 영역</CardTitle>
                  <CardDescription>각 학년별 주요 결손 영역과 평균 격차율을 보여줍니다</CardDescription>
                </CardHeader>
                <CardContent>
                  <BarChart />
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>미국 vs 한국 학생 영어 Reading Exposure</CardTitle>
                  <CardDescription>미국과 한국 학생들의 영어 교재 노출량 비교</CardDescription>
                  <div className="mt-3 py-2 px-4 bg-slate-100 rounded-md border border-slate-200">
                    <h3 className="text-base font-semibold text-slate-800">
                      대한민국 학생들 Reading Exposure(영어교과서)
                    </h3>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border px-4 py-2 text-left">School Level</th>
                          <th className="border px-4 py-2 text-left">Grades</th>
                          <th className="border px-4 py-2 text-left">Est. Words/Textbook</th>
                          <th className="border px-4 py-2 text-left">Textbooks Used</th>
                          <th className="border px-4 py-2 text-left">Total Words</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border px-4 py-2">Elementary</td>
                          <td className="border px-4 py-2">Grades 3–6</td>
                          <td className="border px-4 py-2">~8,000–10,000</td>
                          <td className="border px-4 py-2">4</td>
                          <td className="border px-4 py-2">32,000–40,000</td>
                        </tr>
                        <tr>
                          <td className="border px-4 py-2">Middle School</td>
                          <td className="border px-4 py-2">Grades 7–9</td>
                          <td className="border px-4 py-2">~20,000–25,000</td>
                          <td className="border px-4 py-2">3</td>
                          <td className="border px-4 py-2">60,000–75,000</td>
                        </tr>
                        <tr>
                          <td className="border px-4 py-2">High School</td>
                          <td className="border px-4 py-2">Grades 10–12</td>
                          <td className="border px-4 py-2">~25,000–35,000</td>
                          <td className="border px-4 py-2">3</td>
                          <td className="border px-4 py-2">75,000–105,000</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 p-3 bg-slate-50 rounded-md border">
                    <p className="font-medium">Total Estimated Running Words (Grades 3–12):</p>
                    <p className="text-lg font-bold">≈ 167,000 – 220,000 words</p>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-base font-semibold py-2 px-4 mb-3 bg-blue-50 rounded-md border border-blue-200 text-blue-800">
                      미국학생들의 Reading Exposure
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="border px-4 py-2 text-left">미국학생 교과서 Reading Exposure 분량</th>
                            <th className="border px-4 py-2 text-left">Average Reading Exposure per year</th>
                            <th className="border px-4 py-2 text-left">Total for Each Level</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border px-4 py-2 font-medium">Elementary (5 years):</td>
                            <td className="border px-4 py-2">(100,000 + 500,000) / 2 = 300,000 words/year</td>
                            <td className="border px-4 py-2">5yrs × 300,000 = 1,500,000 words</td>
                          </tr>
                          <tr>
                            <td className="border px-4 py-2 font-medium">Middle (3 years):</td>
                            <td className="border px-4 py-2">(500,000 + 1,000,000) / 2 = 750,000 words/year</td>
                            <td className="border px-4 py-2">3yrs × 750,000 = 2,250,000 words</td>
                          </tr>
                          <tr>
                            <td className="border px-4 py-2 font-medium">High (4 years):</td>
                            <td className="border px-4 py-2">(1,000,000 + 2,000,000) / 2 = 1,500,000 words/year</td>
                            <td className="border px-4 py-2">4yrs × 1,500,000 = 6,000,000 words</td>
                          </tr>
                          <tr className="bg-slate-50 font-medium">
                            <td className="border px-4 py-2">Grand Total (K–12):</td>
                            <td className="border px-4 py-2">1,500,000 + 2,250,000 + 6,000,000</td>
                            <td className="border px-4 py-2">9,750,000 running words</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                      <p className="font-medium text-blue-800">
                        *미국 학생 교과서 Reading Exposure: 총 1천만 단어(개인적 다독 학생: 연 400만 단어)
                      </p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <h4 className="text-base font-semibold mb-3">미국 vs 한국 학생 연간 영어 읽기 노출량 비교</h4>
                    <div className="rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                      <img
                        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Comparison%20chart%20Korea-US-Reading%20Exposure-VZOuWoz51Jf0KQgCo3ko8gzczreFkL.png"
                        alt="Comparison of Annual English Reading Exposure U.S. vs. Korean Students"
                        className="w-full h-auto"
                      />
                    </div>
                    <p className="text-sm text-slate-600 mt-2 italic">
                      그래프 설명: 미국 학생들(노란색)은 모든 학교급에서 한국 학생들(교과서만: 주황색, 학습지 포함:
                      빨간색)보다 월등히 많은 영어 읽기 자료에 노출됩니다. 특히 고등학교 수준에서 그 격차가 가장 큽니다.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>수업 시간 vs 필요 시간 분석</CardTitle>
                  <CardDescription>누적 영어 수업 시간과 CEFR 레벨 달성에 필요한 시간을 비교합니다</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">누적 영어 수업 시간 (초3~고3)</span>
                        <span className="text-slate-500">980시간</span>
                      </div>
                      <Progress value={82} className="h-3" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">CEFR B1 달성 필요 시간</span>
                        <span className="text-slate-500">2,000시간</span>
                      </div>
                      <Progress value={100} className="h-3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trajectory" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>읽기/듣기 능력 궤적</CardTitle>
                  <CardDescription>Lexile 지수 기준으로 학년별 읽기/듣기 능력 발달 추이를 보여줍니다</CardDescription>
                </CardHeader>
                <CardContent>
                  <LineChart />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>쓰기/말하기 능력 분석</CardTitle>
                  <CardDescription>쓰기/말하기 평가 요소별 성취도를 레이더 차트로 시각화합니다</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadarChart />
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>학습 궤적 시각화</CardTitle>
                  <CardDescription>목표 궤적과 실제 학습자의 언어능력 향상 궤적을 비교합니다</CardDescription>
                </CardHeader>
                <CardContent>
                  <LearningTrajectory />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="roadmap" className="mt-6">
            <PersonalizedRoadmap />
          </TabsContent>

          <TabsContent value="teacher" className="mt-6">
            <TeacherReport />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
