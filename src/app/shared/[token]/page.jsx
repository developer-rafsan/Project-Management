"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ProjectBreadcrumbs, ProjectTitle } from "@/components/projects/ProjectDetailHeader"
import { ProjectTimeline } from "@/components/projects/ProjectTimeline"
import {
  ProjectDetailsCard,
  ProjectWebsiteCard,
  ProjectMetaCard,
  ProjectTagsCard,
} from "@/components/projects/ProjectInfoSidebar"
import Notes from "@/components/projects/Notes"
import SharedEditForm from "@/components/shared/SharedEditForm"
import SharedMonthTransfer from "@/components/shared/SharedMonthTransfer"
import SharedTransferAssignee from "@/components/shared/SharedTransferAssignee"
import { FileText, Eye, Settings, ShieldCheck, Pencil, Trash2, ArrowLeftRight, CalendarArrowUp, UserRoundPlus } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { StatusChangeDialog } from "@/components/projects/StatusChangeDialog"

const ACCESS_BADGES = {
  view: { label: "Read-only view", icon: Eye, class: "text-muted-foreground/60" },
  manager: { label: "Manager access", icon: Settings, class: "text-blue-500" },
  full: { label: "Full access", icon: ShieldCheck, class: "text-emerald-500" },
}

const MONTHS = [
  { value: 1, label: "January" }, { value: 2, label: "February" },
  { value: 3, label: "March" }, { value: 4, label: "April" },
  { value: 5, label: "May" }, { value: 6, label: "June" },
  { value: 7, label: "July" }, { value: 8, label: "August" },
  { value: 9, label: "September" }, { value: 10, label: "October" },
  { value: 11, label: "November" }, { value: 12, label: "December" },
]

export default function SharedProjectPage({ params: paramsPromise }) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [project, setProject] = useState(null)
  const [activities, setActivities] = useState([])
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [accessLevel, setAccessLevel] = useState("view")
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [statusNote, setStatusNote] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [shareToken, setShareToken] = useState(null)
  const [transferMonthOpen, setTransferMonthOpen] = useState(false)
  const [transferAssigneeOpen, setTransferAssigneeOpen] = useState(false)

  const canEdit = accessLevel === "manager" || accessLevel === "full"
  const canDelete = accessLevel === "full"

  useEffect(() => {
    paramsPromise.then((p) => setShareToken(p.token))
  }, [paramsPromise])

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      paramsPromise.then((p) => {
        router.replace(`/login?callbackUrl=/shared/${p.token}`)
      })
    }
  }, [status, paramsPromise, router])

  const fetchData = useCallback(async () => {
    if (!shareToken) return
    try {
      const res = await fetch(`/api/shared/${shareToken}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Project not found")
      setProject(data.project)
      setActivities(data.activities || [])
      setNotes(data.notes || [])
      setAccessLevel(data.accessLevel || "view")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [shareToken])

  useEffect(() => {
    if (shareToken) fetchData()
  }, [fetchData, shareToken])

  const handleEditSuccess = async (updatedProject) => {
    setProject(updatedProject)
    setEditOpen(false)
    toast.success("Project updated")
    fetchData()
  }

  const handleDelete = async () => {
    if (!project || !shareToken) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/shared/${shareToken}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to delete")
      setDeleteOpen(false)
      toast.success("Project deleted")
      router.push("/")
    } catch (err) {
      toast.error(err.message || "Failed to delete project")
    } finally {
      setActionLoading(false)
    }
  }

  const handleStatusChange = async () => {
    if (!project || !newStatus || !shareToken) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/shared/${shareToken}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, updateNote: statusNote || "" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update status")
      setProject(data)
      setStatusOpen(false)
      setNewStatus("")
      setStatusNote("")
      toast.success("Status updated")
      fetchData()
    } catch (err) {
      toast.error(err.message || "Failed to update status")
    } finally {
      setActionLoading(false)
    }
  }

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-8 w-96" />
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Eye className="size-12 text-muted-foreground/30 mx-auto" />
          <h1 className="text-xl font-semibold">Project not available</h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            {error === "Share link has expired"
              ? "This share link has expired. Please ask the project owner for a new link."
              : "This share link is invalid or the project has been deleted."}
          </p>
        </div>
      </div>
    )
  }

  if (!project) return null

  const badge = ACCESS_BADGES[accessLevel] || ACCESS_BADGES.view
  const BadgeIcon = badge.icon
  const apiPath = `/api/shared/${shareToken}`

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className={`flex items-center gap-2 text-xs ${badge.class} mb-2`}>
          <BadgeIcon className="size-3.5" />
          <span>{badge.label}</span>
        </div>

        <ProjectBreadcrumbs projectName={project.projectName} />

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <ProjectTitle project={project} />
          </div>
          {canEdit && (
            <div className="flex items-center gap-1 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => { setNewStatus(project.status); setStatusOpen(true) }}>
                <ArrowLeftRight className="size-3.5" />
                Status
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => setTransferMonthOpen(true)}>
                <CalendarArrowUp className="size-3.5" />
                Transfer
              </Button>
              <Button variant="outline" size="sm" onClick={() => setTransferAssigneeOpen(true)}>
                <UserRoundPlus className="size-3.5" />
                Transfer to
              </Button>
              {canDelete && (
                <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)} disabled={actionLoading}>
                  <Trash2 className="size-3.5" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {project.description && (
              <div className="rounded-xl border bg-card p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="size-4 text-muted-foreground shrink-0" />
                  <h2 className="text-sm font-semibold">Description</h2>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {project.description}
                </p>
              </div>
            )}

            <div className="rounded-xl border bg-card p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="size-2 rounded-full bg-primary shrink-0" />
                <h2 className="text-sm font-semibold">Activity Timeline</h2>
              </div>
              <ProjectTimeline activities={activities} />
            </div>

            <Notes projectId={project._id} readOnly={!canEdit} notes={notes} />
          </div>

          <div className="space-y-4 sm:space-y-6">
            <ProjectDetailsCard project={project} />
            <ProjectWebsiteCard
              project={project}
              passwordDisplay={project.decryptedPassword}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword((prev) => !prev)}
            />
            <ProjectMetaCard project={project} />
            <ProjectTagsCard tags={project.tags} />
          </div>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl overflow-hidden p-3 sm:p-4">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update project details</DialogDescription>
          </DialogHeader>
          <SharedEditForm
            project={project}
            apiPath={apiPath}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{project.projectName}&rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={actionLoading}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>Delete</Button>
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

      <SharedMonthTransfer
        project={project}
        apiPath={apiPath}
        open={transferMonthOpen}
        onClose={() => setTransferMonthOpen(false)}
        onSuccess={() => { setTransferMonthOpen(false); fetchData() }}
      />

      <SharedTransferAssignee
        project={project}
        apiPath={apiPath}
        open={transferAssigneeOpen}
        onClose={() => setTransferAssigneeOpen(false)}
        onSuccess={() => { setTransferAssigneeOpen(false); fetchData() }}
      />
    </div>
  )
}
