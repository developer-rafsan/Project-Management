"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

const MONTHS = [
  { value: 1, label: "January" }, { value: 2, label: "February" },
  { value: 3, label: "March" }, { value: 4, label: "April" },
  { value: 5, label: "May" }, { value: 6, label: "June" },
  { value: 7, label: "July" }, { value: 8, label: "August" },
  { value: 9, label: "September" }, { value: 10, label: "October" },
  { value: 11, label: "November" }, { value: 12, label: "December" },
]

export default function SharedMonthTransfer({ project, apiPath, open, onClose, onSuccess }) {
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
      const date = new Date(Number(newYear), Number(newMonth) - 1, 1)
      const res = await fetch(apiPath, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentProjectDate: date }),
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
