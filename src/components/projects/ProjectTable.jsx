"use client"

import { useState, memo, useRef, useCallback, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table"
import {
  Copy, Check, ExternalLink, Globe, User, Lock, Eye, EyeOff,
  MoreHorizontal, Trash2, Pencil, ArrowLeftRight,
  Link, Percent, ArrowUpDown, ArrowUp, ArrowDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

const statusStyles = {
  "Pending": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  "In Progress": "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  "Delivered": "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
  "On Hold": "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800",
  "Cancelled": "bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-900/20 dark:text-zinc-400 dark:border-zinc-800",
  "Revision": "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800",
}

const priorityStyles = {
  "Low": "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800",
  "Medium": "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  "High": "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800",
  "Urgent": "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
}

function LongPressHandler({ onLongPress, onClick, children, className, active }) {
  const timerRef = useRef(null)
  const movedRef = useRef(false)

  const start = useCallback(() => {
    movedRef.current = false
    timerRef.current = setTimeout(() => onLongPress?.(), 500)
  }, [onLongPress])

  const move = useCallback(() => {
    movedRef.current = true
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }, [])

  const end = useCallback((e) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
      if (!movedRef.current) {
        if (active) onLongPress?.()
        else onClick?.(e)
      }
    }
  }, [onClick, onLongPress, active])

  return (
    <div className={className} onTouchStart={start} onTouchMove={move} onTouchEnd={end} onClick={active ? undefined : onClick}>
      {children}
    </div>
  )
}

function getSharePercent(project, userId) {
  if (!userId) return 0
  const isOwner = project.owner?._id === userId || project.owner?.toString() === userId
  if (isOwner) {
    const t = (project.assignee || []).reduce((s, a) => s + (a.percentage || 0), 0)
    return Math.max(0, 100 - t)
  }
  const entry = (project.assignee || []).find(a => (a.user?._id || a.user) === userId)
  return entry ? (entry.percentage || 0) : 0
}

const SORTABLE_COLUMNS = {
  name: { label: "Project", key: "projectName" },
  status: { label: "Status", key: "status" },
  priority: { label: "Priority", key: "priority" },
  price: { label: "My Price", key: "price" },
  progress: { label: "Progress", key: "progress" },
  date: { label: "Date", key: "createdAt" },
}

const RowActions = memo(function RowActions({ project, onAction }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="cursor-pointer" />}>
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onAction?.("edit", project)}>
          <Pencil className="size-4" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction?.("duplicate", project)}>
          <Copy className="size-4" /> Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onAction?.("status", project)}>
          <ArrowLeftRight className="size-4" /> Status
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction?.("progress", project)}>
          <Percent className="size-4" /> Progress
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction?.("share", project)}>
          <Link className="size-4" /> Share
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onAction?.("delete", project)}>
          <Trash2 className="size-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

const WebsiteCell = memo(function WebsiteCell({ project, pwData, copied, onCopy, onFetchPassword, onTogglePw }) {
  const mainSite = project.websites?.[0] || null
  const siteUrl = mainSite?.url || ""
  const siteUsername = mainSite?.username || ""
  const sitePasswordObj = mainSite?.password
  const totalSites = project.websites?.length || 0
  const pw = pwData[project._id]
  const hasPassword = sitePasswordObj && (sitePasswordObj.iv || typeof sitePasswordObj === "string")

  return (
    <div className="flex flex-col gap-1 min-w-0 max-w-[220px]">
      <div className="flex items-center gap-1">
        <Globe className="size-3 shrink-0 text-muted-foreground" />
        {siteUrl ? (
          <>
            <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate cursor-pointer">{siteUrl}</a>
            <button onClick={(e) => { e.stopPropagation(); onCopy(project._id, siteUrl, "url") }} className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground cursor-pointer">
              {copied[`${project._id}-url`] ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
            </button>
            <a href={siteUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground cursor-pointer">
              <ExternalLink className="size-3" />
            </a>
          </>
        ) : <span className="text-xs text-muted-foreground">-</span>}
      </div>
      <div className="flex items-center gap-1">
        <User className="size-3 shrink-0 text-muted-foreground" />
        {siteUsername ? (
          <>
            <span className="text-xs text-muted-foreground truncate">{siteUsername}</span>
            <button onClick={(e) => { e.stopPropagation(); onCopy(project._id, siteUsername, "username") }} className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground cursor-pointer">
              {copied[`${project._id}-username`] ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
            </button>
          </>
        ) : <span className="text-xs text-muted-foreground">-</span>}
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
              if (pw?.password === undefined) onFetchPassword(project._id)
              else onTogglePw(project._id)
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
                  onFetchPassword(project._id, pass)
                } catch { pass = "" }
              }
              if (pass) {
                navigator.clipboard.writeText(pass)
                onCopy(project._id, pass, "password")
              }
            }} className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground cursor-pointer" title="Copy Password">
              {copied[`${project._id}-password`] ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
            </button>
          </>
        ) : <span className="text-xs text-muted-foreground">-</span>}
      </div>
      {(totalSites > 1 || project.links?.length > 0) && (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {totalSites > 1 && <span>{totalSites - 1} extra</span>}
          {project.links?.length > 0 && <span>{project.links.length} links</span>}
        </div>
      )}
    </div>
  )
})

function formatDate(dateStr) {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

const ProjectTable = memo(function ProjectTable({
  projects = [], page = 1, pageSize = 20, onAction,
  selectedIds = [], onSelectionChange, selectMode = false,
  visibility = {}
}) {
  const { data: session } = useSession()
  const router = useRouter()
  const [copied, setCopied] = useState({})
  const [pwData, setPwData] = useState({})
  const [globalFiverrFee, setGlobalFiverrFee] = useState(true)
  const [pendingProjects, setPendingProjects] = useState(new Set())
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState("desc")

  useEffect(() => {
    fetch('/api/notifications?sent=true&type=assignee_add_request')
      .then(r => r.ok ? r.json() : [])
      .then(data => setPendingProjects(new Set(data.filter(n => n.status === 'pending').map(n => n.project?._id || n.project))))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem("fiverrFeeEnabled")
    setGlobalFiverrFee(saved !== "false")
  }, [])

  const handleCopy = useCallback((id, value, key) => {
    navigator.clipboard.writeText(value)
    setCopied(prev => ({ ...prev, [`${id}-${key}`]: true }))
    setTimeout(() => setCopied(prev => ({ ...prev, [`${id}-${key}`]: false })), 1500)
  }, [])

  const toggleOne = useCallback((id) => {
    onSelectionChange?.(
      selectedIds.includes(id)
        ? selectedIds.filter(i => i !== id)
        : [...selectedIds, id]
    )
  }, [selectedIds, onSelectionChange])

  const fetchPassword = useCallback(async (projectId, preloadedPass) => {
    if (preloadedPass !== undefined) {
      setPwData(prev => ({ ...prev, [projectId]: { password: preloadedPass, show: false } }))
      return
    }
    if (pwData[projectId]?.password !== undefined) return
    try {
      const res = await fetch(`/api/projects/${projectId}/password`)
      const data = await res.json()
      setPwData(prev => ({
        ...prev,
        [projectId]: { password: typeof data.password === "string" ? data.password : "", show: true },
      }))
    } catch {
      setPwData(prev => ({ ...prev, [projectId]: { password: "", show: false } }))
    }
  }, [pwData])

  const toggleShowPw = useCallback((projectId) => {
    setPwData(prev => {
      const cur = prev[projectId]
      if (!cur) return prev
      return { ...prev, [projectId]: { ...cur, show: !cur.show } }
    })
  }, [])

  const handleSort = useCallback((col) => {
    if (sortColumn === col) {
      setSortDirection(d => d === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(col)
      setSortDirection("asc")
    }
  }, [sortColumn])

  const sortedProjects = useMemo(() => {
    if (!sortColumn) return projects
    const col = SORTABLE_COLUMNS[sortColumn]
    if (!col) return projects
    const dir = sortDirection === "asc" ? 1 : -1
    return [...projects].sort((a, b) => {
      let va = a[col.key], vb = b[col.key]
      if (col.key === "projectName") {
        va = (a.orderId ? `${a.orderId}_${a.projectName}` : a.projectName) || ""
        vb = (b.orderId ? `${b.orderId}_${b.projectName}` : b.projectName) || ""
      }
      if (va == null) va = ""
      if (vb == null) vb = ""
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir
      return String(va).localeCompare(String(vb)) * dir
    })
  }, [projects, sortColumn, sortDirection])

  const SortIcon = ({ column }) => {
    if (sortColumn !== column) return <ArrowUpDown className="size-3 ml-1 opacity-30" />
    return sortDirection === "asc"
      ? <ArrowUp className="size-3 ml-1" />
      : <ArrowDown className="size-3 ml-1" />
  }

  const desktopColumns = useMemo(() => {
    const cols = [
      { id: "serial", label: "#", className: "w-10 text-center", hide: "" },
      { id: "name", label: "Project", sortable: true, className: "min-w-[180px]", hide: "" },
      { id: "website", label: "Website", className: "min-w-[200px]", hide: "" },
      { id: "status", label: "Status", sortable: true, className: "w-[110px]", hide: "" },
      { id: "priority", label: "Priority", sortable: true, className: "hidden md:table-cell w-[100px]", hide: "md" },
      { id: "orderId", label: "Order ID", className: "hidden lg:table-cell w-[100px]", hide: "lg" },
      { id: "price", label: "My Price", sortable: true, className: "hidden lg:table-cell w-[90px]", hide: "lg" },
      { id: "progress", label: "Progress", sortable: true, className: "hidden lg:table-cell w-[80px] text-right", hide: "lg" },
      { id: "cms", label: "CMS", className: "hidden lg:table-cell w-[90px]", hide: "lg" },
      { id: "tags", label: "Tags", className: "hidden xl:table-cell min-w-[120px]", hide: "xl" },
      { id: "owner", label: "Owner", className: "hidden lg:table-cell w-[100px]", hide: "lg" },
      { id: "createdBy", label: "Created By", className: "hidden xl:table-cell w-[100px]", hide: "xl" },
      { id: "assignee", label: "Contributors", className: "hidden xl:table-cell min-w-[120px]", hide: "xl" },
      { id: "description", label: "Description", className: "hidden xl:table-cell min-w-[160px]", hide: "xl" },
      { id: "links", label: "Links", className: "hidden lg:table-cell w-[70px] text-center", hide: "lg" },
      { id: "actions", label: "", className: "w-[40px]", hide: "" },
    ]
    const colVisibility = {
      serial: visibility.serial !== false,
      name: visibility.title !== false,
      orderId: visibility.orderId !== false,
      status: visibility.status !== false,
      priority: visibility.priority !== false,
      website: visibility.website !== false,
      price: visibility.price !== false,
      progress: visibility.progress !== false,
      cms: visibility.cms !== false,
      tags: visibility.tags !== false,
      owner: visibility.owner !== false,
      createdBy: visibility.createdBy !== false,
      assignee: visibility.assignee !== false,
      description: visibility.description !== false,
      links: visibility.links !== false,
    }
    return cols.filter(col => col.id === "actions" || colVisibility[col.id] !== false)
  }, [visibility])

  if (projects.length === 0) {
    return <div className="text-center text-muted-foreground py-12">Project not available</div>
  }

  const renderSortableHead = (col) => {
    if (!col.sortable) {
      return <TableHead key={col.id} className={col.className}>{col.label}</TableHead>
    }
    return (
      <TableHead key={col.id} className={cn(col.className, "cursor-pointer select-none hover:text-foreground transition-colors")} onClick={() => handleSort(col.id)}>
        <div className="flex items-center gap-0.5">
          {col.label}
          <SortIcon column={col.id} />
        </div>
      </TableHead>
    )
  }

  return (
    <div className="space-y-2 sm:space-y-1.5">
      {/* Desktop table */}
      <div className="hidden sm:block rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {desktopColumns.map(col => renderSortableHead(col))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProjects.map((project, idx) => {
              const isSelected = selectedIds.includes(project._id)
              const serial = (page - 1) * pageSize + idx + 1
              const sharePct = getSharePercent(project, session?.user?.id)
              const shareAmt = project.price ? project.price * sharePct / 100 : 0

              const getName = (obj) => {
                if (!obj) return ""
                if (typeof obj === "object" && obj.name) return obj.name
                if (typeof obj === "object" && obj._id) return obj._id.slice(-6)
                return String(obj).slice(-6)
              }

              const renderCell = (colId) => {
                switch (colId) {
                  case "serial":
                    return <span className="text-sm text-muted-foreground tabular-nums">{serial}</span>
                  case "name":
                    return (
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="font-medium text-sm truncate">
                            {project.orderId ? `${project.orderId}_${project.projectName}` : project.projectName}
                          </p>
                          <button onClick={(e) => { e.stopPropagation(); handleCopy(project._id, project.orderId ? `${project.orderId}_${project.projectName}` : project.projectName, "title") }} className="shrink-0 text-muted-foreground/30 hover:text-muted-foreground transition-colors cursor-pointer">
                            {copied[`${project._id}-title`] ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
                          </button>
                          {pendingProjects.has(project._id) && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-full px-1.5 py-0.5 shrink-0">
                              <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Pending
                            </span>
                          )}
                        </div>
                        {(visibility.date !== false || visibility.cms !== false) && (
                          <p className="text-xs text-muted-foreground">
                            {visibility.date !== false && formatDate(project.currentProjectDate || project.createdAt)}{visibility.cms !== false && project.cms ? ` \u00B7 ${project.cms}` : ""}
                          </p>
                        )}
                      </div>
                    )
                  case "orderId":
                    return project.orderId ? (
                      <span className="text-sm font-mono text-muted-foreground">{project.orderId}</span>
                    ) : <span className="text-sm text-muted-foreground">-</span>
                  case "website":
                    return <WebsiteCell project={project} pwData={pwData} copied={copied} onCopy={handleCopy} onFetchPassword={fetchPassword} onTogglePw={toggleShowPw} />
                  case "status":
                    return project.status ? (
                      <Badge variant="outline" className={cn("text-xs font-medium px-2 py-0.5", statusStyles[project.status])}>{project.status}</Badge>
                    ) : null
                  case "priority":
                    return project.priority ? (
                      <Badge variant="outline" className={cn("text-xs font-medium px-2 py-0.5", priorityStyles[project.priority])}>{project.priority}</Badge>
                    ) : null
                  case "price":
                    return Number(shareAmt) ? (
                      <div className="flex flex-col items-start gap-0.5">
                        <span className={cn("text-xs font-semibold rounded-md px-1.5 py-0.5", sharePct < 100 ? "text-violet-600 dark:text-violet-400 bg-violet-500/10" : "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10")}>
                          ${Number(shareAmt).toFixed(2)}
                        </span>
                        <span className={cn("text-[10px] font-medium px-1.5 rounded-sm", project.fiverrFeeEnabled !== false ? "text-orange-600 dark:text-orange-400 bg-orange-500/10" : "text-muted-foreground/60 bg-muted/50")}>
                          {project.fiverrFeeEnabled !== false ? "Fiverr Fee On" : "Fiverr Fee Off"}
                        </span>
                      </div>
                    ) : <span className="text-sm text-muted-foreground">-</span>
                  case "progress":
                    return <span className="font-medium tabular-nums text-sm text-muted-foreground">{project.progress ?? 0}%</span>
                  case "cms":
                    return project.cms ? (
                      <Badge variant="outline" className="text-xs font-medium px-2 py-0.5">{project.cms}</Badge>
                    ) : <span className="text-sm text-muted-foreground">-</span>
                  case "tags":
                    return project.tags?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {project.tags.slice(0, 3).map((t) => (
                          <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0">{t}</Badge>
                        ))}
                        {project.tags.length > 3 && <span className="text-[10px] text-muted-foreground">+{project.tags.length - 3}</span>}
                      </div>
                    ) : <span className="text-sm text-muted-foreground">-</span>
                  case "owner":
                    return (
                      <span className="text-sm text-muted-foreground truncate block max-w-[100px]">
                        {getName(project.owner) || "-"}
                      </span>
                    )
                  case "createdBy":
                    return (
                      <span className="text-sm text-muted-foreground truncate block max-w-[100px]">
                        {getName(project.createdBy) || "-"}
                      </span>
                    )
                  case "assignee":
                    return project.assignee?.length > 0 ? (
                      <div className="flex flex-col gap-0.5">
                        {project.assignee.slice(0, 2).map((a) => (
                          <span key={a.user?._id || a.user} className="text-xs text-muted-foreground truncate max-w-[120px]">
                            {getName(a.user)} ({a.percentage}%)
                          </span>
                        ))}
                        {project.assignee.length > 2 && <span className="text-[10px] text-muted-foreground">+{project.assignee.length - 2} more</span>}
                      </div>
                    ) : <span className="text-sm text-muted-foreground">-</span>
                  case "description":
                    return project.description ? (
                      <span className="text-xs text-muted-foreground line-clamp-2 max-w-[160px]">{project.description}</span>
                    ) : <span className="text-sm text-muted-foreground">-</span>
                  case "links":
                    return project.links?.length > 0 ? (
                      <span className="text-sm font-medium tabular-nums text-muted-foreground">{project.links.length}</span>
                    ) : <span className="text-sm text-muted-foreground">-</span>
                  case "actions":
                    return <RowActions project={project} onAction={onAction} />
                  default:
                    return null
                }
              }

              return (
                <TableRow
                  key={project._id}
                  className={cn(
                    "transition-all cursor-pointer",
                    isSelected && "bg-primary/10 border-primary/60",
                    selectMode && !isSelected && "opacity-70 hover:opacity-100"
                  )}
                  onClick={() => {
                    if (selectMode) toggleOne(project._id)
                    else router.push(`/dashboard/projects/${project._id}`)
                  }}
                  data-state={isSelected ? "selected" : undefined}
                >
                  {desktopColumns.map(col => (
                    <TableCell key={col.id} className={col.className} onClick={col.id === "actions" ? e => e.stopPropagation() : undefined}>
                      {renderCell(col.id)}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="block sm:hidden space-y-2.5">
        {sortedProjects.map((project, idx) => {
          const getName = (obj) => {
            if (!obj) return ""
            if (typeof obj === "object" && obj.name) return obj.name
            if (typeof obj === "object" && obj._id) return obj._id.slice(-6)
            return String(obj).slice(-6)
          }
          const isSelected = selectedIds.includes(project._id)
          const serial = (page - 1) * pageSize + idx + 1
          const sharePct = getSharePercent(project, session?.user?.id)
          const shareAmt = project.price ? project.price * sharePct / 100 : 0
          const mainSite = project.websites?.[0] || null
          const siteUrl = mainSite?.url || ""
          const siteUsername = mainSite?.username || ""
          const sitePasswordObj = mainSite?.password
          const totalSites = project.websites?.length || 0
          const pw = pwData[project._id]
          const hasPassword = sitePasswordObj && (sitePasswordObj.iv || typeof sitePasswordObj === "string")
          const progressVal = project.progress ?? 0

          return (
            <div key={project._id} className={cn(
              "rounded-xl border bg-card transition-all overflow-hidden",
              isSelected
                ? "border-primary/60 bg-primary/[0.06] shadow-md ring-2 ring-primary/20"
                : selectMode
                  ? "opacity-70 hover:opacity-100 hover:border-primary/30 hover:shadow-sm cursor-pointer active:scale-[0.99]"
                  : "hover:border-primary/30 hover:shadow-sm"
            )}>
              <LongPressHandler
                active={selectMode}
                onLongPress={() => toggleOne(project._id)}
                onClick={() => {
                  if (selectMode) toggleOne(project._id)
                  else router.push(`/dashboard/projects/${project._id}`)
                }}
                className="p-3.5"
              >
                {/* Header row */}
                {(visibility.title !== false || visibility.serial !== false) && (
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className={cn("min-w-0", visibility.title !== false ? "flex-1" : "hidden")}>
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-[15px] leading-snug truncate">
                          {project.orderId ? `${project.orderId}_${project.projectName}` : project.projectName}
                        </p>
                        <button onClick={(e) => { e.stopPropagation(); handleCopy(project._id, project.orderId ? `${project.orderId}_${project.projectName}` : project.projectName, "title") }} className="shrink-0 text-muted-foreground/30 hover:text-muted-foreground transition-colors cursor-pointer">
                          {copied[`${project._id}-title`] ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
                        </button>
                        {pendingProjects.has(project._id) && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-full px-1.5 py-0.5 shrink-0">
                            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Pending
                          </span>
                        )}
                      </div>
                      {visibility.date !== false && (
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          {formatDate(project.currentProjectDate || project.createdAt)}{project.cms && visibility.cms !== false ? ` \u00B7 ${project.cms}` : ""}
                        </p>
                      )}
                    </div>
                    {visibility.serial !== false && (
                      <span className="text-[11px] text-muted-foreground/50 font-mono tabular-nums shrink-0 mt-0.5">#{serial}</span>
                    )}
                  </div>
                )}

                {/* Status + Priority + Price row */}
                {(visibility.status !== false || visibility.priority !== false || visibility.price !== false) && (
                  <div className="flex items-center gap-2 mb-2.5">
                    {visibility.status !== false && project.status && (
                      <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md border", statusStyles[project.status])}>
                        <span className={cn(
                          "size-1.5 rounded-full shrink-0",
                          project.status === "Pending" && "bg-amber-500",
                          project.status === "In Progress" && "bg-blue-500",
                          project.status === "Delivered" && "bg-emerald-500",
                          project.status === "On Hold" && "bg-rose-500",
                          project.status === "Cancelled" && "bg-zinc-400",
                          project.status === "Revision" && "bg-purple-500",
                        )} />
                        {project.status}
                      </span>
                    )}
                    {visibility.priority !== false && project.priority && (
                      <span className={cn("text-[11px] font-medium px-1.5 py-0.5 rounded-md", priorityStyles[project.priority])}>
                        {project.priority}
                      </span>
                    )}
                    {visibility.price !== false && Number(shareAmt) ? (
                      <span className={cn(
                        "ml-auto text-[13px] font-bold tabular-nums",
                        sharePct < 100 ? "text-violet-600 dark:text-violet-400" : "text-emerald-600 dark:text-emerald-400"
                      )}>
                        ${Number(shareAmt).toFixed(2)}
                        <span className="text-[10px] font-medium text-muted-foreground/60 ml-0.5">({sharePct}%)</span>
                      </span>
                    ) : visibility.price !== false && project.price ? (
                      <span className="ml-auto text-[13px] font-bold tabular-nums text-muted-foreground">
                        ${Number(project.price).toFixed(2)}
                      </span>
                    ) : null}
                  </div>
                )}

                {/* Progress bar */}
                {visibility.progress !== false && (
                  <div className="mb-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-medium text-muted-foreground/70">Progress</span>
                      <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">{progressVal}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          progressVal < 30 ? "bg-rose-400" : progressVal < 70 ? "bg-amber-400" : "bg-emerald-400"
                        )}
                        style={{ width: `${progressVal}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Fee indicator */}
                {visibility.price !== false && project.fiverrFeeEnabled !== false && Number(shareAmt) ? (
                  <div className="mb-2 flex items-center gap-1.5">
                    <span className="text-[10px] font-medium text-orange-600 dark:text-orange-400 bg-orange-500/10 rounded-md px-1.5 py-0.5">Fee On</span>
                  </div>
                ) : null}

                {/* Website info - compact rows */}
                {visibility.website !== false && siteUrl && (
                  <div className="border-t border-border/40 pt-2 mt-1 space-y-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[11px] font-medium text-muted-foreground/50 w-5 shrink-0">URL</span>
                      <span className="text-xs truncate flex-1">{siteUrl}</span>
                      <button onClick={(e) => { e.stopPropagation(); handleCopy(project._id, siteUrl, "url") }} className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground cursor-pointer">
                        {copied[`${project._id}-url`] ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
                      </button>
                      <a href={siteUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground cursor-pointer">
                        <ExternalLink className="size-3" />
                      </a>
                    </div>
                    {siteUsername && (
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[11px] font-medium text-muted-foreground/50 w-5 shrink-0">ID</span>
                        <span className="text-xs truncate flex-1">{siteUsername}</span>
                        <button onClick={(e) => { e.stopPropagation(); handleCopy(project._id, siteUsername, "username") }} className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground cursor-pointer">
                          {copied[`${project._id}-username`] ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
                        </button>
                      </div>
                    )}
                    {hasPassword && (
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[11px] font-medium text-muted-foreground/50 w-5 shrink-0">PW</span>
                        <span className="text-xs font-mono truncate flex-1">
                          {pw?.password !== undefined && pw.show ? pw.password : "\u2022\u2022\u2022\u2022\u2022"}
                        </span>
                        <button onClick={(e) => {
                          e.stopPropagation()
                          if (pw?.password === undefined) fetchPassword(project._id)
                          else toggleShowPw(project._id)
                        }} className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground cursor-pointer">
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
                              fetchPassword(project._id, pass)
                            } catch { pass = "" }
                          }
                          if (pass) {
                            navigator.clipboard.writeText(pass)
                            handleCopy(project._id, pass, "password")
                          }
                        }} className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground cursor-pointer">
                          {copied[`${project._id}-password`] ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
                        </button>
                      </div>
                    )}
                    {(totalSites > 1 || project.links?.length > 0) && (
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 pt-0.5">
                        {totalSites > 1 && <span>+{totalSites - 1} more sites</span>}
                        {project.links?.length > 0 && <span>{project.links.length} links</span>}
                      </div>
                    )}
                  </div>
                )}

                {/* Order ID */}
                {visibility.orderId !== false && project.orderId && (
                  <div className="border-t border-border/40 pt-2 mt-1 space-y-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[11px] font-medium text-muted-foreground/50 w-14 shrink-0">Order ID</span>
                      <span className="text-xs font-mono text-muted-foreground">{project.orderId}</span>
                    </div>
                  </div>
                )}

                {/* Tags */}
                {visibility.tags !== false && project.tags?.length > 0 && (
                  <div className="border-t border-border/40 pt-2 mt-1 space-y-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[11px] font-medium text-muted-foreground/50 w-14 shrink-0">Tags</span>
                      <div className="flex flex-wrap gap-1">
                        {project.tags.map((t) => (
                          <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0">{t}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Owner + Created By */}
                {(visibility.owner !== false || visibility.createdBy !== false) && (project.owner || project.createdBy) && (
                  <div className="border-t border-border/40 pt-2 mt-1 space-y-1">
                    {visibility.owner !== false && project.owner && (
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[11px] font-medium text-muted-foreground/50 w-14 shrink-0">Owner</span>
                        <span className="text-xs text-muted-foreground truncate">{getName(project.owner)}</span>
                      </div>
                    )}
                    {visibility.createdBy !== false && project.createdBy && (
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[11px] font-medium text-muted-foreground/50 w-14 shrink-0">Created</span>
                        <span className="text-xs text-muted-foreground truncate">{getName(project.createdBy)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Contributors */}
                {visibility.assignee !== false && project.assignee?.length > 0 && (
                  <div className="border-t border-border/40 pt-2 mt-1 space-y-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[11px] font-medium text-muted-foreground/50 w-14 shrink-0">Team</span>
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                        {project.assignee.map((a) => (
                          <span key={a.user?._id || a.user} className="text-xs text-muted-foreground">
                            {getName(a.user)} ({a.percentage}%)
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Description */}
                {visibility.description !== false && project.description && (
                  <div className="border-t border-border/40 pt-2 mt-1 space-y-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[11px] font-medium text-muted-foreground/50 w-14 shrink-0">Note</span>
                      <span className="text-xs text-muted-foreground line-clamp-2">{project.description}</span>
                    </div>
                  </div>
                )}

                {/* Links */}
                {(visibility.links !== false) && (project.links?.length > 0) && (
                  <div className="border-t border-border/40 pt-2 mt-1 space-y-1">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs text-muted-foreground">
                        <span className="text-muted-foreground/50">Links:</span> {project.links.length}
                      </span>
                    </div>
                  </div>
                )}
              </LongPressHandler>

              {/* Actions footer */}
              <div className="flex items-center justify-between border-t border-border/40 px-3.5 py-2" onClick={e => e.stopPropagation()}>
                <span className="text-[10px] text-muted-foreground/40">{visibility.cms !== false ? (project.cms || "") : ""}</span>
                <RowActions project={project} onAction={onAction} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})

export default ProjectTable
