import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen, Code2 } from "lucide-react"
import Link from "next/link"

export default function CSATQuestionGeneration() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="container mx-auto py-6 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-1">
                  <ArrowLeft className="h-4 w-4" />
                  <span>홈으로</span>
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-slate-900">수능 문항 생성 이해하기</h1>
            </div>
            <p className="text-slate-600 mt-1">
              수능 영어 문항 생성의 원칙과 방법론을 이해하고 효과적인 문항 제작 방법을 알아봅니다
            </p>
          </div>
          <div className="flex gap-2">
            <Button className="bg-teal-800 hover:bg-teal-900 text-white" asChild>
              <Link href="/vocabulary-list">수능 어휘/collocation 리스트</Link>
            </Button>
            <Button className="bg-teal-800 hover:bg-teal-900 text-white">수능 기출문제</Button>
            <Button className="bg-teal-800 hover:bg-teal-900 text-white">수능 문항 평가 루브릭</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-white">
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-purple-700" />
              </div>
              <CardTitle className="text-xl">검사지 구성원칙 쉽게 이해하기</CardTitle>
              <CardDescription>수능 영어 문항 제작의 기본 원칙과 구성 방법을 알아봅니다</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-lg border">
                  <h3 className="font-medium text-lg mb-2">수능 영어 문항 구성 원칙</h3>
                  <ul className="list-disc pl-5 space-y-2 text-sm">
                    <li>
                      <span className="font-medium">타당도 확보:</span> 교육과정에 명시된 성취기준과 평가 목표에
                      부합하는 문항 개발
                    </li>
                    <li>
                      <span className="font-medium">신뢰도 확보:</span> 일관된 평가 결과를 얻을 수 있는 객관적 문항 설계
                    </li>
                    <li>
                      <span className="font-medium">변별도 고려:</span> 학생들의 능력 차이를 적절히 구분할 수 있는
                      난이도 설정
                    </li>
                    <li>
                      <span className="font-medium">실용성 강화:</span> 실생활 및 학문적 맥락에서 활용 가능한 영어 능력
                      평가
                    </li>
                  </ul>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border">
                  <h3 className="font-medium text-lg mb-2">문항 유형별 특성</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm">듣기 문항</h4>
                      <p className="text-xs text-slate-600 mt-1">
                        실제 의사소통 상황을 반영한 대화 및 담화 이해 능력 평가, 다양한 억양과 속도 고려
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">읽기 문항</h4>
                      <p className="text-xs text-slate-600 mt-1">
                        다양한 장르의 글에 대한 이해력, 추론 능력, 비판적 사고력 평가
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">어휘/문법 문항</h4>
                      <p className="text-xs text-slate-600 mt-1">맥락 속에서의 어휘 활용 능력과 문법적 정확성 평가</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border">
                  <h3 className="font-medium text-lg mb-2">교육과정-수능 문항 간 격차 분석</h3>
                  <p className="text-sm text-slate-600">
                    교육과정에서 제시하는 성취기준과 실제 수능 문항 간의 난이도 및 내용 격차를 분석하고, 이를 해소하기
                    위한 방안을 제시합니다.
                  </p>
                </div>
              </div>

              <div className="mt-8 border-t pt-6">
                <h2 className="text-xl font-bold text-purple-800 mb-4">
                  영어 평가 검사지 구성 원칙: 쉽게 풀어 설명하기
                </h2>
                <p className="text-sm text-slate-700 mb-4">
                  영어 시험지를 어떻게 만들면 좋을지에 대한 김용명(2010)의 네 가지 원칙을, 평범한 영어교사가 바로 이해할
                  수 있도록 비유와 실제 사례를 들어 설명합니다.
                </p>

                <hr className="my-4 border-gray-300" />

                <div className="space-y-6">
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h3 className="text-lg font-semibold text-purple-800 mb-2">
                      1. 상보성(Complementarity): "샐러드 만들기" 비유
                    </h3>

                    <div className="mb-3">
                      <h4 className="font-medium text-purple-700 mb-1">비유:</h4>
                      <p className="text-sm text-slate-700">
                        샐러드를 만들 때, 오이만 가득 넣으면 맛이 단조롭고 영양도 부족합니다. 오이, 토마토, 치즈, 양상추
                        등 다양한 재료가 어우러져야 맛있고 건강한 샐러드가 되죠.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-purple-700 mb-1">시험에 적용:</h4>
                      <p className="text-sm text-slate-700">
                        시험 문제도 마찬가지로, 다양한 유형(예: 내용 일치, 빈칸 추론, 목적 찾기 등)을 골고루 포함해야
                        합니다. 만약 비슷한 문제(예: 주제, 제목, 요지 추론)만 반복되면, 학생의 한 가지 능력만 재는
                        셈이어서 좋은 시험이 아닙니다.
                      </p>
                      <p className="text-sm font-medium text-purple-800 mt-2">
                        즉, 여러 가지 문제 유형을 조화롭게 섞어야 학생들의 다양한 영어 능력을 고루 평가할 수 있습니다.
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">
                      2. 통합성(Integration): "운동 경기" 비유
                    </h3>

                    <div className="mb-3">
                      <h4 className="font-medium text-blue-700 mb-1">비유:</h4>
                      <p className="text-sm text-slate-700">
                        축구 경기에서는 달리기, 패스, 슛, 협동 등 여러 기술이 한꺼번에 필요합니다. 달리기만 잘한다고
                        축구를 잘하는 게 아니죠.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-blue-700 mb-1">시험에 적용:</h4>
                      <p className="text-sm text-slate-700">
                        영어도 듣기, 읽기, 말하기, 쓰기를 따로따로 평가하기보다는, 실제 상황처럼 여러 기능이 어우러진
                        문제(예: 듣고 말하기, 읽고 쓰기 연계 문제)를 포함하는 것이 좋습니다.
                      </p>
                      <div className="mt-2">
                        <h5 className="text-sm font-medium text-blue-700 mb-1">예시:</h5>
                        <ul className="list-disc pl-5 text-sm text-slate-700">
                          <li>듣고 대답하기(듣기+말하기)</li>
                          <li>글을 읽고 이어질 내용을 쓰기(읽기+쓰기)</li>
                        </ul>
                      </div>
                      <p className="text-sm text-slate-700 mt-2">
                        이렇게 여러 기능을 통합한 문제는 실제 영어 사용과 더 닮아 있고, 학생들의 종합적인 영어 실력을
                        평가할 수 있습니다.
                      </p>
                    </div>
                  </div>

                  <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                    <h3 className="text-lg font-semibold text-teal-800 mb-2">
                      3. 주축성(Pivotality): "자전거 바퀴" 비유
                    </h3>

                    <div className="mb-3">
                      <h4 className="font-medium text-teal-700 mb-1">비유:</h4>
                      <p className="text-sm text-slate-700">
                        자전거 바퀴에는 중심 축(허브)과 바깥쪽 살(스포크)이 있습니다. 중심 축이 튼튼해야 자전거가 잘
                        굴러가고, 살이 여러 개 있어야 바퀴가 다양한 충격도 견딜 수 있습니다.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-teal-700 mb-1">시험에 적용:</h4>
                      <p className="text-sm text-slate-700">
                        시험 문제도 중심이 되는 '주축 문제'(예: 정답률이 일정하고, 난이도가 높아 실력을 잘 가려내는
                        문제)가 있어야 하고, 다양한 유형의 '주변 문제'(예: 난이도나 정답률이 다양한 문제)도 있어야
                        합니다.
                      </p>
                      <p className="text-sm font-medium text-teal-800 mt-2">
                        즉, 시험의 핵심과 다양성을 모두 챙겨야 좋은 시험이 됩니다.
                      </p>
                    </div>
                  </div>

                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <h3 className="text-lg font-semibold text-amber-800 mb-2">
                      4. 위계성(Hierarchicality): "계단 오르기" 비유
                    </h3>

                    <div className="mb-3">
                      <h4 className="font-medium text-amber-700 mb-1">비유:</h4>
                      <p className="text-sm text-slate-700">
                        계단을 오를 때 한 번에 너무 높은 계단을 오르면 힘들고, 낮은 계단부터 차근차근 올라야 합니다.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-amber-700 mb-1">시험에 적용:</h4>
                      <p className="text-sm text-slate-700">
                        문제의 난이도도 학생들의 수준에 맞게 단계별로 구성해�� 합니다.
                      </p>
                      <ul className="list-disc pl-5 text-sm text-slate-700 mt-2">
                        <li>쉬운 문제(L형)는 기초 실력을 평가하고,</li>
                        <li>중간 난이도(M형)는 평균 학생을,</li>
                        <li>어려운 문제(H형)는 상위권 학생을 변별할 수 있게 합니다.</li>
                      </ul>
                      <p className="text-sm text-slate-700 mt-2">
                        이렇게 다양한 난이도의 문제를 섞으면, 모든 학생이 자신의 실력을 발휘할 수 있고, 시험의 공정성과
                        신뢰성이 높아집니다.
                      </p>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">추가: "적당한 도전" 원칙</h3>

                    <div className="mb-3">
                      <h4 className="font-medium text-green-700 mb-1">비유:</h4>
                      <p className="text-sm text-slate-700">
                        자전거를 처음 배울 때, 너무 어려운 코스를 주면 포기하고, 너무 쉬우면 실력이 늘지 않습니다.
                        적당히 도전적인 과제가 필요합니다.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-green-700 mb-1">시험에 적용:</h4>
                      <p className="text-sm text-slate-700">
                        학생의 현재 실력보다 약간 더 어려운 문제를 내면, 학생은 도전 의식을 가지고 성장할 수 있습니다.
                      </p>
                      <p className="text-sm font-medium text-green-800 mt-2">
                        즉, 학생 수준에 맞는 과제를 단계적으로 제시하는 것이 중요합니다.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-gray-50 p-4 rounded-lg border">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">요약</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded mr-2 text-sm font-medium">
                        샐러드
                      </span>
                      <span className="text-sm">다양한 문제를 골고루</span>
                    </li>
                    <li className="flex items-center">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2 text-sm font-medium">
                        운동 경기
                      </span>
                      <span className="text-sm">여러 기능을 통합</span>
                    </li>
                    <li className="flex items-center">
                      <span className="bg-teal-100 text-teal-800 px-2 py-1 rounded mr-2 text-sm font-medium">
                        자전거 바퀴
                      </span>
                      <span className="text-sm">핵심과 다양성의 균형</span>
                    </li>
                    <li className="flex items-center">
                      <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded mr-2 text-sm font-medium">
                        계단 오르기
                      </span>
                      <span className="text-sm">난이도 단계별 구성</span>
                    </li>
                    <li className="flex items-center">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded mr-2 text-sm font-medium">
                        자전거 코스
                      </span>
                      <span className="text-sm">적당한 도전 부여</span>
                    </li>
                  </ul>
                  <p className="text-sm text-slate-700 mt-4">
                    이렇게 하면, 학생들의 다양한 영어 능력을 정확하고 공정하게 평가할 수 있는 좋은 시험지를 만들 수
                    있습니다.
                  </p>
                </div>

                <div className="mt-6 text-xs text-slate-500">
                  <p className="font-medium mb-1">Citations:</p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>김용명(2010). 영어 평가 검사지 구성 원칙에 관한 연구.</li>
                    <li>한국과학기술정보연구원. Korean Journal of Educational Research, v16n4.</li>
                    <li>Frontiers in Education. Language Testing and Assessment.</li>
                    <li>Cambridge English. Assessment and Analytical Framework.</li>
                    <li>OECD. PISA 2018 Assessment and Analytical Framework.</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-white">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Code2 className="h-6 w-6 text-blue-700" />
              </div>
              <CardTitle className="text-xl">LLM을 이용한 수능문항 생성방법</CardTitle>
              <CardDescription>인공지능 기술을 활용한 효과적인 수능 영어 문항 생성 방법을 소개합니다</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-lg border">
                  <h3 className="font-medium text-lg mb-2">LLM 활용 문항 생성 프로세스</h3>
                  <ol className="list-decimal pl-5 space-y-2 text-sm">
                    <li>교육과정 성취기준 및 평가 목표 설정</li>
                    <li>적절한 난이도와 주제의 지문 선정 또는 생성</li>
                    <li>문항 유형 및 평가 요소 결정</li>
                    <li>LLM을 활용한 초기 문항 생성</li>
                    <li>전문가 검토 및 수정</li>
                    <li>시험 문항 최종 확정</li>
                  </ol>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border">
                  <h3 className="font-medium text-lg mb-2">효과적인 프롬프트 엔지니어링</h3>
                  <p className="text-sm text-slate-600 mb-3">
                    LLM을 활용하여 양질의 수능 문항을 생성하기 위한 프롬프트 작성 방법과 예시를 제공합니다.
                  </p>
                  <div className="bg-gray-100 p-3 rounded-md text-xs font-mono">
                    <p className="text-blue-700">{"// 예시 프롬프트"}</p>
                    <p>{"다음 조건에 맞는 수능 영어 독해 문항을 생성해주세요:"}</p>
                    <p>{"1. 주제: 환경 보호와 지속 가능한 발전"}</p>
                    <p>{"2. 난이도: 상위 30% 학생 대상"}</p>
                    <p>{"3. 문항 유형: 빈칸 추론"}</p>
                    <p>{"4. 지문 길이: 250-300단어"}</p>
                    <p>{"5. 평가 요소: 논리적 추론 능력, 맥락 이해 능력"}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border">
                  <h3 className="font-medium text-lg mb-2">LLM 생성 문항의 검증 방법</h3>
                  <ul className="list-disc pl-5 space-y-2 text-sm">
                    <li>
                      <span className="font-medium">교육과정 부합도:</span> 성취기준과의 일치성 검토
                    </li>
                    <li>
                      <span className="font-medium">난이도 적절성:</span> 목표 학생층에 맞는 난이도 확인
                    </li>
                    <li>
                      <span className="font-medium">문화적 편향성:</span> 특정 문화나 배경에 편향되지 않았는지 확인
                    </li>
                    <li>
                      <span className="font-medium">언어적 정확성:</span> 문법, 어휘, 표현의 정확성 검증
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 border-t pt-6">
                <h2 className="text-xl font-bold text-blue-800 mb-4">LLM을 활용한 수능 영어 문제 출제 방법</h2>
                <p className="text-sm text-slate-700 mb-4">
                  LLM(대형 언어 모델)을 이용해 수능 영어 문제를 제대로 만들기 위해서는 단순히 문제를 생성하는 것을
                  넘어서, 문제의 질과 시험지의 구조까지 신경 써야 합니다. 김용명(2010)이 제안한 네 가지 검사지 구성
                  원칙(상보성, 통합성, 주축성, 위계성)을 LLM 활용에 적용하는 방법을 구체적으로 설명합니다.
                </p>
                <hr className="my-4 border-gray-300" />
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">1. 상보성(Complementarity) 원칙 적용</h3>
                    <div className="mb-3">
                      <h4 className="font-medium text-blue-700 mb-1">핵심:</h4>
                      <p className="text-sm text-slate-700">
                        문제 유형, 평가 영역, 내용이 서로 보완적이어야 하며, 동일한 능력만 반복 측정하지 않도록 해야
                        합니다.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-blue-700 mb-1">LLM 활용 방법:</h4>
                      <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
                        <li>
                          다양한 유형의 문제(예: 사실적 이해, 추론적 이해, 종합적 이해 등)를 LLM에게 명확히 지시하여
                          생성합니다.
                        </li>
                        <li>
                          <p className="mb-1">예시 프롬프트:</p>
                          <ul className="list-none pl-4 space-y-1 text-blue-600 font-mono text-xs">
                            <li>"Create a reading comprehension question that tests factual understanding."</li>
                            <li>"Generate an inference question based on the given passage."</li>
                            <li>
                              "Produce a question that requires synthesizing information from multiple sentences."
                            </li>
                          </ul>
                        </li>
                        <li>
                          생성된 문제들이 서로 다른 읽기 능력(상향식, 하향식, 상호작용식 등)을 평가하는지 점검합니다.
                        </li>
                        <li>
                          유사 유형(예: 주제, 제목, 요지 추론 등)만 반복되지 않도록 LLM이 만든 문제를 검토하고, 필요시
                          유형별로 묶어 '메타 문항'으로 관리합니다.
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <h3 className="text-lg font-semibold text-indigo-800 mb-2">2. 통합성(Integration) 원칙 적용</h3>
                    <div className="mb-3">
                      <h4 className="font-medium text-indigo-700 mb-1">핵심:</h4>
                      <p className="text-sm text-slate-700">
                        듣기, 읽기, 말하기, 쓰기 등 언어의 여러 기능이 통합적으로 평가되어야 하며, 실제 언어 사용 상황과
                        유사해야 합니다.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-indigo-700 mb-1">LLM 활용 방법:</h4>
                      <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
                        <li>
                          LLM에게 듣기와 말하기, 읽기와 쓰기 등 두 가지 이상의 기능이 결합된 문제를 만들도록 요청합니다.
                        </li>
                        <li>
                          <p className="mb-1">예시 프롬프트:</p>
                          <ul className="list-none pl-4 space-y-1 text-indigo-600 font-mono text-xs">
                            <li>
                              "Create a question where students must listen to a dialogue and then choose the most
                              appropriate response (listening + speaking)."
                            </li>
                            <li>
                              "Generate a reading passage followed by a writing prompt that asks students to summarize
                              or continue the story (reading + writing)."
                            </li>
                          </ul>
                        </li>
                        <li>
                          실제 수능 문제 유형(예: 듣고 대화에 응답, 글의 이어질 순서 등)을 참고해 연계형 문항을
                          포함시킵니다.
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
                    <h3 className="text-lg font-semibold text-cyan-800 mb-2">3. 주축성(Pivotality) 원칙 적용</h3>
                    <div className="mb-3">
                      <h4 className="font-medium text-cyan-700 mb-1">핵심:</h4>
                      <p className="text-sm text-slate-700">
                        시험의 안정성과 변별력을 책임지는 '주축 문항'과, 시험의 다양성을 높이는 '주변 문항'이 균형 있게
                        포함되어야 합니다.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-cyan-700 mb-1">LLM 활용 방법:</h4>
                      <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
                        <li>LLM에게 평균적인 난이도와 변별력이 높은 '핵심 문항'을 우선 생성하도록 요청합니다.</li>
                        <li>
                          <p className="mb-1">예시 프롬프트:</p>
                          <ul className="list-none pl-4 space-y-1 text-cyan-600 font-mono text-xs">
                            <li>
                              "Generate a core reading comprehension question that is moderately difficult and
                              discriminates well among students of different ability levels."
                            </li>
                          </ul>
                        </li>
                        <li>다양한 난이도와 유형의 '주변 문항'도 함께 생성하도록 지시합니다.</li>
                        <li>
                          각 문항의 정답률이나 예상 난이도를 LLM에 평가하게 하거나, 샘플 데이터를 활용해 교사가 직접
                          조정합니다.
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-sky-50 p-4 rounded-lg border border-sky-200">
                    <h3 className="text-lg font-semibold text-sky-800 mb-2">4. 위계성(Hierarchicality) 원칙 적용</h3>
                    <div className="mb-3">
                      <h4 className="font-medium text-sky-700 mb-1">핵심:</h4>
                      <p className="text-sm text-slate-700">
                        문항의 난이도와 복잡도가 학생의 실제 수행력 단계와 일치해야 하며, 쉬운 문제부터 어려운 문제까지
                        단계적으로 배치해야 합니다.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-sky-700 mb-1">LLM 활용 방법:</h4>
                      <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
                        <li>LLM에게 난이도(쉬움, 보통, 어려움)를 명확히 지정해 문제를 생성하도록 합니다.</li>
                        <li>
                          <p className="mb-1">예시 프롬프트:</p>
                          <ul className="list-none pl-4 space-y-1 text-sky-600 font-mono text-xs">
                            <li>"Create an easy question suitable for lower-level students."</li>
                            <li>
                              "Generate a challenging question that only high-level students are likely to answer
                              correctly."
                            </li>
                          </ul>
                        </li>
                        <li>
                          문항 반응 곡선(L형, M형, H형)에 따라 LLM이 만든 문제를 분류하거나, 샘플 풀이 결과를 바탕으로
                          난이도를 조정합니다.
                        </li>
                        <li>
                          전체 시험지에서 L/M/H형 문제 비율을 조절하여, 하위~상위권 학생 모두에게 적합한 변별력을
                          확보합니다.
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">실제 적용 예시</h3>
                    <table className="min-w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-4 py-2 text-left">원칙</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">LLM 프롬프트 예시</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">점검 포인트</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 font-medium">상보성</td>
                          <td className="border border-gray-300 px-4 py-2 text-blue-600 font-mono text-xs">
                            "Infer the author's attitude from the passage."
                          </td>
                          <td className="border border-gray-300 px-4 py-2">유형 중복 없이 다양한 능력 평가</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 font-medium">통합성</td>
                          <td className="border border-gray-300 px-4 py-2 text-blue-600 font-mono text-xs">
                            "Listen to this audio and write a summary."
                          </td>
                          <td className="border border-gray-300 px-4 py-2">두 기능(듣기+쓰기) 통합</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 font-medium">주축성</td>
                          <td className="border border-gray-300 px-4 py-2 text-blue-600 font-mono text-xs">
                            "Create a question with moderate difficulty and high validity."
                          </td>
                          <td className="border border-gray-300 px-4 py-2">정답률, 난이도, 변별력 고려</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 font-medium">위계성</td>
                          <td className="border border-gray-300 px-4 py-2 text-blue-600 font-mono text-xs">
                            "Make three questions: easy, medium, hard."
                          </td>
                          <td className="border border-gray-300 px-4 py-2">난이도별 단계적 배치</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">추가 팁:</h3>
                    <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
                      <li>
                        <span className="font-medium">교육과정 연계:</span> LLM에게 반드시 최신 교육과정(예: 2015 개정
                        교육과정)과 수능 출제 범위, 어휘 수준을 반영하도록 지시합니다.
                      </li>
                      <li>
                        <span className="font-medium">문항 검토 및 수정:</span> LLM이 생성한 문제는 반드시 교사가 직접
                        검토·수정하여 실제 수능의 질적 기준에 맞는지 확인합니다.
                      </li>
                      <li>
                        <span className="font-medium">메타 문항 관리:</span> 동일 능력 측정 문항은 묶어서 관리하고,
                        필요시 교체하거나 제거합니다.
                      </li>
                      <li>
                        <span className="font-medium">학생 수행력 고려:</span> 'Performability Principle'에 따라 학생의
                        현재 수준보다 약간 높은 난이도의 과업도 포함시켜 동기와 학습 효과를 높입니다.
                      </li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-800 mb-3">결론</h3>
                    <p className="text-sm text-slate-700 mb-3">LLM을 이용한 수능 영어 문제 출제는,</p>
                    <ul className="list-none space-y-2 mb-3">
                      <li className="flex items-center">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2 text-sm font-medium">
                          다양성
                        </span>
                        <span className="text-sm">(상보성)</span>
                      </li>
                      <li className="flex items-center">
                        <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded mr-2 text-sm font-medium">
                          기능 통합
                        </span>
                        <span className="text-sm">(통합성)</span>
                      </li>
                      <li className="flex items-center">
                        <span className="bg-cyan-100 text-cyan-800 px-2 py-1 rounded mr-2 text-sm font-medium">
                          핵심-주변 균형
                        </span>
                        <span className="text-sm">(주축성)</span>
                      </li>
                      <li className="flex items-center">
                        <span className="bg-sky-100 text-sky-800 px-2 py-1 rounded mr-2 text-sm font-medium">
                          난이도 위계
                        </span>
                        <span className="text-sm">(위계성)</span>
                      </li>
                    </ul>
                    <p className="text-sm text-slate-700">
                      을 반드시 반영해야 하며, LLM의 강점을 최대한 활용하되, 교사의 전문적 검토와 최종 조정이
                      필수적입니다. 이 네 가지 원칙을 염두에 두고 LLM을 설계·운영하면, 실제 수능에 부합하는 고품질 영어
                      평가 문항을 만들 수 있습니다.
                    </p>
                  </div>
                </div>
                <div className="mt-6 text-xs text-slate-500">
                  <p className="font-medium mb-1">Citations:</p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>김용명(2010). 영어 평가 검사지 구성 원칙에 관한 연구.</li>
                    <li>한국과학기술정보연구원. Korean Journal of Educational Research.</li>
                    <li>교육부 블로그. 2015 개정 교육과정 관련 자료.</li>
                    <li>한국교육과정평가원. 수능 영어 영역 출제 방향.</li>
                    <li>한국학술정보. 영어 평가 문항 개발에 관한 연구.</li>
                  </ol>
                </div>
                \
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
