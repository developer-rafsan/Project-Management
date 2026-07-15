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
  UserRoundPlus, Link, Percent, ArrowUpDown, ArrowUp, ArrowDown,
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
  const entry = (project.assignee || []).find(a => (a.user?._id || a.user) === userId)
  if (entry) return entry.percentage || 0
  const isOwner = project.owner?._id === userId || project.owner?.toString() === userId
  if (isOwner) {
    const t = (project.assignee || []).reduce((s, a) => s + (a.percentage || 0), 0)
    return Math.max(0, 100 - t)
  }
  return 0
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
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onAction?.("transferOwner", project)}>
          <UserRoundPlus className="size-4" /> Transfer Owner
        </DropdownMenuItem>
        <DropdownMenuSeparator />
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
      {(totalSites > 1 || project.figmaLinks?.length > 0 || project.referenceLinks?.length > 0) && (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {totalSites > 1 && <span>{totalSites - 1} extra</span>}
          {project.figmaLinks?.length > 0 && <span>{project.figmaLinks.length} figma</span>}
          {project.referenceLinks?.length > 0 && <span>{project.referenceLinks.length} ref</span>}
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
  selectedIds = [], onSelectionChange, selectMode = false
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

  const desktopColumns = useMemo(() => [
    { id: "serial", label: "#", className: "w-10 text-center", hide: "" },
    { id: "name", label: "Project", sortable: true, className: "min-w-[180px]", hide: "" },
    { id: "website", label: "Website", className: "hidden md:table-cell min-w-[200px]", hide: "md" },
    { id: "status", label: "Status", sortable: true, className: "w-[110px]", hide: "" },
    { id: "priority", label: "Priority", sortable: true, className: "hidden md:table-cell w-[100px]", hide: "md" },
    { id: "price", label: "My Price", sortable: true, className: "hidden lg:table-cell w-[90px]", hide: "lg" },
    { id: "progress", label: "Progress", sortable: true, className: "hidden lg:table-cell w-[80px] text-right", hide: "lg" },
    { id: "actions", label: "", className: "w-[40px]", hide: "" },
  ], [])

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
                  <TableCell className="text-center text-sm text-muted-foreground tabular-nums">{serial}</TableCell>
                  <TableCell>
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
                      <p className="text-xs text-muted-foreground">
                        {formatDate(project.currentProjectDate || project.createdAt)}{project.cms ? ` \u00B7 ${project.cms}` : ""}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <WebsiteCell project={project} pwData={pwData} copied={copied} onCopy={handleCopy} onFetchPassword={fetchPassword} onTogglePw={toggleShowPw} />
                  </TableCell>
                  <TableCell>
                    {project.status && (
                      <Badge variant="outline" className={cn("text-xs font-medium px-2 py-0.5", statusStyles[project.status])}>{project.status}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {project.priority && (
                      <Badge variant="outline" className={cn("text-xs font-medium px-2 py-0.5", priorityStyles[project.priority])}>{project.priority}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {Number(shareAmt) ? (
                      <span className={cn("text-xs font-semibold rounded-md px-1.5 py-0.5", sharePct < 100 ? "text-violet-600 dark:text-violet-400 bg-violet-500/10" : "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10")}>
                        ${Number(shareAmt).toFixed(2)}
                      </span>
                    ) : <span className="text-sm text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-right">
                    <span className="font-medium tabular-nums text-sm text-muted-foreground">{project.progress ?? 0}%</span>
                  </TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <RowActions project={project} onAction={onAction} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="block sm:hidden space-y-2">
        {sortedProjects.map((project, idx) => {
          const isSelected = selectedIds.includes(project._id)
          const serial = (page - 1) * pageSize + idx + 1
          const sharePct = getSharePercent(project, session?.user?.id)
          const shareAmt = project.price ? project.price * sharePct / 100 : 0

          return (
            <div key={project._id} className={cn(
              "rounded-xl border bg-card transition-all",
              isSelected
                ? "border-primary/60 bg-primary/10 shadow-md ring-2 ring-primary/30 opacity-100 scale-[1.01]"
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
                className="p-3"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <p className="font-medium text-base truncate">
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
                    <p className="text-xs text-muted-foreground">
                      {formatDate(project.currentProjectDate || project.createdAt)}{project.cms ? ` \u00B7 ${project.cms}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums shrink-0">#{serial}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs mb-1.5">
                  {project.status && (
                    <Badge variant="outline" className={cn("text-[11px] font-medium px-2 py-0", statusStyles[project.status])}>{project.status}</Badge>
                  )}
                  {project.priority && (
                    <Badge variant="outline" className={cn("text-[11px] font-medium px-2 py-0", priorityStyles[project.priority])}>{project.priority}</Badge>
                  )}
                  {Number(shareAmt) ? (
                    <span className={cn("inline-flex flex-col items-start leading-tight font-semibold rounded-md px-1.5 py-0.5 min-w-[52px]", sharePct < 100 ? "text-violet-600 dark:text-violet-400 bg-violet-500/10" : "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10")}>
                      <span className="text-[11px]">${Number(shareAmt).toFixed(2)}</span>
                    </span>
                  ) : null}
                </div>
                <div className="text-xs text-muted-foreground mb-1.5">
                  <span className="font-medium tabular-nums">Progress: {project.progress ?? 0}%</span>
                </div>
                <WebsiteCell project={project} pwData={pwData} copied={copied} onCopy={handleCopy} onFetchPassword={fetchPassword} onTogglePw={toggleShowPw} />
              </LongPressHandler>
              <div className="flex items-center justify-end px-3 pb-3 gap-2" onClick={e => e.stopPropagation()}>
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
