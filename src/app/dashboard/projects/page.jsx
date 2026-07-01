"use client"

import { useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSelector, useDispatch } from "react-redux"
import { fetchProjects } from "@/lib/features/projectSlice"
import { startOfMonth, endOfMonth, format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { DateRangePicker } from "@/components/ui/date-range-picker"
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
import { getMonthRange } from "@/lib/dateUtils"
import { Plus } from "lucide-react"

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
    if (!fetched) dispatch(fetchProjects())
  }, [fetched, dispatch])

  useEffect(() => {
    const saved = localStorage.getItem("projectViewMode")
    if (saved === "list" || saved === "grid") setViewMode(saved)
  }, [])

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
      list = list.filter((p) =>
        p.currentMonth === selectedMonth && p.currentYear === selectedYear
      )
    } else if (filterMode === "range" && (dateRange?.from || dateRange?.to)) {
      list = list.filter((p) => {
        const pd = new Date(p.currentYear, p.currentMonth - 1, 1)
        if (dateRange.from && pd < dateRange.from) return false
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
  }, [allProjects, filters, filterMode, selectedMonth, selectedYear, dateRange])

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

  const handleAction = (action, project) => {
    switch (action) {
      case "duplicate":
        break
      case "delete":
        break
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            {total} {total === 1 ? "project" : "projects"} &middot; ${totalPrice.toFixed(2)} total
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/projects/new")} className="w-full sm:w-auto">
          <Plus className="size-4" />
          <span className="sm:hidden">New Project</span>
          <span className="hidden sm:inline">Create Project</span>
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <ProjectFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
        />
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border p-0.5">
            <Button
              variant={filterMode === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => { setFilterMode("month"); setPage(1) }}
              className="rounded-md px-3"
            >
              Month
            </Button>
            <Button
              variant={filterMode === "range" ? "default" : "ghost"}
              size="sm"
              onClick={() => { setFilterMode("range"); setPage(1) }}
              className="rounded-md px-3"
            >
              Range
            </Button>
            <Button
              variant={filterMode === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => { setFilterMode("all"); setPage(1) }}
              className="rounded-md px-3"
            >
              All
            </Button>
          </div>
          {filterMode === "month" && (
            <div className="flex gap-2">
              <Select value={String(selectedMonth)} onValueChange={(v) => { setSelectedMonth(Number(v)); setPage(1) }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Month">
                    {format(new Date(2024, selectedMonth - 1), "MMMM")}
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
                <SelectTrigger className="w-[100px]">
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
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground mb-4">Project not available</p>
          <Button onClick={() => router.push("/dashboard/projects/new")} className="w-full sm:w-auto">
            <Plus className="size-4" />
            Create Project
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginated.map((project) => (
            <ProjectCard key={project._id} project={project} onAction={handleAction} />
          ))}
        </div>
      ) : (
        <div>
          <ProjectTable projects={paginated} />
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}