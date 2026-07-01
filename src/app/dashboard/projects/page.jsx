"use client"

import { useMemo, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSelector, useDispatch } from "react-redux"
import { fetchProjects, updateProjectInStore, addProject, removeProject } from "@/lib/features/projectSlice"
import { startOfMonth, endOfMonth, format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import ProjectFilters from "@/components/projects/ProjectFilters"
import ProjectTable from "@/components/projects/ProjectTable"
import ProjectCard from "@/components/projects/ProjectCard"
import Pagination from "@/components/projects/Pagination"
import { getMonthRange, getEffectiveMonthYear } from "@/lib/dateUtils"
import { createProject, deleteProject } from "@/actions/projectActions"
import { Plus, FolderKanban } from "lucide-react"

const PAGE_SIZE = 20

export default function ProjectsPage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const { items: allProjects, loading, fetched } = useSelector((s) => s.projects)

  const now = new Date()
  const [filters, setFilters] = useState({})
  const [filterMode, setFilterMode] = useState("month")
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(now),
    to: endOfMonth(now),
  })
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState("list")
  const [startDay] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("monthStartDay")
      return saved ? Number(saved) : 1
    }
    return 1
  })

  useEffect(() => {
    const saved = localStorage.getItem("projectViewMode")
    if (saved === "list" || saved === "grid") setViewMode(saved)
  }, [])

  const handleCardAction = useCallback(async (action, project) => {
    if (action === "duplicate") {
      try {
        const { _id, createdAt, updatedAt, orderId, transferHistory, __v, ...rest } = project
        const newProj = await createProject({
          ...rest,
          projectName: `${project.projectName} (Copy)`,
        })
        dispatch(addProject(newProj))
        toast.success("Project duplicated")
        router.push(`/dashboard/projects/${newProj._id}`)
      } catch (err) {
        toast.error(err.message || "Failed to duplicate")
      }
    } else if (action === "delete") {
      try {
        await deleteProject(project._id)
        dispatch(removeProject(project._id))
        toast.success("Project deleted")
      } catch (err) {
        toast.error(err.message || "Failed to delete")
      }
    }
  }, [dispatch, router])

  useEffect(() => {
    if (!fetched) dispatch(fetchProjects())
  }, [fetched, dispatch])

  const filtered = useMemo(() => {
    let list = [...allProjects]

    if (filters.search) {
      const q = filters.search.toLowerCase()
      list = list.filter(
        (p) =>
          (p.orderId && p.orderId.toLowerCase().includes(q)) ||
          (p.projectName && p.projectName.toLowerCase().includes(q)) ||
          (p.businessName && p.businessName.toLowerCase().includes(q)) ||
          (p.websiteUrl && p.websiteUrl.toLowerCase().includes(q))
      )
    }
    if (filters.status) {
      list = list.filter((p) => p.status === filters.status)
    }
    if (filters.priority) {
      list = list.filter((p) => p.priority === filters.priority)
    }
    if (filters.cms) {
      list = list.filter((p) => p.cms === filters.cms)
    }
    if (filterMode === "month") {
      list = list.filter((p) => {
        const eff = getEffectiveMonthYear(p, startDay)
        return eff.month === selectedMonth && eff.year === selectedYear
      })
    } else if (filterMode === "range" && (dateRange?.from || dateRange?.to)) {
      list = list.filter((p) => {
        const eff = getEffectiveMonthYear(p, startDay)
        const pd = new Date(eff.year, eff.month - 1, 1)
        const monthEnd = new Date(eff.year, eff.month, 0, 23, 59, 59, 999)
        if (dateRange.from && monthEnd < dateRange.from) return false
        if (dateRange.to && pd > dateRange.to) return false
        return true
      })
    }

    list.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0)
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0)
      return dateB - dateA
    })

    return list
  }, [allProjects, filters, filterMode, selectedMonth, selectedYear, dateRange, startDay])

  const total = filtered.length
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPrice = filtered.reduce((sum, p) => sum + (p.price || 0), 0)

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    setPage(1)
  }

  const handleSearch = (search) => {
    setFilters((prev) => ({ ...prev, search: search || undefined }))
    setPage(1)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-medium text-foreground">{total}</span> {total === 1 ? "project" : "projects"} &middot; <span className="font-medium text-emerald-600 dark:text-emerald-400">${totalPrice.toFixed(2)}</span> total
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/projects/new")} className="w-full sm:w-auto shrink-0 gap-2">
          <Plus className="size-4" />
          <span>New Project</span>
        </Button>
      </div>

      <div className="rounded-xl border bg-card p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0 w-full">
            <ProjectFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onSearch={handleSearch}
            />
          </div>
          <div className="hidden sm:flex items-center gap-2 flex-wrap">
            <div className="flex rounded-lg border p-0.5 bg-muted/30">
              <Button
                variant={filterMode === "month" ? "default" : "ghost"}
                size="sm"
                onClick={() => { setFilterMode("month"); setPage(1) }}
                className="rounded-md px-2.5 text-xs"
              >
                Month
              </Button>
              <Button
                variant={filterMode === "range" ? "default" : "ghost"}
                size="sm"
                onClick={() => { setFilterMode("range"); setPage(1) }}
                className="rounded-md px-2.5 text-xs"
              >
                Range
              </Button>
              <Button
                variant={filterMode === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => { setFilterMode("all"); setPage(1) }}
                className="rounded-md px-2.5 text-xs"
              >
                All
              </Button>
            </div>
            {filterMode === "month" && (
              <div className="flex gap-1.5">
                <Select value={String(selectedMonth)} onValueChange={(v) => { setSelectedMonth(Number(v)); setPage(1) }}>
                  <SelectTrigger className="w-[110px] h-8">
                    <SelectValue placeholder="Month">
                      {format(new Date(2024, selectedMonth - 1), "MMM")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <SelectItem key={m} value={String(m)}>
                        {format(new Date(2024, m - 1), "MMMM")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={String(selectedYear)} onValueChange={(v) => { setSelectedYear(Number(v)); setPage(1) }}>
                  <SelectTrigger className="w-[90px] h-8">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: new Date().getFullYear() - 2021 + 1 }, (_, i) => 2022 + i).map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {filterMode === "range" && (
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            )}
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {filterMode === "month"
                ? (() => {
                    const { from, to } = getMonthRange(selectedYear, selectedMonth, startDay)
                    return `${format(from, "MMM d")} — ${format(to, "MMM d, yyyy")}`
                  })()
                : filterMode === "range" && dateRange?.from && dateRange?.to
                  ? `${format(dateRange.from, "MMM d")} — ${format(dateRange.to, "MMM d, yyyy")}`
                  : filterMode === "all"
                    ? "All projects"
                    : ""}
            </span>
          </div>
          <div className="flex sm:hidden flex-wrap items-center gap-2">
            <div className="flex rounded-lg border p-0.5 bg-muted/30">
              <Button
                variant={filterMode === "month" ? "default" : "ghost"}
                size="sm"
                onClick={() => { setFilterMode("month"); setPage(1) }}
                className="rounded-md px-2 text-xs"
              >
                Month
              </Button>
              <Button
                variant={filterMode === "range" ? "default" : "ghost"}
                size="sm"
                onClick={() => { setFilterMode("range"); setPage(1) }}
                className="rounded-md px-2 text-xs"
              >
                Range
              </Button>
              <Button
                variant={filterMode === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => { setFilterMode("all"); setPage(1) }}
                className="rounded-md px-2 text-xs"
              >
                All
              </Button>
            </div>
            {filterMode === "month" && (
              <div className="flex gap-1.5">
                <Select value={String(selectedMonth)} onValueChange={(v) => { setSelectedMonth(Number(v)); setPage(1) }}>
                  <SelectTrigger className="w-[95px] h-8">
                    <SelectValue placeholder="Month">
                      {format(new Date(2024, selectedMonth - 1), "MMM")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <SelectItem key={m} value={String(m)}>
                        {format(new Date(2024, m - 1), "MMMM")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={String(selectedYear)} onValueChange={(v) => { setSelectedYear(Number(v)); setPage(1) }}>
                  <SelectTrigger className="w-[80px] h-8">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: new Date().getFullYear() - 2021 + 1 }, (_, i) => 2022 + i).map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {filterMode === "range" && (
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            )}
          </div>
        </div>
      </div>

      {loading ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        )
      ) : paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
          <FolderKanban className="size-10 sm:size-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground mb-4">Project not available</p>
          <Button onClick={() => router.push("/dashboard/projects/new")} className="w-full sm:w-auto">
            <Plus className="size-4" />
            Create Project
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map((project, idx) => (
            <ProjectCard key={project._id} project={project} index={(page - 1) * PAGE_SIZE + idx + 1} onAction={handleCardAction} />
          ))}
        </div>
      ) : (
        <ProjectTable projects={paginated} page={page} pageSize={PAGE_SIZE} />
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}