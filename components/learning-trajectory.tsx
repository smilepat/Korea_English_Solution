"use client"

import { useEffect, useRef } from "react"
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from "chart.js"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

export function LearningTrajectory() {
  const readingChartRef = useRef<HTMLCanvasElement>(null)
  const listeningChartRef = useRef<HTMLCanvasElement>(null)
  const readingChartInstance = useRef<Chart | null>(null)
  const listeningChartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    // Reading Chart
    if (readingChartRef.current) {
      if (readingChartInstance.current) {
        readingChartInstance.current.destroy()
      }

      const ctx = readingChartRef.current.getContext("2d")
      if (ctx) {
        readingChartInstance.current = new Chart(ctx, {
          type: "line",
          data: {
            labels: ["초3", "초4", "초5", "초6", "중1", "중2", "중3", "고1", "고2", "고3"],
            datasets: [
              {
                label: "목표 궤적",
                data: [300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200],
                borderColor: "rgb(99, 102, 241)",
                backgroundColor: "rgba(99, 102, 241, 0.1)",
                tension: 0.3,
                fill: false,
                borderWidth: 2,
              },
              {
                label: "상위 25% 학생",
                data: [350, 450, 550, 650, 750, 850, 950, 1050, 1150, 1250],
                borderColor: "rgb(16, 185, 129)",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                tension: 0.3,
                fill: false,
                borderWidth: 2,
              },
              {
                label: "평균 학생",
                data: [250, 320, 400, 480, 550, 620, 700, 780, 850, 950],
                borderColor: "rgb(245, 158, 11)",
                backgroundColor: "rgba(245, 158, 11, 0.1)",
                tension: 0.3,
                fill: false,
                borderWidth: 2,
              },
              {
                label: "하위 25% 학생",
                data: [150, 200, 250, 300, 350, 400, 450, 500, 550, 600],
                borderColor: "rgb(244, 63, 94)",
                backgroundColor: "rgba(244, 63, 94, 0.1)",
                tension: 0.3,
                fill: false,
                borderWidth: 2,
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: "top",
                labels: {
                  usePointStyle: true,
                  padding: 15,
                },
              },
              tooltip: {
                mode: "index",
                intersect: false,
                callbacks: {
                  title: (tooltipItems) => {
                    return `${tooltipItems[0].label}`
                  },
                  label: (context) => {
                    return `${context.dataset.label}: ${context.raw}L`
                  },
                },
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                padding: 10,
                cornerRadius: 4,
              },
            },
            scales: {
              y: {
                min: 0,
                max: 1400,
                title: {
                  display: true,
                  text: "Lexile 지수 (L)",
                  font: {
                    weight: "bold",
                  },
                },
                grid: {
                  color: "rgba(0, 0, 0, 0.1)",
                },
                ticks: {
                  stepSize: 200,
                },
              },
              x: {
                grid: {
                  color: "rgba(0, 0, 0, 0.1)",
                },
              },
            },
          },
        })
      }
    }

    // Listening Chart
    if (listeningChartRef.current) {
      if (listeningChartInstance.current) {
        listeningChartInstance.current.destroy()
      }

      const ctx = listeningChartRef.current.getContext("2d")
      if (ctx) {
        const A1 = "A1"
        const A2 = "A2"
        const B1 = "B1"
        const B2 = "B2"

        listeningChartInstance.current = new Chart(ctx, {
          type: "line",
          data: {
            labels: ["초3", "초4", "초5", "초6", "중1", "중2", "중3", "고1", "고2", "고3"],
            datasets: [
              {
                label: "목표 궤적",
                data: [A1, A1, A1, A2, A2, A2, B1, B1, B1, B2].map(levelToNumber),
                borderColor: "rgb(99, 102, 241)",
                backgroundColor: "rgba(99, 102, 241, 0.1)",
                tension: 0.3,
                fill: false,
              },
              {
                label: "상위 25% 학생",
                data: [A1, A1, A2, A2, A2, B1, B1, B1, B2, B2].map(levelToNumber),
                borderColor: "rgb(16, 185, 129)",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                tension: 0.3,
                fill: false,
              },
              {
                label: "평균 학생",
                data: [A1, A1, A1, A1, A2, A2, A2, B1, B1, B1].map(levelToNumber),
                borderColor: "rgb(245, 158, 11)",
                backgroundColor: "rgba(245, 158, 11, 0.1)",
                tension: 0.3,
                fill: false,
              },
              {
                label: "하위 25% 학생",
                data: [A1, A1, A1, A1, A1, A2, A2, A2, A2, A2].map(levelToNumber),
                borderColor: "rgb(244, 63, 94)",
                backgroundColor: "rgba(244, 63, 94, 0.1)",
                tension: 0.3,
                fill: false,
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: "top",
              },
              tooltip: {
                mode: "index",
                intersect: false,
                callbacks: {
                  label: (context) => {
                    const value = context.raw as number
                    return `${context.dataset.label}: ${numberToLevel(value)}`
                  },
                },
              },
            },
            scales: {
              y: {
                min: 0,
                max: 6,
                ticks: {
                  callback: (value) => numberToLevel(value as number),
                },
                title: {
                  display: true,
                  text: "CEFR 레벨",
                },
              },
            },
          },
        })
      }
    }

    return () => {
      if (readingChartInstance.current) {
        readingChartInstance.current.destroy()
      }
      if (listeningChartInstance.current) {
        listeningChartInstance.current.destroy()
      }
    }
  }, [])

  // CEFR 레벨을 숫자로 변환하는 함수
  function levelToNumber(level: string): number {
    const levels: Record<string, number> = {
      A1: 1,
      A2: 2,
      B1: 3,
      B2: 4,
      C1: 5,
      C2: 6,
    }
    return levels[level] || 0
  }

  // 숫자를 CEFR 레벨로 변환하는 함수
  function numberToLevel(num: number): string {
    const levels = ["", "A1", "A2", "B1", "B2", "C1", "C2"]
    return levels[Math.round(num)] || ""
  }

  return (
    <Tabs defaultValue="reading" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="reading">읽기 능력 궤적</TabsTrigger>
        <TabsTrigger value="listening">듣기 능력 궤적</TabsTrigger>
      </TabsList>

      <TabsContent value="reading" className="mt-4">
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg border text-sm">
            <p className="font-medium">Lexile 지수 기준</p>
            <p className="text-slate-600 mt-1">수능 지문 평균 1200L vs 교과서 800L</p>
            <p className="text-slate-600 mt-1">2023년 고3 43%가 1000L 미달</p>
          </div>
          <div className="relative">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-aZqLuoTVGAzKXyDRpyvOYhuCgwYwML.png"
              alt="Lexile 지수 기준 학습 궤적"
              className="w-full h-auto rounded-lg border mb-4"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <canvas ref={readingChartRef} className="w-full h-full opacity-0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <p className="text-sm font-medium">개인 맞춤형 학습 경로</p>
              <p className="text-xs text-slate-600 mt-1">
                학생의 현재 수준에서 목표 궤적에 도달하기 위한 맞춤형 학습 경로를 제시합니다.
              </p>
            </div>
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
              <p className="text-sm font-medium">격차 해소 전략</p>
              <p className="text-xs text-slate-600 mt-1">
                하위 25% 학생들의 격차를 효과적으로 해소하기 위한 집중 학습 전략을 제공합니다.
              </p>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="listening" className="mt-4">
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg border text-sm">
            <p className="font-medium">CEFR 레벨 기준</p>
            <p className="text-slate-600 mt-1">A1-A2: 기초 / B1-B2: 중급 / C1-C2: 고급</p>
            <p className="text-slate-600 mt-1">수능 목표: B1-B2 수준</p>
          </div>
          <canvas ref={listeningChartRef} />
        </div>
      </TabsContent>
    </Tabs>
  )
}
