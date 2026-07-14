"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CalendarArrowUp, UserRoundPlus, ArrowLeftRight, Plus, Pencil, Trash2, Percent, Globe, Link, Server, DollarSign, FileText } from "lucide-react"

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

function TimelineDot({ color, icon: Icon }) {
  return (
    <div
      className={`mt-1 size-[22px] shrink-0 rounded-full border-2 border-background ring-2 ring-background flex items-center justify-center ${
        color || "bg-muted-foreground/30"
      }`}
    >
      {Icon && <Icon className="size-3 text-white" />}
    </div>
  )
}

function getActivityConfig(activity) {
  switch (activity.type) {
    case "status_change":
      return {
        dotColor: statusColors[activity.newStatus] || "bg-gray-500",
        dotIcon: null,
        icon: <ArrowLeftRight className="size-3.5 text-muted-foreground" />,
        title: `${activity.previousStatus || "New"} \u2192 ${activity.newStatus}`,
        user: activity.performedBy || null,
        description: null,
        note: activity.note || null,
      }
    case "month_transfer":
      return {
        dotColor: "bg-blue-500",
        dotIcon: CalendarArrowUp,
        icon: <CalendarArrowUp className="size-3.5 text-muted-foreground" />,
        title: "Month Transfer",
        user: activity.performedBy || null,
        description: `${monthNames[(activity.oldMonth || 1) - 1]} \u2192 ${monthNames[(activity.newMonth || 1) - 1]}${activity.newYear ? ` (${activity.newYear})` : ""}`,
        note: null,
      }
    case "person_transfer":
      return {
        dotColor: "bg-emerald-500",
        dotIcon: UserRoundPlus,
        icon: <UserRoundPlus className="size-3.5 text-muted-foreground" />,
        title: "Person Transfer",
        user: activity.performedBy || null,
        description: `Transferred to ${activity.toUser?.name || "Unknown"}`,
        note: null,
      }
    case "project_created":
      return {
        dotColor: "bg-purple-500",
        dotIcon: Plus,
        icon: <Plus className="size-3.5 text-muted-foreground" />,
        title: "Project Created",
        user: activity.performedBy || null,
        description: activity.description || null,
        note: null,
      }
    case "project_updated":
      return {
        dotColor: "bg-amber-500",
        dotIcon: Pencil,
        icon: <Pencil className="size-3.5 text-muted-foreground" />,
        title: "Project Updated",
        user: activity.performedBy || null,
        description: activity.description || null,
        note: activity.note || null,
      }
    case "project_deleted":
      return {
        dotColor: "bg-red-500",
        dotIcon: Trash2,
        icon: <Trash2 className="size-3.5 text-muted-foreground" />,
        title: "Project Deleted",
        user: activity.performedBy || null,
        description: activity.description || null,
        note: null,
      }
    case "progress_updated":
      return {
        dotColor: "bg-emerald-500",
        dotIcon: Percent,
        icon: <Percent className="size-3.5 text-muted-foreground" />,
        title: "Progress Updated",
        user: activity.performedBy || null,
        description: activity.description || null,
        note: activity.note || null,
      }
    case "website_added":
      return {
        dotColor: "bg-sky-500",
        dotIcon: Globe,
        icon: <Globe className="size-3.5 text-muted-foreground" />,
        title: "Website Added",
        user: activity.performedBy || null,
        description: activity.description || null,
        note: null,
      }
    case "website_updated":
      return {
        dotColor: "bg-sky-500",
        dotIcon: Globe,
        icon: <Globe className="size-3.5 text-muted-foreground" />,
        title: "Website Updated",
        user: activity.performedBy || null,
        description: activity.description || null,
        note: null,
      }
    case "website_removed":
      return {
        dotColor: "bg-sky-500",
        dotIcon: Globe,
        icon: <Globe className="size-3.5 text-muted-foreground" />,
        title: "Website Removed",
        user: activity.performedBy || null,
        description: activity.description || null,
        note: null,
      }
    case "domain_added":
      return {
        dotColor: "bg-indigo-500",
        dotIcon: Server,
        icon: <Server className="size-3.5 text-muted-foreground" />,
        title: "Domain Added",
        user: activity.performedBy || null,
        description: activity.description || null,
        note: null,
      }
    case "domain_updated":
      return {
        dotColor: "bg-indigo-500",
        dotIcon: Server,
        icon: <Server className="size-3.5 text-muted-foreground" />,
        title: "Domain Updated",
        user: activity.performedBy || null,
        description: activity.description || null,
        note: null,
      }
    case "domain_removed":
      return {
        dotColor: "bg-indigo-500",
        dotIcon: Server,
        icon: <Server className="size-3.5 text-muted-foreground" />,
        title: "Domain Removed",
        user: activity.performedBy || null,
        description: activity.description || null,
        note: null,
      }
    case "link_updated":
      return {
        dotColor: "bg-violet-500",
        dotIcon: Link,
        icon: <Link className="size-3.5 text-muted-foreground" />,
        title: "Links Updated",
        user: activity.performedBy || null,
        description: activity.description || null,
        note: null,
      }
    case "price_updated":
      return {
        dotColor: "bg-amber-500",
        dotIcon: DollarSign,
        icon: <DollarSign className="size-3.5 text-muted-foreground" />,
        title: "Price Updated",
        user: activity.performedBy || null,
        description: activity.description || null,
        note: null,
      }
    case "meta_updated":
      return {
        dotColor: "bg-amber-500",
        dotIcon: DollarSign,
        icon: <DollarSign className="size-3.5 text-muted-foreground" />,
        title: "Meta Updated",
        user: activity.performedBy || null,
        description: activity.description || null,
        note: null,
      }
    case "note_added":
      return {
        dotColor: "bg-rose-500",
        dotIcon: FileText,
        icon: <FileText className="size-3.5 text-muted-foreground" />,
        title: "Note Added",
        user: activity.performedBy || null,
        description: activity.description || null,
        note: activity.note || null,
      }
    case "note_updated":
      return {
        dotColor: "bg-rose-500",
        dotIcon: FileText,
        icon: <FileText className="size-3.5 text-muted-foreground" />,
        title: "Note Updated",
        user: activity.performedBy || null,
        description: activity.description || null,
        note: activity.note || null,
      }
    case "note_deleted":
      return {
        dotColor: "bg-rose-500",
        dotIcon: FileText,
        icon: <FileText className="size-3.5 text-muted-foreground" />,
        title: "Note Deleted",
        user: activity.performedBy || null,
        description: activity.description || null,
        note: null,
      }
    default:
      return {
        dotColor: "bg-gray-500",
        dotIcon: null,
        icon: null,
        title: activity.type || "Activity",
        user: activity.performedBy || null,
        description: activity.description || null,
        note: activity.note || null,
      }
  }
}

export function ProjectTimeline({ activities = [] }) {
  if (!activities?.length) {
    return <p className="text-sm text-muted-foreground">No activity yet</p>
  }

  return (
    <div className="space-y-0">
      {activities.map((activity, idx) => {
        const config = getActivityConfig(activity)
        return (
          <div key={activity._id || `event-${idx}`} className="relative flex gap-4 pb-6 last:pb-0">
            {idx < activities.length - 1 && (
              <div className="absolute left-[11px] top-6 bottom-0 w-px bg-gradient-to-b from-border to-transparent" />
            )}
            <TimelineDot color={config.dotColor} icon={config.dotIcon} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {config.icon}
                <span className="text-sm font-medium">{config.title}</span>
                <span className="text-xs text-muted-foreground">{formatDate(activity.createdAt)}</span>
              </div>
              {config.description && (
                <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
              )}
              {config.note && (
                <p className="text-sm text-muted-foreground mt-1.5 bg-muted/50 rounded-lg p-2.5">{config.note}</p>
              )}
              {config.user && (
                <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                  {config.user.image && (
                    <Avatar size="sm">
                      <AvatarImage src={config.user.image} />
                      <AvatarFallback className="text-[10px]">
                        {config.user.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <span>{typeof config.user === 'object' ? (config.user.name || 'Unknown') : 'Unknown'}</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
