"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Building2, Users, Settings, ArrowLeft, Mail, Trash2 } from "lucide-react"

export default function OrganizationDashboardPage() {
  const { orgId } = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [org, setOrg] = useState(null)
  const [members, setMembers] = useState([])
  const [workspaces, setWorkspaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("member")
  const [submitting, setSubmitting] = useState(false)

  async function loadOrg() {
    try {
      const [orgRes, membersRes, workspacesRes] = await Promise.all([
        fetch(`/api/organizations/${orgId}`),
        fetch(`/api/organizations/${orgId}/members`),
        fetch(`/api/organizations/${orgId}/workspaces`),
      ])
      if (!orgRes.ok) {
        if (orgRes.status === 404) router.push("/dashboard/organizations")
        throw new Error("Failed to load organization")
      }
      const orgData = await orgRes.json()
      const membersData = await membersRes.json()
      const workspacesData = await workspacesRes.json()
      setOrg(orgData)
      setMembers(membersData.members || [])
      setWorkspaces(workspacesData.workspaces || [])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (orgId) loadOrg()
  }, [orgId])

  async function handleInvite(e) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/organizations/${orgId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: inviteEmail.trim(), role: inviteRole }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to invite member")
      }
      toast.success("Member added")
      setInviteOpen(false)
      setInviteEmail("")
      loadOrg()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemoveMember(userId) {
    try {
      const res = await fetch(`/api/organizations/${orgId}/members/${userId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to remove member")
      toast.success("Member removed")
      loadOrg()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleChangeRole(userId, newRole) {
    try {
      const res = await fetch(`/api/organizations/${orgId}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) throw new Error("Failed to update role")
      toast.success("Role updated")
      loadOrg()
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!org) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/organizations")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{org.name}</h1>
          <p className="text-sm text-muted-foreground">{org.description || "No description"}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{workspaces.length}</p>
              <p className="text-sm text-muted-foreground">Workspaces</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{members.length}</p>
              <p className="text-sm text-muted-foreground">Members</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </h2>
          <Button size="xs" onClick={() => setInviteOpen(true)}>
            <Mail className="h-3 w-3 mr-1" />
            Add Member
          </Button>
        </div>
        <div className="divide-y">
          {members.map((m) => (
            <div key={m._id} className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {m.user?.name?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="text-sm font-medium">{m.user?.name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{m.user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="text-xs rounded border bg-background px-2 py-1"
                  value={m.role}
                  onChange={(e) => handleChangeRole(m.user?._id, e.target.value)}
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
                <Button
                  size="xs"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => handleRemoveMember(m.user?._id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          {members.length === 0 && (
            <p className="px-6 py-4 text-sm text-muted-foreground">No members yet</p>
          )}
        </div>
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
            <DialogDescription>Add a member to this organization</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">User ID</label>
                <Input
                  placeholder="Enter user ID"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <select
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Adding..." : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
