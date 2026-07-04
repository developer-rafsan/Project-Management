"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Copy, Check, Link2, Clock, Infinity, Trash2, Plus } from "lucide-react"
import { toast } from "sonner"

const EXPIRY_OPTIONS = [
  { value: "1h", label: "1 Hour", icon: Clock },
  { value: "24h", label: "24 Hours", icon: Clock },
  { value: "never", label: "Until Revoked", icon: Infinity },
]

function formatExpiry(dateStr) {
  if (!dateStr) return "Never"
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

export default function ShareListDialog({ open, onOpenChange, selectedProjectIds = [] }) {
  const [step, setStep] = useState("list")
  const [selectedExpiry, setSelectedExpiry] = useState("24h")
  const [loading, setLoading] = useState(false)
  const [shareUrl, setShareUrl] = useState(null)
  const [links, setLinks] = useState([])
  const [fetching, setFetching] = useState(true)

  const isSelectedMode = selectedProjectIds?.length > 0

  useEffect(() => {
    if (!open) return
    const isSelected = selectedProjectIds?.length > 0
    setStep(isSelected ? "create" : "list")
    setShareUrl(null)
    setFetching(true)

    fetch(`/api/share-list`)
      .then((r) => r.json())
      .then((data) => setLinks(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [open, selectedProjectIds])

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/share-list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expiresIn: selectedExpiry,
          projectIds: isSelectedMode ? selectedProjectIds : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create share link")
      setShareUrl(data.url)
      setLinks((prev) => [{
        _id: data._id,
        token: data.token,
        url: data.url,
        expiresAt: data.expiresAt,
        createdAt: new Date().toISOString(),
        active: true,
        projectCount: data.projectCount || 0,
      }, ...prev])
      toast.success("Share link created")
    } catch (err) {
      toast.error(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async (link) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/share-list/${link.token}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to revoke")
      setLinks((prev) => prev.filter((l) => l._id !== link._id))
      toast.success("Share link revoked")
    } catch (err) {
      toast.error(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (url) => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Link copied to clipboard")
    } catch {
      toast.error("Failed to copy")
    }
  }

  const handleClose = () => {
    setStep("list")
    setShareUrl(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="size-4" />
            {isSelectedMode ? "Share Selected Projects" : "Share Project List"}
          </DialogTitle>
          <DialogDescription>
            {step === "create"
              ? isSelectedMode
                ? `Share ${selectedProjectIds.length} selected project${selectedProjectIds.length > 1 ? "s" : ""}`
                : "Create a new share link for your project list"
              : "Manage your shared project list links"}
          </DialogDescription>
        </DialogHeader>

        {step === "create" ? (
          <>
            {!shareUrl ? (
              <div className="space-y-3 py-2">
                {isSelectedMode && (
                  <p className="text-xs text-muted-foreground">
                    This link will share {selectedProjectIds.length} selected project{selectedProjectIds.length > 1 ? "s" : ""}.
                  </p>
                )}
                <p className="text-sm font-medium text-muted-foreground">Link expiry</p>
                <div className="grid grid-cols-3 gap-2">
                  {EXPIRY_OPTIONS.map((opt) => {
                    const Icon = opt.icon
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all cursor-pointer ${
                          selectedExpiry === opt.value
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border hover:border-muted-foreground/30"
                        }`}
                        onClick={() => setSelectedExpiry(opt.value)}
                      >
                        <Icon className={`size-4 ${selectedExpiry === opt.value ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="text-xs font-medium">{opt.label}</span>
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-muted-foreground/60">
                  {selectedExpiry === "never"
                    ? "Link works until you revoke it"
                    : selectedExpiry === "1h"
                      ? "Link expires in 1 hour"
                      : "Link expires in 24 hours"}
                </p>
              </div>
            ) : (
              <div className="space-y-3 py-2">
                <div className="flex items-center gap-2">
                  <Input value={shareUrl} readOnly className="text-xs font-mono h-9" />
                  <Button size="sm" variant="outline" onClick={() => handleCopy(shareUrl)} className="shrink-0 h-9">
                    <Copy className="size-3.5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground/60">
                  {isSelectedMode
                    ? `Anyone with this link can view only the ${selectedProjectIds.length} selected project${selectedProjectIds.length > 1 ? "s" : ""}.`
                    : "Anyone with this link can view your project list. They can filter by month, status, and more."}
                </p>
              </div>
            )}

            <DialogFooter>
              {!shareUrl ? (
                <>
                  <Button variant="outline" onClick={() => setStep("list")}>Back</Button>
                  <Button onClick={handleGenerate} disabled={loading}>
                    {loading ? "Generating..." : "Generate Link"}
                  </Button>
                </>
              ) : (
                <div className="flex w-full gap-2">
                  <Button variant="outline" onClick={() => { setStep("list"); setShareUrl(null) }} className="flex-1">
                    <Plus className="size-3.5" /> Create Another
                  </Button>
                  <Button variant="outline" onClick={handleClose} className="flex-1">Close</Button>
                </div>
              )}
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-3 py-2 max-h-60 overflow-y-auto">
              {fetching ? (
                <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
              ) : links.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No share links yet</p>
              ) : (
                links.map((link) => {
                  const active = !link.expiresAt || new Date(link.expiresAt) > new Date()
                  return (
                    <div key={link._id} className="flex items-center gap-2 rounded-lg border p-2.5">
                      <div className={`size-2 rounded-full shrink-0 ${active ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono truncate">{link.url}</p>
                        <p className="text-[10px] text-muted-foreground/60">
                          {link.projectCount > 0
                            ? `${link.projectCount} project${link.projectCount > 1 ? "s" : ""}`
                            : "All projects"}
                          {active ? ` · Expires: ${formatExpiry(link.expiresAt)}` : " · Expired"}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon-xs" onClick={() => handleCopy(link.url)}>
                          <Copy className="size-3" />
                        </Button>
                        {active && (
                          <Button variant="ghost" size="icon-xs" onClick={() => handleRevoke(link)} disabled={loading}>
                            <Trash2 className="size-3 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <DialogFooter>
              <div className="flex w-full gap-2">
                <Button onClick={() => { setStep("create"); setShareUrl(null) }} className="flex-1">
                  <Plus className="size-3.5" /> New Link
                </Button>
                <Button variant="outline" onClick={handleClose} className="flex-1">Close</Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
