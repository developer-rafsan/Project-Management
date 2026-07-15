"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  List, Eye, Settings, ShieldCheck, Circle, Hash, Globe, User, FolderKanban, Search, X,
  MoreHorizontal, Pencil, Trash2, CalendarArrowUp, UserRoundPlus, ExternalLink,
} from "lucide-react"
import { toast } from "sonner"
import SharedEditForm from "@/components/shared/SharedEditForm"
import { getEffectiveMonthYear } from "@/lib/dateUtils"
import SharedMonthTransfer from "@/components/shared/SharedMonthTransfer"
import SharedTransferAssignee from "@/components/shared/SharedTransferAssignee"
import SharedDeleteConfirm from "@/components/shared/SharedDeleteConfirm"

const STATUSES = ["All", "Pending", "In Progress", "Delivered", "Revision", "On Hold", "Cancelled"]
const PRIORITIES = ["All", "Low", "Medium", "High", "Urgent"]
const CMS_OPTIONS = ["All", "WordPress", "WooCommerce", "Shopify", "Wix", "Webflow", "Next.js", "React", "Laravel", "PHP", "Custom", "HTML", "Other"]

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const statusStyles = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  "In Progress": "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  Delivered: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
  "On Hold": "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800",
  Cancelled: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
  Revision: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800",
}

const priorityStyles = {
  Low: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
  Medium: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
  High: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800",
  Urgent: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
}

const ACCESS_BADGES = {
  view: { label: "Read-only view", icon: Eye, class: "text-muted-foreground/60" },
  manager: { label: "Manager access", icon: Settings, class: "text-blue-500" },
  full: { label: "Full access", icon: ShieldCheck, class: "text-emerald-500" },
}

function formatDate(dateStr) {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  })
}

export default function SharedListPage({ params: paramsPromise }) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [projects, setProjects] = useState([])
  const [sharedBy, setSharedBy] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSelectedShare, setIsSelectedShare] = useState(false)
  const [accessLevel, setAccessLevel] = useState("view")
  const [listToken, setListToken] = useState(null)

  const [activeMenu, setActiveMenu] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [transferMonthOpen, setTransferMonthOpen] = useState(false)
  const [transferAssigneeOpen, setTransferAssigneeOpen] = useState(false)
  const [deleteProjectId, setDeleteProjectId] = useState(null)

  const [startDay] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("monthStartDay")
      return saved ? Number(saved) : 1
    }
    return 1
  })

  const now = new Date()
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1)
  const [filterYear, setFilterYear] = useState(now.getFullYear())
  const [filterStatus, setFilterStatus] = useState("All")
  const [filterPriority, setFilterPriority] = useState("All")
  const [filterCms, setFilterCms] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterMode, setFilterMode] = useState("month")

  useEffect(() => {
    paramsPromise.then((p) => setListToken(p.token))
  }, [paramsPromise])

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      paramsPromise.then((p) => {
        router.replace(`/login?callbackUrl=/shared-list/${p.token}`)
      })
    }
  }, [status, paramsPromise, router])

  const fetchData = useCallback(async () => {
    if (!listToken) return
    try {
      const res = await fetch(`/api/share-list/${listToken}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Not found")
      setProjects(data.projects || [])
      setSharedBy(data.sharedBy)
      setAccessLevel(data.accessLevel || "view")
      if (data.isSelectedShare) {
        setIsSelectedShare(true)
        setFilterMode("all")
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [listToken])

  useEffect(() => {
    if (listToken) fetchData()
  }, [fetchData, listToken])

  const filtered = useMemo(() => {
    let list = [...projects]

    if (filterMode === "month") {
      list = list.filter((p) => {
        const eff = getEffectiveMonthYear(p, startDay)
        return eff.month === filterMonth && eff.year === filterYear
      })
    }

    if (filterStatus !== "All") {
      list = list.filter((p) => p.status === filterStatus)
    }
    if (filterPriority !== "All") {
      list = list.filter((p) => p.priority === filterPriority)
    }
    if (filterCms !== "All") {
      list = list.filter((p) => p.cms === filterCms)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (p) =>
          (p.projectName && p.projectName.toLowerCase().includes(q)) ||
          (p.orderId && p.orderId.toLowerCase().includes(q)) ||
          (p.websites?.some(s => s.url && s.url.toLowerCase().includes(q)))
      )
    }

    return list
  }, [projects, filterMode, filterMonth, filterYear, filterStatus, filterPriority, filterCms, searchQuery, startDay, now])

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-48" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Eye className="size-12 text-muted-foreground/30 mx-auto" />
          <h1 className="text-xl font-semibold">List not available</h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            This share link has expired or is invalid.
          </p>
        </div>
      </div>
    )
  }

  const badge = ACCESS_BADGES[accessLevel] || ACCESS_BADGES.view
  const BadgeIcon = badge.icon
  const canEdit = accessLevel === "manager" || accessLevel === "full"
  const canFull = accessLevel === "full"

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className={`flex items-center gap-2 text-xs ${badge.class}`}>
          <BadgeIcon className="size-3.5" />
          <span>{badge.label}</span>
          <span className="text-muted-foreground/50">&middot;</span>
          <span>Shared by</span>
          {sharedBy && (
            <div className="flex items-center gap-1.5">
              <Avatar size="sm">
                <AvatarImage src={sharedBy.image} />
                <AvatarFallback className="text-[10px]">{sharedBy.name?.charAt(0) || "?"}</AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium">{sharedBy.name}</span>
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <List className="size-6" />
            Projects
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-medium text-foreground">{filtered.length}</span> {filtered.length === 1 ? "project" : "projects"}
            {filtered.length !== projects.length && (
              <span className="text-muted-foreground/60"> (filtered from {projects.length})</span>
            )}
          </p>
        </div>

        {projects.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
            <div className="flex rounded-lg border p-0.5 bg-muted/30">
              <button
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${filterMode === "month" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setFilterMode("month")}
              >Month</button>
              <button
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${filterMode === "all" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setFilterMode("all")}
              >All</button>
            </div>

            {filterMode === "month" && (
              <div className="flex gap-1.5">
                <Select value={String(filterMonth)} onValueChange={(v) => setFilterMonth(Number(v))}>
                  <SelectTrigger className="w-[100px] h-7 text-xs">
                    <SelectValue placeholder={monthNames[filterMonth - 1]} />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames.map((name, i) => (
                      <SelectItem key={i} value={String(i + 1)} className="text-xs">{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={String(filterYear)} onValueChange={(v) => setFilterYear(Number(v))}>
                  <SelectTrigger className="w-[80px] h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
                      <SelectItem key={y} value={String(y)} className="text-xs">{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="h-4 w-px bg-border mx-1" />

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[110px] h-7 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">{s === "All" ? "All Status" : s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[110px] h-7 text-xs">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p} className="text-xs">{p === "All" ? "All Priority" : p}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCms} onValueChange={setFilterCms}>
              <SelectTrigger className="w-[110px] h-7 text-xs">
                <SelectValue placeholder="CMS" />
              </SelectTrigger>
              <SelectContent>
                {CMS_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c} className="text-xs">{c === "All" ? "All CMS" : c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1 min-w-[150px] max-w-[220px]">
              <Search className="size-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="h-7 text-xs pl-7 pr-7"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground cursor-pointer">
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FolderKanban className="size-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No projects match your filters</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((project) => {
              const isMenuOpen = activeMenu === project._id
              const shareTokenUrl = project.shareToken ? `/shared/${project.shareToken}` : "#"
              const apiPath = `/api/shared/${project.shareToken}`
              return (
                <div key={project._id} className="rounded-xl border bg-card hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between gap-4 p-4">
                    <Link href={shareTokenUrl} className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-semibold truncate">{project.projectName}</h2>
                        {project.status && (
                          <Badge variant="outline" className={`text-xs font-medium px-2 py-0.5 ${statusStyles[project.status] || ""}`}>
                            <Circle className="size-2 fill-current mr-1" />
                            {project.status}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {project.orderId && (
                          <span className="flex items-center gap-1">
                            <Hash className="size-3" /> {project.orderId}
                          </span>
                        )}
                        {project.cms && (
                          <span className="flex items-center gap-1">
                            <Globe className="size-3" /> {project.cms}
                          </span>
                        )}
                        {project.assignee?.[0]?.user?.name && (
                          <span className="flex items-center gap-1">
                            <User className="size-3" /> {project.assignee[0].user.name}
                          </span>
                        )}
                        <span>{formatDate(project.currentProjectDate || project.createdAt)}</span>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      {project.priority && (
                        <Badge variant="outline" className={`text-xs font-medium px-2 py-0.5 ${priorityStyles[project.priority] || ""}`}>
                          {project.priority}
                        </Badge>
                      )}
                      {Number(project.price) > 0 && (
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          ${Number(project.price).toFixed(2)}
                        </span>
                      )}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setActiveMenu(isMenuOpen ? null : project._id) }}
                          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                        >
                          <MoreHorizontal className="size-4" />
                        </button>
                        {isMenuOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                            <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-lg border bg-popover p-1 shadow-md">
                              <Link
                                href={shareTokenUrl}
                                className="flex items-center gap-2 w-full rounded-md px-2.5 py-2 text-sm hover:bg-accent cursor-pointer"
                                onClick={() => setActiveMenu(null)}
                              >
                                <ExternalLink className="size-3.5" />
                                View
                              </Link>
                              {canEdit && (
                                <>
                                  <button
                                    type="button"
                                    className="flex items-center gap-2 w-full rounded-md px-2.5 py-2 text-sm hover:bg-accent cursor-pointer"
                                    onClick={() => { setActiveMenu(null); setSelectedProject({ ...project, shareToken: project.shareToken }); setEditOpen(true) }}
                                  >
                                    <Pencil className="size-3.5" />
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="flex items-center gap-2 w-full rounded-md px-2.5 py-2 text-sm hover:bg-accent cursor-pointer"
                                    onClick={() => { setActiveMenu(null); setSelectedProject({ ...project, shareToken: project.shareToken }); setTransferMonthOpen(true) }}
                                  >
                                    <CalendarArrowUp className="size-3.5" />
                                    Transfer
                                  </button>
                                  <button
                                    type="button"
                                    className="flex items-center gap-2 w-full rounded-md px-2.5 py-2 text-sm hover:bg-accent cursor-pointer"
                                    onClick={() => { setActiveMenu(null); setSelectedProject({ ...project, shareToken: project.shareToken }); setTransferAssigneeOpen(true) }}
                                  >
                                    <UserRoundPlus className="size-3.5" />
                                    Transfer to
                                  </button>
                                </>
                              )}
                              {canFull && (
                                <button
                                  type="button"
                                  className="flex items-center gap-2 w-full rounded-md px-2.5 py-2 text-sm text-destructive hover:bg-destructive/10 cursor-pointer"
                                  onClick={() => { setActiveMenu(null); setSelectedProject({ ...project, shareToken: project.shareToken }); setDeleteProjectId(project._id); setDeleteOpen(true) }}
                                >
                                  <Trash2 className="size-3.5" />
                                  Delete
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {selectedProject && editOpen && (
          <SharedEditForm
            project={selectedProject}
            apiPath={`/api/shared/${selectedProject.shareToken}`}
            onSuccess={() => { setEditOpen(false); setSelectedProject(null); fetchData() }}
            onCancel={() => { setEditOpen(false); setSelectedProject(null) }}
          />
        )}

        {selectedProject && transferMonthOpen && (
          <SharedMonthTransfer
            project={selectedProject}
            apiPath={`/api/shared/${selectedProject.shareToken}`}
            open={transferMonthOpen}
            onClose={() => setTransferMonthOpen(false)}
            onSuccess={() => { setTransferMonthOpen(false); setSelectedProject(null); fetchData() }}
          />
        )}

        {selectedProject && transferAssigneeOpen && (
          <SharedTransferAssignee
            project={selectedProject}
            apiPath={`/api/shared/${selectedProject.shareToken}`}
            open={transferAssigneeOpen}
            onClose={() => setTransferAssigneeOpen(false)}
            onSuccess={() => { setTransferAssigneeOpen(false); setSelectedProject(null); fetchData() }}
          />
        )}

        <SharedDeleteConfirm
          project={projects.find((p) => p._id === deleteProjectId)}
          apiPath={deleteProjectId ? `/api/shared/${projects.find((p) => p._id === deleteProjectId)?.shareToken}` : ""}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onSuccess={() => { setDeleteOpen(false); setDeleteProjectId(null); fetchData() }}
          onCancel={() => { setDeleteOpen(false); setDeleteProjectId(null) }}
        />
      </div>
    </div>
  )
}
