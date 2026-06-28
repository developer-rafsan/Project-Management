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
  getProjectPassword,
} from "@/actions/projectActions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  ArrowLeftRight,
  Loader2,
  Globe,
  Lock,
  User,
  Tag,
  DollarSign,
  Calendar,
  Clock,
  Hash,
  FileText,
  Layout,
  ArrowUpDown,
  ListChecks,
  Circle,
} from "lucide-react"
import ProjectForm from "@/components/projects/ProjectForm"
import MonthTransferDialog from "@/components/projects/MonthTransferDialog"
import Notes from "@/components/projects/Notes"

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

function formatDateShort(dateStr) {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
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

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="flex items-center gap-2 min-w-[120px] shrink-0">
        <Icon className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

function SectionDivider() {
  return <div className="h-px bg-border/50" />
}

export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [project, setProject] = useState(null)
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [decryptedPassword, setDecryptedPassword] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
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
      getProjectPassword(params.id)
        .then((res) => setDecryptedPassword(res.password))
        .catch(() => {})
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

  const handleStatusChange = async () => {
    if (!project || !newStatus) return
    setActionLoading(true)
    try {
      const updated = await updateProject(project._id, {
        status: newStatus,
        updateNote: statusNote || "",
      })
      setProject(updated)
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
      <div className="space-y-6">
        <Skeleton className="h-4 w-64" />
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
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
    <div className="space-y-6">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
        <ChevronRight className="size-3.5" />
        <Link href="/dashboard/projects" className="hover:text-foreground transition-colors">Projects</Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground font-medium truncate">{project.projectName}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{project.projectName}</h1>
            <div className="flex items-center gap-1.5">
              <Badge variant={statusVariants[project.status] || "secondary"} className="rounded-full">
                <Circle className="size-2 fill-current mr-1" />
                {project.status}
              </Badge>
              <Badge variant={priorityVariants[project.priority] || "default"} className="rounded-full">
                {project.priority}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {project.orderId && <span className="font-mono text-xs">#{project.orderId}</span>}
            {project.cms && (
              <>
                <span className="text-muted-foreground/50">·</span>
                <span>{project.cms}</span>
              </>
            )}
            {Number(project.price) > 0 && (
              <>
                <span className="text-muted-foreground/50">·</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">${Number(project.price).toFixed(2)}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <Button variant="ghost" size="icon" onClick={handleToggleFavorite} title={project.favorite ? "Unfavorite" : "Favorite"}>
            {project.favorite ? (
              <Star className="size-4 fill-yellow-400 text-yellow-400" />
            ) : (
              <StarOff className="size-4" />
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            setNewStatus(project.status)
            setStatusOpen(true)
          }}>
            <ArrowLeftRight className="size-3.5" />
            Status
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="size-3.5" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => setArchiveOpen(true)}>
            <Archive className="size-3.5" />
            {project.archived ? "Unarchive" : "Archive"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDuplicate} disabled={actionLoading}>
            <DuplicateIcon className="size-3.5" />
            Duplicate
          </Button>
          <Button variant="outline" size="sm" onClick={() => setTransferOpen(true)}>
            <CalendarArrowUp className="size-3.5" />
            Transfer
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {project.description && (
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Description</h2>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{project.description}</p>
            </div>
          )}

          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="size-2 rounded-full bg-primary" />
              <h2 className="text-sm font-semibold">Timeline</h2>
            </div>
            {updates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No updates yet</p>
            ) : (
              <div className="space-y-0">
                {updates.map((update, idx) => (
                  <div key={update._id} className="relative flex gap-4 pb-6 last:pb-0">
                    {idx < updates.length - 1 && (
                      <div className="absolute left-[11px] top-6 bottom-0 w-px bg-gradient-to-b from-border to-transparent" />
                    )}
                    <div
                      className={`mt-1.5 size-[22px] shrink-0 rounded-full border-2 border-background ring-2 ring-background ${
                        statusColors[update.newStatus] || "bg-gray-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">
                          {update.previousStatus || "New"}
                          <span className="text-muted-foreground mx-1">→</span>
                          {update.newStatus}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(update.createdAt)}
                        </span>
                      </div>
                      {update.note && (
                        <p className="text-sm text-muted-foreground mt-1.5 bg-muted/50 rounded-lg p-2.5">{update.note}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                        <Avatar size="sm">
                          <AvatarImage src={update.updatedBy?.image} />
                          <AvatarFallback className="text-[10px]">
                            {update.updatedBy?.name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span>{update.updatedBy?.name || "Unknown"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {project.transferHistory?.length > 0 && (
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <CalendarArrowUp className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Transfer History</h2>
              </div>
              <div className="space-y-2">
                {project.transferHistory.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm py-1.5">
                    <div className="size-1.5 rounded-full bg-muted-foreground/30" />
                    <span className="font-medium text-muted-foreground">
                      {monthNames[(entry.oldMonth || 1) - 1]}
                    </span>
                    <ArrowLeftRight className="size-3 text-muted-foreground/50" />
                    <span className="font-medium">{monthNames[(entry.newMonth || 1) - 1]}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatDateShort(entry.transferDate)}
                    </span>
                    {entry.transferredBy?.name && (
                      <span className="text-xs text-muted-foreground">{entry.transferredBy.name}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Notes projectId={project._id} />
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Details</h2>
            <div className="divide-y divide-border/50">
              <InfoRow icon={Hash} label="Order ID">
                <span className="font-mono text-sm">{project.orderId || "-"}</span>
              </InfoRow>
              <SectionDivider />
              <InfoRow icon={User} label="Assignee">
                {project.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar size="sm">
                      <AvatarImage src={project.assignee.image} />
                      <AvatarFallback className="text-[10px]">
                        {project.assignee.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{project.assignee.name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Unassigned</span>
                )}
              </InfoRow>
              <SectionDivider />
              <InfoRow icon={Layout} label="CMS">
                <span className="text-sm">{project.cms || "-"}</span>
              </InfoRow>
              <SectionDivider />
              <InfoRow icon={ArrowUpDown} label="Priority">
                <Badge variant={priorityVariants[project.priority] || "default"} className="rounded-full text-xs">
                  {project.priority || "-"}
                </Badge>
              </InfoRow>
              <SectionDivider />
              <InfoRow icon={ListChecks} label="Status">
                <Badge variant={statusVariants[project.status] || "secondary"} className="rounded-full text-xs">
                  {project.status || "-"}
                </Badge>
              </InfoRow>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Website</h2>
            <div className="divide-y divide-border/50">
              <InfoRow icon={Globe} label="URL">
                {project.websiteUrl ? (
                  <div className="flex items-center gap-1 min-w-0">
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
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </InfoRow>
              <SectionDivider />
              <InfoRow icon={User} label="Username">
                {project.websiteUsername ? (
                  <div className="flex items-center gap-1">
                    <span className="text-sm">{project.websiteUsername}</span>
                    <CopyButton text={project.websiteUsername} />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </InfoRow>
              <SectionDivider />
              <InfoRow icon={Lock} label="Password">
                {passwordDisplay ? (
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-mono">
                      {showPassword ? passwordDisplay : "••••••••"}
                    </span>
                    <Button variant="ghost" size="icon-xs" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                    </Button>
                    {typeof passwordDisplay === "string" && <CopyButton text={passwordDisplay} />}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </InfoRow>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Meta</h2>
            <div className="divide-y divide-border/50">
              <InfoRow icon={DollarSign} label="Price">
                <span className="text-sm font-medium">
                  {Number(project.price) ? `$${Number(project.price).toFixed(2)}` : "-"}
                </span>
              </InfoRow>
              <SectionDivider />
              <InfoRow icon={Calendar} label="Month/Year">
                <span className="text-sm">
                  {project.currentMonth ? monthNames[project.currentMonth - 1] : "-"} / {project.currentYear || "-"}
                </span>
              </InfoRow>
              <SectionDivider />
              <InfoRow icon={Calendar} label="Start Date">
                <span className="text-sm">{formatDateShort(project.startDate || project.createdAt)}</span>
              </InfoRow>
              <SectionDivider />
              <InfoRow icon={Clock} label="Created">
                <span className="text-sm">{formatDateShort(project.createdAt)}</span>
              </InfoRow>
              <SectionDivider />
              <InfoRow icon={Clock} label="Updated">
                <span className="text-sm">{formatDateShort(project.updatedAt)}</span>
              </InfoRow>
            </div>
          </div>

          {project.tags?.length > 0 && (
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="size-4 text-muted-foreground" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tags</h2>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {project.tags.map((tag, idx) => (
                  <Badge key={`${tag}-${idx}`} variant="secondary" className="rounded-full text-xs font-normal">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

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
              key={editOpen ? project._id : "closed"}
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

      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Status</DialogTitle>
            <DialogDescription>
              Update the status for "{project?.projectName}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {["Pending", "In Progress", "Waiting Client", "Delivered", "On Hold", "Cancelled"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Note <span className="text-muted-foreground font-normal">(optional)</span></label>
              <Textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Add a note about this status change..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleStatusChange} disabled={actionLoading || !newStatus || newStatus === project?.status}>
              {actionLoading && <Loader2 className="size-4 animate-spin" />}
              Update Status
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
