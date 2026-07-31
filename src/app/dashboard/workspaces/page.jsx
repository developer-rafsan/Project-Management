"use client"

import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { fetchWorkspaces, setCurrentWorkspace, addWorkspace, updateWorkspaceInStore, removeWorkspace } from "@/lib/redux/slices/workspaceSlice"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
  LayoutDashboard,
  Plus,
  Settings,
  Trash2,
  ExternalLink,
  Check,
} from "lucide-react"

export default function WorkspacesPage() {
  const dispatch = useDispatch()
  const { workspaces, currentWorkspaceId, loading, fetched } = useSelector((s) => s.workspaces)
  const [createOpen, setCreateOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedWorkspace, setSelectedWorkspace] = useState(null)
  const [formName, setFormName] = useState("")
  const [formSettings, setFormSettings] = useState({ allowInvites: true, maxMembers: 10 })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!fetched && !loading) {
      dispatch(fetchWorkspaces())
    }
  }, [dispatch, fetched, loading])

  async function handleCreate(e) {
    e.preventDefault()
    if (!formName.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName.trim(), settings: formSettings }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create workspace")
      }
      const workspace = await res.json()
      dispatch(addWorkspace(workspace))
      dispatch(setCurrentWorkspace(workspace._id))
      toast.success("Workspace created")
      setCreateOpen(false)
      setFormName("")
      setFormSettings({ allowInvites: true, maxMembers: 10 })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function openSettings(w) {
    setSelectedWorkspace(w)
    setFormName(w.name)
    setFormSettings({ ...w.settings })
    setSettingsOpen(true)
  }

  async function handleUpdate(e) {
    e.preventDefault()
    if (!formName.trim() || !selectedWorkspace) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/workspaces/${selectedWorkspace._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName.trim(), settings: formSettings }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to update workspace")
      }
      const updated = await res.json()
      dispatch(updateWorkspaceInStore(updated))
      toast.success("Workspace updated")
      setSettingsOpen(false)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function openDelete(w) {
    setSelectedWorkspace(w)
    setDeleteOpen(true)
  }

  async function handleDelete() {
    if (!selectedWorkspace) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/workspaces/${selectedWorkspace._id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to delete workspace")
      }
      dispatch(removeWorkspace(selectedWorkspace._id))
      toast.success("Workspace deleted")
      setDeleteOpen(false)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && !fetched) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workspaces</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your workspaces and switch between them
          </p>
        </div>
        <Button onClick={() => { setFormName(""); setFormSettings({ allowInvites: true, maxMembers: 10 }); setCreateOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          New Workspace
        </Button>
      </div>

      {workspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <LayoutDashboard className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-lg font-medium text-muted-foreground">No workspaces yet</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Create your first workspace to get started</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((w) => (
            <div
              key={w._id}
              className={`relative rounded-xl border p-5 transition-all hover:shadow-md ${
                w._id === currentWorkspaceId ? "border-primary/50 bg-primary/5" : "bg-card"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{w.name}</h3>
                    {w._id === currentWorkspaceId && (
                      <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase">
                      {w.type}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-4">
                {w._id !== currentWorkspaceId && (
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={() => dispatch(setCurrentWorkspace(w._id))}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Switch
                  </Button>
                )}
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => openSettings(w)}
                >
                  <Settings className="h-3 w-3" />
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => openDelete(w)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Workspace</DialogTitle>
            <DialogDescription>Create a new workspace to organize your projects</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Workspace Name</label>
                <Input
                  id="name"
                  placeholder="My Workspace"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="allowInvites" className="text-sm font-medium">Allow Invites</label>
                <input
                  id="allowInvites"
                  type="checkbox"
                  className="h-4 w-4 rounded border-border"
                  checked={formSettings.allowInvites}
                  onChange={(e) => setFormSettings((s) => ({ ...s, allowInvites: e.target.checked }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !formName.trim()}>
                {submitting ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Workspace Settings</DialogTitle>
            <DialogDescription>Update your workspace name and preferences</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="edit-name" className="text-sm font-medium">Workspace Name</label>
                <Input
                  id="edit-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="edit-invites" className="text-sm font-medium">Allow Invites</label>
                <input
                  id="edit-invites"
                  type="checkbox"
                  className="h-4 w-4 rounded border-border"
                  checked={formSettings.allowInvites}
                  onChange={(e) => setFormSettings((s) => ({ ...s, allowInvites: e.target.checked }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSettingsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !formName.trim()}>
                {submitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Workspace</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedWorkspace?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
