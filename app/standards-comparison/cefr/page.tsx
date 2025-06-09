import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CEFRComparison() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="container mx-auto py-6">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                <span>홈으로</span>
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-slate-900">CEFR vs 한국 영어교육과정 비교</h1>
          </div>
          <p className="text-slate-600 mt-1">
            유럽공통참조기준(CEFR)과 한국 영어교육과정의 성취기준을 학년별로 비교합니다
          </p>
        </div>
      </header>

      <main className="container mx-auto py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>한국 영어교육과정과 CEFR 레벨 비교</CardTitle>
            <CardDescription>각 학년별 한국 영어교육과정의 목표 수준과 CEFR 레벨을 비교한 차트입니다</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%ED%95%9C%EA%B5%AD%EA%B5%90%EC%9C%A1%EA%B3%BC%EC%A0%95-CEFR-Korea-QgyAnhx2YwBKP71KlQmO3kgLPKtsL8.png"
                alt="Korean National English Curriculum vs CEFR Levels"
                className="w-full max-w-4xl rounded-lg border"
              />
              <div className="mt-6 text-sm text-slate-600 max-w-3xl">
                <p>
                  위 차트는 한국 영어교육과정의 각 학년별 목표 수준을 유럽공통참조기준(CEFR)과 비교한 것입니다. 초등학교
                  저학년(3-4학년)에서는 A1 수준을, 고등학교 고학년(11-12학년)에서는 B1-B2 수준을 목표로 하고 있습니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>한국 영어교육과정 단계별 상세 비교</CardTitle>
            <CardDescription>각 학년별 한국 영어교육과정의 목표 수준과 CEFR 레벨의 상세 비교표입니다</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="border px-4 py-2 text-left">교육 단계</th>
                    <th className="border px-4 py-2 text-left">학년</th>
                    <th className="border px-4 py-2 text-left">한국 교육과정 목표 수준 (기준)</th>
                    <th className="border px-4 py-2 text-left">대응 가능한 CEFR 수준</th>
                    <th className="border px-4 py-2 text-left">설명</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border px-4 py-2 font-medium" rowSpan={2}>
                      초등학교
                    </td>
                    <td className="border px-4 py-2">3–4학년</td>
                    <td className="border px-4 py-2">간단한 표현 이해 및 사용 (기초 의사소통)</td>
                    <td className="border px-4 py-2 text-center bg-blue-50">A1</td>
                    <td className="border px-4 py-2">인사, 자기소개, 기본 지시 이해 등</td>
                  </tr>
                  <tr>
                    <td className="border px-4 py-2">5–6학년</td>
                    <td className="border px-4 py-2">익숙한 주제에 대해 간단한 말하기 및 듣기</td>
                    <td className="border px-4 py-2 text-center bg-blue-50">A1~A2</td>
                    <td className="border px-4 py-2">간단한 문장 말하기, 그림 설명 등</td>
                  </tr>
                  <tr>
                    <td className="border px-4 py-2 font-medium" rowSpan={2}>
                      중학교
                    </td>
                    <td className="border px-4 py-2">1학년</td>
                    <td className="border px-4 py-2">일상생활 관련 듣기·읽기 중심 이해</td>
                    <td className="border px-4 py-2 text-center bg-blue-50">A2</td>
                    <td className="border px-4 py-2">간단한 설명문, 짧은 대화문 이해</td>
                  </tr>
                  <tr>
                    <td className="border px-4 py-2">2–3학년</td>
                    <td className="border px-4 py-2">친숙한 주제에 대해 간단한 말하기·쓰기</td>
                    <td className="border px-4 py-2 text-center bg-green-50">A2~B1</td>
                    <td className="border px-4 py-2">이메일 쓰기, 일상 정보 교환 등</td>
                  </tr>
                  <tr>
                    <td className="border px-4 py-2 font-medium" rowSpan={2}>
                      고등학교
                    </td>
                    <td className="border px-4 py-2">1학년</td>
                    <td className="border px-4 py-2">실생활·학교생활 관련 복합적 이해와 표현</td>
                    <td className="border px-4 py-2 text-center bg-green-50">B1</td>
                    <td className="border px-4 py-2">의견 제시, 지문 요약, 복합문 이해</td>
                  </tr>
                  <tr>
                    <td className="border px-4 py-2">2–3학년</td>
                    <td className="border px-4 py-2">추상적 주제에 대한 해석 및 표현</td>
                    <td className="border px-4 py-2 text-center bg-green-50">B1~B2</td>
                    <td className="border px-4 py-2">설명문 해석, 주제 관련 말하기, 비판적 읽기 등</td>
                  </tr>
                  <tr>
                    <td className="border px-4 py-2 font-medium">대학 수준</td>
                    <td className="border px-4 py-2">(필요 시)</td>
                    <td className="border px-4 py-2">학문적 영어, 비판적 사고 표현</td>
                    <td className="border px-4 py-2 text-center bg-purple-50">B2~C1</td>
                    <td className="border px-4 py-2">논문 요약, 발표, 복잡한 정보 통합</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-6 p-4 bg-slate-50 rounded-lg border">
              <h3 className="font-medium text-lg mb-2">표 해석 가이드</h3>
              <p className="text-sm text-slate-600 mb-3">
                위 표는 한국 영어교육과정의 각 단계별 목표 수준과 이에 대응하는 CEFR 레벨을 보여줍니다. 한국 교육과정은
                학년이 올라갈수록 점진적으로 어려워지는 구조로, 초등학교에서는 기초적인 의사소통 능력(A1~A2)을,
                고등학교에서는 중급 수준의 영어 능력(B1~B2)을 목표로 합니다.
              </p>
              <p className="text-sm text-slate-600">
                그러나 실제 학생들의 성취도는 이러한 목표에 미치지 못하는 경우가 많으며, 특히 말하기와 쓰기 영역에서
                격차가 크게 나타납니다. 이는 입시 중심의 교육 환경과 실제 의사소통 기회 부족 등이 주요 원인으로
                분석됩니다.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>CEFR 레벨 설명</CardTitle>
            <CardDescription>유럽공통참조기준(CEFR)의 각 레벨에 대한 설명입니다</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h3 className="font-medium text-lg mb-2">A1 (초급)</h3>
                <p className="text-sm">
                  일상생활에서 사용되는 매우 기초적인 표현과 문장을 이해하고 사용할 수 있습니다. 자신과 다른 사람을
                  소개할 수 있으며, 개인 정보에 관한 질문(예: 사는 곳, 아는 사람, 가진 물건)을 하고 답할 수 있습니다.
                  상대방이 천천히 또박또박 말하고 도움을 준다면 간단한 대화를 할 수 있습니다.
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h3 className="font-medium text-lg mb-2">A2 (초급)</h3>
                <p className="text-sm">
                  자주 사용되는 표현과 문장을 이해할 수 있습니다(예: 개인 및 가족 정보, 쇼핑, 지역 지리, 고용). 친숙하고
                  일상적인 사항에 관해 직접적인 정보 교환이 필요한 단순하고 일상적인 과제에 대해 의사소통할 수 있습니다.
                  자신의 배경, 주변 환경, 직접적인 필요와 관련된 사항을 간단한 용어로 설명할 수 있습니다.
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                <h3 className="font-medium text-lg mb-2">B1 (중급)</h3>
                <p className="text-sm">
                  직장, 학교, 여가 등 친숙한 주제에 관한 명확한 표준 언어를 이해할 수 있습니다. 여행 중 발생할 수 있는
                  대부분의 상황에 대처할 수 있습니다. 친숙하거나 개인적 관심사에 관해 간단하고 일관된 텍스트를 작성할 수
                  있습니다. 경험, 사건, 꿈, 희망, 포부를 설명하고 의견이나 계획에 대한 이유와 설명을 간략하게 제시할 수
                  있습니다.
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                <h3 className="font-medium text-lg mb-2">B2 (중급)</h3>
                <p className="text-sm">
                  구체적이거나 추상적인 주제의 복잡한 텍스트의 주요 내용을 이해할 수 있습니다. 전문 분야의 기술적 토론을
                  포함하여 자신의 전문 분야에서 원어민과 자연스럽게 대화할 수 있습니다. 다양한 주제에 대해 명확하고
                  상세한 텍스트를 작성할 수 있으며, 다양한 선택지의 장단점을 제시하며 특정 관점에 대한 견해를 설명할 수
                  있습니다.
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                <h3 className="font-medium text-lg mb-2">C1 (고급)</h3>
                <p className="text-sm">
                  다양한 까다로운 긴 텍스트를 이해하고 함축적 의미를 파악할 수 있습니다. 표현을 찾기 위해 망설이지 않고
                  유창하고 자연스럽게 자신을 표현할 수 있습니다. 사회적, 학문적, 직업적 목적으로 언어를 유연하고
                  효과적으로 사용할 수 있습니다. 복잡한 주제에 대해 명확하고 잘 구성된 상세한 텍스트를 작성할 수 있으며,
                  조직적 패턴, 연결사, 결합 장치를 적절히 사용할 수 있습니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>한국 영어교육과정과 CEFR 격차 분석</CardTitle>
            <CardDescription>한국 영어교육과정의 목표와 실제 성취도 간의 격차를 분석합니다</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h3 className="font-medium text-lg mb-2">주요 격차 요인</h3>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li>
                    <span className="font-medium">수업 시간 부족:</span> 한국 학생들의 누적 영어 수업 시간(980시간)은
                    CEFR B1 레벨 달성에 필요한 시간(약 1,200시간)에 미치지 못함
                  </li>
                  <li>
                    <span className="font-medium">실제 언어 사용 기회 부족:</span> 교실 내 영어 사용 시간이 제한적이며,
                    실생활에서 영어를 사용할 기회가 적음
                  </li>
                  <li>
                    <span className="font-medium">문법 중심 교육:</span> 의사소통 능력보다 문법과 어휘 암기에 중점을 둔
                    교육 방식
                  </li>
                  <li>
                    <span className="font-medium">평가 방식의 불일치:</span> 수능 등 주요 시험이 CEFR 기준과 일치하지
                    않는 평가 방식 사용
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border">
                <h3 className="font-medium text-lg mb-2">개선 방안</h3>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li>
                    <span className="font-medium">의사소통 중심 교육 강화:</span> 실제 의사소통 상황에서 영어를 사용할
                    수 있는 기회를 확대하고, 말하기/듣기 활동 비중 증가
                  </li>
                  <li>
                    <span className="font-medium">영어 노출 시간 확대:</span> 정규 수업 외 영어 노출 시간을 늘릴 수 있는
                    프로그램 개발 및 지원
                  </li>
                  <li>
                    <span className="font-medium">CEFR 기반 평가 도입:</span> 국제 기준에 부합하는 평가 체계 도입으로
                    실질적인 영어 능력 향상 유도
                  </li>
                  <li>
                    <span className="font-medium">교사 역량 강화:</span> 영어 교사의 의사소통 능력 및 교수법 향상을 위한
                    지속적인 연수 프로그램 제공
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="bg-white border-t py-6 mt-8">
        <div className="container mx-auto">
          <div className="text-center text-sm text-slate-500">
            <p>© 2025 대한민국 영어교육 개선 시스템. All rights reserved.</p>
            <p className="mt-1">출처: 한국교육과정평가원(KICE), "영어과 교육과정 성취기준 적정화 연구", 2023</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
