"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import Link from "next/link"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  List, Eye, Settings, ShieldCheck, Circle, Hash, Globe, User, FolderKanban, Search, X,
  MoreHorizontal, Pencil, Trash2, CalendarArrowUp, UserRoundPlus, ExternalLink,
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const STATUSES = ["All", "Pending", "In Progress", "Delivered", "On Hold", "Cancelled"]
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

const MONTHS = [
  { value: 1, label: "January" }, { value: 2, label: "February" },
  { value: 3, label: "March" }, { value: 4, label: "April" },
  { value: 5, label: "May" }, { value: 6, label: "June" },
  { value: 7, label: "July" }, { value: 8, label: "August" },
  { value: 9, label: "September" }, { value: 10, label: "October" },
  { value: 11, label: "November" }, { value: 12, label: "December" },
]

export default function SharedListPage({ params: paramsPromise }) {
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
        const pm = p.currentMonth || (p.createdAt ? new Date(p.createdAt).getMonth() + 1 : now.getMonth() + 1)
        const py = p.currentYear || (p.createdAt ? new Date(p.createdAt).getFullYear() : now.getFullYear())
        return pm === filterMonth && py === filterYear
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
          (p.websiteUrl && p.websiteUrl.toLowerCase().includes(q))
      )
    }

    return list
  }, [projects, filterMode, filterMonth, filterYear, filterStatus, filterPriority, filterCms, searchQuery, now])

  if (loading) {
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
                    <SelectValue>{monthNames[filterMonth - 1]}</SelectValue>
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
                        {project.assignee?.name && (
                          <span className="flex items-center gap-1">
                            <User className="size-3" /> {project.assignee.name}
                          </span>
                        )}
                        <span>{formatDate(project.startDate)}</span>
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
                              {(accessLevel === "manager" || accessLevel === "full") && (
                                <>
                                  <button
                                    type="button"
                                    className="flex items-center gap-2 w-full rounded-md px-2.5 py-2 text-sm hover:bg-accent cursor-pointer"
                                    onClick={() => { setActiveMenu(null); setSelectedProject(project); setEditOpen(true) }}
                                  >
                                    <Pencil className="size-3.5" />
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="flex items-center gap-2 w-full rounded-md px-2.5 py-2 text-sm hover:bg-accent cursor-pointer"
                                    onClick={() => { setActiveMenu(null); setSelectedProject(project); setTransferMonthOpen(true) }}
                                  >
                                    <CalendarArrowUp className="size-3.5" />
                                    Transfer
                                  </button>
                                  <button
                                    type="button"
                                    className="flex items-center gap-2 w-full rounded-md px-2.5 py-2 text-sm hover:bg-accent cursor-pointer"
                                    onClick={() => { setActiveMenu(null); setSelectedProject(project); setTransferAssigneeOpen(true) }}
                                  >
                                    <UserRoundPlus className="size-3.5" />
                                    Transfer to
                                  </button>
                                </>
                              )}
                              {accessLevel === "full" && (
                                <button
                                  type="button"
                                  className="flex items-center gap-2 w-full rounded-md px-2.5 py-2 text-sm text-destructive hover:bg-destructive/10 cursor-pointer"
                                  onClick={() => { setActiveMenu(null); setSelectedProject(project); setDeleteProjectId(project._id); setDeleteOpen(true) }}
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
          <ListEditForm
            project={selectedProject}
            open={editOpen}
            onOpenChange={setEditOpen}
            onSuccess={() => { setEditOpen(false); setSelectedProject(null); fetchData() }}
            onCancel={() => { setEditOpen(false); setSelectedProject(null) }}
          />
        )}

        {selectedProject && transferMonthOpen && (
          <ListMonthTransfer
            project={selectedProject}
            open={transferMonthOpen}
            onOpenChange={setTransferMonthOpen}
            onSuccess={() => { setTransferMonthOpen(false); setSelectedProject(null); fetchData() }}
            onCancel={() => { setTransferMonthOpen(false); setSelectedProject(null) }}
          />
        )}

        {selectedProject && transferAssigneeOpen && (
          <ListTransferAssignee
            project={selectedProject}
            open={transferAssigneeOpen}
            onOpenChange={setTransferAssigneeOpen}
            onSuccess={() => { setTransferAssigneeOpen(false); setSelectedProject(null); fetchData() }}
            onCancel={() => { setTransferAssigneeOpen(false); setSelectedProject(null) }}
          />
        )}

        <ListDeleteConfirm
          projects={projects}
          deleteProjectId={deleteProjectId}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onSuccess={() => { setDeleteOpen(false); setDeleteProjectId(null); fetchData() }}
          onCancel={() => { setDeleteOpen(false); setDeleteProjectId(null) }}
        />
      </div>
    </div>
  )
}

function ListEditForm({ project, open, onOpenChange, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    projectName: project.projectName || "",
    websiteUrl: project.websiteUrl || "",
    websiteUsername: project.websiteUsername || "",
    orderId: project.orderId || "",
    cms: project.cms || "",
    priority: project.priority || "Medium",
    description: project.description || "",
    price: project.price || "",
    startDate: project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : "",
    tags: project.tags || [],
    websitePassword: "",
  })
  const [tagInput, setTagInput] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body = { ...formData }
      if (body.price) body.price = Number(body.price)
      if (!body.websitePassword) delete body.websitePassword
      const res = await fetch(`/api/shared/${project.shareToken}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update")
      toast.success("Project updated")
      onSuccess(data)
    } catch (err) {
      toast.error(err.message || "Failed to update project")
    } finally {
      setSaving(false)
    }
  }

  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }))
      setTagInput("")
    }
  }
  const removeTag = (tag) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl overflow-hidden p-3 sm:p-4">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>Update project details</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project Name</label>
              <input value={formData.projectName} onChange={(e) => setFormData((p) => ({ ...p, projectName: e.target.value }))} className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Order ID</label>
              <input value={formData.orderId} onChange={(e) => setFormData((p) => ({ ...p, orderId: e.target.value }))} className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">CMS</label>
              <input value={formData.cms} onChange={(e) => setFormData((p) => ({ ...p, cms: e.target.value }))} className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Website URL</label>
              <input value={formData.websiteUrl} onChange={(e) => setFormData((p) => ({ ...p, websiteUrl: e.target.value }))} className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Website Username</label>
              <input value={formData.websiteUsername} onChange={(e) => setFormData((p) => ({ ...p, websiteUsername: e.target.value }))} className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Website Password</label>
              <input type="password" value={formData.websitePassword} onChange={(e) => setFormData((p) => ({ ...p, websitePassword: e.target.value }))} placeholder="Leave blank to keep current" className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <select value={formData.priority} onChange={(e) => setFormData((p) => ({ ...p, priority: e.target.value }))} className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Price</label>
              <input type="number" value={formData.price} onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))} className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <input type="date" value={formData.startDate} onChange={(e) => setFormData((p) => ({ ...p, startDate: e.target.value }))} className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            <div className="flex gap-2">
              <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag() } }} placeholder="Add a tag..." className="flex h-9 flex-1 rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm" />
              <Button type="button" variant="outline" size="sm" onClick={addTag}>Add</Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {formData.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="text-muted-foreground hover:text-foreground cursor-pointer">&times;</button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} rows={3} className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ListMonthTransfer({ project, open, onOpenChange, onSuccess, onCancel }) {
  const [newMonth, setNewMonth] = useState("")
  const [newYear, setNewYear] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const CURRENT_YEAR = new Date().getFullYear()
  const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i)

  const handleConfirm = async () => {
    if (!newMonth || !newYear) { toast.error("Please select both month and year"); return }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/shared/${project.shareToken}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentMonth: Number(newMonth), currentYear: Number(newYear) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to transfer")
      toast.success("Project transferred")
      onSuccess(data)
    } catch (err) {
      toast.error(err.message || "Failed to transfer")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Project</DialogTitle>
          <DialogDescription>Move &ldquo;{project?.projectName}&rdquo; to a different month.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Month</label>
            <Select value={newMonth} onValueChange={setNewMonth}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{MONTHS.map((m) => (<SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Year</label>
            <Select value={newYear} onValueChange={setNewYear}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{YEARS.map((y) => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={submitting}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={submitting || !newMonth || !newYear}>{submitting ? "Transferring..." : "Transfer"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ListTransferAssignee({ project, open, onOpenChange, onSuccess, onCancel }) {
  const [users, setUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUserId, setSelectedUserId] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)

  useEffect(() => {
    if (!open) return
    setSearchQuery(""); setSelectedUserId(""); setLoadingUsers(true)
    fetch(`/api/users?share_token=${project.shareToken}`)
      .then((r) => r.json()).then(setUsers).catch(() => toast.error("Failed to load users"))
      .finally(() => setLoadingUsers(false))
  }, [open, project.shareToken])

  const filteredUsers = users.filter((u) => u.name?.toLowerCase().includes(searchQuery.toLowerCase()))
  const selectedUser = users.find((u) => u._id === selectedUserId)

  const handleConfirm = async () => {
    if (!selectedUserId) { toast.error("Please select a user"); return }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/shared/${project.shareToken}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignee: selectedUserId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to transfer")
      toast.success("Project transferred")
      onSuccess(data)
    } catch (err) {
      toast.error(err.message || "Failed to transfer")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer to Person</DialogTitle>
          <DialogDescription>Transfer &ldquo;{project?.projectName}&rdquo; to another user.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Select User</label>
            <input
              placeholder={loadingUsers ? "Loading..." : "Search by name..."}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); if (selectedUserId) setSelectedUserId("") }}
              className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              disabled={loadingUsers}
            />
            {searchQuery && filteredUsers.length > 0 && (
              <div className="rounded-lg border bg-popover shadow-md overflow-hidden mt-1">
                {filteredUsers.map((u) => (
                  <button key={u._id} type="button" onMouseDown={() => { setSelectedUserId(u._id); setSearchQuery(u.name || "") }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-left hover:bg-accent cursor-pointer"
                  >
                    <Avatar className="size-7 shrink-0">
                      <AvatarImage src={u.image} /><AvatarFallback className="text-[10px]">{u.name?.charAt(0) || "?"}</AvatarFallback>
                    </Avatar>
                    <div><p className="text-sm font-medium">{u.name}</p>{u.email && <p className="text-xs text-muted-foreground">{u.email}</p>}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedUser && (
            <div className="flex items-center gap-2.5 rounded-lg border bg-muted/30 px-3 py-2.5 text-sm">
              <Avatar className="size-6 shrink-0"><AvatarImage src={selectedUser.image} /><AvatarFallback className="text-[9px]">{selectedUser.name?.charAt(0) || "?"}</AvatarFallback></Avatar>
              <UserRoundPlus className="size-3.5 text-muted-foreground shrink-0" />
              Transferring to <strong>{selectedUser.name}</strong>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={submitting}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={submitting || !selectedUserId}>{submitting ? "Transferring..." : "Transfer"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ListDeleteConfirm({ projects, deleteProjectId, open, onOpenChange, onSuccess, onCancel }) {
  const [submitting, setSubmitting] = useState(false)
  const project = projects.find((p) => p._id === deleteProjectId)
  const [shareToken, setShareToken] = useState(null)

  useEffect(() => {
    if (project?.shareToken) setShareToken(project.shareToken)
  }, [project])

  const handleDelete = async () => {
    if (!shareToken) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/shared/${shareToken}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to delete")
      toast.success("Project deleted")
      onSuccess()
    } catch (err) {
      toast.error(err.message || "Failed to delete project")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Project</DialogTitle>
          <DialogDescription>Are you sure you want to delete &ldquo;{project?.projectName}&rdquo;? This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={submitting}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={submitting}>{submitting ? "Deleting..." : "Delete"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
