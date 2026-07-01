"use client"

import { memo } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

const statusStyles = {
  "Pending": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  "In Progress": "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  "Delivered": "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
  "On Hold": "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800",
  "Cancelled": "bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-900/20 dark:text-zinc-400 dark:border-zinc-800",
}

const priorityStyles = {
  "Low": "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800",
  "Medium": "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  "High": "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800",
  "Urgent": "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
}

const ProjectTable = memo(function ProjectTable({ projects = [], page = 1, pageSize = 20 }) {
  const router = useRouter()
  const startSerial = (page - 1) * pageSize + 1

  const formatDate = (dateStr) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (projects.length === 0) {
    return <div className="text-center text-muted-foreground py-12">Project not available</div>
  }

  return (
    <div className="space-y-2 sm:space-y-1.5">
      {/* Desktop header row */}
      <div className="hidden sm:grid sm:grid-cols-[36px_120px_1fr_120px_100px_90px_100px_120px] gap-3 px-4 sm:px-6 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <span className="text-center">#</span>
        <span>Order ID</span>
        <span>Project Name</span>
        <span>Status</span>
        <span className="hidden md:block">Priority</span>
        <span className="hidden lg:block">CMS</span>
        <span>Price</span>
        <span className="hidden lg:block text-right">Start Date</span>
      </div>

      {projects.map((project, idx) => (
        <div
          key={project._id}
          className="rounded-xl border bg-card cursor-pointer transition-all hover:border-primary/30 hover:shadow-sm active:scale-[0.99]"
          onClick={() => router.push(`/dashboard/projects/${project._id}`)}
        >
          {/* Mobile layout */}
          <div className="block sm:hidden p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-gradient-to-br from-primary/10 to-primary/5 text-sm font-semibold text-primary/70">
                  {project.projectName?.charAt(0)?.toUpperCase() || "P"}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{project.projectName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {project.websiteUrl?.replace(/^https?:\/\//, "") || "-"}
                  </p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                #{startSerial + idx}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
              <span className="font-mono text-muted-foreground">
                {project.orderId || "-"}
              </span>
              {project.status && (
                <Badge variant="outline" className={`text-[11px] font-medium px-2 py-0 ${statusStyles[project.status] || ""}`}>
                  {project.status}
                </Badge>
              )}
              {project.priority && (
                <Badge variant="outline" className={`text-[11px] font-medium px-2 py-0 ${priorityStyles[project.priority] || ""}`}>
                  {project.priority}
                </Badge>
              )}
              <span className="text-muted-foreground">{project.cms || "-"}</span>
              {Number(project.price) ? (
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  ${Number(project.price).toFixed(2)}
                </span>
              ) : null}
              <span className="text-muted-foreground">{formatDate(project.startDate)}</span>
            </div>
          </div>

          {/* Desktop layout */}
          <div className="hidden sm:grid sm:grid-cols-[36px_120px_1fr_120px_100px_90px_100px_120px] items-center gap-3 px-4 sm:px-6 py-4">
            <span className="text-sm text-muted-foreground tabular-nums text-center">
              {startSerial + idx}
            </span>
            <span className="font-mono text-sm text-muted-foreground truncate">
              {project.orderId || "-"}
            </span>
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-gradient-to-br from-primary/10 to-primary/5 text-xs font-semibold text-primary/70">
                {project.projectName?.charAt(0)?.toUpperCase() || "P"}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{project.projectName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {project.websiteUrl?.replace(/^https?:\/\//, "") || "-"}
                </p>
              </div>
            </div>
            <div>
              {project.status && (
                <Badge variant="outline" className={`text-xs font-medium px-2 py-0.5 ${statusStyles[project.status] || ""}`}>
                  {project.status}
                </Badge>
              )}
            </div>
            <div className="hidden md:block">
              {project.priority && (
                <Badge variant="outline" className={`text-xs font-medium px-2 py-0.5 ${priorityStyles[project.priority] || ""}`}>
                  {project.priority}
                </Badge>
              )}
            </div>
            <div className="hidden lg:block text-sm text-muted-foreground truncate">
              {project.cms || "-"}
            </div>
            <div>
              {Number(project.price) ? (
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  ${Number(project.price).toFixed(2)}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">-</span>
              )}
            </div>
            <div className="hidden lg:block text-sm text-muted-foreground text-right whitespace-nowrap">
              {formatDate(project.startDate)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
})

export default ProjectTable
