"use client"

import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Loader2, Search, Percent, Check } from "lucide-react"
import { toast } from "sonner"
import { getUsers } from "@/actions/projectActions"

export default function ContributorRequestDialog({ project, open, onClose, onSuccess }) {
  const [users, setUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUserId, setSelectedUserId] = useState("")
  const [percentage, setPercentage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setSearchQuery("")
      setSelectedUserId("")
      setPercentage("")
      setFocused(false)
      fetchUsers()
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const allUsers = await getUsers()
      setUsers(allUsers)
    } catch (err) {
      toast.error("Failed to load users")
    } finally {
      setLoadingUsers(false)
    }
  }

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

    const pct = Number(percentage)
    if (!pct || pct < 0 || pct > 100) {
      toast.error("Please enter a valid percentage (0-100)")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedUserId,
          project: project._id,
          type: "assignee_add_request",
          percentage: pct,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Failed to send request")
      }
      toast.success("Contributor request sent")
      onSuccess?.()
      onClose?.()
    } catch (err) {
      toast.error(err.message || "Failed to send request")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Contributor</DialogTitle>
          <DialogDescription>
            Search for a user and send them a contributor request for &ldquo;{project?.projectName}&rdquo;. They must accept to join.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Select User</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                ref={inputRef}
                placeholder={loadingUsers ? "Loading users..." : "Search by name..."}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  if (selectedUserId) setSelectedUserId("")
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 200)}
                className="pl-8"
                disabled={loadingUsers}
              />
              {focused && searchQuery && filteredUsers.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-lg border bg-popover shadow-md overflow-hidden">
                  <Command className="rounded-lg">
                    <CommandList>
                      <CommandGroup>
                        {filteredUsers.map((u) => (
                          <CommandItem
                            key={u._id}
                            value={u._id}
                            onSelect={() => handleSelect(u._id)}
                            className="flex items-center gap-2.5 px-3 py-2 cursor-pointer"
                          >
                            <Avatar className="size-7 shrink-0">
                              <AvatarImage src={u.image} />
                              <AvatarFallback className="text-[10px]">{u.name?.charAt(0) || "?"}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{u.name}</p>
                              {u.email && (
                                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                              )}
                            </div>
                            {selectedUserId === u._id && (
                              <Check className="size-4 text-primary shrink-0" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>
              )}
              {focused && searchQuery && filteredUsers.length === 0 && !loadingUsers && (
                <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-lg border bg-popover shadow-md">
                  <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No users found
                  </div>
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
              <span className="text-muted-foreground">Adding <strong>{selectedUser.name}</strong> as contributor</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Percentage (%)</label>
            <div className="relative">
              <Percent className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                type="number"
                min={0}
                max={100}
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                placeholder="Enter share percentage..."
                className="pl-8"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={submitting || !selectedUserId || !percentage}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Send Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
