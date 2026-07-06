"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
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

  if (loading) {
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
          <EditForm
            project={project}
            token={shareToken}
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

      <MonthTransferDialog
        project={project}
        token={shareToken}
        open={transferMonthOpen}
        onClose={() => setTransferMonthOpen(false)}
        onSuccess={() => { setTransferMonthOpen(false); fetchData() }}
      />

      <TransferAssigneeDialog
        project={project}
        token={shareToken}
        open={transferAssigneeOpen}
        onClose={() => setTransferAssigneeOpen(false)}
        onSuccess={() => { setTransferAssigneeOpen(false); fetchData() }}
      />
    </div>
  )
}

function EditForm({ project, token, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    projectName: project.projectName || "",
    websiteUrl: project.websiteUrl || "",
    websiteUsername: project.websiteUsername || "",
    orderId: project.orderId || "",
    cms: project.cms || "",
    priority: project.priority || "Medium",
    description: project.description || "",
    price: project.price || "",
    startDate: project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : "",
    tags: project.tags || [],
    websitePassword: "",
  })
  const [tagInput, setTagInput] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body = { ...formData }
      if (body.price) body.price = Number(body.price)
      if (!body.websitePassword) delete body.websitePassword
      const res = await fetch(`/api/shared/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update")
      onSuccess(data)
    } catch (err) {
      toast.error(err.message || "Failed to update project")
    } finally {
      setSaving(false)
    }
  }

  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }))
      setTagInput("")
    }
  }

  const removeTag = (tag) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Project Name</label>
          <input
            value={formData.projectName}
            onChange={(e) => setFormData((p) => ({ ...p, projectName: e.target.value }))}
            className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Order ID</label>
          <input
            value={formData.orderId}
            onChange={(e) => setFormData((p) => ({ ...p, orderId: e.target.value }))}
            className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">CMS</label>
          <input
            value={formData.cms}
            onChange={(e) => setFormData((p) => ({ ...p, cms: e.target.value }))}
            className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Website URL</label>
          <input
            value={formData.websiteUrl}
            onChange={(e) => setFormData((p) => ({ ...p, websiteUrl: e.target.value }))}
            className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Website Username</label>
          <input
            value={formData.websiteUsername}
            onChange={(e) => setFormData((p) => ({ ...p, websiteUsername: e.target.value }))}
            className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Website Password</label>
          <input
            type="password"
            value={formData.websitePassword}
            onChange={(e) => setFormData((p) => ({ ...p, websitePassword: e.target.value }))}
            placeholder="Leave blank to keep current"
            className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Priority</label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData((p) => ({ ...p, priority: e.target.value }))}
            className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Price</label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))}
            className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Start Date</label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData((p) => ({ ...p, startDate: e.target.value }))}
            className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Tags</label>
        <div className="flex gap-2">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag() } }}
            placeholder="Add a tag..."
            className="flex h-9 flex-1 rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          />
          <Button type="button" variant="outline" size="sm" onClick={addTag}>Add</Button>
        </div>
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {formData.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="text-muted-foreground hover:text-foreground cursor-pointer">&times;</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
          rows={3}
          className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
      </DialogFooter>
    </form>
  )
}

function MonthTransferDialog({ project, token, open, onClose, onSuccess }) {
  const [newMonth, setNewMonth] = useState("")
  const [newYear, setNewYear] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const CURRENT_YEAR = new Date().getFullYear()
  const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i)

  const handleConfirm = async () => {
    if (!newMonth || !newYear) {
      toast.error("Please select both month and year")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/shared/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentMonth: Number(newMonth), currentYear: Number(newYear) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to transfer")
      toast.success("Project transferred successfully")
      onSuccess?.(data)
    } catch (err) {
      toast.error(err.message || "Failed to transfer project")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Project</DialogTitle>
          <DialogDescription>Move &ldquo;{project?.projectName}&rdquo; to a different month.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Month</label>
              <Select value={newMonth} onValueChange={setNewMonth}>
                <SelectTrigger><SelectValue placeholder="Select month" /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Year</label>
              <Select value={newYear} onValueChange={setNewYear}>
                <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={submitting || !newMonth || !newYear}>
            {submitting ? "Transferring..." : "Transfer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TransferAssigneeDialog({ project, token, open, onClose, onSuccess }) {
  const [users, setUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUserId, setSelectedUserId] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (open) {
      setSearchQuery("")
      setSelectedUserId("")
      setLoadingUsers(true)
      fetch(`/api/users?share_token=${token}`)
        .then((r) => r.json())
        .then(setUsers)
        .catch(() => toast.error("Failed to load users"))
        .finally(() => setLoadingUsers(false))
    }
  }, [open, token])

  const filteredUsers = users.filter((u) =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const selectedUser = users.find((u) => u._id === selectedUserId)

  const handleSelect = (userId) => {
    setSelectedUserId(userId)
    setSearchQuery(users.find((u) => u._id === userId)?.name || "")
    setFocused(false)
  }

  const handleConfirm = async () => {
    if (!selectedUserId) {
      toast.error("Please select a user")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/shared/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignee: selectedUserId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to transfer")
      toast.success("Project transferred successfully")
      onSuccess?.(data)
    } catch (err) {
      toast.error(err.message || "Failed to transfer project")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer to Person</DialogTitle>
          <DialogDescription>Transfer &ldquo;{project?.projectName}&rdquo; to another user.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Select User</label>
            <div className="relative">
              <input
                placeholder={loadingUsers ? "Loading users..." : "Search by name..."}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); if (selectedUserId) setSelectedUserId("") }}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 200)}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm pl-8"
                disabled={loadingUsers}
              />
              {focused && searchQuery && filteredUsers.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-lg border bg-popover shadow-md overflow-hidden">
                  {filteredUsers.map((u) => (
                    <button
                      key={u._id}
                      type="button"
                      onMouseDown={() => handleSelect(u._id)}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-left hover:bg-accent cursor-pointer"
                    >
                      <Avatar className="size-7 shrink-0">
                        <AvatarImage src={u.image} />
                        <AvatarFallback className="text-[10px]">{u.name?.charAt(0) || "?"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{u.name}</p>
                        {u.email && <p className="text-xs text-muted-foreground truncate">{u.email}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {selectedUser && (
            <div className="flex items-center gap-2.5 rounded-lg border bg-muted/30 px-3 py-2.5 text-sm">
              <Avatar className="size-6 shrink-0">
                <AvatarImage src={selectedUser.image} />
                <AvatarFallback className="text-[9px]">{selectedUser.name?.charAt(0) || "?"}</AvatarFallback>
              </Avatar>
              <UserRoundPlus className="size-3.5 text-muted-foreground shrink-0" />
              Transferring to <strong className="truncate">{selectedUser.name}</strong>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={submitting || !selectedUserId}>
            {submitting ? "Transferring..." : "Transfer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
