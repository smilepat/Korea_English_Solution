import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, BookOpen, Headphones, PenTool } from "lucide-react"

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
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-aZqLuoTVGAzKXyDRpyvOYhuCgwYwML.png"
              alt="Lexile 지수 기준 학습 궤적"
              className="w-full h-auto rounded-lg border"
            />
            <div className="bg-slate-50 p-4 rounded-lg border">
              <h3 className="font-medium text-lg mb-2">학생 B의 개인화 학습 궤적 분석</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="font-medium min-w-[120px]">현재 Lexile 지수:</span>
                  <span>480L (초6 수준, 평균 학생 궤적)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium min-w-[120px]">목표 Lexile 지수:</span>
                  <span>900L (중3 수준, 목표 궤적)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium min-w-[120px]">필요 상승 포인트:</span>
                  <span>420L</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium min-w-[120px]">예상 소요 기간:</span>
                  <span>2년 (주 3회, 45분 집중 학습 기준)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium min-w-[120px]">중점 학습 영역:</span>
                  <span>복합문 분석, 추론적 독해, 학술적 어휘 확장</span>
                </div>
              </div>
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
    return CERF_gap * 150  # CEFR 1단계 당 150시간 필요`}</code>
            </pre>
            <p className="text-sm text-slate-600 mt-2">
              CEFR 레벨 간 격차에 따라 필요한 학습 시간을 계산합니다. CEFR 1단계 상승에 약 150시간의 학습이 필요합니다.
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
                  <p className="text-sm text-slate-600 mt-1">중학교 수준의 어휘 1,500단어를 학습합니다.</p>
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
                  <p className="text-sm text-slate-600 mt-1">대학 수준의 학술적 어휘 2,000단어를 학습합니다.</p>
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
