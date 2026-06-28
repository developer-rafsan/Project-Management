"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { FolderKanban, PlayCircle, CheckCircle2, Clock, PauseCircle } from "lucide-react"

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
]

export default function StatsCards({ stats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card, i) => {
        const Icon = card.icon
        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg ${card.bg}`}
                >
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats[card.key] ?? 0}</p>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
