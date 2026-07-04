"use client"

import { useState, useEffect, useMemo } from "react"
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
import { List, Eye, Circle, Hash, Globe, User, FolderKanban, Search, X } from "lucide-react"

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

function formatDate(dateStr) {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  })
}

export default function SharedListPage({ params }) {
  const [projects, setProjects] = useState([])
  const [sharedBy, setSharedBy] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSelectedShare, setIsSelectedShare] = useState(false)

  const now = new Date()
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1)
  const [filterYear, setFilterYear] = useState(now.getFullYear())
  const [filterStatus, setFilterStatus] = useState("All")
  const [filterPriority, setFilterPriority] = useState("All")
  const [filterCms, setFilterCms] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterMode, setFilterMode] = useState("month")

  useEffect(() => {
    async function fetchData() {
      try {
        const token = (await params).token
        const res = await fetch(`/api/share-list/${token}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Not found")
        setProjects(data.projects || [])
        setSharedBy(data.sharedBy)
        if (data.isSelectedShare) {
          setIsSelectedShare(true)
          setFilterMode("all")
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [params])

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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
          <Eye className="size-3.5" />
          <span>Read-only view</span>
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
            {filtered.map((project) => (
              <Link
                key={project._id}
                href={project.shareToken ? `/shared/${project.shareToken}` : "#"}
                className="block rounded-xl border bg-card p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
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
                  </div>
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
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
