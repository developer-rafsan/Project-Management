"use client"

import { useState, memo } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import {
  Copy,
  Check,
  ExternalLink,
  Globe,
} from "lucide-react"

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
  const [copied, setCopied] = useState({})

  const formatDate = (dateStr) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const handleCopy = (id, value, key) => {
    navigator.clipboard.writeText(value)
    setCopied((prev) => ({ ...prev, [`${id}-${key}`]: true }))
    setTimeout(() => setCopied((prev) => ({ ...prev, [`${id}-${key}`]: false })), 1500)
  }

  if (projects.length === 0) {
    return <div className="text-center text-muted-foreground py-12">Project not available</div>
  }

  const renderWebsite = (project) => {
    if (!project.websiteUrl) return <span className="text-sm text-muted-foreground">-</span>
    return (
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-1">
          <Globe className="size-3 shrink-0 text-muted-foreground" />
          <a href={project.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate">{project.websiteUrl}</a>
          <button onClick={(e) => { e.stopPropagation(); handleCopy(project._id, project.websiteUrl, "url") }} className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground">
            {copied[`${project._id}-url`] ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
          </button>
          <a href={project.websiteUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground">
            <ExternalLink className="size-3" />
          </a>
        </div>
        <div />
      </div>
    )
  }

  return (
    <div className="space-y-2 sm:space-y-1.5">
      {/* Desktop header row */}
      <div className="hidden sm:grid grid-cols-[36px_minmax(0,1fr)_90px] md:grid-cols-[36px_minmax(0,1fr)_1fr_90px_80px] lg:grid-cols-[36px_1fr_1fr_100px_80px_80px_80px_110px] gap-3 px-4 sm:px-6 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <span className="text-center">#</span>
        <span>Project</span>
        <span className="hidden md:block">Website</span>
        <span>Status</span>
        <span className="hidden md:block">Priority</span>
        <span className="hidden lg:block">CMS</span>
        <span className="hidden lg:block text-right">Price</span>
        <span className="hidden lg:block text-right">Start Date</span>
      </div>

      {projects.map((project, idx) => (
        <div
          key={project._id}
          className="rounded-xl border bg-card cursor-pointer transition-all hover:border-primary/30 hover:shadow-sm active:scale-[0.99]"
          onClick={() => router.push(`/dashboard/projects/${project._id}`)}
        >
          {/* Mobile layout */}
          <div className="block sm:hidden p-3">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-gradient-to-br from-primary/10 to-primary/5 text-xs font-semibold text-primary/70">
                  {project.projectName?.charAt(0)?.toUpperCase() || "P"}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="font-medium text-sm truncate">
                      {project.orderId ? `${project.orderId}_${project.projectName}` : project.projectName}
                    </p>
                    <button onClick={(e) => { e.stopPropagation(); handleCopy(project._id, project.orderId ? `${project.orderId}_${project.projectName}` : project.projectName, "title") }} className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground">
                      {copied[`${project._id}-title`] ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{project.businessName || ""}</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums shrink-0">#{startSerial + idx}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs mb-1.5">
              {project.status && (
                <Badge variant="outline" className={`text-[11px] font-medium px-2 py-0 ${statusStyles[project.status] || ""}`}>{project.status}</Badge>
              )}
              {project.priority && (
                <Badge variant="outline" className={`text-[11px] font-medium px-2 py-0 ${priorityStyles[project.priority] || ""}`}>{project.priority}</Badge>
              )}
              <span className="text-muted-foreground">{project.cms || "-"}</span>
              {Number(project.price) ? (
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">${Number(project.price).toFixed(2)}</span>
              ) : null}
              <span className="text-muted-foreground">{formatDate(project.startDate)}</span>
            </div>
            {renderWebsite(project)}
          </div>

          {/* Desktop layout */}
          <div className="hidden sm:grid grid-cols-[36px_minmax(0,1fr)_90px] md:grid-cols-[36px_minmax(0,1fr)_1fr_90px_80px] lg:grid-cols-[36px_1fr_1fr_100px_80px_80px_80px_110px] items-center gap-3 px-4 sm:px-6 py-3">
            <span className="text-sm text-muted-foreground tabular-nums text-center">{startSerial + idx}</span>
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-gradient-to-br from-primary/10 to-primary/5 text-xs font-semibold text-primary/70">
                {project.projectName?.charAt(0)?.toUpperCase() || "P"}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <p className="font-medium text-sm truncate">
                    {project.orderId ? `${project.orderId}_${project.projectName}` : project.projectName}
                  </p>
                  <button onClick={(e) => { e.stopPropagation(); handleCopy(project._id, project.orderId ? `${project.orderId}_${project.projectName}` : project.projectName, "title") }} className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground">
                    {copied[`${project._id}-title`] ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground truncate">{project.businessName || ""}</p>
              </div>
            </div>
            <div className="hidden md:block" onClick={(e) => e.stopPropagation()}>{renderWebsite(project)}</div>
            <div>
              {project.status && (
                <Badge variant="outline" className={`text-xs font-medium px-2 py-0.5 ${statusStyles[project.status] || ""}`}>{project.status}</Badge>
              )}
            </div>
            <div className="hidden md:block">
              {project.priority && (
                <Badge variant="outline" className={`text-xs font-medium px-2 py-0.5 ${priorityStyles[project.priority] || ""}`}>{project.priority}</Badge>
              )}
            </div>
            <div className="hidden lg:block text-sm text-muted-foreground">{project.cms || "-"}</div>
            <div className="hidden lg:block text-sm text-right">
              {Number(project.price) ? (
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">${Number(project.price).toFixed(2)}</span>
              ) : <span className="text-muted-foreground">-</span>}
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
