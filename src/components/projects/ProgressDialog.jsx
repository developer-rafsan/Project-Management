"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

export default function ProgressDialog({
  open,
  onOpenChange,
  projectName,
  currentProgress = 0,
  onConfirm,
  actionLoading,
}) {
  const [value, setValue] = useState(currentProgress)

  useEffect(() => {
    if (open) setValue(currentProgress)
  }, [open, currentProgress])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Progress</DialogTitle>
          <DialogDescription>
            Set completion progress for &ldquo;{projectName}&rdquo;
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className="flex-1 h-2 rounded-full appearance-none cursor-pointer bg-muted [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"
            />
            <span className="text-2xl font-bold tabular-nums min-w-[4ch] text-right">{value}%</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground/60 px-0.5">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button onClick={() => onConfirm(value)} disabled={actionLoading || value === currentProgress}>
            {actionLoading && <Loader2 className="size-4 animate-spin" />}
            Update Progress
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
