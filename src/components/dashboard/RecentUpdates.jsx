"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { CalendarArrowUp, UserRoundPlus, ArrowLeftRight, Plus, Pencil, Trash2 } from "lucide-react"

const statusColors = {
  Pending: "bg-yellow-500",
  "In Progress": "bg-indigo-500",
  Delivered: "bg-emerald-500",
  "On Hold": "bg-orange-500",
  Cancelled: "bg-red-500",
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const activityConfig = {
  status_change: {
    dotColor: (a) => statusColors[a.newStatus] || "bg-gray-500",
    dotIcon: null,
    icon: ArrowLeftRight,
    title: (a) => `${a.previousStatus || "New"} \u2192 ${a.newStatus}`,
    desc: (a) => a.note || null,
  },
  month_transfer: {
    dotColor: () => "bg-blue-500",
    dotIcon: CalendarArrowUp,
    icon: CalendarArrowUp,
    title: () => "Month Transfer",
    desc: (a) => `${monthNames[(a.oldMonth || 1) - 1]} \u2192 ${monthNames[(a.newMonth || 1) - 1]}${a.newYear ? ` (${a.newYear})` : ""}`,
  },
  person_transfer: {
    dotColor: () => "bg-emerald-500",
    dotIcon: UserRoundPlus,
    icon: UserRoundPlus,
    title: () => "Person Transfer",
    desc: (a) => `Transferred to ${a.toUser?.name || "Unknown"}`,
  },
  project_created: {
    dotColor: () => "bg-purple-500",
    dotIcon: Plus,
    icon: Plus,
    title: () => "Project Created",
    desc: (a) => a.description || null,
  },
  project_updated: {
    dotColor: () => "bg-amber-500",
    dotIcon: Pencil,
    icon: Pencil,
    title: () => "Project Updated",
    desc: (a) => a.description || null,
  },
  project_deleted: {
    dotColor: () => "bg-red-500",
    dotIcon: Trash2,
    icon: Trash2,
    title: () => "Project Deleted",
    desc: (a) => a.description || null,
  },
}

function getConfig(activity) {
  return activityConfig[activity.type] || {
    dotColor: () => "bg-gray-500",
    dotIcon: null,
    icon: null,
    title: () => activity.type || "Activity",
    desc: () => activity.description || null,
  }
}

export default function RecentUpdates({ updates }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Updates</CardTitle>
      </CardHeader>
      <CardContent>
        {updates.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No updates yet
          </p>
        ) : (
          <div className="space-y-0">
            {updates.map((update, i) => {
              const cfg = getConfig(update)
              const Icon = cfg.icon
              const DotIcon = cfg.dotIcon
              return (
                <div key={update._id} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < updates.length - 1 && (
                    <div className="absolute left-[11px] top-5 bottom-0 w-0.5 bg-border" />
                  )}
                  <div className="relative flex flex-col items-center">
                    <div
                      className={cn(
                        "h-6 w-6 rounded-full border-2 border-background ring-2 ring-border flex items-center justify-center",
                        cfg.dotColor(update)
                      )}
                    >
                      {DotIcon ? (
                        <DotIcon className="size-3 text-white" />
                      ) : (
                        <div className={cn("h-2 w-2 rounded-full", cfg.dotColor(update))} />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {Icon && <Icon className="size-3.5 text-muted-foreground shrink-0" />}
                      <p className="text-sm font-medium">{cfg.title(update)}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {update.project?.projectName || "Unknown Project"}
                    </p>
                    {cfg.desc(update) && (
                      <p className="text-xs text-muted-foreground mt-1 bg-muted/50 rounded-md px-2 py-1">
                        {cfg.desc(update)}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      by {update.performedBy?.name || "Unknown"} ·{" "}
                      {new Date(update.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
