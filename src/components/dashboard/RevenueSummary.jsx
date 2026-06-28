"use client"

import { Card, CardContent } from "@/components/ui/card"
import { DollarSign, CheckCircle2, TrendingUp, Percent, Landmark, XCircle } from "lucide-react"

const cards = [
  { key: "total", label: "Total Revenue", icon: DollarSign, color: "text-sky-500", bg: "bg-sky-500/10" },
  { key: "delivered", label: "Delivered Revenue", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { key: "inProgress", label: "In Progress Revenue", icon: TrendingUp, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  { key: "cancelled", label: "Cancelled Revenue", icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
  { key: "fee", label: "Fiverr Fee (20%)", icon: Percent, color: "text-orange-500", bg: "bg-orange-500/10" },
  { key: "net", label: "Net Revenue", icon: Landmark, color: "text-green-500", bg: "bg-green-500/10" },
]

export default function RevenueSummary({ data, highlight }) {
  if (!data) return null

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((item) => {
        const Icon = item.icon
        const val = data[item.key] ?? 0
        const isHighlighted = highlight === item.key
        return (
          <Card
            key={item.key}
            className={
              isHighlighted
                ? "ring-2 ring-green-500 ring-offset-2 ring-offset-background scale-[1.02] transition-all duration-300"
                : undefined
            }
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${item.bg}`}>
                <Icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <div className="min-w-0">
                <p className={`text-lg font-bold tabular-nums ${isHighlighted ? "text-green-500" : ""}`}>
                  ${val.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground truncate">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
