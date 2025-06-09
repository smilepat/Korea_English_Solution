"use client"

export default function LexileChart() {
  // 간단한 정적 차트로 대체
  return (
    <div className="w-full p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-1">Lexile 지수 기준</h2>
      <p className="text-center mb-1">수능 지문 1200L vs 교과서 1000L</p>
      <p className="text-center mb-4 text-sm text-gray-600">2023년 고3 43%가 1000L 미달 (출처: MetaMetrics, 2023)</p>

      <div className="border rounded-lg p-4 bg-gray-50">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">학년</th>
              <th className="border p-2 text-right">목표 궤적</th>
              <th className="border p-2 text-right">상위 5% 학생</th>
              <th className="border p-2 text-right">평균 학생</th>
              <th className="border p-2 text-right">하위 25% 학생</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-2">초3</td>
              <td className="border p-2 text-right">400</td>
              <td className="border p-2 text-right">300</td>
              <td className="border p-2 text-right">200</td>
              <td className="border p-2 text-right">100</td>
            </tr>
            <tr>
              <td className="border p-2">초6</td>
              <td className="border p-2 text-right">850</td>
              <td className="border p-2 text-right">500</td>
              <td className="border p-2 text-right">360</td>
              <td className="border p-2 text-right">220</td>
            </tr>
            <tr className="bg-yellow-50">
              <td className="border p-2">중1</td>
              <td className="border p-2 text-right">890</td>
              <td className="border p-2 text-right">550</td>
              <td className="border p-2 text-right">410</td>
              <td className="border p-2 text-right">250</td>
            </tr>
            <tr>
              <td className="border p-2">중3</td>
              <td className="border p-2 text-right">1000</td>
              <td className="border p-2 text-right">700</td>
              <td className="border p-2 text-right">550</td>
              <td className="border p-2 text-right">350</td>
            </tr>
            <tr>
              <td className="border p-2">고3</td>
              <td className="border p-2 text-right">1200</td>
              <td className="border p-2 text-right">1000</td>
              <td className="border p-2 text-right">850</td>
              <td className="border p-2 text-right">500</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>* 목표 궤적: 수능 지문 수준(1200L)에 도달하기 위한 이상적인 성장 경로</p>
        <p>* 상위 5% 학생: 각 학년에서 상위 5%에 해당하는 학생들의 평균 Lexile 지수</p>
        <p>* 평균 학생: 각 학년 학생들의 평균 Lexile 지수</p>
        <p>* 하위 25% 학생: 각 학년에서 하위 25%에 해당하는 학생들의 평균 Lexile 지수</p>
      </div>
    </div>
  )
}
