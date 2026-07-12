"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Globe,
  Lock,
  Mail,
  User,
  Tag,
  DollarSign,
  Calendar,
  Clock,
  Hash,
  ArrowUpDown,
  Check,
  ListChecks,
  Layout,
  ExternalLink,
  Eye,
  EyeOff,
  Copy,
  Palette,
  Link,
  Plus,
  Pencil,
  X,
  Percent,
  Building2,
  Server,
  Trash2,
  ChevronUp,
} from "lucide-react"
import { updateProject } from "@/actions/projectActions"

const CMS_OPTIONS = ["WordPress", "WooCommerce", "Shopify", "Wix", "Webflow", "Next.js", "React", "Laravel", "PHP", "Custom", "HTML", "Other"]

const CMS_CATEGORIES = [
  { label: "CMS Platforms", items: ["WordPress", "Wix", "Webflow"] },
  { label: "E-commerce", items: ["WooCommerce", "Shopify"] },
  { label: "Frameworks", items: ["Next.js", "React", "Laravel", "PHP"] },
  { label: "Other", items: ["Custom", "HTML", "Other"] },
]

const priorityVariants = {
  Low: "secondary",
  Medium: "default",
  High: "outline",
  Urgent: "destructive",
}

const statusVariants = {
  Pending: "secondary",
  "In Progress": "default",
  Delivered: "secondary",
  "On Hold": "destructive",
  Cancelled: "destructive",
  Revision: "secondary",
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function formatDateShort(dateStr) {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function CopyButton({ text, label = "Copy" }) {
  const handleCopy = async () => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Copied to clipboard")
    } catch {
      toast.error("Failed to copy")
    }
  }

  return (
    <Button variant="ghost" size="icon-xs" onClick={handleCopy} title={label}>
      <Copy className="size-3" />
    </Button>
  )
}

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="flex items-center gap-2 min-w-[120px] shrink-0">
        <Icon className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

function SectionDivider() {
  return <div className="h-px bg-border/50" />
}

export function ProjectDetailsCard({ project, onUpdate }) {
  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  const handleOpen = () => {
    setForm({
      orderId: project.orderId || "",
      cms: CMS_OPTIONS.includes(project.cms) ? project.cms : (project.cms ? "Other" : ""),
      customCms: project.cms && !CMS_OPTIONS.includes(project.cms) ? project.cms : "",
      priority: project.priority || "",
      status: project.status || "",
      progress: project.progress ?? 0,
    })
    setEditOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await updateProject(project._id, {
        orderId: form.orderId,
        cms: form.cms === "Other" && form.customCms ? form.customCms : form.cms,
        priority: form.priority,
        status: form.status,
        progress: Number(form.progress) || 0,
      })
      onUpdate?.(updated)
      setEditOpen(false)
      toast.success("Details updated")
    } catch (err) {
      toast.error(err.message || "Failed to update")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Details</h2>
        <Button variant="ghost" size="icon-xs" onClick={handleOpen}>
          <Pencil className="size-3" />
        </Button>
      </div>
      <div className="divide-y divide-border/50">
        <InfoRow icon={Hash} label="Order ID">
          <span className="font-mono text-sm">{project.orderId || "-"}</span>
        </InfoRow>
        <SectionDivider />
        <InfoRow icon={User} label="Assignee">
          {project.assignee ? (
            <div className="flex items-center gap-2">
              <Avatar size="sm">
                <AvatarImage src={project.assignee.image} />
                <AvatarFallback className="text-[10px]">
                  {project.assignee.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{project.assignee.name}</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Unassigned</span>
          )}
        </InfoRow>
        <SectionDivider />
        <InfoRow icon={Layout} label="CMS">
          <span className="text-sm">{project.cms || "-"}</span>
        </InfoRow>
        <SectionDivider />
        <InfoRow icon={ArrowUpDown} label="Priority">
          <Badge variant={priorityVariants[project.priority] || "default"} className="rounded-full text-xs">
            {project.priority || "-"}
          </Badge>
        </InfoRow>
        <SectionDivider />
        <InfoRow icon={ListChecks} label="Status">
          <Badge variant={statusVariants[project.status] || "secondary"} className="rounded-full text-xs">
            {project.status || "-"}
          </Badge>
        </InfoRow>
        <SectionDivider />
        <InfoRow icon={ListChecks} label="Progress">
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${project.progress ?? 0}%` }} />
            </div>
            <span className="text-sm font-semibold tabular-nums whitespace-nowrap">{project.progress ?? 0}%</span>
          </div>
        </InfoRow>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg">Edit Details</DialogTitle>
            <DialogDescription>Update project information</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Order ID</label>
              <Input value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })} className="h-9 text-sm bg-background" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">CMS</label>
              <Select value={form.cms} onValueChange={(v) => setForm({ ...form, cms: v })}>
                <SelectTrigger className="h-9 text-sm bg-background w-full">
                  <SelectValue placeholder="Select CMS platform" />
                </SelectTrigger>
                <SelectContent className="max-h-[320px]">
                  {CMS_CATEGORIES.map((cat) => (
                    <div key={cat.label}>
                      <div className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pointer-events-none">
                        {cat.label}
                      </div>
                      {cat.items.map((item) => (
                        <SelectItem key={item} value={item} className="pl-6 text-sm">{item}</SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
              {form.cms === "Other" && (
                <div className="mt-2 p-3 rounded-lg bg-amber-50/60 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-800/30">
                  <label className="text-xs font-medium text-muted-foreground mb-1.5">Custom CMS Name</label>
                  <Input value={form.customCms} onChange={(e) => setForm({ ...form, customCms: e.target.value })} placeholder="e.g., Drupal, Joomla" className="h-9 text-sm bg-background" />
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Priority</label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger className="h-9 text-sm bg-background w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {["Low", "Medium", "High", "Urgent"].map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="h-9 text-sm bg-background w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {["Pending", "In Progress", "Delivered", "Revision", "On Hold", "Cancelled"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Progress</label>
                <span className="text-sm font-semibold tabular-nums text-emerald-500">{Math.min(Number(form.progress) || 0, 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={form.progress}
                onChange={(e) => setForm({ ...form, progress: e.target.value })}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted accent-emerald-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>
          </div>
          <DialogFooter className="pt-4 gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving} className="h-9">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="h-9 px-5">{saving ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function ProjectWebsiteCard({ project, passwordDisplay, showPassword, onTogglePassword, additionalPasswords = {}, onUpdate }) {
  const [editOpen, setEditOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)
  const [form, setForm] = useState({ url: '', username: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const extraSites = project.additionalWebsites || []

  const allSites = []
  if (project.websiteUrl || project.websiteUsername || passwordDisplay) {
    allSites.push({
      url: project.websiteUrl || '',
      username: project.websiteUsername || '',
      password: passwordDisplay || '',
      showPw: showPassword,
      onTogglePw: onTogglePassword,
    })
  }
  extraSites.forEach((site, i) => {
    allSites.push({
      url: site.url || '',
      username: site.username || '',
      password: additionalPasswords[i] || '',
    })
  })

  const hasWebsite = allSites.length > 0

  const handleAdd = () => {
    setEditingIndex(null)
    setForm({ url: '', username: '', password: '' })
    setEditOpen(true)
    setShowAll(false)
  }

  const handleEdit = (idx) => {
    const site = allSites[idx]
    setEditingIndex(idx)
    setForm({
      url: site.url || '',
      username: site.username || '',
      password: site.password || '',
    })
    setEditOpen(true)
  }

  const handleDelete = async (idx) => {
    setConfirmDelete(idx)
    try {
      if (idx === 0) {
        const payload = { websiteUrl: '', websiteUsername: '', websitePassword: '' }
        const updated = await updateProject(project._id, payload)
        onUpdate?.(updated, '', {})
      } else {
        const updatedExtra = extraSites.filter((_, i) => i !== idx - 1)
        const newPwMap = {}
        extraSites.forEach((s, i) => {
          if (i !== idx - 1) {
            const newIdx = i < idx - 1 ? i : i - 1
            if (additionalPasswords[i]) newPwMap[newIdx] = additionalPasswords[i]
          }
        })
        const updated = await updateProject(project._id, { additionalWebsites: updatedExtra })
        onUpdate?.(updated, passwordDisplay, newPwMap)
      }
      toast.success("Deleted")
    } catch {
      toast.error("Failed to delete")
    } finally {
      setConfirmDelete(null)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      let updated
      if (editingIndex === null) {
        if (!project.websiteUrl && !project.websiteUsername && !passwordDisplay) {
          const payload = { websiteUrl: form.url, websiteUsername: form.username }
          if (form.password) payload.websitePassword = form.password
          updated = await updateProject(project._id, payload)
          onUpdate?.(updated, form.password || '', {})
        } else {
          const updatedExtra = [...extraSites, { url: form.url, username: form.username, password: form.password || '' }]
          updated = await updateProject(project._id, { additionalWebsites: updatedExtra })
          const pwMap = {}
          if (form.password) pwMap[extraSites.length] = form.password
          onUpdate?.(updated, passwordDisplay, { ...additionalPasswords, ...pwMap })
        }
      } else if (editingIndex === 0) {
        const payload = { websiteUrl: form.url, websiteUsername: form.username }
        if (form.password) payload.websitePassword = form.password
        updated = await updateProject(project._id, payload)
        onUpdate?.(updated, form.password || '', additionalPasswords)
      } else {
        const updatedExtra = [...extraSites]
        updatedExtra[editingIndex - 1] = { url: form.url, username: form.username, password: form.password || '' }
        updated = await updateProject(project._id, { additionalWebsites: updatedExtra })
        const pwMap = { ...additionalPasswords }
        if (form.password) pwMap[editingIndex - 1] = form.password
        onUpdate?.(updated, passwordDisplay, pwMap)
      }
      setEditOpen(false)
      toast.success(editingIndex === null ? "Website added" : "Website updated")
    } catch (err) {
      toast.error(err.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const cardContent = hasWebsite ? (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe className="size-4 text-muted-foreground" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Websites</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={handleAdd} className="size-7">
          <Plus className="size-3.5" />
        </Button>
      </div>
      <div className="space-y-3">
        {(showAll ? allSites : allSites.slice(0, 1)).map((site, i) => (
          <div key={i} className="group rounded-xl border border-border/60 bg-card overflow-hidden transition-shadow hover:shadow-sm">
            <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-muted/20 border-b border-border/40">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="size-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Globe className="size-3.5 text-primary" />
                </div>
                {site.url ? (
                  <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary hover:underline truncate">{site.url}</a>
                ) : (
                  <span className="text-xs text-muted-foreground italic">No URL</span>
                )}
              </div>
              <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon-xs" onClick={() => handleEdit(i)}>
                  <Pencil className="size-3" />
                </Button>
                <Button variant="ghost" size="icon-xs" onClick={() => setConfirmDelete(i)}>
                  <Trash2 className="size-3" />
                </Button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground text-xs font-medium w-[68px] shrink-0">Username</span>
                {site.username ? (
                  <><span className="truncate">{site.username}</span><CopyButton text={site.username} /></>
                ) : (
                  <span className="text-muted-foreground/50 text-xs italic">Not set</span>
                )}
              </div>
              {site.password && (
                <div className="flex items-center gap-2 text-sm">
                  <Lock className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground text-xs font-medium w-[68px] shrink-0">Password</span>
                  {'showPw' in site ? (
                    <>
                      <span className="font-mono truncate text-[13px]">{site.showPw ? site.password : "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}</span>
                      <button onClick={site.onTogglePw} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                        {site.showPw ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                      <CopyButton text={site.password} />
                    </>
                  ) : (
                    <SitePassword password={site.password} />
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {allSites.length > 1 && (
          <button onClick={() => setShowAll(!showAll)} className="w-full text-xs text-muted-foreground hover:text-foreground py-2 transition-colors flex items-center justify-center gap-1.5 hover:bg-muted/30 rounded-lg border border-dashed border-border/60">
            {!showAll ? (
              <><span className="size-1 rounded-full bg-muted-foreground/40" />
                <span className="size-1 rounded-full bg-muted-foreground/40" />
                <span className="size-1 rounded-full bg-muted-foreground/40" />
                <span className="ml-1.5 font-medium">{allSites.length - 1} more</span></>
            ) : (
              <><ChevronUp className="size-3.5" />
                <span className="font-medium">Show less</span></>
            )}
          </button>
        )}
      </div>
    </div>
  ) : (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Globe className="size-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold">Websites</h2>
          <p className="text-xs text-muted-foreground">No website added yet</p>
        </div>
        <Button variant="default" size="sm" onClick={handleAdd} className="gap-1.5 h-8 text-xs shrink-0 shadow-sm">
          <Plus className="size-3.5" /> Add Website
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {cardContent}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingIndex === null ? "Add Website" : "Edit Website"}</DialogTitle>
            <DialogDescription>{editingIndex === null ? "Add a new website" : "Update website details"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">URL</label>
              <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="h-9 text-sm bg-background" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Username</label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="h-9 text-sm bg-background" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Password</label>
              <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Current password" className="h-9 text-sm bg-background" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete !== null} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Website?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleDelete(confirmDelete)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function SitePassword({ password }) {
  const [show, setShow] = useState(false)
  if (!password) return null
  return (
    <>
      <span className="font-mono truncate text-[13px]">{show ? password : "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}</span>
      <button onClick={() => setShow(!show)} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
        {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      </button>
      {typeof password === "string" && <CopyButton text={password} />}
    </>
  )
}

export function ProjectLinksCard({ project, onUpdate }) {
  const hasFigma = project.figmaLinks?.length > 0
  const hasRef = project.referenceLinks?.length > 0

  const [editOpen, setEditOpen] = useState(false)
  const [figmaInputs, setFigmaInputs] = useState([])
  const [refInputs, setRefInputs] = useState([])
  const [saving, setSaving] = useState(false)

  const handleOpen = () => {
    setFigmaInputs(project.figmaLinks?.map((l) => l.url || "") || [])
    setRefInputs(project.referenceLinks?.map((l) => l.url || "") || [])
    setEditOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await updateProject(project._id, {
        figmaLinks: figmaInputs.filter(Boolean).map((url) => ({ url })),
        referenceLinks: refInputs.filter(Boolean).map((url) => ({ url })),
      })
      onUpdate?.(updated)
      setEditOpen(false)
      toast.success("Links updated")
    } catch (err) {
      toast.error(err.message || "Failed to update")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Links</h2>
        <Button variant="ghost" size="icon-xs" onClick={handleOpen}>
          <Pencil className="size-3" />
        </Button>
      </div>
      {(hasFigma || hasRef) ? (
        <div className="divide-y divide-border/50">
          {hasFigma && (
            <InfoRow icon={Palette} label="Figma">
              <div className="space-y-1 w-full">
                {project.figmaLinks.map((link, i) => (
                  link.url ? (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1 truncate">
                      <Palette className="size-3 shrink-0" />
                      <span className="truncate">{link.url}</span>
                      <ExternalLink className="size-3 shrink-0" />
                    </a>
                  ) : null
                ))}
              </div>
            </InfoRow>
          )}
          {hasFigma && hasRef && <SectionDivider />}
          {hasRef && (
            <InfoRow icon={Link} label="Reference">
              <div className="space-y-1 w-full">
                {project.referenceLinks.map((link, i) => (
                  link.url ? (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1 truncate">
                      <ExternalLink className="size-3 shrink-0" />
                      <span className="truncate">{link.url}</span>
                    </a>
                  ) : null
                ))}
              </div>
            </InfoRow>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No links added yet</p>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Links</DialogTitle>
            <DialogDescription>Update Figma &amp; reference links</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-80 overflow-y-auto">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Figma Links</label>
                <Button variant="ghost" size="icon-xs" onClick={() => setFigmaInputs([...figmaInputs, ""])}>
                  <Plus className="size-3" />
                </Button>
              </div>
              {figmaInputs.length === 0 && (
                <Button variant="outline" size="sm" className="w-full" onClick={() => setFigmaInputs([""])}>
                  <Plus className="size-3 mr-2" /> Add Figma Link
                </Button>
              )}
              {figmaInputs.map((url, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={url} onChange={(e) => { const n = [...figmaInputs]; n[i] = e.target.value; setFigmaInputs(n) }} placeholder="Figma URL" />
                  <Button variant="ghost" size="icon-xs" onClick={() => setFigmaInputs(figmaInputs.filter((_, j) => j !== i))}>
                    <X className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Reference Links</label>
                <Button variant="ghost" size="icon-xs" onClick={() => setRefInputs([...refInputs, ""])}>
                  <Plus className="size-3" />
                </Button>
              </div>
              {refInputs.length === 0 && (
                <Button variant="outline" size="sm" className="w-full" onClick={() => setRefInputs([""])}>
                  <Plus className="size-3 mr-2" /> Add Reference Link
                </Button>
              )}
              {refInputs.map((url, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={url} onChange={(e) => { const n = [...refInputs]; n[i] = e.target.value; setRefInputs(n) }} placeholder="Reference URL" />
                  <Button variant="ghost" size="icon-xs" onClick={() => setRefInputs(refInputs.filter((_, j) => j !== i))}>
                    <X className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function ProjectMetaCard({ project, onUpdate }) {
  const [editOpen, setEditOpen] = useState(false)
  const [price, setPrice] = useState("")
  const [fiverrFeeEnabled, setFiverrFeeEnabled] = useState(true)
  const [globalFiverrFee, setGlobalFiverrFee] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("fiverrFeeEnabled")
    setGlobalFiverrFee(saved !== "false")
  }, [])

  const handleOpen = () => {
    setPrice(String(project.price || ""))
    setFiverrFeeEnabled(project.fiverrFeeEnabled !== false)
    setEditOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await updateProject(project._id, {
        price: Number(price) || 0,
        fiverrFeeEnabled: globalFiverrFee ? fiverrFeeEnabled : false,
      })
      onUpdate?.(updated)
      setEditOpen(false)
      toast.success("Price updated")
    } catch (err) {
      toast.error(err.message || "Failed to update")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Meta</h2>
        <Button variant="ghost" size="icon-xs" onClick={handleOpen}>
          <Pencil className="size-3" />
        </Button>
      </div>
      <div className="divide-y divide-border/50">
        <InfoRow icon={DollarSign} label="Price">
          <span className="text-sm font-medium">
            {Number(project.price) ? `$${Number(project.price).toFixed(2)}` : "-"}
          </span>
        </InfoRow>
        <SectionDivider />
        <InfoRow icon={Percent} label="Fiverr Fee">
          <span className={`text-sm font-medium ${project.fiverrFeeEnabled !== false ? "text-orange-500" : "text-muted-foreground"}`}>
            {project.fiverrFeeEnabled !== false ? "20%" : "Off"}
          </span>
        </InfoRow>
        <SectionDivider />
        <InfoRow icon={Calendar} label="Month/Year">
          <span className="text-sm">
            {project.currentMonth ? monthNames[project.currentMonth - 1] : "-"} / {project.currentYear || "-"}
          </span>
        </InfoRow>
        <SectionDivider />
        <InfoRow icon={Calendar} label="Start Date">
          <span className="text-sm">{formatDateShort(project.startDate || project.createdAt)}</span>
        </InfoRow>
        <SectionDivider />
        <InfoRow icon={Clock} label="Created">
          <span className="text-sm">{formatDateShort(project.createdAt)}</span>
        </InfoRow>
        <SectionDivider />
        <InfoRow icon={Clock} label="Updated">
          <span className="text-sm">{formatDateShort(project.updatedAt)}</span>
        </InfoRow>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Price</DialogTitle>
            <DialogDescription>Update project price</DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Price ($)</label>
              <Input type="text" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            {globalFiverrFee && (
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-medium">Fiverr Fee (20%)</span>
                  <p className="text-[10px] text-muted-foreground/60">Apply to this project</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={fiverrFeeEnabled}
                  onClick={() => setFiverrFeeEnabled(!fiverrFeeEnabled)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    fiverrFeeEnabled ? "bg-primary" : "bg-input"
                  }`}
                >
                  <span
                    className={`pointer-events-none block size-4 rounded-full bg-background shadow-sm ring-0 transition-transform duration-200 ${
                      fiverrFeeEnabled ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const PROVIDER_OPTIONS = [
  "Namecheap", "GoDaddy", "Google Domains", "Cloudflare",
  "Hostinger", "SiteGround", "Bluehost", "DreamHost",
  "Name.com", "IONOS", "OVHcloud", "Gandi.net",
]

const HOSTING_OPTIONS = [
  "Hostinger", "SiteGround", "Bluehost", "DreamHost",
  "Cloudways", "WP Engine", "Kinsta", "Flywheel",
  "DigitalOcean", "AWS", "Vercel", "Netlify",
]

function ProviderSelect({ value, options, onChange, placeholder = "Select" }) {
  const isOther = value && !options.includes(value)
  return (
    <div className="space-y-1.5">
      <select
        className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        value={isOther ? "other" : value}
        onChange={(e) => onChange(e.target.value === "other" ? "" : e.target.value)}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
        <option value="other">Other</option>
      </select>
      {isOther && (
        <Input
          placeholder="Type provider name"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1"
        />
      )}
    </div>
  )
}

export function ProjectDomainCard({ project, domainHostingPasswords = {}, onUpdate }) {
  const [entryOpen, setEntryOpen] = useState(false)
  const [editingInfo, setEditingInfo] = useState(null)
  const [entryForm, setEntryForm] = useState({ linked: false, url: "", provider: "", email: "", password: "", hProvider: "", hEmail: "", hPassword: "" })
  const [saving, setSaving] = useState(false)
  const [showPw, setShowPw] = useState({})
  const [showHPw, setShowHPw] = useState({})
  const [removing, setRemoving] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(null)
  const [showEntryPw, setShowEntryPw] = useState(false)
  const [showEntryHPw, setShowEntryHPw] = useState(false)

  const oldDomain = project.domains?.[0] || (project.domainUrl ? { url: project.domainUrl, provider: project.domainProvider } : null)
  const list = project.domainHosting?.length > 0
    ? project.domainHosting
    : oldDomain
      ? [{
          provider: oldDomain.provider || '',
          domainUrl: oldDomain.url || '',
          email: oldDomain.email || '',
          password: '',
          hostingProvider: project.hosting?.[0]?.provider || '',
          hostingEmail: project.hosting?.[0]?.email || '',
          hostingPassword: '',
          sameAccount: !!oldDomain.linked,
        }]
      : []
  const pw = domainHostingPasswords

  const handleRemove = async (idx) => {
    setRemoving(idx)
    try {
      const payload = { domainHosting: list.filter((_, i) => i !== idx) }
      const updated = await updateProject(project._id, payload)
      onUpdate?.(updated)
      toast.success("Deleted")
    } catch {
      toast.error("Failed to delete")
    } finally {
      setRemoving(null)
      setConfirmRemove(null)
    }
  }

  const resetEntryForm = (linked = false) => {
    setEntryForm({ linked, url: "", provider: "", email: "", password: "", hProvider: "", hEmail: "", hPassword: "" })
    setShowEntryPw(false)
    setShowEntryHPw(false)
  }

  const handleAddNew = () => {
    setEditingInfo(null)
    resetEntryForm(false)
    setEntryOpen(true)
  }

  const handleEdit = (idx) => {
    const e = list[idx]
    const p = pw[idx] || {}
    setEditingInfo({ idx })
    setEntryForm({
      linked: e.sameAccount,
      url: e.domainUrl || "",
      provider: e.provider || "",
      email: e.email || "",
      password: p.password || "",
      hProvider: e.hostingProvider || "",
      hEmail: e.hostingEmail || "",
      hPassword: p.hostingPassword || "",
    })
    setShowEntryPw(false)
    setShowEntryHPw(false)
    setEntryOpen(true)
  }

  const handleEntrySave = async () => {
    const f = entryForm
    if (!f.url && !f.provider && !f.email && !f.password && !f.hProvider && !f.hEmail && !f.hPassword) {
      toast.error("Please fill in at least one field")
      return
    }
    setSaving(true)
    try {
      let updatedList = [...list]
      const entry = f.linked
        ? {
            provider: f.provider,
            domainUrl: f.url,
            email: f.email,
            password: f.password,
            hostingProvider: f.provider,
            hostingEmail: f.email,
            hostingPassword: f.password,
            sameAccount: true,
          }
        : {
            provider: f.provider,
            domainUrl: f.url,
            email: f.email,
            password: f.password,
            hostingProvider: f.hProvider,
            hostingEmail: f.hEmail,
            hostingPassword: f.hPassword,
            sameAccount: false,
          }
      if (editingInfo) {
        updatedList[editingInfo.idx] = entry
      } else {
        updatedList.push(entry)
      }
      const updated = await updateProject(project._id, { domainHosting: updatedList })
      onUpdate?.(updated)
      setEntryOpen(false)
      toast.success(editingInfo ? "Entry updated" : "Entry added")
    } catch (err) {
      toast.error(err.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const hasData = list.length > 0

  const EntryCard = ({ e, i, p }) => {
    const confirmKey = i
    const canMerge = e.sameAccount
    return (
      <div className="group rounded-xl border border-border/60 bg-card overflow-hidden transition-shadow hover:shadow-sm">
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-muted/20 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-md bg-primary/10 flex items-center justify-center">
              <Globe className="size-3.5 text-primary" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground/80">Domain & Hosting</span>
          </div>
          <div className="flex items-center gap-0.5">
            {confirmRemove === confirmKey ? (
              <div className="flex items-center gap-1">
                <button onClick={() => handleRemove(i)} disabled={removing === i} className="size-7 rounded-md bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors" title="Confirm">
                  <Check className="size-3.5 text-destructive" />
                </button>
                <button onClick={() => setConfirmRemove(null)} className="size-7 rounded-md bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors" title="Cancel">
                  <X className="size-3.5 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(i)} className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors" title="Edit">
                  <Pencil className="size-3.5" />
                </button>
                <button onClick={() => setConfirmRemove(confirmKey)} className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Delete">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {canMerge ? (
          <div className="p-4 space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="size-5 rounded bg-blue-500/10 flex items-center justify-center">
                  <Globe className="size-3 text-blue-500" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Domain</span>
              </div>
              <div className="ml-7 space-y-1.5">
                <DataRow label="URL" value={e.domainUrl} copy={e.domainUrl} />
              </div>
            </div>
            <div className="border-t border-border/40" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="size-5 rounded bg-emerald-500/10 flex items-center justify-center">
                  <Server className="size-3 text-emerald-500" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Hosting</span>
              </div>
              <div className="ml-7 space-y-1.5">
                <DataRow label="Pro." value={e.provider} />
                <DataRow label="Email" value={e.email} />
                {p.password && <PwRow label="PW" pw={p.password} show={showPw[i]} onToggle={() => setShowPw({ ...showPw, [i]: !showPw[i] })} />}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="size-5 rounded bg-blue-500/10 flex items-center justify-center">
                  <Globe className="size-3 text-blue-500" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Domain</span>
              </div>
              <div className="ml-7 space-y-1.5">
                <DataRow label="URL" value={e.domainUrl} copy={e.domainUrl} />
                <DataRow label="Pro." value={e.provider} />
                <DataRow label="Email" value={e.email} />
                {p.password && <PwRow label="PW" pw={p.password} show={showPw[i]} onToggle={() => setShowPw({ ...showPw, [i]: !showPw[i] })} />}
              </div>
            </div>
            <div className="border-t border-border/40" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="size-5 rounded bg-emerald-500/10 flex items-center justify-center">
                  <Server className="size-3 text-emerald-500" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Hosting</span>
              </div>
              <div className="ml-7 space-y-1.5">
                <DataRow label="Pro." value={e.hostingProvider} />
                <DataRow label="Email" value={e.hostingEmail} />
                {p.hostingPassword && <PwRow label="PW" pw={p.hostingPassword} show={showHPw[i]} onToggle={() => setShowHPw({ ...showHPw, [i]: !showHPw[i] })} />}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-5">
      {hasData && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe className="size-4 text-muted-foreground" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Domain & Hosting</h2>
          </div>
          <Button variant="outline" size="sm" onClick={handleAddNew} className="h-7 text-xs gap-1">
            <Plus className="size-3" /> Add
          </Button>
        </div>
      )}
      {hasData ? (() => {
        const total = list.length
        const collapsed = !showAll && total > 1
        const shownItems = collapsed ? list.slice(0, 1) : list
        return (
          <div className="space-y-3">
            {shownItems.map((e, i) => (
              <EntryCard key={i} e={e} i={i} p={pw[i] || {}} />
            ))}
            {total > 1 && (
              <button onClick={() => setShowAll(!showAll)} className="w-full text-xs text-muted-foreground hover:text-foreground py-2 transition-colors flex items-center justify-center gap-1.5 hover:bg-muted/30 rounded-lg border border-dashed border-border/60">
                {collapsed ? (
                  <><span className="size-1 rounded-full bg-muted-foreground/40" />
                    <span className="size-1 rounded-full bg-muted-foreground/40" />
                    <span className="size-1 rounded-full bg-muted-foreground/40" />
                    <span className="ml-1.5 font-medium">{total - 1} more</span></>
                ) : (
                  <><ChevronUp className="size-3.5" />
                    <span className="font-medium">Show less</span></>
                )}
              </button>
            )}
          </div>
        )
      })() : (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-9 rounded-lg border bg-muted/50 flex items-center justify-center shrink-0">
              <Globe className="size-4.5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">Domain & Hosting</p>
              <p className="text-xs text-muted-foreground truncate">No domain & hosting added yet</p>
            </div>
          </div>
          <Button onClick={handleAddNew} className="shrink-0">
            <Plus className="size-4 mr-1.5" /> Add
          </Button>
        </div>
      )}

      <Dialog open={entryOpen} onOpenChange={(v) => { if (!v) setEntryOpen(false) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="size-7 rounded-md bg-primary/10 flex items-center justify-center">
                {entryForm.linked ? <Globe className="size-4 text-primary" /> : <Globe className="size-4 text-primary" />}
              </div>
              <span>{editingInfo ? "Edit Entry" : "New Entry"}</span>
            </DialogTitle>
            <DialogDescription>Add your domain and hosting account information</DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3.5 py-2.5 mb-1">
            <div className="flex items-center gap-2.5">
              <div className={`size-4 rounded-sm border-2 flex items-center justify-center transition-colors ${entryForm.linked ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}>
                {entryForm.linked && <Check className="size-3 text-primary-foreground" />}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium leading-tight">Same account for both</span>
                <span className="text-[11px] text-muted-foreground">Domain & hosting use identical login</span>
              </div>
            </div>
            <button type="button" role="switch" aria-checked={entryForm.linked}
              onClick={() => setEntryForm({ ...entryForm, linked: !entryForm.linked })}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${entryForm.linked ? "bg-primary" : "bg-input"}`}>
              <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform ring-0 transition duration-200 ${entryForm.linked ? "translate-x-4" : "translate-x-0"}`} />
            </button>
          </div>

          <div className="space-y-3 py-1">
            {entryForm.linked ? (
              <div className="rounded-lg border border-border/60 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="size-5 rounded bg-primary/10 flex items-center justify-center">
                    <Globe className="size-3 text-primary" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Shared Account</span>
                </div>
                <FormField label="Provider">
                  <ProviderSelect value={entryForm.provider} options={PROVIDER_OPTIONS} onChange={(v) => setEntryForm({ ...entryForm, provider: v })} placeholder="Select provider" />
                </FormField>
                <FormField label="Domain URL">
                  <Input placeholder="example.com" value={entryForm.url} onChange={(e) => setEntryForm({ ...entryForm, url: e.target.value })} />
                </FormField>
                <FormField label="User ID / Email">
                  <Input placeholder="user@example.com" value={entryForm.email} onChange={(e) => setEntryForm({ ...entryForm, email: e.target.value })} />
                </FormField>
                <FormField label="Password">
                  <PwInput value={entryForm.password} onChange={(v) => setEntryForm({ ...entryForm, password: v })} show={showEntryPw} onToggle={() => setShowEntryPw(!showEntryPw)} placeholder="Account password" />
                </FormField>
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-blue-200/50 dark:border-blue-900/30 bg-blue-500/[0.02] p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="size-5 rounded bg-blue-500/10 flex items-center justify-center">
                      <Globe className="size-3 text-blue-500" />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Domain</span>
                  </div>
                  <FormField label="Domain URL">
                    <Input placeholder="example.com" value={entryForm.url} onChange={(e) => setEntryForm({ ...entryForm, url: e.target.value })} />
                  </FormField>
                  <FormField label="Provider">
                    <ProviderSelect value={entryForm.provider} options={PROVIDER_OPTIONS} onChange={(v) => setEntryForm({ ...entryForm, provider: v })} placeholder="Select provider" />
                  </FormField>
                  <FormField label="User ID / Email">
                    <Input placeholder="user@example.com" value={entryForm.email} onChange={(e) => setEntryForm({ ...entryForm, email: e.target.value })} />
                  </FormField>
                  <FormField label="Password">
                    <PwInput value={entryForm.password} onChange={(v) => setEntryForm({ ...entryForm, password: v })} show={showEntryPw} onToggle={() => setShowEntryPw(!showEntryPw)} placeholder="Account password" />
                  </FormField>
                </div>
                <div className="rounded-lg border border-emerald-200/50 dark:border-emerald-900/30 bg-emerald-500/[0.02] p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="size-5 rounded bg-emerald-500/10 flex items-center justify-center">
                      <Server className="size-3 text-emerald-500" />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Hosting</span>
                  </div>
                  <FormField label="Provider">
                    <ProviderSelect value={entryForm.hProvider} options={HOSTING_OPTIONS} onChange={(v) => setEntryForm({ ...entryForm, hProvider: v })} placeholder="Select hosting provider" />
                  </FormField>
                  <FormField label="User ID / Email">
                    <Input placeholder="user@example.com" value={entryForm.hEmail} onChange={(e) => setEntryForm({ ...entryForm, hEmail: e.target.value })} />
                  </FormField>
                  <FormField label="Password">
                    <PwInput value={entryForm.hPassword} onChange={(v) => setEntryForm({ ...entryForm, hPassword: v })} show={showEntryHPw} onToggle={() => setShowEntryHPw(!showEntryHPw)} placeholder="Account password" />
                  </FormField>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setEntryOpen(false)} disabled={saving} className="flex-1">Cancel</Button>
            <Button onClick={handleEntrySave} disabled={saving} className="flex-1">{saving ? "Saving..." : editingInfo ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DataRow({ label, value, copy }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-[11px] font-medium text-muted-foreground w-8 shrink-0">{label}</span>
      {value ? (
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <span className="truncate">{value}</span>
          {copy && <CopyButton text={copy} />}
        </div>
      ) : <span className="text-muted-foreground/50 text-xs">-</span>}
    </div>
  )
}

function PwRow({ label, pw, show, onToggle }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-[11px] font-medium text-muted-foreground w-8 shrink-0">{label}</span>
      <span className="font-mono truncate text-[13px]">
        {show ? pw : "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
      </span>
      <button onClick={onToggle} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
        {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      </button>
      {typeof pw === "string" && <CopyButton text={pw} />}
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}

function PwInput({ value, onChange, show, onToggle, placeholder }) {
  return (
    <div className="relative">
      <Input type={show ? "text" : "password"} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="pr-9" />
      <button type="button" onClick={onToggle} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
        {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      </button>
    </div>
  )
}

export function ProjectTagsCard({ tags }) {
  if (!tags?.length) return null

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Tag className="size-4 text-muted-foreground" />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tags</h2>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag, idx) => (
          <Badge key={`${tag}-${idx}`} variant="secondary" className="rounded-full text-xs font-normal">{tag}</Badge>
        ))}
      </div>
    </div>
  )
}
