"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CalendarArrowUp } from "lucide-react"

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

function formatDate(dateStr) {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDateShort(dateStr) {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function ProjectTimeline({ updates }) {
  if (updates.length === 0) {
    return <p className="text-sm text-muted-foreground">No updates yet</p>
  }

  return (
    <div className="space-y-0">
      {updates.map((update, idx) => (
        <div key={update._id} className="relative flex gap-4 pb-6 last:pb-0">
          {idx < updates.length - 1 && (
            <div className="absolute left-[11px] top-6 bottom-0 w-px bg-gradient-to-b from-border to-transparent" />
          )}
          <div
            className={`mt-1.5 size-[22px] shrink-0 rounded-full border-2 border-background ring-2 ring-background ${
              statusColors[update.newStatus] || "bg-gray-500"
            }`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">
                {update.previousStatus || "New"}
                <span className="text-muted-foreground mx-1">&rarr;</span>
                {update.newStatus}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDate(update.createdAt)}
              </span>
            </div>
            {update.note && (
              <p className="text-sm text-muted-foreground mt-1.5 bg-muted/50 rounded-lg p-2.5">{update.note}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
              <Avatar size="sm">
                <AvatarImage src={update.updatedBy?.image} />
                <AvatarFallback className="text-[10px]">
                  {update.updatedBy?.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <span>{update.updatedBy?.name || "Unknown"}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ProjectTransferHistory({ transferHistory }) {
  if (!transferHistory?.length) return null

  return (
    <div className="space-y-2">
      {transferHistory.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-3 text-sm py-1.5">
          <div className="size-1.5 rounded-full bg-muted-foreground/30" />
          <span className="font-medium text-muted-foreground">
            {monthNames[(entry.oldMonth || 1) - 1]}
          </span>
          <span className="text-muted-foreground/50">&larr;&rarr;</span>
          <span className="font-medium">{monthNames[(entry.newMonth || 1) - 1]}</span>
          <span className="text-xs text-muted-foreground ml-auto">
            {formatDateShort(entry.transferDate)}
          </span>
          {entry.transferredBy?.name && (
            <span className="text-xs text-muted-foreground">{entry.transferredBy.name}</span>
          )}
        </div>
      ))}
    </div>
  )
}
