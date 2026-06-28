"use client"

import { useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSelector, useDispatch } from "react-redux"
import { fetchProjects } from "@/lib/features/projectSlice"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
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
import { LayoutGrid, LayoutList, Plus } from "lucide-react"

const PAGE_SIZE = 20

export default function ProjectsPage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const { items: allProjects, loading, fetched } = useSelector((s) => s.projects)

  const [filters, setFilters] = useState({})
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState("desc")
  const [viewMode, setViewMode] = useState("table")

  useEffect(() => {
    if (!fetched) {
      dispatch(fetchProjects())
    }
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
    if (filters.month) {
      list = list.filter((p) => p.currentMonth === Number(filters.month))
    }
    if (filters.year) {
      list = list.filter((p) => p.currentYear === Number(filters.year))
    }

    list.sort((a, b) => {
      const aVal = a[sortBy]
      const bVal = b[sortBy]
      if (!aVal) return 1
      if (!bVal) return -1
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sortOrder === "asc" ? cmp : -cmp
    })

    return list
  }, [allProjects, filters, sortBy, sortOrder])

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

  const handleSort = (key, order) => {
    setSortBy(key)
    setSortOrder(order)
  }

  const handleSortByChange = (value) => {
    setSortBy(value)
    setSortOrder("asc")
    setPage(1)
  }

  const handleAction = (action, project) => {
    switch (action) {
      case "favorite":
        break
      case "duplicate":
        break
      case "archive":
        break
      case "delete":
        break
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            {total} {total === 1 ? "project" : "projects"} &middot; ${totalPrice.toFixed(2)} total
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/projects/new")}>
          <Plus className="size-4" />
          Create Project
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ProjectFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
        />
        <div className="flex items-center gap-2 ml-auto">
          <Select value={sortBy} onValueChange={handleSortByChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Created</SelectItem>
              <SelectItem value="orderId">Order ID</SelectItem>
              <SelectItem value="projectName">Name</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === "grid" ? "table" : "grid")}
            title={viewMode === "grid" ? "Table view" : "Grid view"}
          >
            {viewMode === "grid" ? <LayoutList className="size-4" /> : <LayoutGrid className="size-4" />}
          </Button>
        </div>
      </div>

      {loading ? (
        viewMode === "table" ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-4">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        )
      ) : paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground mb-4">Project not available</p>
          <Button onClick={() => router.push("/dashboard/projects/new")}>
            <Plus className="size-4" />
            Create Project
          </Button>
        </div>
      ) : (
        <div>
          {viewMode === "table" ? (
            <ProjectTable
              projects={paginated}
              onSort={handleSort}
              sortBy={sortBy}
              sortOrder={sortOrder}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginated.map((project) => (
                <ProjectCard key={project._id} project={project} onAction={handleAction} />
              ))}
            </div>
          )}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
