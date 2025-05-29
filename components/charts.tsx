"use client"

import { useEffect, useRef } from "react"
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  RadarController,
  ArcElement,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend,
} from "chart.js"

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  RadarController,
  ArcElement,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend,
)

export function LineChart() {
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
            labels: ["초3", "초6", "중3", "고3"],
            datasets: [
              {
                label: "목표 Lexile 지수",
                data: [300, 600, 900, 1200],
                borderColor: "rgb(99, 102, 241)",
                backgroundColor: "rgba(99, 102, 241, 0.1)",
                tension: 0.3,
                fill: false,
              },
              {
                label: "실제 평균 Lexile 지수",
                data: [250, 450, 700, 950],
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
              },
            },
            scales: {
              y: {
                min: 0,
                max: 1400,
                title: {
                  display: true,
                  text: "Lexile 지수 (L)",
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
    <div className="relative">
      <canvas ref={chartRef} />
      <div className="text-xs text-slate-500 text-center mt-2">
        출처: 한국교육과정평가원 2023년 영어 성취도 평가 데이터
      </div>
    </div>
  )
}

export function BarChart() {
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
          type: "bar",
          data: {
            labels: ["초6", "중3", "고2"],
            datasets: [
              {
                label: "평균 격차율 (%)",
                data: [35, 58, 72],
                backgroundColor: ["rgba(255, 159, 64, 0.7)", "rgba(255, 99, 132, 0.7)", "rgba(255, 0, 0, 0.7)"],
                borderColor: ["rgb(255, 159, 64)", "rgb(255, 99, 132)", "rgb(255, 0, 0)"],
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                callbacks: {
                  afterLabel: (context) => {
                    const labels = ["기본 구문 이해", "복합문 분석", "추론적 독해"]
                    return `주요 결손 영역: ${labels[context.dataIndex]}`
                  },
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                title: {
                  display: true,
                  text: "격차율 (%)",
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
    <div className="relative">
      <canvas ref={chartRef} />
      <div className="text-xs text-slate-500 text-center mt-2">
        출처: GEPS 2017-2022, CSAT 텍스트 분석, 2023 수능 33번 문항 분석
      </div>
    </div>
  )
}

export function PieChart() {
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
          type: "pie",
          data: {
            labels: ["어휘력 부족", "문법 이해 부족", "독해력 부족", "듣기 이해 부족", "말하기/쓰기 부족"],
            datasets: [
              {
                data: [30, 25, 20, 15, 10],
                backgroundColor: [
                  "rgba(255, 99, 132, 0.7)",
                  "rgba(54, 162, 235, 0.7)",
                  "rgba(255, 206, 86, 0.7)",
                  "rgba(75, 192, 192, 0.7)",
                  "rgba(153, 102, 255, 0.7)",
                ],
                borderColor: [
                  "rgb(255, 99, 132)",
                  "rgb(54, 162, 235)",
                  "rgb(255, 206, 86)",
                  "rgb(75, 192, 192)",
                  "rgb(153, 102, 255)",
                ],
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: "right",
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
    <div className="relative">
      <canvas ref={chartRef} />
      <div className="text-xs text-slate-500 text-center mt-2">출처: 2022-2023 영어교육 실태조사 결과</div>
    </div>
  )
}

export function RadarChart() {
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
          type: "radar",
          data: {
            labels: ["문법 정확성", "어휘 다양성", "논리 구성력", "창의성", "맥락 적절성"],
            datasets: [
              {
                label: "목표 수준",
                data: [80, 75, 70, 65, 75],
                backgroundColor: "rgba(99, 102, 241, 0.2)",
                borderColor: "rgb(99, 102, 241)",
                pointBackgroundColor: "rgb(99, 102, 241)",
                pointBorderColor: "#fff",
                pointHoverBackgroundColor: "#fff",
                pointHoverBorderColor: "rgb(99, 102, 241)",
              },
              {
                label: "현재 수준 (고2 샘플)",
                data: [35, 25, 20, 15, 5],
                backgroundColor: "rgba(244, 63, 94, 0.2)",
                borderColor: "rgb(244, 63, 94)",
                pointBackgroundColor: "rgb(244, 63, 94)",
                pointBorderColor: "#fff",
                pointHoverBackgroundColor: "#fff",
                pointHoverBorderColor: "rgb(244, 63, 94)",
              },
            ],
          },
          options: {
            responsive: true,
            scales: {
              r: {
                angleLines: {
                  display: true,
                },
                suggestedMin: 0,
                suggestedMax: 100,
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
    <div className="relative">
      <canvas ref={chartRef} />
      <div className="text-xs text-slate-500 text-center mt-2">
        출처: 한국교육과정평가원 Performance Descriptor 기반 분석
      </div>
    </div>
  )
}
