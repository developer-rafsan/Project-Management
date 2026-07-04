"use client"

import { useState, memo } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Copy,
  Check,
  ExternalLink,
  Globe,
  User,
  Lock,
  Eye,
  EyeOff,
  MoreHorizontal,
  Trash2,
  Pencil,
  ArrowLeftRight,
  CalendarArrowUp,
  UserRoundPlus,
  Link,
  Square,
  CheckSquare,
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

const ProjectTable = memo(function ProjectTable({ projects = [], page = 1, pageSize = 20, onAction, selectedIds = [], onSelectionChange }) {
  const router = useRouter()
  const startSerial = (page - 1) * pageSize + 1
  const [copied, setCopied] = useState({})
  const [pwData, setPwData] = useState({})

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

  const fetchPassword = async (projectId) => {
    if (pwData[projectId]?.password !== undefined) return
    try {
      const res = await fetch(`/api/projects/${projectId}/password`)
      const data = await res.json()
      setPwData((prev) => ({
        ...prev,
        [projectId]: { password: typeof data.password === "string" ? data.password : "", show: true },
      }))
    } catch {
      setPwData((prev) => ({
        ...prev,
        [projectId]: { password: "", show: false },
      }))
    }
  }

  const toggleShowPw = (projectId) => {
    setPwData((prev) => {
      const cur = prev[projectId]
      if (!cur) return prev
      return { ...prev, [projectId]: { ...cur, show: !cur.show } }
    })
  }

  const renderWebsite = (project) => {
    const pw = pwData[project._id]
    const hasPassword = project.websitePassword && (
      project.websitePassword.iv || typeof project.websitePassword === "string"
    )
    return (
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-1">
          <Globe className="size-3 shrink-0 text-muted-foreground" />
          {project.websiteUrl ? (
            <>
              <a href={project.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate cursor-pointer">{project.websiteUrl}</a>
              <button onClick={(e) => { e.stopPropagation(); handleCopy(project._id, project.websiteUrl, "url") }} className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground cursor-pointer">
                {copied[`${project._id}-url`] ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
              </button>
              <a href={project.websiteUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground cursor-pointer">
                <ExternalLink className="size-3" />
              </a>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <User className="size-3 shrink-0 text-muted-foreground" />
          {project.websiteUsername ? (
            <>
              <span className="text-xs text-muted-foreground truncate">{project.websiteUsername}</span>
              <button onClick={(e) => { e.stopPropagation(); handleCopy(project._id, project.websiteUsername, "username") }} className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground cursor-pointer">
                {copied[`${project._id}-username`] ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
              </button>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Lock className="size-3 shrink-0 text-muted-foreground" />
          {hasPassword ? (
            <>
              <span className="text-xs font-mono text-muted-foreground">
                {pw?.password !== undefined && pw.show ? pw.password : "\u2022\u2022\u2022\u2022\u2022"}
              </span>
              <button onClick={(e) => {
                e.stopPropagation()
                if (pw?.password === undefined) {
                  fetchPassword(project._id)
                } else {
                  toggleShowPw(project._id)
                }
              }} className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground cursor-pointer" title={pw?.show ? "Hide" : "Show"}>
                {pw?.show ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
              </button>
              <button onClick={async (e) => {
                e.stopPropagation()
                let pass = pw?.password
                if (pass === undefined) {
                  try {
                    const res = await fetch(`/api/projects/${project._id}/password`)
                    const data = await res.json()
                    pass = typeof data.password === "string" ? data.password : ""
                    setPwData((prev) => ({ ...prev, [project._id]: { password: pass, show: false } }))
                  } catch {
                    pass = ""
                  }
                }
                if (pass) {
                  navigator.clipboard.writeText(pass)
                  setCopied((prev) => ({ ...prev, [`${project._id}-password`]: true }))
                  setTimeout(() => setCopied((prev) => ({ ...prev, [`${project._id}-password`]: false })), 1500)
                }
              }} className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground cursor-pointer" title="Copy Password">
                {copied[`${project._id}-password`] ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
              </button>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2 sm:space-y-1.5">
      {/* Desktop header row */}
      <div className="hidden sm:grid grid-cols-[24px_36px_minmax(0,1fr)_110px] md:grid-cols-[24px_36px_minmax(0,1fr)_1fr_120px_100px] lg:grid-cols-[24px_36px_1fr_1fr_130px_110px_100px_36px] gap-4 px-4 sm:px-6 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <button
          onClick={(e) => {
            e.stopPropagation()
            const allIds = projects.map(p => p._id)
            onSelectionChange?.(selectedIds.length === allIds.length ? [] : allIds)
          }}
          className="text-center cursor-pointer"
        >
          {selectedIds.length === projects.length && projects.length > 0
            ? <CheckSquare className="size-4 mx-auto text-primary" />
            : <Square className="size-4 mx-auto text-muted-foreground/40 hover:text-muted-foreground" />
          }
        </button>
        <span className="text-center">#</span>
        <span>Project</span>
        <span className="hidden md:block">Website</span>
        <span>Status</span>
        <span className="hidden md:block">Priority</span>
        <span className="hidden lg:block text-right">Price</span>
        <span></span>
      </div>

      {projects.map((project, idx) => (
        <div
          key={project._id}
          className="rounded-xl border bg-card cursor-pointer transition-all hover:border-primary/30 hover:shadow-sm active:scale-[0.99]"
          onClick={() => router.push(`/dashboard/projects/${project._id}`)}
        >
          {/* Mobile layout */}
          <div className="block sm:hidden p-3">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <p className="font-medium text-base truncate">
                    {project.orderId ? `${project.orderId}_${project.projectName}` : project.projectName}
                  </p>
                  <button onClick={(e) => { e.stopPropagation(); handleCopy(project._id, project.orderId ? `${project.orderId}_${project.projectName}` : project.projectName, "title") }} className="shrink-0 text-muted-foreground/30 hover:text-muted-foreground transition-colors cursor-pointer">
                    {copied[`${project._id}-title`] ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {formatDate(project.startDate)}{project.cms ? ` · ${project.cms}` : ""}
                </p>
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
              {Number(project.price) ? (
                <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-md px-1.5 py-0.5">${Number(project.price).toFixed(2)}</span>
              ) : null}
            </div>
            {renderWebsite(project)}
            <div className="flex justify-end mt-1" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" className="cursor-pointer" />}>
                  <MoreHorizontal className="size-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onAction?.("edit", project)}>
                    <Pencil className="size-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAction?.("duplicate", project)}>
                    <Copy className="size-4" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onAction?.("status", project)}>
                    <ArrowLeftRight className="size-4" />
                    Status
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAction?.("transfer", project)}>
                    <CalendarArrowUp className="size-4" />
                    Transfer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAction?.("transferAssignee", project)}>
                    <UserRoundPlus className="size-4" />
                    Transfer to
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onAction?.("share", project)}>
                    <Link className="size-4" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => onAction?.("delete", project)}>
                    <Trash2 className="size-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Desktop layout */}
          <div className="hidden sm:grid grid-cols-[24px_36px_minmax(0,1fr)_110px] md:grid-cols-[24px_36px_minmax(0,1fr)_1fr_120px_100px] lg:grid-cols-[24px_36px_1fr_1fr_130px_110px_100px_36px] items-center gap-4 px-4 sm:px-6 py-3">
            <button
              onClick={(e) => { e.stopPropagation(); onSelectionChange?.(
                selectedIds.includes(project._id)
                  ? selectedIds.filter(id => id !== project._id)
                  : [...selectedIds, project._id]
              ) }}
              className="text-center cursor-pointer"
            >
              {selectedIds.includes(project._id)
                ? <CheckSquare className="size-4 mx-auto text-primary" />
                : <Square className="size-4 mx-auto text-muted-foreground/40 hover:text-muted-foreground" />
              }
            </button>
            <span className="text-sm text-muted-foreground tabular-nums text-center">{startSerial + idx}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <p className="font-medium text-base truncate">
                  {project.orderId ? `${project.orderId}_${project.projectName}` : project.projectName}
                </p>
                <button onClick={(e) => { e.stopPropagation(); handleCopy(project._id, project.orderId ? `${project.orderId}_${project.projectName}` : project.projectName, "title") }} className="shrink-0 text-muted-foreground/30 hover:text-muted-foreground transition-colors cursor-pointer">
                  {copied[`${project._id}-title`] ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDate(project.startDate)}{project.cms ? ` · ${project.cms}` : ""}
              </p>
            </div>
            <div className="hidden md:block">{renderWebsite(project)}</div>
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
            <div className="hidden lg:block text-sm text-right">
              {Number(project.price) ? (
                <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-md px-1.5 py-0.5">${Number(project.price).toFixed(2)}</span>
              ) : <span className="text-muted-foreground">-</span>}
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="-mr-1.5 cursor-pointer" />}>
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onAction?.("edit", project)}>
                    <Pencil className="size-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAction?.("duplicate", project)}>
                    <Copy className="size-4" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onAction?.("status", project)}>
                    <ArrowLeftRight className="size-4" />
                    Status
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAction?.("transfer", project)}>
                    <CalendarArrowUp className="size-4" />
                    Transfer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAction?.("transferAssignee", project)}>
                    <UserRoundPlus className="size-4" />
                    Transfer to
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onAction?.("share", project)}>
                    <Link className="size-4" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => onAction?.("delete", project)}>
                    <Trash2 className="size-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
})

export default ProjectTable
