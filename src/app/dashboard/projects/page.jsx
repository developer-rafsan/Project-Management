"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { getProjects } from "@/actions/projectActions"
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

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPrice, setTotalPrice] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({})
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState("desc")
  const [viewMode, setViewMode] = useState("table")

  const fetchIdRef = useRef(0)
  const isFirstLoad = useRef(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const fetchId = ++fetchIdRef.current

    if (isFirstLoad.current) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }

    getProjects({ ...filters, page, limit: 20, sortBy, sortOrder })
      .then((data) => {
        if (fetchId !== fetchIdRef.current) return
        setProjects(data.projects || [])
        setTotal(data.total || 0)
        setTotalPrice(data.totalPrice || 0)
        setTotalPages(data.totalPages || 1)
      })
      .catch((err) => {
        if (fetchId !== fetchIdRef.current) return
        toast.error(err.message || "Failed to fetch projects")
      })
      .finally(() => {
        if (fetchId === fetchIdRef.current) {
          setLoading(false)
          setRefreshing(false)
          isFirstLoad.current = false
        }
      })
  }, [filters, page, sortBy, sortOrder])

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
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground mb-4">Project not available</p>
          <Button onClick={() => router.push("/dashboard/projects/new")}>
            <Plus className="size-4" />
            Create Project
          </Button>
        </div>
      ) : (
        <div className={`transition-opacity duration-200 ${refreshing ? "opacity-50" : ""}`}>
          {viewMode === "table" ? (
            <ProjectTable
              projects={projects}
              onSort={handleSort}
              sortBy={sortBy}
              sortOrder={sortOrder}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard key={project._id} project={project} />
              ))}
            </div>
          )}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
