"use client"

import { useEffect, useRef } from "react"
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from "chart.js"

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

export function GapAnalysis() {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }

      const ctx = chartRef.current.getContext("2d")
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: "line",
          data: {
            labels: ["초3", "초4", "초5", "초6", "중1", "중2", "중3", "고1", "고2", "고3"],
            datasets: [
              {
                label: "교육과정 목표",
                data: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
                borderColor: "rgb(99, 102, 241)",
                backgroundColor: "rgba(99, 102, 241, 0.1)",
                tension: 0.3,
                fill: true,
              },
              {
                label: "실제 성취도",
                data: [8, 15, 22, 28, 32, 38, 42, 48, 52, 58],
                borderColor: "rgb(244, 63, 94)",
                backgroundColor: "rgba(244, 63, 94, 0.1)",
                tension: 0.3,
                fill: true,
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
                  afterFooter: (tooltipItems) => {
                    const item = tooltipItems[0]
                    if (item && item.dataset.data) {
                      const targetValue = item.dataset.data[item.dataIndex] as number
                      const actualValue = (tooltipItems[1]?.dataset.data[item.dataIndex] as number) || 0
                      const gap = (((targetValue - actualValue) / targetValue) * 100).toFixed(1)
                      return `격차율: ${gap}%`
                    }
                    return ""
                  },
                },
              },
            },
            scales: {
              y: {
                min: 0,
                max: 100,
                title: {
                  display: true,
                  text: "성취도 (%)",
                },
              },
            },
          },
        })
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
          <p className="text-sm font-medium">초·중·고 연계성 결여</p>
          <p className="text-xs text-slate-600 mt-1">중1의 42%가 초등 필수 어휘 800단어 미달성</p>
        </div>
        <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
          <p className="text-sm font-medium">수업 시간 부족</p>
          <p className="text-xs text-slate-600 mt-1">누적 영어 수업 시간 980시간, CEFR B1 달성 필요 1,200시간</p>
        </div>
      </div>
      <canvas ref={chartRef} />
      <div className="text-xs text-slate-500 text-center mt-2">
        출처: GEPS 2017-2022, CSAT 텍스트 분석, 2023 수능 33번 문항 분석
      </div>
    </div>
  )
}
