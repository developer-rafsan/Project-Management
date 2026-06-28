"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import {
  getProject,
  updateProject,
  deleteProject,
  createProject,
  getProjectUpdates,
} from "@/actions/projectActions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import {
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Star,
  StarOff,
  Pencil,
  Archive,
  Copy as DuplicateIcon,
  Trash2,
  CalendarArrowUp,
  ExternalLink,
} from "lucide-react"
import ProjectForm from "@/components/projects/ProjectForm"
import MonthTransferDialog from "@/components/projects/MonthTransferDialog"

const statusColors = {
  Pending: "bg-yellow-500",
  "In Progress": "bg-indigo-500",
  "Waiting Client": "bg-purple-500",
  Delivered: "bg-emerald-500",
  "On Hold": "bg-orange-500",
  Cancelled: "bg-red-500",
}

const statusVariants = {
  Pending: "secondary",
  "In Progress": "default",
  "Waiting Client": "outline",
  Delivered: "secondary",
  "On Hold": "destructive",
  Cancelled: "destructive",
}

const priorityVariants = {
  Low: "secondary",
  Medium: "default",
  High: "outline",
  Urgent: "destructive",
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function formatDate(dateStr) {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function CopyButton({ text, label = "Copy" }) {
  const handleCopy = async () => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Copied to clipboard")
    } catch {
      toast.error("Failed to copy")
    }
  }

  return (
    <Button variant="ghost" size="icon-xs" onClick={handleCopy} title={label}>
      <Copy className="size-3" />
    </Button>
  )
}

export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [project, setProject] = useState(null)
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
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
    setEditOpen(false)
  }

  const handleArchive = async () => {
    if (!project) return
    setActionLoading(true)
    try {
      const updated = await updateProject(project._id, { archived: !project.archived })
      setProject(updated)
      setArchiveOpen(false)
      toast.success(project.archived ? "Project unarchived" : "Project archived")
    } catch (err) {
      toast.error(err.message || "Failed to archive project")
    } finally {
      setActionLoading(false)
    }
  }

  const handleDuplicate = async () => {
    if (!project) return
    setActionLoading(true)
    try {
      const { _id, createdAt, updatedAt, orderId, archived, transferHistory, ...rest } = project
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

  const handleToggleFavorite = async () => {
    if (!project) return
    try {
      const updated = await updateProject(project._id, { favorite: !project.favorite })
      setProject(updated)
    } catch (err) {
      toast.error(err.message || "Failed to update favorite")
    }
  }

  const handleTransferSuccess = () => {
    fetchData()
    setTransferOpen(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-5 w-32" />
            </div>
          ))}
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

  const passwordDisplay = project.websitePassword
    ? typeof project.websitePassword === "object" && project.websitePassword.encryptedData
      ? "Encrypted"
      : project.websitePassword
    : null

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
        <ChevronRight className="size-4" />
        <Link href="/dashboard/projects" className="hover:text-foreground">Projects</Link>
        <ChevronRight className="size-4" />
        <span className="text-foreground">{project.projectName}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{project.projectName}</h1>
            {project.status && (
              <Badge variant={statusVariants[project.status] || "secondary"}>
                {project.status}
              </Badge>
            )}
            {project.priority && (
              <Badge variant={priorityVariants[project.priority] || "default"}>
                {project.priority}
              </Badge>
            )}
          </div>
          {project.orderId && (
            <p className="text-sm text-muted-foreground font-mono">#{project.orderId}</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <Button variant="ghost" size="icon" onClick={handleToggleFavorite} title={project.favorite ? "Unfavorite" : "Favorite"}>
            {project.favorite ? (
              <Star className="size-4 fill-yellow-400 text-yellow-400" />
            ) : (
              <StarOff className="size-4" />
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => setArchiveOpen(true)}>
            <Archive className="size-4" />
            {project.archived ? "Unarchive" : "Archive"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDuplicate} disabled={actionLoading}>
            <DuplicateIcon className="size-4" />
            Duplicate
          </Button>
          <Button variant="outline" size="sm" onClick={() => setTransferOpen(true)}>
            <CalendarArrowUp className="size-4" />
            Transfer
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Order ID</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-sm">{project.orderId || "-"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business Name</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{project.businessName || "-"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CMS</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{project.cms || "-"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Website URL</CardTitle>
          </CardHeader>
          <CardContent>
            {project.websiteUrl ? (
              <div className="flex items-center gap-1">
                <a
                  href={project.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline truncate"
                >
                  {project.websiteUrl}
                </a>
                <CopyButton text={project.websiteUrl} />
                <Button variant="ghost" size="icon-xs" asChild>
                  <a href={project.websiteUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-3" />
                  </a>
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">-</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Website Username</CardTitle>
          </CardHeader>
          <CardContent>
            {project.websiteUsername ? (
              <div className="flex items-center gap-1">
                <span className="text-sm">{project.websiteUsername}</span>
                <CopyButton text={project.websiteUsername} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">-</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Website Password</CardTitle>
          </CardHeader>
          <CardContent>
            {passwordDisplay ? (
              <div className="flex items-center gap-1">
                <span className="text-sm font-mono">
                  {showPassword ? passwordDisplay : "••••••••"}
                </span>
                <Button variant="ghost" size="icon-xs" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                </Button>
                {typeof passwordDisplay === "string" && passwordDisplay !== "Encrypted" && (
                  <CopyButton text={passwordDisplay} />
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">-</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assignee</CardTitle>
          </CardHeader>
          <CardContent>
            {project.assignee ? (
              <div className="flex items-center gap-2">
                <Avatar size="sm">
                  <AvatarImage src={project.assignee.image} />
                  <AvatarFallback>
                    {project.assignee.name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{project.assignee.name}</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Unassigned</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Created</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{formatDate(project.createdAt)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{formatDate(project.updatedAt)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Month / Year</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {project.currentMonth ? monthNames[project.currentMonth - 1] : "-"} / {project.currentYear || "-"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Price</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">
              {Number(project.price) ? `$${Number(project.price).toFixed(2)}` : "-"}
            </p>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            {project.tags?.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {project.tags.map((tag) => (
                  <Badge key={tag} variant="ghost">{tag}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tags</p>
            )}
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            {project.description ? (
              <p className="text-sm whitespace-pre-wrap">{project.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No description</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {updates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No updates yet</p>
          ) : (
            <div className="space-y-0">
              {updates.map((update, idx) => (
                <div key={update._id} className="relative flex gap-4 pb-6 last:pb-0">
                  {idx < updates.length - 1 && (
                    <div className="absolute left-[11px] top-6 bottom-0 w-px bg-border" />
                  )}
                  <div
                    className={`mt-1.5 size-[22px] shrink-0 rounded-full border-2 border-background ${
                      statusColors[update.newStatus] || "bg-gray-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {update.previousStatus || "New"} → {update.newStatus}
                    </p>
                    {update.note && (
                      <p className="text-sm text-muted-foreground mt-1">{update.note}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{update.updatedBy?.name || "Unknown"}</span>
                      <span>·</span>
                      <span>{formatDate(update.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transfer History</CardTitle>
        </CardHeader>
        <CardContent>
          {project.transferHistory?.length > 0 ? (
            <div className="space-y-3">
              {project.transferHistory.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm">
                  <CalendarArrowUp className="size-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium">
                      {monthNames[(entry.oldMonth || 1) - 1]} → {monthNames[(entry.newMonth || 1) - 1]}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      · {formatDate(entry.transferDate)}
                    </span>
                  </div>
                  {entry.transferredBy?.name && (
                    <span className="text-muted-foreground text-xs">{entry.transferredBy.name}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No transfers</p>
          )}
        </CardContent>
      </Card>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Project</SheetTitle>
            <SheetDescription>
              Update project details
            </SheetDescription>
          </SheetHeader>
          <div className="p-4">
            <ProjectForm
              initialData={project}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{project.archived ? "Unarchive" : "Archive"} Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to {project.archived ? "unarchive" : "archive"} "{project.projectName}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleArchive} disabled={actionLoading}>
              {project.archived ? "Unarchive" : "Archive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{project.projectName}"? This action cannot be undone.
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

      <MonthTransferDialog
        project={project}
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        onSuccess={handleTransferSuccess}
      />
    </div>
  )
}
