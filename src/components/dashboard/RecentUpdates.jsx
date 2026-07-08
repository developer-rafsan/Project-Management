"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

const statusDotColors = {
  Pending: "bg-yellow-500",
  "In Progress": "bg-indigo-500",
  Delivered: "bg-emerald-500",
  "On Hold": "bg-orange-500",
  Cancelled: "bg-red-500",
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
              const prevColor =
                statusDotColors[update.previousStatus] || "bg-gray-400"
              const newColor =
                statusDotColors[update.newStatus] || "bg-gray-400"
              const projectName =
                update.project?.projectName || "Unknown Project"
              const updatedByName =
                update.performedBy?.name || "Unknown"
              return (
                <div key={update._id} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < updates.length - 1 && (
                    <div className="absolute left-[11px] top-5 bottom-0 w-0.5 bg-border" />
                  )}
                  <div className="relative flex flex-col items-center">
                    <div
                      className={cn(
                        "h-6 w-6 rounded-full border-2 border-background ring-2 ring-border flex items-center justify-center",
                        newColor
                      )}
                    >
                      <div className={cn("h-2 w-2 rounded-full", newColor)} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{projectName}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs">
                      <span
                        className={cn(
                          "inline-block h-2 w-2 rounded-full shrink-0",
                          prevColor
                        )}
                      />
                      <span className="text-muted-foreground">
                        {update.previousStatus || "—"}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span
                        className={cn(
                          "inline-block h-2 w-2 rounded-full shrink-0",
                          newColor
                        )}
                      />
                      <span className="font-medium">{update.newStatus}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      by {updatedByName} ·{" "}
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
