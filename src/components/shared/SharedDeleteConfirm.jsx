"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

export default function SharedDeleteConfirm({ project, apiPath, open, onOpenChange, onSuccess, onCancel }) {
  const [submitting, setSubmitting] = useState(false)

  const handleDelete = async () => {
    if (!apiPath) return
    setSubmitting(true)
    try {
      const res = await fetch(apiPath, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to delete")
      toast.success("Project deleted")
      onSuccess?.()
    } catch (err) {
      toast.error(err.message || "Failed to delete project")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Project</DialogTitle>
          <DialogDescription>Are you sure you want to delete &ldquo;{project?.projectName}&rdquo;? This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={submitting}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={submitting}>{submitting ? "Deleting..." : "Delete"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
