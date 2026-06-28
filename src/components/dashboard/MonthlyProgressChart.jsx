"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function MonthlyProgressChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No data for this month
          </p>
        </CardContent>
      </Card>
    )
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1)
  const chartHeight = 200
  const barCount = data.length
  const barWidth = Math.min(32, 600 / barCount - 4)
  const chartWidth = Math.max(600, barCount * 40)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <svg
          width="100%"
          height={chartHeight + 40}
          viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}
          className="overflow-visible"
        >
          <line
            x1={30}
            y1={0}
            x2={30}
            y2={chartHeight}
            stroke="currentColor"
            className="text-border"
            strokeWidth={1}
          />
          <line
            x1={30}
            y1={chartHeight}
            x2={chartWidth - 10}
            y2={chartHeight}
            stroke="currentColor"
            className="text-border"
            strokeWidth={1}
          />
          {data.map((d, i) => {
            const barHeight = (d.count / maxCount) * (chartHeight - 10) || 0
            const x = 40 + i * (chartWidth / barCount)
            const y = chartHeight - barHeight
            const day = new Date(d.date).getDate()
            return (
              <g key={d.date}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={4}
                  className="fill-primary/80 hover:fill-primary transition-colors duration-200 cursor-pointer"
                />
                {barHeight > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 6}
                    textAnchor="middle"
                    className="fill-foreground text-[10px] font-medium"
                  >
                    {d.count}
                  </text>
                )}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 16}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px]"
                >
                  {day}
                </text>
              </g>
            )
          })}
        </svg>
      </CardContent>
    </Card>
  )
}
