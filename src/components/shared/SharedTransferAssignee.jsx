"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserRoundPlus } from "lucide-react"
import { toast } from "sonner"

export default function SharedTransferAssignee({ project, apiPath, open, onClose, onSuccess }) {
  const [users, setUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUserId, setSelectedUserId] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)

  useEffect(() => {
    if (!open) return
    setSearchQuery("")
    setSelectedUserId("")
    setLoadingUsers(true)
    fetch(`/api/users?share_token=${project?.shareToken || ""}`)
      .then((r) => r.json())
      .then(setUsers)
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setLoadingUsers(false))
  }, [open, project?.shareToken])

  const filteredUsers = users.filter((u) =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const selectedUser = users.find((u) => u._id === selectedUserId)

  const handleConfirm = async () => {
    if (!selectedUserId) {
      toast.error("Please select a user")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(apiPath, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignee: [{ user: selectedUserId, percentage: 100 }] }),
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
            <input
              placeholder={loadingUsers ? "Loading users..." : "Search by name..."}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); if (selectedUserId) setSelectedUserId("") }}
              className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              disabled={loadingUsers}
            />
            {searchQuery && filteredUsers.length > 0 && (
              <div className="rounded-lg border bg-popover shadow-md overflow-hidden mt-1">
                {filteredUsers.map((u) => (
                  <button
                    key={u._id}
                    type="button"
                    onMouseDown={() => { setSelectedUserId(u._id); setSearchQuery(u.name || "") }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-left hover:bg-accent cursor-pointer"
                  >
                    <Avatar className="size-7 shrink-0">
                      <AvatarImage src={u.image} />
                      <AvatarFallback className="text-[10px]">{u.name?.charAt(0) || "?"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{u.name}</p>
                      {u.email && <p className="text-xs text-muted-foreground">{u.email}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
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
