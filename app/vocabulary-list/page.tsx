import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function VocabularyList() {
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
            <h1 className="text-3xl font-bold text-slate-900">수능 어휘/collocation 리스트</h1>
          </div>
          <p className="text-slate-600 mt-1">
            AWL(Academic Word List)의 570 단어와 수능 고난이도 지문에 자주 출제되는 내용을 분석하여 정리한 목록입니다
          </p>
        </div>
      </header>

      <main className="container mx-auto py-8">
        <Tabs defaultValue="academic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="academic">학술 어휘 목록 (AWL)</TabsTrigger>
            <TabsTrigger value="collocations">수능 영어지문 필수 Collocations</TabsTrigger>
          </TabsList>

          <TabsContent value="academic" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>수능 고난이도 문제 빈출 어휘 목록</CardTitle>
                <CardDescription>
                  AWL(Academic Word List)의 570 단어와 미국 대학교재 주요 어휘를 정리한 목록입니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-sm">
                    아래에 나열된 어휘 목록은 AWL(Academic Word List)의 570 단어와 수능 고난이도 지문에 자주 출제되는
                    내용을 분석하여 미국 대학 교재의 분야별 어휘를 정리한 목록입니다. Averil Coxhead 박사가 집필한
                    'Academic Word List'는 다양한 학문 분야에 걸쳐 널리 사용되는 어휘를 선정하였으나, 미국 대학 교재의
                    각 분야에서 유용하게 사용되는 어휘는 포함되지 않았습니다. 일상생활에 널리 쓰이는 어휘(2,000개)를
                    'General Service Vocabulary'라고 부르는데 이 어휘를 모두 알고 있다면 그 다음 학문 분야의 글을 읽기
                    위해서 숙지해야 할 어휘가 아래 목록의 어휘입니다.
                  </p>
                  <p className="text-sm mt-2">
                    이 목록은 최근 수능 고난이도 문항의 지문과 최근에 자주 등장하는 주제(topic) 지문을 분석하여 최신
                    트렌드를 반영하여 집필하였습니다. 일부 어휘는 한 개 이상의 범주(카테고리)에 중복해서 포함될 수
                    있습니다. 이는 해당 범주에서 관련성이 있는 어휘를 함께 학습함으로써, 그 어휘가 사용되는 맥락을
                    이해할 수 있도록 하기 위한 것입니다. 또한 다소 쉬운 단어가 간혹 포함되어 있는 경우가 있는데
                    마찬가지로 특정 학술 분야에서 관련 어휘와 함께 사용되는 맥락을 이해할 수 있도록 의도한 것입니다.
                  </p>
                  <p className="text-sm mt-2">
                    이 목록을 철저히 익히면 교과서 어휘만으로는 이해하기 어려운 미국 대학 수준의 학술적인 글을 읽는 데
                    도움이 됩니다. 수능 고난이도 문제 이해에 기여할 뿐만 아니라, 미국(영어사용권 등) 대학교재의 이해에도
                    큰 도움이 될 것입니다.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-4">Academic Disciplines (학문분야)</h3>

                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-2 bg-purple-100 p-2 rounded-md">Mathematics (수학)</h4>
                    <ul className="space-y-3">
                      <li className="border-b pb-2">
                        <span className="font-medium">calculate - v. 계산하다</span>
                        <p className="text-sm text-gray-600 mt-1">
                          (예문) Engineers calculate the stress on materials to ensure safety.
                        </p>
                      </li>
                      <li className="border-b pb-2">
                        <span className="font-medium">compare - v. 비교하다</span>
                        <p className="text-sm text-gray-600 mt-1">
                          (예문) Scientists compare experimental results to theoretical predictions.
                        </p>
                      </li>
                      <li className="border-b pb-2">
                        <span className="font-medium">dimension - n. 차원</span>
                        <p className="text-sm text-gray-600 mt-1">
                          (예문) The study explores the dimension of time in quantum mechanics.
                        </p>
                      </li>
                      <li className="border-b pb-2">
                        <span className="font-medium">formula - n. 공식</span>
                        <p className="text-sm text-gray-600 mt-1">
                          (예문) The quadratic formula is used to find the roots of a polynomial.
                        </p>
                      </li>
                      <li className="border-b pb-2">
                        <span className="font-medium">function - n. 함수</span>
                        <p className="text-sm text-gray-600 mt-1">
                          (예문) In computer science, a function performs a specific task.
                        </p>
                      </li>
                      <li className="border-b pb-2">
                        <span className="font-medium">measure - v. 측정하다</span>
                        <p className="text-sm text-gray-600 mt-1">
                          (예문) Researchers measure the variables to determine their impact.
                        </p>
                      </li>
                      <li className="border-b pb-2">
                        <span className="font-medium">ratio - n. 비율</span>
                        <p className="text-sm text-gray-600 mt-1">
                          (예문) The ratio of students to teachers affects the quality of education.
                        </p>
                      </li>
                      <li className="border-b pb-2">
                        <span className="font-medium">statistic - n. 통계</span>
                        <p className="text-sm text-gray-600 mt-1">
                          (예문) Statistics help in understanding trends in data.
                        </p>
                      </li>
                      <li className="border-b pb-2">
                        <span className="font-medium">variable - n. 변수</span>
                        <p className="text-sm text-gray-600 mt-1">
                          (예문) In experiments, a variable is controlled to observe its effects.
                        </p>
                      </li>
                    </ul>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-2 bg-blue-100 p-2 rounded-md">Physics (물리학)</h4>
                    <ul className="space-y-3">
                      <li className="border-b pb-2">
                        <span className="font-medium">energy - n. 에너지</span>
                        <p className="text-sm text-gray-600 mt-1">
                          (예문) Renewable energy sources are crucial for sustainable development.
                        </p>
                      </li>
                      <li className="border-b pb-2">
                        <span className="font-medium">mechanism - n. 기계적 작용</span>
                        <p className="text-sm text-gray-600 mt-1">
                          (예문) The mechanism of action in this reaction involves multiple steps.
                        </p>
                      </li>
                      <li className="border-b pb-2">
                        <span className="font-medium">phenomenon - n. 현상</span>
                        <p className="text-sm text-gray-600 mt-1">
                          (예문) The Northern Lights are a natural phenomenon that attracts many tourists.
                        </p>
                      </li>
                      <li className="border-b pb-2">
                        <span className="font-medium">physical - adj. 물리적인</span>
                        <p className="text-sm text-gray-600 mt-1">
                          (예문) The physical properties of materials determine their usability in different
                          applications.
                        </p>
                      </li>
                    </ul>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-2 bg-green-100 p-2 rounded-md">Chemistry (화학)</h4>
                    <ul className="space-y-3">
                      <li className="border-b pb-2">
                        <span className="font-medium">chemical - n. 화학물질</span>
                        <p className="text-sm text-gray-600 mt-1">
                          (예문) Chemical reactions are fundamental to the process of metabolism.
                        </p>
                      </li>
                      <li className="border-b pb-2">
                        <span className="font-medium">compound - n. 화합물</span>
                        <p className="text-sm text-gray-600 mt-1">
                          (예문) Water is a simple compound consisting of hydrogen and oxygen.
                        </p>
                      </li>
                      <li className="border-b pb-2">
                        <span className="font-medium">element - n. 원소</span>
                        <p className="text-sm text-gray-600 mt-1">
                          (예문) Carbon is a versatile element essential for life on Earth.
                        </p>
                      </li>
                      <li className="border-b pb-2">
                        <span className="font-medium">molecule - n. 분자</span>
                        <p className="text-sm text-gray-600 mt-1">
                          (예문) The structure of a molecule determines its chemical behavior.
                        </p>
                      </li>
                      <li className="border-b pb-2">
                        <span className="font-medium">react - v. 반응하다</span>
                        <p className="text-sm text-gray-600 mt-1">
                          (예문) When sodium reacts with water, it produces sodium hydroxide and hydrogen gas.
                        </p>
                      </li>
                      <li className="border-b pb-2">
                        <span className="font-medium">substance - n. 물질</span>
                        <p className="text-sm text-gray-600 mt-1">
                          (예문) Identifying the unknown substance requires precise chemical analysis.
                        </p>
                      </li>
                    </ul>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-2 bg-amber-100 p-2 rounded-md">Biology (생물학)</h4>
                    <ul className="space-y-3">
                      <li className="border-b pb-2">
                        <span className="font-medium">biology - n. 생물학</span>
                        <p className="text-sm text-gray-600 mt-1">
                          (예문) Biology explores the complexity of living organisms and their interactions.
                        </p>
                      </li>
                      <li className="border-b pb-2">
                        <span className="font-medium">evolve - v. 진화하다</span>
                        <p className="text-sm text-gray-600 mt-1">
                          (예문) Species evolve over time through natural selection and genetic variation.
                        </p>
                      </li>
                      <li className="border-b pb-2">
                        <span className="font-medium">genetic - adj. 유전의</span>
                        <p className="text-sm text-gray-600 mt-1">
                          (예문) Genetic mutations can lead to various hereditary diseases.
                        </p>
                      </li>
                      <li className="border-b pb-2">
                        <span className="font-medium">organism - n. 유기체</span>
                        <p className="text-sm text-gray-600 mt-1">
                          (예문) Each organism plays a unique role in its ecosystem.
                        </p>
                      </li>
                    </ul>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-2 bg-red-100 p-2 rounded-md">
                      Economics and Business (경제학 및 비즈니스)
                    </h4>
                    <ul className="space-y-3">
                      <li className="border-b pb-2">
                        <span className="font-medium">account - n. 계좌</span>
                        <p className="text-sm text-gray-600 mt-1">
                          (예문) Maintaining a savings account is essential for financial stability.
                        </p>
                      </li>
                      <li className="border-b pb-2">
                        <span className="font-medium">capital - n. 자본</span>
                        <p className="text-sm text-gray-600 mt-1">
                          (예문) Businesses require capital to invest in new technologies and expand operations.
                        </p>
                      </li>
                      <li className="border-b pb-2">
                        <span className="font-medium">commerce - n. 상업</span>
                        <p className="text-sm text-gray-600 mt-1">
                          (예문) E-commerce has revolutionized the way people shop and conduct business.
                        </p>
                      </li>
                      <li className="border-b pb-2">
                        <span className="font-medium">commission - n. 수수료</span>
                        <p className="text-sm text-gray-600 mt-1">
                          (예문) Sales representatives earn a commission based on their performance.
                        </p>
                      </li>
                      <li className="border-b pb-2">
                        <span className="font-medium">commodity - n. 상품</span>
                        <p className="text-sm text-gray-600 mt-1">
                          (예문) Oil is a valuable commodity traded on global markets.
                        </p>
                      </li>
                      <li className="border-b pb-2">
                        <span className="font-medium">consume - v. 소비하다</span>
                        <p className="text-sm text-gray-600 mt-1">
                          (예문) Consumers tend to spend more during holiday seasons.
                        </p>
                      </li>
                      <li className="border-b pb-2">
                        <span className="font-medium">corporate - adj. 기업의</span>
                        <p className="text-sm text-gray-600 mt-1">
                          (예문) Corporate governance ensures that companies operate ethically and efficiently.
                        </p>
                      </li>
                      <li className="border-b pb-2">
                        <span className="font-medium">economy - n. 경제</span>
                        <p className="text-sm text-gray-600 mt-1">
                          (예문) The global economy is influenced by factors such as trade policies and consumer
                          spending.
                        </p>
                      </li>
                      <li className="border-b pb-2">
                        <span className="font-medium">finance - n. 재정</span>
                        <p className="text-sm text-gray-600 mt-1">
                          (예문) Understanding finance is crucial for managing personal and corporate budgets
                          effectively.
                        </p>
                      </li>
                      <li className="border-b pb-2">
                        <span className="font-medium">invest - v. 투자하다</span>
                        <p className="text-sm text-gray-600 mt-1">
                          (예문) Investors often seek to diversify their portfolios to minimize risk.
                        </p>
                      </li>
                    </ul>
                  </div>

                  {/* More categories would be added here */}
                  <div className="text-center mt-8">
                    <p className="text-gray-500">
                      이 페이지에는 일부 어휘만 표시되어 있습니다. 전체 목록은 PDF 자료를 참고하세요.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="collocations" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>수능 영어지문 필수 Collocations(연결어) 목록</CardTitle>
                <CardDescription>
                  최근에 중요하게 등장하는 주제를 논할 때 자주 사용되는 연결어(collocations) 목록입니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-sm">
                    아래의 표현들은 최근에 중요하게 등장하는 주제를 논할 때 자주 사용되는 연결어(collocations)
                    목록입니다. 암기해두면 수능 지문 이해는 물론 대학 원서와 신문 등 최근의 이슈들에 관련된 지문을 읽을
                    때 매우 유용합니다. 꼭 익혀 두세요.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-4">Climate Change and Environment (기후 변화 및 환경)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                      <ul className="space-y-2">
                        <li className="flex">
                          <span className="font-medium min-w-[180px]">climate change:</span>
                          <span>기후 변화</span>
                        </li>
                        <li className="flex">
                          <span className="font-medium min-w-[180px]">carbon emissions:</span>
                          <span>탄소 배출</span>
                        </li>
                        <li className="flex">
                          <span className="font-medium min-w-[180px]">renewable energy:</span>
                          <span>재생 에너지</span>
                        </li>
                        <li className="flex">
                          <span className="font-medium min-w-[180px]">greenhouse gas emissions:</span>
                          <span>온실가스 배출</span>
                        </li>
                        <li className="flex">
                          <span className="font-medium min-w-[180px]">for future generations:</span>
                          <span>미래 세대를 위해</span>
                        </li>
                        <li className="flex">
                          <span className="font-medium min-w-[180px]">fossil fuels:</span>
                          <span>화석 연료</span>
                        </li>
                      </ul>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                      <ul className="space-y-2">
                        <li className="flex">
                          <span className="font-medium min-w-[180px]">future generations:</span>
                          <span>미래 세대</span>
                        </li>
                        <li className="flex">
                          <span className="font-medium min-w-[180px]">help reduce:</span>
                          <span>줄이는 데 도움</span>
                        </li>
                        <li className="flex">
                          <span className="font-medium min-w-[180px]">natural resources:</span>
                          <span>자연 자원</span>
                        </li>
                        <li className="flex">
                          <span className="font-medium min-w-[180px]">potential risks:</span>
                          <span>잠재적 위험</span>
                        </li>
                        <li className="flex">
                          <span className="font-medium min-w-[180px]">renewable energy sources:</span>
                          <span>재생 에너지 원</span>
                        </li>
                        <li className="flex">
                          <span className="font-medium min-w-[180px]">energy consumption:</span>
                          <span>에너지 소비</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-4">Education and Learning (교육 및 학습)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <ul className="space-y-2">
                        <li className="flex">
                          <span className="font-medium min-w-[180px]">foreign language:</span>
                          <span>외국어</span>
                        </li>
                        <li className="flex">
                          <span className="font-medium min-w-[180px]">teaching methods:</span>
                          <span>교수법</span>
                        </li>
                        <li className="flex">
                          <span className="font-medium min-w-[180px]">learning process:</span>
                          <span>학습 과정</span>
                        </li>
                        <li className="flex">
                          <span className="font-medium min-w-[180px]">educational systems:</span>
                          <span>교육 시스템</span>
                        </li>
                        <li className="flex">
                          <span className="font-medium min-w-[180px]">learning disabilities:</span>
                          <span>학습 장애</span>
                        </li>
                        <li className="flex">
                          <span className="font-medium min-w-[180px]">learning experience:</span>
                          <span>학습 경험</span>
                        </li>
                      </ul>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <ul className="space-y-2">
                        <li className="flex">
                          <span className="font-medium min-w-[180px]">education and training:</span>
                          <span>교육 및 훈련</span>
                        </li>
                        <li className="flex">
                          <span className="font-medium min-w-[180px]">educational programs:</span>
                          <span>교육 프로그램</span>
                        </li>
                        <li className="flex">
                          <span className="font-medium min-w-[180px]">helps students:</span>
                          <span>학생들을 돕다</span>
                        </li>
                        <li className="flex">
                          <span className="font-medium min-w-[180px]">process of learning:</span>
                          <span>학습 과정</span>
                        </li>
                        <li className="flex">
                          <span className="font-medium min-w-[180px]">teachers and students:</span>
                          <span>교사와 학생</span>
                        </li>
                        <li className="flex">
                          <span className="font-medium min-w-[180px]">teaching and learning:</span>
                          <span>교육 및 학습</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-4">Mental Health (정신 건강)</h3>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <ul className="space-y-2">
                      <li className="flex">
                        <span className="font-medium min-w-[180px]">mental health:</span>
                        <span>정신 건강</span>
                      </li>
                      <li className="flex">
                        <span className="font-medium min-w-[180px]">anxiety and depression:</span>
                        <span>불안과 우울증</span>
                      </li>
                      <li className="flex">
                        <span className="font-medium min-w-[180px]">need help:</span>
                        <span>도움이 필요하다</span>
                      </li>
                      <li className="flex">
                        <span className="font-medium min-w-[180px]">seek help:</span>
                        <span>도움을 청하다</span>
                      </li>
                      <li className="flex">
                        <span className="font-medium min-w-[180px]">reduce stress:</span>
                        <span>스트레스를 줄이다</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-4">Society and Economy (사회 및 경제)</h3>
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                    <ul className="space-y-2">
                      <li className="flex">
                        <span className="font-medium min-w-[180px]">religious freedom:</span>
                        <span>종교의 자유</span>
                      </li>
                      <li className="flex">
                        <span className="font-medium min-w-[180px]">social and economic:</span>
                        <span>사회적 및 경제적</span>
                      </li>
                      <li className="flex">
                        <span className="font-medium min-w-[180px]">equal access to:</span>
                        <span>동등한 접근</span>
                      </li>
                      <li className="flex">
                        <span className="font-medium min-w-[180px]">freedom of religion:</span>
                        <span>종교의 자유</span>
                      </li>
                      <li className="flex">
                        <span className="font-medium min-w-[180px]">economic growth:</span>
                        <span>경제 성장</span>
                      </li>
                      <li className="flex">
                        <span className="font-medium min-w-[180px]">global economy:</span>
                        <span>세계 경제</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* More collocation categories would be added here */}
                <div className="text-center mt-8">
                  <p className="text-gray-500">
                    이 페이지에는 일부 연결어만 표시되어 있습니다. 전체 목록은 PDF 자료를 참고하세요.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="bg-white border-t py-6 mt-8">
        <div className="container mx-auto">
          <div className="text-center text-sm text-slate-500">
            <p>© 2025 대한민국 영어교육 개선 시스템. All rights reserved.</p>
            <p className="mt-1">출처: Coxhead, A. (1998). An Academic Word List. Occasional Publication Number 18.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
