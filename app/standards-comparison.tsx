import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function StandardsComparison() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="container mx-auto py-6">
          <h1 className="text-3xl font-bold text-slate-900">영어성취 기준(standards) 비교표</h1>
          <p className="text-slate-600 mt-1">국제 기준과 한국 교육과정의 성취 기준을 비교합니다</p>
        </div>
      </header>

      <main className="container mx-auto py-8">
        <Tabs defaultValue="cefr" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="cefr">CEFR vs 교육과정</TabsTrigger>
            <TabsTrigger value="vocabulary">CEFR 어휘기준 vs 교육과정</TabsTrigger>
            <TabsTrigger value="lexile">Lexile 지수 vs 교육과정</TabsTrigger>
            <TabsTrigger value="us-kr">미국 vs 한국 교육과정</TabsTrigger>
            <TabsTrigger value="csat">수능 vs 국제 영어시험</TabsTrigger>
          </TabsList>

          <TabsContent value="cefr" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>CEFR 기준과 한국 영어교육과정 비교</CardTitle>
                <CardDescription>
                  유럽공통참조기준(CEFR)과 한국 영어교육과정의 성취기준을 학년별로 비교합니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>학년</TableHead>
                      <TableHead>한국 교육과정 목표</TableHead>
                      <TableHead>실제 평균 성취도</TableHead>
                      <TableHead>CEFR 기준</TableHead>
                      <TableHead>격차</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>초등 6학년</TableCell>
                      <TableCell>A1</TableCell>
                      <TableCell>A1 미만</TableCell>
                      <TableCell>A1-A2</TableCell>
                      <TableCell className="text-red-500">-1 단계</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>중등 3학년</TableCell>
                      <TableCell>A2</TableCell>
                      <TableCell>A1</TableCell>
                      <TableCell>A2-B1</TableCell>
                      <TableCell className="text-red-500">-1 단계</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>고등 3학년</TableCell>
                      <TableCell>B1</TableCell>
                      <TableCell>A2</TableCell>
                      <TableCell>B1-B2</TableCell>
                      <TableCell className="text-red-500">-1 단계</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <div className="mt-6 p-4 bg-slate-50 rounded-lg border">
                  <h3 className="font-medium mb-2">CEFR 레벨 설명</h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <strong>A1 (초급):</strong> 기초적인 표현을 이해하고 사용할 수 있음
                    </li>
                    <li>
                      <strong>A2 (초급):</strong> 일상적인 표현과 매우 기본적인 구문을 이해하고 사용할 수 있음
                    </li>
                    <li>
                      <strong>B1 (중급):</strong> 일과, 학교, 여가 등 친숙한 주제에 관해 명확한 표준 언어를 이해할 수
                      있음
                    </li>
                    <li>
                      <strong>B2 (중급):</strong> 구체적이거나 추상적인 주제의 복잡한 텍스트의 주요 내용을 이해할 수
                      있음
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vocabulary" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>CEFR 어휘 기준과 한국 영어교육과정 비교</CardTitle>
                <CardDescription>CEFR 레벨별 어휘 기준과 한국 영어교육과정의 어휘 목표를 비교합니다</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>CEFR 레벨</TableHead>
                      <TableHead>권장 어휘량</TableHead>
                      <TableHead>한국 교육과정 목표</TableHead>
                      <TableHead>실제 평균 성취도</TableHead>
                      <TableHead>격차</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>A1</TableCell>
                      <TableCell>600-1,200 단어</TableCell>
                      <TableCell>800 단어 (초등)</TableCell>
                      <TableCell>500 단어</TableCell>
                      <TableCell className="text-red-500">-300 단어</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>A2</TableCell>
                      <TableCell>1,200-2,500 단어</TableCell>
                      <TableCell>1,800 단어 (중등)</TableCell>
                      <TableCell>1,200 단어</TableCell>
                      <TableCell className="text-red-500">-600 단어</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>B1</TableCell>
                      <TableCell>2,500-3,300 단어</TableCell>
                      <TableCell>3,000 단어 (고등)</TableCell>
                      <TableCell>2,100 단어</TableCell>
                      <TableCell className="text-red-500">-900 단어</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>B2</TableCell>
                      <TableCell>3,300-5,000 단어</TableCell>
                      <TableCell>4,000 단어 (수능)</TableCell>
                      <TableCell>2,800 단어</TableCell>
                      <TableCell className="text-red-500">-1,200 단어</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lexile" className="mt-6">
            {/* Lexile 지수 비교 내용 */}
          </TabsContent>

          <TabsContent value="us-kr" className="mt-6">
            {/* 미국 vs 한국 교육과정 비교 내용 */}
          </TabsContent>

          <TabsContent value="csat" className="mt-6">
            {/* 수능 vs 국제 영어시험 비교 내용 */}
          </TabsContent>
        </Tabs>
      </main>

      <div className="container mx-auto py-4 border-t mt-8 mb-8">
        <h3 className="text-lg font-semibold mb-3">출처 및 참고자료</h3>
        <ul className="text-xs text-slate-600 space-y-2">
          <li id="source-1">1. 한국교육과정평가원(KICE), "영어과 교육과정 성취기준 적정화 연구", 2023</li>
          <li id="source-2">2. 한국교육과정평가원, "대학수학능력시험 영어 영역 문항 분석", 2022-2024</li>
          <li id="source-3">3. 교육부, "초중고 영어교육 현황 조사", 2024</li>
          <li id="source-4">
            4. Council of Europe, "Common European Framework of Reference for Languages (CEFR)", 2020
          </li>
          <li id="source-5">5. MetaMetrics Inc., "The Lexile Framework for Reading", 2023</li>
          <li id="source-6">6. U.S. Department of Education, "English Language Arts Standards", 2023</li>
          <li id="source-7">7. Cambridge Assessment English, "Vocabulary Size Research", 2022</li>
        </ul>
      </div>

      <footer className="bg-white border-t py-8">
        <div className="container mx-auto">
          <div className="text-center text-sm text-slate-500">
            © 2025 대한민국 영어교육 개선 시스템. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
