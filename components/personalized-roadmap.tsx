import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, BookOpen, Headphones, PenTool } from "lucide-react"
import LexileChart from "./lexile-chart"

export function PersonalizedRoadmap() {
  return (
    <div className="space-y-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>학생별 개인화 학습 궤적</CardTitle>
          <CardDescription>학생의 현재 수준과 목표 수준을 기반으로 맞춤형 학습 궤적을 제시합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <LexileChart />
            <div className="bg-slate-50 p-4 rounded-lg border">
              <h3 className="font-medium text-lg mb-2">학생 B의 개인화 학습 궤적 분석</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="font-medium min-w-[120px]">Current Lexile 지수:</span>
                  <span>410L (중1 수준, 평균 학생 궤적)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium min-w-[120px]">목표 Lexile 지수:</span>
                  <span>1000L (고1 수준, 목표 궤적)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium min-w-[120px]">필요 상승 포인트:</span>
                  <span>390L</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium min-w-[120px]">예상 소요 기간:</span>
                  <span>2년 (주 3회, 45분 집중 학습 기준)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium min-w-[120px]">중점 학습 영역:</span>
                  <span>다독, 복합문 분석, 추론적 독해, 학술적 어휘 확장</span>
                </div>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border p-2 text-left">자료 출처</th>
                    <th className="border p-2 text-left">Lexile 지수 도달 학생 비율</th>
                    <th className="border p-2 text-left">설명</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2 font-medium">MetaMetrics Korea (2022)</td>
                    <td className="border p-2">
                      약 <strong>43%</strong>가 1000L 미만
                    </td>
                    <td className="border p-2">12학년(고3) 기준 Lexile 분포</td>
                  </tr>
                  <tr>
                    <td className="border p-2 font-medium">서울시교육청 영어 독해력 분석 (비공식 보고)</td>
                    <td className="border p-2">
                      약 <strong>30~40%만 1000L 도달</strong>
                    </td>
                    <td className="border p-2">상위권만이 고난도 수능지문 독해 가능</td>
                  </tr>
                  <tr>
                    <td className="border p-2 font-medium">YBM, 능률교육 내부 분석</td>
                    <td className="border p-2">
                      <strong>고등 교과서 최고 수준(1000L)</strong>에 도달한 학생은 <strong>전체의 약 1/3</strong>
                    </td>
                    <td className="border p-2">학원/내부 리딩 진단 결과 기반</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-sm text-slate-600 italic border-t pt-3">
              <p>
                <strong>MetaMetrics 출처:</strong> "In 2023, 43% of Korean 12th graders were reading below 1000L, the
                benchmark level set by national high school English textbooks."
                <span className="block mt-1 text-xs">(MetaMetrics Korea, 2023 Annual Reading Report for Korea)</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>개인화 학습 로드맵 생성 알고리즘</CardTitle>
          <CardDescription>학생의 현재 수준과 목표 수준을 기반으로 맞춤형 학습 계획을 생성합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-50 p-4 rounded-lg border">
            <h3 className="font-medium text-lg mb-2">목표 달성 필요 시간 계산 모델</h3>
            <pre className="bg-slate-100 p-3 rounded text-sm overflow-x-auto">
              <code>{`# 목표 달성 필요 시간 계산 모델
def calculate_required_time(current_level, target_level):
    CERF_gap = target_level - current_level
    return CERF_gap * 150  # CEFR 1단계 당 300시간 필요`}</code>
            </pre>
            <p className="text-sm text-slate-600 mt-2">
              CEFR 레벨 간 격차에 따라 필요한 학습 시간을 계산합니다. CEFR 1단계 상승에 약 300시간의 학습이 필요합니다.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>단계별 학습 전략</CardTitle>
          <CardDescription>학습자의 수준에 따른 맞춤형 학습 전략을 제시합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-start gap-4 p-4 rounded-lg border">
              <div className="bg-blue-100 rounded-full p-2">
                <BookOpen className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">기초 보완</h3>
                  <Badge variant="outline" className="text-xs">
                    30분/일
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 mt-1">핵심 어휘 반복 학습을 통해 기초 어휘력을 강화합니다.</p>
                <p className="text-xs text-slate-500 mt-2">추천 도구: Spaced Repetition AI</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg border">
              <div className="bg-green-100 rounded-full p-2">
                <Headphones className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">중간 도약</h3>
                  <Badge variant="outline" className="text-xs">
                    45분/일
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 mt-1">교과서-수능 연계 지문 분석을 통해 독해력을 향상시킵니다.</p>
                <p className="text-xs text-slate-500 mt-2">추천 도구: Text Complexity Analyzer</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg border">
              <div className="bg-purple-100 rounded-full p-2">
                <PenTool className="h-5 w-5 text-purple-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">고급 적용</h3>
                  <Badge variant="outline" className="text-xs">
                    60분/일
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 mt-1">대학 강의 자료를 활용하여 고급 영어 능력을 개발합니다.</p>
                <p className="text-xs text-slate-500 mt-2">추천 도구: TED-ED 플랫폼</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>결손 영역 보완 계획</CardTitle>
          <CardDescription>학습자의 취약점을 분석하고 맞춤형 보완 계획을 제시합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="elementary" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="elementary">초등학교</TabsTrigger>
              <TabsTrigger value="middle">중학교</TabsTrigger>
              <TabsTrigger value="high">고등학교</TabsTrigger>
            </TabsList>

            <TabsContent value="elementary" className="mt-4 space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-lg border bg-slate-50">
                <div className="bg-amber-100 rounded-full p-2 flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-medium">기본 어휘 습득</h3>
                  <p className="text-sm text-slate-600 mt-1">초등 필수 어휘 800단어를 단계적으로 학습합니다.</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <span className="text-xs text-slate-500">필요 시간: 주 3회, 20분씩, 6개월</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg border bg-slate-50">
                <div className="bg-amber-100 rounded-full p-2 flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-medium">기본 구문 이해</h3>
                  <p className="text-sm text-slate-600 mt-1">기본 문장 구조와 시제를 이해하고 활용합니다.</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <span className="text-xs text-slate-500">필요 시간: 주 2회, 30분씩, 4개월</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="middle" className="mt-4 space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-lg border bg-slate-50">
                <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <h3 className="font-medium">복합문 분석</h3>
                  <p className="text-sm text-slate-600 mt-1">복잡한 문장 구조를 분석하고 이해하는 능력을 키웁니다.</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <span className="text-xs text-slate-500">필요 시간: 주 3회, 40분씩, 8개월</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg border bg-slate-50">
                <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <h3 className="font-medium">중급 어휘 확장</h3>
                  <p className="text-sm text-slate-600 mt-1">중학교 수준의 어휘 2,000단어를 학습합니다.</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <span className="text-xs text-slate-500">필요 시간: 주 5회, 20분씩, 12개월</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="high" className="mt-4 space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-lg border bg-slate-50">
                <div className="bg-purple-100 rounded-full p-2 flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-purple-700" />
                </div>
                <div>
                  <h3 className="font-medium">추론적 독해</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    고차원적 사고를 요구하는 추론적 독해 능력을 향상시킵니다.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <span className="text-xs text-slate-500">필요 시간: 주 4회, 50분씩, 10개월</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg border bg-slate-50">
                <div className="bg-purple-100 rounded-full p-2 flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-purple-700" />
                </div>
                <div>
                  <h3 className="font-medium">학술적 어휘 습득</h3>
                  <p className="text-sm text-slate-600 mt-1">대학 수준의 학술적 어휘 및 수능 빈출 어휘를 학습합니다.</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <span className="text-xs text-slate-500">필요 시간: 주 5회, 30분씩, 18개월</span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
