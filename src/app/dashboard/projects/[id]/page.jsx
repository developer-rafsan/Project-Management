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
  getProjectActivities,
  getProjectPassword,
  getAdditionalPasswords,
  getDomainPassword,
} from "@/actions/projectActions"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText } from "lucide-react"
import MonthTransferDialog from "@/components/projects/MonthTransferDialog"
import TransferAssigneeDialog from "@/components/projects/TransferAssigneeDialog"
import Notes from "@/components/projects/Notes"
import { ProjectBreadcrumbs, ProjectTitle, ProjectActions } from "@/components/projects/ProjectDetailHeader"
import ShareDialog from "@/components/projects/ShareDialog"

import { ProjectTimeline } from "@/components/projects/ProjectTimeline"
import {
  ProjectDetailsCard,
  ProjectWebsiteCard,
  ProjectMetaCard,
  ProjectTagsCard,
  ProjectLinksCard,
  ProjectDomainCard,
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

export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const dispatch = useDispatch()
  const [project, setProject] = useState(null)
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [decryptedPassword, setDecryptedPassword] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [additionalPasswords, setAdditionalPasswords] = useState({})
  const [domainPasswords, setDomainPasswords] = useState({})
  const [hostingPasswords, setHostingPasswords] = useState({})
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  useEffect(() => {
    if (deleteOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [deleteOpen])
  const [transferOpen, setTransferOpen] = useState(false)
  const [transferAssigneeOpen, setTransferAssigneeOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [statusNote, setStatusNote] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [projectData, activitiesData, passwordData, additionalPwData, domainPwData] = await Promise.all([
        getProject(params.id),
        getProjectActivities(params.id),
        getProjectPassword(params.id).catch(() => ({ password: "" })),
        getAdditionalPasswords(params.id).catch(() => ({ passwords: [] })),
        getDomainPassword(params.id).catch(() => ({ domainPasswords: [], hostingPasswords: [] })),
      ])
      setProject(projectData)
      setActivities(activitiesData || [])
      setDecryptedPassword(passwordData.password || null)
      const dpMap = {}
      const hpMap = {}
      for (const item of domainPwData.domainPasswords || []) {
        dpMap[item.index] = item.password
      }
      for (const item of domainPwData.hostingPasswords || []) {
        hpMap[item.index] = item.password
      }
      setDomainPasswords(dpMap)
      setHostingPasswords(hpMap)
      const pwMap = {}
      for (const item of additionalPwData.passwords || []) {
        pwMap[item.index] = item.password
      }
      setAdditionalPasswords(pwMap)
    } catch (err) {
      toast.error(err.message || "Failed to load project")
    } finally {
      setLoading(false)
    }
  }, [params.id])

  const refreshActivities = useCallback(async () => {
    const fresh = await getProjectActivities(params.id)
    setActivities(fresh || [])
  }, [params.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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

  const handleTransferSuccess = async (updatedProject) => {
    setProject(updatedProject)
    dispatch(updateProjectInStore(updatedProject))
    setTransferOpen(false)
    await refreshActivities()
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
      await refreshActivities()
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

  const handleWebsiteUpdate = useCallback(async (updated, newPassword, extraPwMap) => {
    setProject(updated)
    dispatch(updateProjectInStore(updated))
    if (newPassword !== undefined && newPassword !== null) {
      setDecryptedPassword(newPassword)
      if (newPassword) setShowPassword(true)
      else setShowPassword(false)
    }
    if (extraPwMap) setAdditionalPasswords(extraPwMap)
    await refreshActivities()
  }, [refreshActivities])

  const handleDomainUpdate = useCallback(async (updated) => {
    setProject(updated)
    dispatch(updateProjectInStore(updated))
    const pwData = await getDomainPassword(params.id).catch(() => ({ domainPasswords: [], hostingPasswords: [] }))
    const dpMap = {}
    const hpMap = {}
    for (const item of pwData.domainPasswords || []) dpMap[item.index] = item.password
    for (const item of pwData.hostingPasswords || []) hpMap[item.index] = item.password
    setDomainPasswords(dpMap)
    setHostingPasswords(hpMap)
    await refreshActivities()
  }, [refreshActivities, params.id])

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
    <div className="space-y-4 sm:space-y-6 pb-8 sm:pb-0">
      <div className="animate-fade-in-up stagger-1"><ProjectBreadcrumbs projectName={project.projectName} /></div>

      <div className="animate-fade-in-up stagger-2">
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
            onDuplicate={handleDuplicate}
            onTransfer={() => setTransferOpen(true)}
            onTransferAssignee={() => setTransferAssigneeOpen(true)}
            onDelete={() => setDeleteOpen(true)}
            onShare={() => setShareOpen(true)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3 animate-fade-in-up stagger-3">
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
              <h2 className="text-sm font-semibold">Activity Timeline</h2>
            </div>
            <ProjectTimeline activities={activities} />
          </div>

          <Notes projectId={project._id} />
        </div>

        <div className="space-y-4 sm:space-y-6">
          <ProjectDetailsCard project={project} onUpdate={async (updated) => { setProject(updated); dispatch(updateProjectInStore(updated)); await refreshActivities() }} />
          <ProjectWebsiteCard
            project={project}
            passwordDisplay={passwordDisplay}
            showPassword={showPassword}
            onTogglePassword={handleTogglePassword}
            additionalPasswords={additionalPasswords}
            onUpdate={handleWebsiteUpdate}
          />
          <ProjectDomainCard
            project={project}
            domainPasswords={domainPasswords}
            hostingPasswords={hostingPasswords}
            onUpdate={handleDomainUpdate}
          />
          <ProjectLinksCard project={project} onUpdate={async (updated) => { setProject(updated); dispatch(updateProjectInStore(updated)); await refreshActivities() }} />
          <ProjectMetaCard project={project} onUpdate={async (updated) => { setProject(updated); dispatch(updateProjectInStore(updated)); await refreshActivities() }} />
          <ProjectTagsCard tags={project.tags} />
        </div>
      </div>

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

      <TransferAssigneeDialog
        project={project}
        open={transferAssigneeOpen}
        onClose={() => setTransferAssigneeOpen(false)}
        onSuccess={async () => {
          setTransferAssigneeOpen(false)
          await refreshActivities()
          const fresh = await getProject(params.id)
          setProject(fresh)
          dispatch(updateProjectInStore(fresh))
        }}
      />

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        projectId={project._id}
        projectName={project.projectName}
      />
    </div>
  )
}
