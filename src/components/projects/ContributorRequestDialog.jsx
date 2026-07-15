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
import { Loader2, Search, Percent, Plus, X, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { getUsers } from "@/actions/projectActions"

export default function ContributorRequestDialog({ project, open, onClose, onSuccess }) {
  const [users, setUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selected, setSelected] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)

  const existingIds = new Set((project.assignee || []).map(a => (a.user?._id || a.user)?.toString()))
  const ownerId = project.owner?._id?.toString() || project.owner?.toString()

  useEffect(() => {
    if (open) {
      setSearchQuery("")
      setSelected([])
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

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPct = selected.reduce((s, c) => s + (Number(c.percentage) || 0), 0)
  const remainingPct = Math.max(0, 100 - totalPct)

  const addUser = (userId) => {
    const u = users.find(x => x._id === userId)
    if (!u) return
    if (selected.some(c => c._id === userId)) return
    setSelected([...selected, { _id: u._id, name: u.name, image: u.image, percentage: "" }])
    setSearchQuery("")
    setFocused(false)
    inputRef.current?.focus()
  }

  const removeUser = (userId) => {
    setSelected(selected.filter(c => c._id !== userId))
  }

  const updatePct = (userId, val) => {
    setSelected(selected.map(c => c._id === userId ? { ...c, percentage: val } : c))
  }

  const handleConfirm = async () => {
    if (selected.length === 0) {
      toast.error("Please add at least one contributor")
      return
    }

    const entries = selected.map(c => ({
      userId: c._id,
      name: c.name,
      percentage: Number(c.percentage) || 0,
    }))

    if (entries.some(e => e.percentage <= 0 || e.percentage > 100)) {
      toast.error("Each contributor must have a percentage between 1 and 100")
      return
    }

    const total = entries.reduce((s, e) => s + e.percentage, 0)
    if (total > 100) {
      toast.error("Total share cannot exceed 100%")
      return
    }

    setSubmitting(true)
    try {
      let hasError = false
      for (const entry of entries) {
        const res = await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: entry.userId,
            project: project._id,
            type: "assignee_add_request",
            percentage: entry.percentage,
          }),
        })
        if (!res.ok) {
          const err = await res.json()
          toast.error(`Failed for ${entry.name}: ${err.message || "Error"}`)
          hasError = true
        }
      }
      if (!hasError) {
        toast.success(`Request sent to ${entries.length} contributor${entries.length > 1 ? "s" : ""}`)
        onSuccess?.()
        onClose?.()
      }
    } catch (err) {
      toast.error(err.message || "Failed to send requests")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Contributors</DialogTitle>
          <DialogDescription>
            Search and add multiple contributors to &ldquo;{project?.projectName}&rdquo;. Each must accept to join.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Search Users</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                ref={inputRef}
                placeholder={loadingUsers ? "Loading users..." : "Type name and press Add..."}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 200)}
                className="pl-8"
                disabled={loadingUsers}
              />
              {focused && searchQuery && (
                <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-lg border bg-popover shadow-md overflow-hidden">
                  <Command className="rounded-lg">
                    <CommandList>
                      {filteredUsers.length > 0 ? (
                        <CommandGroup>
                          {filteredUsers.map((u) => {
                            const isSelected = selected.some(c => c._id === u._id)
                            const isOwner = u._id === ownerId
                            const isExisting = existingIds.has(u._id)
                            const disabled = isSelected || isOwner || isExisting
                            return (
                              <CommandItem
                                key={u._id}
                                value={u._id}
                                onSelect={() => { if (!disabled) addUser(u._id) }}
                                disabled={disabled}
                                className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer ${disabled ? "opacity-40 pointer-events-none" : ""}`}
                              >
                                <Avatar className="size-7 shrink-0">
                                  <AvatarImage src={u.image} />
                                  <AvatarFallback className="text-[10px]">{u.name?.charAt(0) || "?"}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">{u.name}</p>
                                  {u.email && <p className="text-xs text-muted-foreground truncate">{u.email}</p>}
                                </div>
                                {isSelected && <span className="text-xs text-muted-foreground shrink-0">Added</span>}
                                {isOwner && <span className="text-xs text-muted-foreground shrink-0">Owner</span>}
                                {isExisting && !isSelected && <span className="text-xs text-muted-foreground shrink-0">Already added</span>}
                                {!isSelected && !isOwner && !isExisting && (
                                  <Button type="button" size="icon-xs" variant="ghost" className="shrink-0 size-6" onMouseDown={(e) => { e.preventDefault(); addUser(u._id) }}>
                                    <Plus className="size-3.5" />
                                  </Button>
                                )}
                              </CommandItem>
                            )
                          })}
                        </CommandGroup>
                      ) : (
                        <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">No users found</CommandEmpty>
                      )}
                    </CommandList>
                  </Command>
                </div>
              )}
            </div>
          </div>

          {selected.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Selected Contributors</span>
                <span className={`text-xs font-semibold tabular-nums ${totalPct > 100 ? "text-destructive" : "text-muted-foreground"}`}>
                  {totalPct}% / 100%
                </span>
              </div>
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                {selected.map((c) => (
                  <div key={c._id} className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2.5">
                    <Avatar size="sm">
                      <AvatarImage src={c.image} />
                      <AvatarFallback className="text-[10px]">{c.name?.charAt(0) || "?"}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium flex-1 min-w-0 truncate">{c.name || "Unknown"}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={c.percentage}
                        onChange={(e) => updatePct(c._id, e.target.value)}
                        className="h-7 w-16 text-xs text-center"
                        placeholder="%"
                      />
                    </div>
                    <Button variant="ghost" size="icon-xs" onClick={() => removeUser(c._id)}>
                      <X className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
              {totalPct > 100 && (
                <div className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="size-3.5" />
                  Total exceeds 100% — requests cannot be sent
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={submitting || selected.length === 0 || totalPct > 100 || totalPct === 0}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {submitting ? "Sending..." : `Send Request${selected.length > 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}