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

const revKeyMap = {
  total: "revTotal",
  delivered: "revDelivered",
  inProgress: "revInProgress",
  cancelled: "revCancelled",
  fee: "revFee",
  net: "revNet",
}

export default function RevenueSummary({ data, highlight, showFiverrFee = true, visibility = {} }) {
  if (!data) return null

  const visibleCards = cards.filter((item) => {
    if (item.key === "fee" && !showFiverrFee) return false
    return visibility[revKeyMap[item.key]] !== false
  })

  return (
    <div className={`grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 ${visibleCards.length > 5 ? "lg:grid-cols-6" : "lg:grid-cols-5"}`}>
      {visibleCards.map((item) => {
        const Icon = item.icon
        const val = data[item.key] ?? 0
        const isHighlighted = highlight === item.key
        return (
          <Card
            key={item.key}
            size="sm"
            className={`max-h-[100px] py-0 transition-all duration-200 hover:shadow-md hover:shadow-black/5 hover:-translate-y-0.5 ${
              isHighlighted
                ? "ring-2 ring-green-500 ring-offset-2 ring-offset-background"
                : ""
            }`}
          >
            <CardContent className="flex items-center gap-2 p-2 sm:gap-3 sm:p-4">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl sm:h-9 sm:w-9 ${item.bg} ring-1 ring-inset ring-black/5`}>
                <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${item.color}`} />
              </div>
              <div className="text-left min-w-0">
                <p className={`text-base font-bold tabular-nums sm:text-lg ${isHighlighted ? "text-green-500" : ""}`}>
                  ${val.toFixed(2)}
                </p>
                <p className="text-[10px] font-semibold text-foreground/80 truncate sm:text-[11px]">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
