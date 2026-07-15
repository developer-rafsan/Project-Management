"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
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
  User,
  Tag,
  DollarSign,
  Calendar,
  Clock,
  Hash,
  ArrowUpDown,
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
  Server,
  Users,
  ChevronDown,
  ChevronUp,
  Search,
  AlertCircle,
} from "lucide-react"
import { updateProject, getUsers } from "@/actions/projectActions"
import ContributorRequestDialog from "@/components/projects/ContributorRequestDialog"

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
    <div className="flex items-center gap-3 py-2">
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

export function ProjectDetailsCard({ project, isOwner, onUpdate }) {
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
        {isOwner && (
          <Button variant="ghost" size="icon-xs" onClick={handleOpen}>
            <Pencil className="size-3" />
          </Button>
        )}
      </div>
      <div className="divide-y divide-border/50">
        <InfoRow icon={Hash} label="Order ID">
          <span className="font-mono text-sm">{project.orderId || "-"}</span>
        </InfoRow>
        <SectionDivider />
        <InfoRow icon={User} label="Owner">
          {project.owner ? (
            <div className="flex items-center gap-2">
              <Avatar size="sm">
                <AvatarImage src={project.owner?.image} />
                <AvatarFallback className="text-[10px]">
                  {(project.owner?.name || "?").charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{project.owner?.name || "Unknown"}</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
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

export function ProjectWebsiteCard({ project, isOwner, passwordDisplay, showPassword, onTogglePassword, additionalPasswords = {}, onUpdate }) {
  const [editIdx, setEditIdx] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const websites = project.websites || []
  const hasWebsite = websites.length > 0

  const visibleSites = websites.map((site, i) => ({
    name: site.name || (i === 0 ? 'Main Website' : `Site #${i + 1}`),
    url: site.url || '',
    username: site.username || '',
    password: additionalPasswords[i] || null,
  }))

  const emptyForm = () => ({ name: '', url: '', username: '', password: '' })

  const handleEdit = (idx) => {
    const s = visibleSites[idx]
    setForm({ name: s.name === 'Main Website' ? '' : s.name, url: s.url || '', username: s.username || '', password: '' })
    setEditIdx(idx)
  }

  const handleAdd = () => {
    setForm(emptyForm())
    setAddOpen(true)
  }

  const handleSave = async () => {
    if (!form) return
    setSaving(true)
    try {
      let updated
      const newPw = form.password || undefined
      if (editIdx !== null) {
        const newSites = websites.map((s, i) => {
          if (i !== editIdx) return { _id: s._id, name: s.name, url: s.url, username: s.username }
          const obj = { _id: s._id, name: form.name, url: form.url, username: form.username }
          if (newPw) obj.password = newPw
          return obj
        })
        updated = await updateProject(project._id, { websites: newSites })
        setEditIdx(null)
      } else {
        const kept = websites.map(s => ({ _id: s._id, name: s.name, url: s.url, username: s.username }))
        const added = { name: form.name, url: form.url, username: form.username, ...(newPw ? { password: newPw } : {}) }
        updated = await updateProject(project._id, { websites: [...kept, added] })
        setAddOpen(false)
      }
      const pwMap = {}
      const pwIdx = editIdx !== null ? editIdx : websites.length
      if (newPw) pwMap[pwIdx] = newPw
      onUpdate?.(updated, pwMap[0] || null, pwMap)
      setForm(null)
      toast.success(editIdx !== null ? "Website updated" : "Website added")
    } catch (err) {
      toast.error(err.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (idx) => {
    setSaving(true)
    try {
      const newSites = websites.filter((_, i) => i !== idx).map(s => ({ _id: s._id, name: s.name, url: s.url, username: s.username }))
      const updated = await updateProject(project._id, { websites: newSites })
      const pwMap = {}
      onUpdate?.(updated, pwMap[0] || null, pwMap)
      setDeleteConfirm(null)
      toast.success("Website removed")
    } catch (err) {
      toast.error(err.message || "Failed to delete")
    } finally {
      setSaving(false)
    }
  }

  const dialogOpen = editIdx !== null || addOpen

  const cardContent = hasWebsite ? (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Websites</h2>
      </div>
      <div className="space-y-3">
        {(showAll ? visibleSites : visibleSites.slice(0, 1)).map((site, idx) => {
          const actualIdx = showAll ? idx : idx
          return (
            <div key={actualIdx} className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Globe className="size-3.5 text-primary" />
                  <span className="text-xs font-semibold truncate">{site.name}</span>
                </div>
                {isOwner && (
                  <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="icon-xs" onClick={() => handleEdit(actualIdx)}>
                      <Pencil className="size-3" />
                    </Button>
                    <Button variant="ghost" size="icon-xs" onClick={() => setDeleteConfirm(actualIdx)}>
                      <X className="size-3" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider w-8 shrink-0">URL</span>
                {site.url ? (
                  <div className="flex items-center gap-1 min-w-0 flex-1">
                    <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate">{site.url}</a>
                    <CopyButton text={site.url} />
                  </div>
                ) : <span className="text-sm text-muted-foreground">-</span>}
              </div>
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider w-8 shrink-0">User</span>
                {site.username ? (
                  <div className="flex items-center gap-1">
                    <span className="text-sm">{site.username}</span>
                    <CopyButton text={site.username} />
                  </div>
                ) : <span className="text-sm text-muted-foreground">-</span>}
              </div>
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider w-8 shrink-0">Pass</span>
                {actualIdx === 0 && passwordDisplay ? (
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-mono">
                      {showPassword ? passwordDisplay : "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
                    </span>
                    <Button variant="ghost" size="icon-xs" onClick={onTogglePassword}>
                      {showPassword ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                    </Button>
                    <CopyButton text={passwordDisplay} />
                  </div>
                ) : actualIdx > 0 && site.password ? (
                  <AdditionalPasswordItem password={site.password} />
                ) : <span className="text-sm text-muted-foreground">-</span>}
              </div>
            </div>
          )
        })}
        {visibleSites.length > 1 && (
          <Button variant="ghost" size="sm" onClick={() => setShowAll(!showAll)} className="w-full gap-1 h-8 text-xs text-muted-foreground hover:text-foreground">
            {showAll ? <>Show less <ChevronUp className="size-3.5" /></> : <>Show more ({visibleSites.length - 1} more) <ChevronDown className="size-3.5" /></>}
          </Button>
        )}
        {isOwner && (
          <Button variant="outline" size="sm" onClick={handleAdd} className="w-full gap-1 h-8 text-xs">
            <Plus className="size-3.5" /> Add Website
          </Button>
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
          <p className="text-xs text-muted-foreground">No websites added yet</p>
        </div>
        {isOwner && (
          <Button variant="default" size="sm" onClick={handleAdd} className="gap-1.5 h-8 text-xs shrink-0 shadow-sm">
            <Plus className="size-3.5" /> Add Website
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <>
      {cardContent}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setEditIdx(null); setAddOpen(false); setForm(null) } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editIdx !== null ? "Edit Website" : "Add Website"}</DialogTitle>
            <DialogDescription>{editIdx !== null ? "Update website credentials" : "Add website credentials"}</DialogDescription>
          </DialogHeader>
          {form && (
            <div className="space-y-4 py-2">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Name</label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Main Website" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">URL</label>
                  <div className="relative">
                    <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                    <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://example.com" className="h-9 pl-8 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Username</label>
                    <div className="relative">
                      <User className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                      <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Username" className="h-9 pl-8 text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                      <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" className="h-9 pl-8 text-sm" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditIdx(null); setAddOpen(false); setForm(null) }} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Website</DialogTitle>
            <DialogDescription>Are you sure you want to delete this website? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={saving}>Cancel</Button>
            <Button variant="destructive" onClick={() => { handleDelete(deleteConfirm); setDeleteConfirm(null) }} disabled={saving}>{saving ? "Deleting..." : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  )
}

function AdditionalPasswordItem({ password }) {
  const [show, setShow] = useState(false)
  if (!password) return null
  return (
    <div className="flex items-center gap-1 min-w-0">
      <Lock className="size-3 shrink-0 text-muted-foreground" />
      <span className="text-xs font-mono truncate max-w-20 sm:max-w-none">
        {show ? password : "\u2022\u2022\u2022\u2022\u2022\u2022"}
      </span>
      <button onClick={() => setShow(!show)} className="text-muted-foreground/50 hover:text-muted-foreground cursor-pointer shrink-0">
        {show ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
      </button>
      <CopyButton text={password} />
    </div>
  )
}

export function ProjectLinksCard({ project, isOwner, onUpdate }) {
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
        {isOwner && (
          <Button variant="ghost" size="icon-xs" onClick={handleOpen}>
            <Pencil className="size-3" />
          </Button>
        )}
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

export function ProjectMetaCard({ project, isOwner, onUpdate }) {
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
        {isOwner && (
          <Button variant="ghost" size="icon-xs" onClick={handleOpen}>
            <Pencil className="size-3" />
          </Button>
        )}
      </div>
      <div className="divide-y divide-border/50">
        <InfoRow icon={User} label="Created by">
          <div className="flex items-center gap-1.5">
            {project.createdBy && (
              <>
                <Avatar size="sm">
                  <AvatarImage src={project.createdBy.image} />
                  <AvatarFallback className="text-[10px]">{(project.createdBy.name || "?").charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium truncate">{project.createdBy.name || "Unknown"}</span>
              </>
            )}
            {!project.createdBy && <span className="text-sm text-muted-foreground">-</span>}
          </div>
        </InfoRow>
        <SectionDivider />
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
        <InfoRow icon={Calendar} label="Project Date">
          <span className="text-sm">{project.currentProjectDate ? formatDateShort(project.currentProjectDate) : "-"}</span>
        </InfoRow>
        <SectionDivider />
        <InfoRow icon={Clock} label="Created">
          <span className="text-sm">{formatDateShort(project.createdAt)}</span>
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

export function ProjectDomainCard({ project, isOwner, domainHostingPasswords = {}, onUpdate }) {
  const [editIdx, setEditIdx] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showPw, setShowPw] = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [showAll, setShowAll] = useState(false)

  const domains = project.domainHosting || []

  const emptyForm = () => ({
    provider: '', domainUrl: '', email: '', password: '',
    hostingProvider: '', hostingEmail: '', hostingPassword: '', sameAccount: false,
  })

  const handleEdit = (idx) => {
    const d = domains[idx]
    setForm({
      provider: d.provider || '',
      domainUrl: d.domainUrl || '',
      email: d.email || '',
      password: '',
      hostingProvider: d.hostingProvider || '',
      hostingEmail: d.hostingEmail || '',
      hostingPassword: '',
      sameAccount: d.sameAccount || false,
    })
    setEditIdx(idx)
  }

  const handleAdd = () => {
    setForm(emptyForm())
    setAddOpen(true)
  }

  const handleSave = async () => {
    if (!form) return
    setSaving(true)
    try {
      let updated
      if (editIdx !== null) {
        const newDomains = domains.map((d, i) => i === editIdx ? {
          provider: form.provider,
          domainUrl: form.domainUrl,
          email: form.email,
          password: form.password || undefined,
          hostingProvider: form.hostingProvider,
          hostingEmail: form.hostingEmail,
          hostingPassword: form.hostingPassword || undefined,
          sameAccount: form.sameAccount,
        } : d)
        updated = await updateProject(project._id, { domainHosting: newDomains })
        setEditIdx(null)
      } else {
        const newDomains = [...domains, {
          provider: form.provider,
          domainUrl: form.domainUrl,
          email: form.email,
          password: form.password || undefined,
          hostingProvider: form.hostingProvider,
          hostingEmail: form.hostingEmail,
          hostingPassword: form.hostingPassword || undefined,
          sameAccount: form.sameAccount,
        }]
        updated = await updateProject(project._id, { domainHosting: newDomains })
        setAddOpen(false)
      }
      onUpdate?.(updated)
      setForm(null)
      toast.success(editIdx !== null ? "Domain updated" : "Domain added")
    } catch (err) {
      toast.error(err.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (idx) => {
    setSaving(true)
    try {
      const newDomains = domains.filter((_, i) => i !== idx)
      const updated = await updateProject(project._id, { domainHosting: newDomains })
      onUpdate?.(updated)
      setDeleteConfirm(null)
      toast.success("Domain removed")
    } catch (err) {
      toast.error(err.message || "Failed to delete")
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field, value) => {
    const n = { ...form, [field]: value }
    if (field === 'sameAccount' && value) {
      n.hostingEmail = n.email
      n.hostingProvider = n.provider
    }
    setForm(n)
  }

  const dialogOpen = editIdx !== null || addOpen

  const hasDomains = domains.length > 0

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Domain & Hosting</h2>
      </div>

      {hasDomains ? (
        <div className="space-y-3">
          {(showAll ? domains : domains.slice(0, 1)).map((d, idx) => {
            const actualIdx = showAll ? idx : idx
            const pwEntry = domainHostingPasswords[actualIdx] || {}
            const showDPw = showPw[`d-${actualIdx}`]
            const showHPw = showPw[`h-${actualIdx}`]
            return (
              <div key={actualIdx} className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Server className="size-3.5 text-primary" />
                    <span className="text-xs font-semibold truncate">{d.provider || 'Domain'}</span>
                  </div>
                  {isOwner && (
                    <div className="flex items-center gap-0.5">
                      <Button variant="ghost" size="icon-xs" onClick={() => handleEdit(actualIdx)}>
                        <Pencil className="size-3" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => setDeleteConfirm(actualIdx)}>
                        <X className="size-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <InfoRow icon={Globe} label="Domain">
                  {d.domainUrl ? (
                    <div className="flex items-center gap-1 min-w-0">
                      <a href={d.domainUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate">{d.domainUrl}</a>
                      <CopyButton text={d.domainUrl} />
                    </div>
                  ) : <span className="text-sm text-muted-foreground">-</span>}
                </InfoRow>
                <InfoRow icon={User} label="Email">
                  <span className="text-sm">{d.email || '-'}</span>
                </InfoRow>
                <InfoRow icon={Lock} label="Password">
                  {pwEntry.password ? (
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-mono">{showDPw ? pwEntry.password : '\u2022\u2022\u2022\u2022\u2022\u2022'}</span>
                      <button onClick={() => setShowPw(p => ({ ...p, [`d-${actualIdx}`]: !showDPw }))} className="text-muted-foreground/50 hover:text-muted-foreground cursor-pointer">
                        {showDPw ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                      </button>
                      <CopyButton text={pwEntry.password} />
                    </div>
                  ) : <span className="text-sm text-muted-foreground">-</span>}
                </InfoRow>
                {!d.sameAccount && (
                  <>
                    <InfoRow icon={Server} label="Hosting">
                      <span className="text-sm">{d.hostingProvider || '-'}</span>
                    </InfoRow>
                    <InfoRow icon={User} label="H. Email">
                      <span className="text-sm">{d.hostingEmail || '-'}</span>
                    </InfoRow>
                    <InfoRow icon={Lock} label="H. Pass">
                      {pwEntry.hostingPassword ? (
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-mono">{showHPw ? pwEntry.hostingPassword : '\u2022\u2022\u2022\u2022\u2022\u2022'}</span>
                          <button onClick={() => setShowPw(p => ({ ...p, [`h-${actualIdx}`]: !showHPw }))} className="text-muted-foreground/50 hover:text-muted-foreground cursor-pointer">
                            {showHPw ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                          </button>
                          <CopyButton text={pwEntry.hostingPassword} />
                        </div>
                      ) : <span className="text-sm text-muted-foreground">-</span>}
                    </InfoRow>
                  </>
                )}
                {d.sameAccount && (
                  <span className="text-[11px] text-muted-foreground italic">Same account as domain</span>
                )}
              </div>
            )
          })}
          {domains.length > 1 && (
            <Button variant="ghost" size="sm" onClick={() => setShowAll(!showAll)} className="w-full gap-1 h-8 text-xs text-muted-foreground hover:text-foreground">
              {showAll ? <>Show less <ChevronUp className="size-3.5" /></> : <>Show more ({domains.length - 1} more) <ChevronDown className="size-3.5" /></>}
            </Button>
          )}
          {isOwner && (
            <Button variant="outline" size="sm" onClick={handleAdd} className="w-full gap-1 h-8 text-xs">
              <Plus className="size-3.5" /> Add Domain
            </Button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Server className="size-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold">Domain & Hosting</h2>
            <p className="text-xs text-muted-foreground">No domains added yet</p>
          </div>
          {isOwner && (
            <Button variant="default" size="sm" onClick={handleAdd} className="gap-1.5 h-8 text-xs shrink-0 shadow-sm">
              <Plus className="size-3.5" /> Add
            </Button>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setEditIdx(null); setAddOpen(false); setForm(null) } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editIdx !== null ? "Edit Domain" : "Add Domain"}</DialogTitle>
            <DialogDescription>{editIdx !== null ? "Update domain and hosting details" : "Add domain and hosting details"}</DialogDescription>
          </DialogHeader>
          {form && (
            <div className="py-2 space-y-5">
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3.5 py-2.5">
                <div className="flex items-center gap-2.5">
                  <Server className="size-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm font-medium">Same account for hosting</span>
                    <p className="text-xs text-muted-foreground">Use the same credentials</p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.sameAccount}
                  onClick={() => updateField('sameAccount', !form.sameAccount)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    form.sameAccount ? "bg-primary" : "bg-input"
                  }`}
                >
                  <span
                    className={`pointer-events-none block size-4 rounded-full bg-background shadow-sm ring-0 transition-transform duration-200 ${
                      form.sameAccount ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="size-1.5 rounded-full bg-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Domain Details</span>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Provider</label>
                    <Select value={form.provider} onValueChange={(v) => updateField('provider', v)}>
                      <SelectTrigger className="h-9 text-sm bg-background w-full">
                        <Server className="size-3.5 text-muted-foreground shrink-0" />
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {["Namecheap", "GoDaddy", "Cloudflare", "Hostinger", "Bluehost", "SiteGround", "Name.com", "Google Domains", "Other"].map((p) => (
                          <SelectItem key={p} value={p} className="text-sm">{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Domain URL</label>
                    <div className="relative">
                      <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                      <Input value={form.domainUrl} onChange={(v) => updateField('domainUrl', v.target.value)} placeholder="e.g. example.com" className="h-9 pl-8 text-sm" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Email</label>
                    <div className="relative">
                      <User className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                      <Input value={form.email} onChange={(v) => updateField('email', v.target.value)} placeholder="Login email" className="h-9 pl-8 text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                      <Input value={form.password} onChange={(v) => updateField('password', v.target.value)} placeholder="Enter password" className="h-9 pl-8 text-sm" />
                    </div>
                  </div>
                </div>
              </div>

              {!form.sameAccount && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="size-1.5 rounded-full bg-primary" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hosting Details</span>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Provider</label>
                      <Select value={form.hostingProvider} onValueChange={(v) => updateField('hostingProvider', v)}>
                        <SelectTrigger className="h-9 text-sm bg-background w-full">
                          <Server className="size-3.5 text-muted-foreground shrink-0" />
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {["Hostinger", "Bluehost", "SiteGround", "Cloudways", "WP Engine", "DigitalOcean", "AWS", "Namecheap", "Other"].map((p) => (
                            <SelectItem key={p} value={p} className="text-sm">{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Email</label>
                      <div className="relative">
                        <User className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                        <Input value={form.hostingEmail} onChange={(v) => updateField('hostingEmail', v.target.value)} placeholder="Hosting email" className="h-9 pl-8 text-sm" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                      <Input value={form.hostingPassword} onChange={(v) => updateField('hostingPassword', v.target.value)} placeholder="Enter hosting password" className="h-9 pl-8 text-sm" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setEditIdx(null); setAddOpen(false); setForm(null) }} disabled={saving} className="h-9">Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form} className="h-9 px-5">{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Domain</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{deleteConfirm !== null ? domains[deleteConfirm]?.provider || 'this domain' : ''}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={saving}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleDelete(deleteConfirm)} disabled={saving}>{saving ? "Deleting..." : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function ProjectContributorsCard({ project, isOwner, sessionUserId, onUpdate }) {
  const [editOpen, setEditOpen] = useState(false)
  const [contributors, setContributors] = useState([])
  const [saving, setSaving] = useState(false)
  const [allUsers, setAllUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchFocused, setSearchFocused] = useState(false)
  const searchRef = useRef(null)
  const [pendingRequests, setPendingRequests] = useState([])
  const [loadingRequests, setLoadingRequests] = useState(false)

  const assignees = project.assignee || []

  const fetchPendingRequests = async () => {
    setLoadingRequests(true)
    try {
      const res = await fetch(`/api/notifications?sent=true&project=${project._id}&type=assignee_add_request`)
      if (res.ok) {
        const data = await res.json()
        setPendingRequests(data.filter((n) => n.status === "pending"))
      }
    } catch {
    } finally {
      setLoadingRequests(false)
    }
  }

  useEffect(() => {
    fetchPendingRequests()
  }, [project._id])

  const handleOpen = async () => {
    const ownerId = project.owner?._id?.toString() || project.owner?.toString()
    const ownerPct = Math.max(0, 100 - assignees.reduce((s, a) => s + (a.percentage || 0), 0))
    const ownerInAssignees = assignees.some(a => (a.user?._id || a.user)?.toString() === ownerId)
    setContributors([
      ...(ownerInAssignees ? [] : [{
        userId: ownerId,
        name: project.owner?.name || 'Owner',
        image: project.owner?.image || '',
        percentage: ownerPct,
        _isOwner: true,
      }]),
      ...assignees
        .filter(a => (a.user?._id || a.user)?.toString() !== ownerId)
        .map((a) => ({
          userId: a.user?._id || a.user || '',
          name: a.user?.name || '',
          image: a.user?.image || '',
          percentage: a.percentage || 0,
        })),
    ])
    setSearchQuery("")
    try {
      const users = await getUsers()
      setAllUsers(users)
    } catch {}
    setEditOpen(true)
    setTimeout(() => searchRef.current?.focus(), 100)
  }

  const handleAddToList = (user) => {
    const exists = contributors.some(c => c.userId === user._id)
    const hasPending = pendingRequests.some(r => r.to?._id === user._id)
    if (exists || hasPending) return
    setContributors(prev => [...prev, {
      userId: user._id,
      name: user.name,
      image: user.image || '',
      percentage: 0,
      _isNew: true,
    }])
    setSearchQuery("")
    setSearchFocused(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const nonOwner = contributors.filter(c => !c._isOwner)
      const totalPct = contributors.reduce((s, c) => s + (Number(c.percentage) || 0), 0)
      if (totalPct !== 100) {
        toast.error("Total share must be exactly 100%")
        setSaving(false)
        return
      }

      const existingUserIds = new Set(assignees.map(a => (a.user?._id || a.user)?.toString()))
      const newContributors = nonOwner.filter(c => !existingUserIds.has(c.userId))
      const existingContributors = nonOwner.filter(c => existingUserIds.has(c.userId))
      const removed = assignees.filter(a => {
        const uid = (a.user?._id || a.user)?.toString()
        return !contributors.some(c => c.userId === uid)
      })
      const origMap = new Map(assignees.map(a => [(a.user?._id || a.user)?.toString(), a.percentage || 0]))
      const changed = existingContributors.filter(c => {
        const origPct = origMap.get(c.userId)
        return origPct !== undefined && (Number(c.percentage) || 0) !== origPct
      })

      const kept = existingContributors.map(c => ({
        user: c.userId,
        percentage: Number(c.percentage) || 0,
      }))
      const updated = await updateProject(project._id, { assignee: kept })

      for (const c of newContributors) {
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: c.userId,
            project: project._id,
            type: "assignee_add_request",
            percentage: Number(c.percentage) || 0,
          }),
        })
      }

      for (const r of removed) {
        const uid = (r.user?._id || r.user)?.toString()
        if (uid) {
          await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: uid,
              project: project._id,
              type: "assignee_remove_request",
            }),
          })
        }
      }

      for (const c of changed) {
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: c.userId,
            project: project._id,
            type: "assignee_update_request",
            percentage: Number(c.percentage) || 0,
          }),
        })
      }

      onUpdate?.(updated)
      fetchPendingRequests()
      setEditOpen(false)

      const parts = []
      if (newContributors.length > 0) parts.push(`${newContributors.length} invited`)
      if (removed.length > 0) parts.push(`${removed.length} removed`)
      if (changed.length > 0) parts.push(`${changed.length} updated`)
      if (parts.length > 0) {
        toast.success(parts.join(', '))
      } else {
        toast.info("No changes made")
      }
    } catch (err) {
      toast.error(err.message || "Failed to save changes")
    } finally {
      setSaving(false)
    }
  }

  const ownerId = project.owner?._id?.toString() || project.owner?.toString()
  const ownerInAssignees = assignees.some(a => (a.user?._id || a.user)?.toString() === ownerId)
  const ownerImplicitPct = Math.max(0, 100 - assignees.reduce((s, a) => s + (a.percentage || 0), 0))
  const allContributors = ownerInAssignees
    ? assignees
    : [{ user: { _id: ownerId, name: project.owner?.name, image: project.owner?.image }, percentage: ownerImplicitPct, _isOwner: true }, ...assignees]
  const hasContributors = allContributors.length > 0

  const totalPct = contributors.reduce((s, c) => s + (Number(c.percentage) || 0), 0)
  const userIsOwner = isOwner !== undefined ? isOwner : (project.owner?._id === sessionUserId || project.owner?.toString() === sessionUserId)

  const filteredUsers = allUsers.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contributors</h2>
        {userIsOwner && (
          <Button variant="ghost" size="icon-xs" onClick={handleOpen}>
            <Pencil className="size-3" />
          </Button>
        )}
      </div>
      {hasContributors ? (
        <div className="divide-y divide-border/50">
          {allContributors.map((a, idx) => {
            const uid = a.user?._id?.toString() || a.user?.toString()
            const name = a.user?.name || "Unknown"
            const image = a.user?.image
            const isOwnerEntry = uid === ownerId
            return (
              <div key={uid || idx}>
                {idx > 0 && <SectionDivider />}
                <InfoRow icon={isOwnerEntry ? User : Users} label={isOwnerEntry ? "Owner" : "Contributor"}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Avatar size="sm">
                        <AvatarImage src={image} />
                        <AvatarFallback className="text-[10px]">{name.charAt(0) || "?"}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm truncate">{name}</span>
                    </div>
                    <span className="text-xs font-semibold tabular-nums text-muted-foreground shrink-0 ml-2">{a.percentage}%</span>
                  </div>
                </InfoRow>
              </div>
            )
          })}
          {pendingRequests.length > 0 && (
            <>
              <SectionDivider />
              {pendingRequests.map((req) => (
                <InfoRow key={req._id} icon={Users} label="Pending">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Avatar size="sm">
                        <AvatarImage src={req.to?.image} />
                        <AvatarFallback className="text-[10px]">{req.to?.name?.charAt(0) || "?"}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm truncate">{req.to?.name || "Unknown"}</span>
                    </div>
                    <Badge variant="secondary" className="rounded-full text-[10px] font-medium shrink-0 ml-2">
                      Pending
                    </Badge>
                  </div>
                </InfoRow>
              ))}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Users className="size-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold">Contributors</h2>
              <p className="text-xs text-muted-foreground">No contributors yet</p>
            </div>
            {userIsOwner && (
              <Button variant="default" size="sm" onClick={handleOpen} className="gap-1.5 h-8 text-xs shrink-0 shadow-sm">
                <Plus className="size-3.5" /> Add
              </Button>
            )}
          </div>
          {project.owner && (
            <div className="rounded-lg bg-primary/5 border border-primary/10 px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="size-3.5 text-primary" />
                  <span className="text-sm font-medium">{project.owner?.name || "You"}</span>
                </div>
                <span className="text-sm font-bold text-primary">{ownerImplicitPct}%</span>
              </div>
            </div>
          )}
          {pendingRequests.length > 0 && (
            <div className="space-y-1.5">
              {pendingRequests.map((req) => (
                <div key={req._id} className="flex items-center justify-between rounded-lg bg-amber-50/60 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-800/30 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Avatar size="sm">
                      <AvatarImage src={req.to?.image} />
                      <AvatarFallback className="text-[10px]">{req.to?.name?.charAt(0) || "?"}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm truncate">{req.to?.name || "Unknown"}</span>
                  </div>
                  <Badge variant="secondary" className="rounded-full text-[10px] font-medium shrink-0 ml-2">
                    Pending
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Contributors</DialogTitle>
            <DialogDescription>Search users to invite, manage shares and remove contributors</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                ref={searchRef}
                placeholder="Search users to invite..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                className="pl-8 h-9 text-sm"
              />
              {searchFocused && searchQuery && filteredUsers.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-lg border bg-popover shadow-md overflow-hidden">
                  <Command className="rounded-lg">
                    <CommandList>
                      <CommandGroup>
                        {filteredUsers.map((u) => {
                          const isOwner = u._id === ownerId
                          const inList = contributors.some(c => c.userId === u._id)
                          const isExistingAssignee = assignees.some(a => (a.user?._id || a.user)?.toString() === u._id)
                          const hasPending = pendingRequests.some(r => r.to?._id === u._id)
                          const disabled = isOwner || inList || hasPending
                          let label = ''
                          if (isOwner) label = 'Owner'
                          else if (isExistingAssignee) label = 'Added'
                          else if (inList) label = 'In List'
                          else if (hasPending) label = 'Pending'
                          return (
                            <CommandItem
                              key={u._id}
                              value={u._id}
                              disabled={disabled}
                              className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer ${disabled ? "opacity-40 pointer-events-none" : ""}`}
                            >
                              <Avatar className="size-7 shrink-0">
                                <AvatarImage src={u.image} />
                                <AvatarFallback className="text-[10px]">{u.name?.charAt(0) || "?"}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{u.name}</p>
                              </div>
                              {label && <span className="text-xs text-muted-foreground shrink-0">{label}</span>}
                              {!disabled && (
                                <Button type="button" size="icon-xs" variant="ghost" className="shrink-0 size-6" onMouseDown={(e) => {
                                  e.preventDefault()
                                  handleAddToList(u)
                                }}>
                                  <Plus className="size-3.5" />
                                </Button>
                              )}
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>
              )}
              {searchFocused && searchQuery && filteredUsers.length === 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-lg border bg-popover shadow-md">
                  <div className="px-3 py-6 text-center text-sm text-muted-foreground">No users found</div>
                </div>
              )}
            </div>

            <div className="space-y-1.5 max-h-[260px] overflow-y-auto">
              {contributors.map((c, i) => (
                <div key={c.userId || i} className={`flex items-center gap-2 rounded-lg border p-2.5 ${c._isNew ? 'border-dashed border-primary/40 bg-primary/[0.03]' : 'bg-muted/30'}`}>
                  <Avatar size="sm">
                    <AvatarImage src={c.image} />
                    <AvatarFallback className="text-[10px]">{c.name?.charAt(0) || "?"}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium flex-1 min-w-0 truncate">{c.name || "Unknown"}</span>
                  {c._isNew && <Badge variant="outline" className="rounded-full text-[9px] h-5 px-1.5 text-primary border-primary/40">Invite</Badge>}
                  <div className="flex items-center gap-1 shrink-0">
                    <Input type="number" min={0} max={100} value={c.percentage} onChange={(v) => { const n = [...contributors]; n[i] = { ...n[i], percentage: v.target.value }; setContributors(n) }} className="h-8 w-16 text-xs text-center" />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                  {!c._isOwner && (
                    <Button variant="ghost" size="icon-xs" onClick={() => setContributors(contributors.filter((_, j) => j !== i))}>
                      <X className="size-3" />
                    </Button>
                  )}
                </div>
              ))}
              {pendingRequests.length > 0 && (
                <>
                  <div className="border-t border-border/40 pt-2 mt-2" />
                  <span className="text-xs font-medium text-muted-foreground px-1">Pending Invitations</span>
                  {pendingRequests.map((req) => (
                    <div key={req._id} className="flex items-center gap-2 rounded-lg border bg-amber-50/60 dark:bg-amber-900/10 border-amber-200/60 dark:border-amber-800/30 p-2.5">
                      <Avatar size="sm">
                        <AvatarImage src={req.to?.image} />
                        <AvatarFallback className="text-[10px]">{req.to?.name?.charAt(0) || "?"}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium flex-1 min-w-0 truncate">{req.to?.name || "Unknown"}</span>
                      <Badge variant="secondary" className="rounded-full text-[10px] font-medium shrink-0">Pending</Badge>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-medium text-muted-foreground">Total</span>
              <span className={`text-xs font-semibold tabular-nums ${totalPct !== 100 ? "text-destructive" : "text-emerald-500"}`}>
                {totalPct}% / 100%
              </span>
            </div>
            {totalPct !== 100 && (
              <div className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="size-3.5" />
                {totalPct > 100 ? "Total exceeds 100%" : "Total must be exactly 100%"}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || totalPct !== 100}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </>
  )
}
