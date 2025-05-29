import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Headphones, PenTool, MessageCircle, BarChart3, FileText, Users, Map } from "lucide-react"

export function TeacherReport() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>교사용 데이터 분석 리포트 샘플</CardTitle>
          <CardDescription>학생별 진단 리포트와 맞춤형 학습 계획을 제공합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold">학생 A 진단 리포트 (중2)</h3>
                <p className="text-slate-500 text-sm mt-1">최종 업데이트: 2025년 5월 10일</p>
              </div>
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">중급 초반</Badge>
            </div>

            <div className="mt-6">
              <h4 className="font-medium text-lg">영어 영역별 성취도(CEFR 기준)</h4>
              <div className="grid gap-4 mt-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">읽기</span>
                    </div>
                    <span className="text-sm">A2(650L) → 목표 B1(800L)</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Headphones className="h-4 w-4 text-green-600" />
                      <span className="font-medium">듣기</span>
                    </div>
                    <span className="text-sm">
                      A2+ → <span className="text-red-500 font-medium">격차 23%</span>
                    </span>
                  </div>
                  <Progress value={70} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <PenTool className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">쓰기</span>
                    </div>
                    <span className="text-sm">문법 오류율 42% → 상위 25% 학생 대비 2.3배</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-amber-600" />
                      <span className="font-medium">말하기</span>
                    </div>
                    <span className="text-sm">
                      A1+ → <span className="text-red-500 font-medium">격차 35%</span>
                    </span>
                  </div>
                  <Progress value={30} className="h-2" />
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h4 className="font-medium text-lg">권장 학습 플랜</h4>
              <div className="space-y-3 mt-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border">
                  <div className="font-medium text-blue-600 text-sm">Daily:</div>
                  <div className="text-sm">기초 구문 훈련 15분(오류율 35% 감소 예상)</div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border">
                  <div className="font-medium text-blue-600 text-sm">Weekly:</div>
                  <div className="text-sm">수능 유형 미니모의고사 2회</div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border">
                  <div className="font-medium text-blue-600 text-sm">Monthly:</div>
                  <div className="text-sm">AI 발음 평가 → 정확도 70% 달성 목표</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>교사 연계 전략</CardTitle>
          <CardDescription>교사가 학생들의 영어 학습을 효과적으로 지원할 수 있는 전략을 제시합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-start gap-4 p-4 rounded-lg border">
              <div className="bg-blue-100 rounded-full p-2">
                <BarChart3 className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <h3 className="font-medium">자동화 진단 도구</h3>
                <p className="text-sm text-slate-600 mt-1">
                  10분 내에 학생 프로파일을 생성하여 개인별 학습 상태를 빠르게 파악합니다.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg border">
              <div className="bg-green-100 rounded-full p-2">
                <FileText className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <h3 className="font-medium">맞춤형 워크시트</h3>
                <p className="text-sm text-slate-600 mt-1">
                  오류 패턴별 연습문제를 자동으로 생성하여 학생별 맞춤형 학습을 지원합니다.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg border">
              <div className="bg-purple-100 rounded-full p-2">
                <Users className="h-5 w-5 text-purple-700" />
              </div>
              <div>
                <h3 className="font-medium">학부모 통신문</h3>
                <p className="text-sm text-slate-600 mt-1">
                  주간 학습 현황을 카카오톡으로 발송하여 학부모와의 소통을 강화합니다.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg border">
              <div className="bg-amber-100 rounded-full p-2">
                <Map className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <h3 className="font-medium">지자체 연계</h3>
                <p className="text-sm text-slate-600 mt-1">
                  지역별 학습 격차 지도를 실시간으로 제공하여 교육 자원 배분을 최적화합니다.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-slate-50 rounded-lg border">
            <p className="text-sm">
              이 시스템은 2025년 교육부 디지털 교과서 플랫폼과 연동해 <strong>학생-교사-학부모</strong> 3자 협업 모델을
              구현할 수 있습니다. 실제 서울 강남구 5개 학교 시범 적용 결과, 6개월 만에 기초 미달 학생 비율 28% 감소
              효과가 확인되었습니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
