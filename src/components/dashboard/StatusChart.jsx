"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function StatusChart({ data }) {
  const total = data.reduce((sum, d) => sum + d.count, 0)

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No data available
          </p>
        </CardContent>
      </Card>
    )
  }

  const radius = 80
  const circumference = 2 * Math.PI * radius
  let cumulativePercent = 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <svg width="200" height="200" viewBox="0 0 200 200">
            <g transform="translate(100, 100)">
              {data.map((item) => {
                const percent = item.count / total
                const offset = cumulativePercent * circumference
                const dashArray = `${percent * circumference} ${
                  circumference - percent * circumference
                }`
                cumulativePercent += percent
                return (
                  <circle
                    key={item.status}
                    r={radius}
                    fill="none"
                    stroke={item.color}
                    strokeWidth={24}
                    strokeDasharray={dashArray}
                    strokeDashoffset={-offset}
                    transform="rotate(-90)"
                    className="transition-all duration-300"
                  />
                )
              })}
              <text
                textAnchor="middle"
                dy="0.35em"
                className="fill-foreground text-2xl font-bold"
              >
                {total}
              </text>
            </g>
          </svg>
          <div className="space-y-2 w-full sm:w-auto">
            {data.map((item) => (
              <div
                key={item.status}
                className="flex items-center gap-2 text-sm"
              >
                <div
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="flex-1">{item.status}</span>
                <span className="text-muted-foreground font-medium tabular-nums">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
