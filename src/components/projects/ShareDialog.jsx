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
import { Copy, Check, Link, Clock, Infinity, CalendarDays, Trash2, Plus, Eye, Settings, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { DatePicker } from "@/components/ui/date-picker"

const EXPIRY_OPTIONS = [
  { value: "1h", label: "1 Hour", icon: Clock },
  { value: "24h", label: "24 Hours", icon: Clock },
  { value: "never", label: "Until Revoked", icon: Infinity },
  { value: "custom", label: "Custom", icon: CalendarDays },
]

const ACCESS_OPTIONS = [
  { value: "view", label: "View", desc: "Can only view project details", icon: Eye },
  { value: "manager", label: "Manager", desc: "Can edit project settings", icon: Settings },
  { value: "full", label: "Full Access", desc: "Can edit, delete, and manage", icon: ShieldCheck },
]

const ACCESS_LABELS = { view: "View", manager: "Manager", full: "Full Access" }

function formatExpiry(dateStr) {
  if (!dateStr) return "Never"
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

export default function ShareDialog({ open, onOpenChange, projectId, projectName }) {
  const [step, setStep] = useState("list")
  const [selectedExpiry, setSelectedExpiry] = useState("24h")
  const [customDate, setCustomDate] = useState(null)
  const [accessLevel, setAccessLevel] = useState("view")
  const [loading, setLoading] = useState(false)
  const [shareUrl, setShareUrl] = useState(null)
  const [copied, setCopied] = useState(false)
  const [links, setLinks] = useState([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!open || !projectId) return
    setStep("list")
    setShareUrl(null)
    setCopied(false)
    setSelectedExpiry("24h")
    setCustomDate(null)
    setAccessLevel("view")
    setFetching(true)

    fetch(`/api/projects/${projectId}/shares`)
      .then((r) => r.json())
      .then((data) => setLinks(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [open, projectId])

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const body = {
        expiresIn: selectedExpiry,
        accessLevel,
      }
      if (selectedExpiry === "custom" && customDate) {
        body.customDate = customDate.toISOString()
      }
      const res = await fetch(`/api/projects/${projectId}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create share link")
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      setShareUrl(data.url || `${baseUrl}/shared/${data.token}`)
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
      const res = await fetch(`/api/projects/${projectId}/shares/${link._id}`, {
        method: "DELETE",
      })
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
    setCopied(false)
    setSelectedExpiry("24h")
    setCustomDate(null)
    setAccessLevel("view")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="size-4" />
            Share Project
          </DialogTitle>
          <DialogDescription>
            {step === "create"
              ? `Create a new share link for &ldquo;${projectName}&rdquo;`
              : `Manage share links for &ldquo;${projectName}&rdquo;`
            }
          </DialogDescription>
        </DialogHeader>

        {step === "create" ? (
          <>
            {!shareUrl ? (
              <div className="space-y-4 py-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Link expiry</p>
                  <div className="grid grid-cols-4 gap-2">
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
                  {selectedExpiry === "custom" && (
                    <div className="mt-3">
                      <DatePicker
                        value={customDate}
                        onChange={(date) => setCustomDate(date)}
                        placeholder="Pick an expiry date"
                        fromDate={new Date()}
                      />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground/60 mt-2">
                    {selectedExpiry === "never"
                      ? "Link works until you revoke it"
                      : selectedExpiry === "1h"
                        ? "Link expires in 1 hour"
                        : selectedExpiry === "24h"
                          ? "Link expires in 24 hours"
                          : customDate
                            ? `Link expires on ${customDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                            : "Select a custom expiry date"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Access level</p>
                  <div className="space-y-2">
                    {ACCESS_OPTIONS.map((opt) => {
                      const Icon = opt.icon
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          className={`flex items-start gap-3 w-full rounded-xl border p-3 transition-all cursor-pointer text-left ${
                            accessLevel === opt.value
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:border-muted-foreground/30"
                          }`}
                          onClick={() => setAccessLevel(opt.value)}
                        >
                          <Icon className={`size-4 mt-0.5 shrink-0 ${accessLevel === opt.value ? "text-primary" : "text-muted-foreground"}`} />
                          <div>
                            <p className={`text-sm font-medium ${accessLevel === opt.value ? "text-primary" : ""}`}>{opt.label}</p>
                            <p className="text-xs text-muted-foreground/60">{opt.desc}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 py-2">
                <div className="flex items-center gap-2">
                  <Input value={shareUrl} readOnly className="text-xs font-mono h-9" />
                  <Button size="sm" variant="outline" onClick={() => handleCopy(shareUrl)} className="shrink-0 h-9">
                    {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground/60">
                  Anyone with this link has <strong>{ACCESS_LABELS[accessLevel]}</strong> access to this project.
                </p>
              </div>
            )}

            <DialogFooter>
              {!shareUrl ? (
                <>
                  <Button variant="outline" onClick={() => setStep("list")}>Back</Button>
                  <Button onClick={handleGenerate} disabled={loading || (selectedExpiry === "custom" && !customDate)}>
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
                  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "")
                  const url = link.url || `${baseUrl}/shared/${link.token}`
                  const level = link.accessLevel || "view"
                  return (
                    <div key={link._id} className="flex items-center gap-2 rounded-lg border p-2.5">
                      <div className={`size-2 rounded-full shrink-0 ${active ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono truncate">{url}</p>
                        <p className="text-[10px] text-muted-foreground/60">
                          {ACCESS_LABELS[level]} access
                          {active ? ` · Expires: ${formatExpiry(link.expiresAt)}` : " · Expired"}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon-xs" onClick={() => handleCopy(url)}>
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
