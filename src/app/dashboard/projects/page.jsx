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
import ProjectForm from "@/components/projects/ProjectForm"
import Pagination from "@/components/projects/Pagination"
import { StatusChangeDialog } from "@/components/projects/StatusChangeDialog"
import ShareDialog from "@/components/projects/ShareDialog"
import ShareListDialog from "@/components/projects/ShareListDialog"
import ProgressDialog from "@/components/projects/ProgressDialog"
import { getMonthRange, getEffectiveMonthYear } from "@/lib/dateUtils"
import { createProject, deleteProject, getProjectPassword, updateProject } from "@/actions/projectActions"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Loader2, Plus, FolderKanban, ArrowLeftRight, Link2, Trash2, ListChecks, X } from "lucide-react"

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
  const [createOpen, setCreateOpen] = useState(false)
  const [editProject, setEditProject] = useState(null)
  const [statusProject, setStatusProject] = useState(null)
  const [shareProject, setShareProject] = useState(null)
  const [shareListOpen, setShareListOpen] = useState(false)
  const [shareSelectedIds, setShareSelectedIds] = useState([])
  const [progressProject, setProgressProject] = useState(null)
  const [progressLoading, setProgressLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [selectMode, setSelectMode] = useState(false)
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false)
  const [bulkStatusValue, setBulkStatusValue] = useState("Pending")
  const [bulkStatusLoading, setBulkStatusLoading] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false)

  useEffect(() => {
    if (createOpen || editProject) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [createOpen, editProject])
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
    if (action === "edit") {
      setEditProject(project)
    } else if (action === "duplicate") {
      try {
        const { _id, createdAt, updatedAt, transferMonth, __v, owner, ...rest } = project
        const newProj = await createProject({
          ...rest,
          orderId: project.orderId,
          projectName: `${project.projectName} (Copy)`,
          confirmDuplicateOrderId: true,
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
    } else if (action === "status") {
      setStatusProject(project)
    } else if (action === "share") {
      setShareProject(project)
    } else if (action === "progress") {
      setProgressProject(project)
    }
  }, [dispatch, router])

  const handleCreateSuccess = (project) => {
    dispatch(addProject(project))
    setCreateOpen(false)
    toast.success("Project created")
  }

  const handleEditSuccess = (updatedProject) => {
    dispatch(updateProjectInStore(updatedProject))
    setEditProject(null)
    toast.success("Project updated")
  }

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
          (p.websites?.some(s => s.url && s.url.toLowerCase().includes(q)))
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
        const pd = p.currentProjectDate ? new Date(p.currentProjectDate) : (p.createdAt ? new Date(p.createdAt) : null)
        if (!pd) return false
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
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant={selectMode ? "default" : "outline"}
            size={selectMode ? "sm" : "default"}
            onClick={() => {
              if (selectMode) {
                setSelectedIds([])
                setSelectMode(false)
              } else {
                setSelectMode(true)
              }
            }}
            className={`shrink-0 gap-2 cursor-pointer transition-all active:scale-95 ${selectMode ? "bg-primary/90 hover:bg-primary shadow-sm" : ""}`}
          >
            {selectMode ? <X className="size-4" /> : <ListChecks className="size-4" />}
            <span className="hidden sm:inline">{selectMode ? "Bulk action" : "Bulk action"}</span>
            <span className="sm:hidden">{selectMode ? "Bulk" : "Bulk"}</span>
          </Button>
          {!selectMode && (
            <>
              <Button
                variant="outline"
                onClick={() => setShareListOpen(true)}
                className="shrink-0 gap-2 cursor-pointer border-dashed hover:border-primary/50 active:scale-95 transition-transform"
              >
                <Link2 className="size-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>
              <Button onClick={() => setCreateOpen(true)} className="shrink-0 gap-2 cursor-pointer shadow-sm active:scale-95 transition-transform">
                <Plus className="size-4" />
                <span className="hidden sm:inline">New Project</span>
                <span className="sm:hidden">New</span>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          <div className="flex-1 min-w-0 w-full">
            <ProjectFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onSearch={handleSearch}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
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
                  <SelectTrigger className="w-[100px] h-8">
                    <SelectValue placeholder={format(new Date(2024, selectedMonth - 1), "MMM")} />
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
                  <SelectTrigger className="w-[85px] h-8">
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
            <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">
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
      </div>

      {selectedIds.length > 0 && selectMode && (
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/5 to-transparent px-3 sm:px-4 py-3 shadow-sm">
          <span className="text-xs sm:text-sm font-semibold text-foreground min-w-[4rem] sm:min-w-[5rem]">{selectedIds.length} selected</span>
          <div className="h-5 w-px bg-border/60 hidden sm:block" />
          <Button variant="secondary" size="xs" onClick={() => { setBulkStatusValue("Pending"); setBulkStatusOpen(true) }} className="gap-1 h-7 sm:h-8 text-[10px] sm:text-xs font-medium cursor-pointer shadow-sm">
            <ArrowLeftRight className="size-3 sm:size-3.5" /> <span className="hidden xs:inline">Status</span>
          </Button>
          <Button variant="secondary" size="xs" onClick={() => setBulkDeleteOpen(true)} className="gap-1 h-7 sm:h-8 text-[10px] sm:text-xs font-medium text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer shadow-sm">
            <Trash2 className="size-3 sm:size-3.5" /> <span className="hidden xs:inline">Delete</span>
          </Button>
        </div>
      )}

      {loading ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`h-40 sm:h-44 rounded-xl bg-muted animate-pulse ${i > 1 ? 'hidden sm:block' : ''} ${i > 2 ? 'hidden lg:block' : ''}`} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 sm:h-14 w-full rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        )
      ) : paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
          <FolderKanban className="size-10 sm:size-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground mb-4">Project not available</p>
          <Button onClick={() => setCreateOpen(true)} className="w-full sm:w-auto">
            <Plus className="size-4" />
            Create Project
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {paginated.map((project, idx) => (
            <div key={project._id} className="animate-fade-in-up" style={{ animationDelay: `${(idx % 6) * 0.06}s` }}>
              <ProjectCard project={project} index={(page - 1) * PAGE_SIZE + idx + 1} onAction={handleCardAction} selected={selectedIds.includes(project._id)} selectionMode={selectMode} onSelect={() => setSelectedIds(prev => prev.includes(project._id) ? prev.filter(id => id !== project._id) : [...prev, project._id])} />
            </div>
          ))}
        </div>
      ) : (
        <div className="animate-fade-in-up"><ProjectTable projects={paginated} page={page} pageSize={PAGE_SIZE} onAction={handleCardAction} selectedIds={selectedIds} onSelectionChange={setSelectedIds} selectMode={selectMode} /></div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Dialog open={!!editProject} onOpenChange={(open) => !open && setEditProject(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-3 sm:p-4">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update project details</DialogDescription>
          </DialogHeader>
          {editProject && (
            <ProjectForm
              key={editProject._id}
              initialData={editProject}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditProject(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {statusProject && (
        <StatusChangeDialog
          open={!!statusProject}
          onOpenChange={(open) => { if (!open) setStatusProject(null) }}
          projectName={statusProject.projectName}
          newStatus={statusProject.status}
          onNewStatusChange={(s) => setStatusProject((prev) => prev ? { ...prev, status: s } : null)}
          actionLoading={false}
          onConfirm={async () => {
            try {
              const updated = await updateProject(statusProject._id, { status: statusProject.status })
              dispatch(updateProjectInStore(updated))
              toast.success("Status updated")
              setStatusProject(null)
            } catch (err) {
              toast.error(err.message || "Failed to update status")
            }
          }}
        />
      )}

      {/* Bulk Status */}
      <Dialog open={bulkStatusOpen} onOpenChange={(v) => { if (!v) setBulkStatusOpen(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Status</DialogTitle>
            <DialogDescription>
              Update status for {selectedIds.length} selected project{selectedIds.length > 1 ? "s" : ""}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={bulkStatusValue} onValueChange={setBulkStatusValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {["Pending","In Progress","Delivered","Revision","On Hold","Cancelled"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkStatusOpen(false)} disabled={bulkStatusLoading}>Cancel</Button>
            <Button onClick={async () => {
              setBulkStatusLoading(true)
              try {
                const results = await Promise.all(selectedIds.map(id => updateProject(id, { status: bulkStatusValue })))
                results.forEach(p => dispatch(updateProjectInStore(p)))
                toast.success(`Status updated for ${results.length} project${results.length > 1 ? "s" : ""}`)
                setBulkStatusOpen(false)
              } catch (err) {
                toast.error(err.message || "Failed to update status")
              } finally {
                setBulkStatusLoading(false)
              }
            }} disabled={bulkStatusLoading}>
              {bulkStatusLoading && <Loader2 className="size-4 animate-spin" />}
              Update {selectedIds.length > 1 ? `${selectedIds.length} Projects` : "Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete */}
      <Dialog open={bulkDeleteOpen} onOpenChange={(v) => { if (!v) setBulkDeleteOpen(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Projects</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedIds.length} selected project{selectedIds.length > 1 ? "s" : ""}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteOpen(false)} disabled={bulkDeleteLoading}>Cancel</Button>
            <Button variant="destructive" onClick={async () => {
              setBulkDeleteLoading(true)
              try {
                await Promise.all(selectedIds.map(id => deleteProject(id)))
                selectedIds.forEach(id => dispatch(removeProject(id)))
                toast.success(`Deleted ${selectedIds.length} project${selectedIds.length > 1 ? "s" : ""}`)
                setSelectedIds([])
                setSelectMode(false)
                setBulkDeleteOpen(false)
              } catch (err) {
                toast.error(err.message || "Failed to delete")
              } finally {
                setBulkDeleteLoading(false)
              }
            }} disabled={bulkDeleteLoading}>
              {bulkDeleteLoading && <Loader2 className="size-4 animate-spin" />}
              Delete {selectedIds.length > 1 ? `${selectedIds.length} Projects` : "Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProgressDialog
        open={!!progressProject}
        onOpenChange={(v) => { if (!v) setProgressProject(null) }}
        projectName={progressProject?.projectName}
        currentProgress={progressProject?.progress ?? 0}
        actionLoading={progressLoading}
        onConfirm={async (value) => {
          if (!progressProject) return
          setProgressLoading(true)
          try {
            const updated = await updateProject(progressProject._id, { progress: value })
            dispatch(updateProjectInStore(updated))
            toast.success("Progress updated")
            setProgressProject(null)
          } catch (err) {
            toast.error(err.message || "Failed to update progress")
          } finally {
            setProgressLoading(false)
          }
        }}
      />

      <ShareDialog
        open={!!shareProject}
        onOpenChange={(v) => { if (!v) setShareProject(null) }}
        projectId={shareProject?._id}
        projectName={shareProject?.projectName}
      />

      <ShareListDialog
        open={shareListOpen}
        onOpenChange={(v) => { if (!v) { setSelectedIds([]); setSelectMode(false) }; setShareListOpen(v) }}
        selectedProjectIds={shareSelectedIds}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-3 sm:p-4">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>Fill in the project details</DialogDescription>
          </DialogHeader>
          <ProjectForm
            key={createOpen ? "open" : "closed"}
            onSuccess={handleCreateSuccess}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}