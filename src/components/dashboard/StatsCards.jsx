"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { FolderKanban, PlayCircle, CheckCircle2, Clock, PauseCircle, RefreshCw } from "lucide-react"

const cards = [
  {
    key: "totalProjects",
    label: "Total Projects",
    icon: FolderKanban,
    color: "text-muted-foreground",
    bg: "bg-muted",
  },
  {
    key: "runningProjects",
    label: "In Progress",
    icon: PlayCircle,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    key: "completedProjects",
    label: "Delivered",
    icon: CheckCircle2,
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    key: "pendingProjects",
    label: "Pending",
    icon: Clock,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
  {
    key: "onHoldProjects",
    label: "On Hold",
    icon: PauseCircle,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    key: "revisionProjects",
    label: "Revision",
    icon: RefreshCw,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
]

export default function StatsCards({ stats }) {
  const formatNum = (n) => String(n ?? 0).padStart(2, "0")

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-4 lg:grid-cols-6">
      {cards.map((card, i) => {
        const Icon = card.icon
        const val = formatNum(stats[card.key])
        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            <Card size="sm" className="max-h-[100px] py-0 transition-all duration-200 hover:shadow-md hover:shadow-black/5 hover:-translate-y-0.5">
              <CardContent className="flex flex-col items-center gap-1.5 p-2 text-center sm:flex-row sm:items-center sm:gap-3 sm:p-4 sm:text-left">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl sm:h-9 sm:w-9 ${card.bg} ring-1 ring-inset ring-black/5`}
                >
                  <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${card.color}`} />
                </div>
                <div>
                  <p className="text-lg font-bold sm:text-xl">{val}</p>
                  <p className="text-[10px] font-semibold text-foreground/80 sm:text-[11px]">{card.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
