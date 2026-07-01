"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { useDispatch } from "react-redux"
import { updateProjectInStore } from "@/lib/features/projectSlice"
import { toast } from "sonner"
import {
  getProject,
  updateProject,
  deleteProject,
  createProject,
  getProjectUpdates,
  getProjectPassword,
} from "@/actions/projectActions"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, CalendarArrowUp } from "lucide-react"
import ProjectForm from "@/components/projects/ProjectForm"
import MonthTransferDialog from "@/components/projects/MonthTransferDialog"
import Notes from "@/components/projects/Notes"
import { ProjectBreadcrumbs, ProjectTitle, ProjectActions } from "@/components/projects/ProjectDetailHeader"
import { ProjectTimeline, ProjectTransferHistory } from "@/components/projects/ProjectTimeline"
import {
  ProjectDetailsCard,
  ProjectWebsiteCard,
  ProjectMetaCard,
  ProjectTagsCard,
} from "@/components/projects/ProjectInfoSidebar"
import { StatusChangeDialog } from "@/components/projects/StatusChangeDialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const dispatch = useDispatch()
  const [project, setProject] = useState(null)
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [decryptedPassword, setDecryptedPassword] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [statusNote, setStatusNote] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [projectData, updatesData] = await Promise.all([
        getProject(params.id),
        getProjectUpdates(params.id),
      ])
      setProject(projectData)
      setUpdates(updatesData || [])
    } catch (err) {
      toast.error(err.message || "Failed to load project")
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleEditSuccess = (updatedProject) => {
    setProject(updatedProject)
    dispatch(updateProjectInStore(updatedProject))
    setEditOpen(false)
  }

  const handleDuplicate = async () => {
    if (!project) return
    setActionLoading(true)
    try {
      const { _id, createdAt, updatedAt, orderId, transferHistory, ...rest } = project
      const newProject = await createProject({
        ...rest,
        projectName: `${project.projectName} (Copy)`,
      })
      toast.success("Project duplicated")
      router.push(`/dashboard/projects/${newProject._id}`)
    } catch (err) {
      toast.error(err.message || "Failed to duplicate project")
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!project) return
    setActionLoading(true)
    try {
      await deleteProject(project._id)
      setDeleteOpen(false)
      toast.success("Project deleted")
      router.push("/dashboard/projects")
    } catch (err) {
      toast.error(err.message || "Failed to delete project")
    } finally {
      setActionLoading(false)
    }
  }

  const handleTransferSuccess = (updatedProject) => {
    setProject(updatedProject)
    dispatch(updateProjectInStore(updatedProject))
    setTransferOpen(false)
  }

  const handleStatusChange = async () => {
    if (!project || !newStatus) return
    setActionLoading(true)
    try {
      const updated = await updateProject(project._id, {
        status: newStatus,
        updateNote: statusNote || "",
      })
      setProject(updated)
      dispatch(updateProjectInStore(updated))
      const freshUpdates = await getProjectUpdates(params.id)
      setUpdates(freshUpdates || [])
      setStatusOpen(false)
      setNewStatus("")
      setStatusNote("")
      toast.success("Status updated")
    } catch (err) {
      toast.error(err.message || "Failed to update status")
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Skeleton className="h-4 w-48 sm:w-64" />
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 min-w-0 flex-1">
            <Skeleton className="h-7 sm:h-8 w-48 sm:w-64" />
            <Skeleton className="h-4 w-24 sm:w-32" />
          </div>
          <Skeleton className="h-9 w-24 shrink-0 rounded-lg" />
        </div>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const handleTogglePassword = useCallback(async () => {
    if (showPassword) {
      setShowPassword(false)
    } else if (decryptedPassword) {
      setShowPassword(true)
    } else {
      setPasswordLoading(true)
      try {
        const res = await getProjectPassword(params.id)
        setDecryptedPassword(res.password)
        setShowPassword(true)
      } catch {
        setShowPassword(false)
      } finally {
        setPasswordLoading(false)
      }
    }
  }, [params.id, showPassword, decryptedPassword])

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground mb-4">Project not found</p>
        <Button onClick={() => router.push("/dashboard/projects")}>
          Back to Projects
        </Button>
      </div>
    )
  }

  const passwordDisplay = decryptedPassword || null

  return (
    <div className="space-y-4 sm:space-y-6">
      <ProjectBreadcrumbs projectName={project.projectName} />

      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <ProjectTitle project={project} />
        </div>
        <ProjectActions
          project={project}
          actionLoading={actionLoading}
          onStatusClick={() => {
            setNewStatus(project.status)
            setStatusOpen(true)
          }}
          onEdit={() => setEditOpen(true)}
          onDuplicate={handleDuplicate}
          onTransfer={() => setTransferOpen(true)}
          onDelete={() => setDeleteOpen(true)}
        />
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {project.description && (
            <div className="rounded-xl border bg-card p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="size-4 text-muted-foreground shrink-0" />
                <h2 className="text-sm font-semibold">Description</h2>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{project.description}</p>
            </div>
          )}

          <div className="rounded-xl border bg-card p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="size-2 rounded-full bg-primary shrink-0" />
              <h2 className="text-sm font-semibold">Timeline</h2>
            </div>
            <ProjectTimeline updates={updates} />
          </div>

          {project.transferHistory?.length > 0 && (
            <div className="rounded-xl border bg-card p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <CalendarArrowUp className="size-4 text-muted-foreground shrink-0" />
                <h2 className="text-sm font-semibold">Transfer History</h2>
              </div>
              <ProjectTransferHistory transferHistory={project.transferHistory} />
            </div>
          )}

          <Notes projectId={project._id} />
        </div>

        <div className="space-y-4 sm:space-y-6">
          <ProjectDetailsCard project={project} />
          <ProjectWebsiteCard
            project={project}
            passwordDisplay={passwordDisplay}
            showPassword={showPassword}
            onTogglePassword={handleTogglePassword}
          />
          <ProjectMetaCard project={project} />
          <ProjectTagsCard tags={project.tags} />
        </div>
      </div>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Project</SheetTitle>
            <SheetDescription>Update project details</SheetDescription>
          </SheetHeader>
          <div className="p-4">
            <ProjectForm
              key={editOpen ? project._id : "closed"}
              initialData={project}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{project.projectName}&rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <StatusChangeDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        projectName={project.projectName}
        newStatus={newStatus}
        onNewStatusChange={setNewStatus}
        statusNote={statusNote}
        onStatusNoteChange={setStatusNote}
        actionLoading={actionLoading}
        onConfirm={handleStatusChange}
      />

      <MonthTransferDialog
        project={project}
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        onSuccess={handleTransferSuccess}
      />
    </div>
  )
}
