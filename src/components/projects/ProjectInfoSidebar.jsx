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
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  const allSites = project.additionalWebsites?.length > 0 ? project.additionalWebsites : [];
  const fallbackUrl = project.websiteUrl || '';
  const fallbackUsername = project.websiteUsername || '';
  const hasWebsite = allSites.length > 0 || fallbackUrl || fallbackUsername || passwordDisplay;

  const getVisibleSites = () => {
    if (allSites.length > 0) {
      return allSites.map((site, i) => ({
        name: site.name || (i === 0 ? 'Main Website' : `Site #${i + 1}`),
        url: site.url || '',
        username: site.username || '',
        password: additionalPasswords[i] || null,
      }));
    }
    if (fallbackUrl || fallbackUsername || passwordDisplay) {
      return [{
        name: 'Main Website',
        url: fallbackUrl,
        username: fallbackUsername,
        password: passwordDisplay || null,
      }];
    }
    return [];
  };

  const visibleSites = getVisibleSites();

  const handleOpen = () => {
    const sites = allSites.length > 0
      ? allSites.map((s) => ({ name: s.name || '', url: s.url || '', username: s.username || '', password: s.password || '' }))
      : [{ name: 'Main Website', url: fallbackUrl, username: fallbackUsername, password: passwordDisplay || '' }];
    setForm({ sites })
    setEditOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const filteredSites = form.sites.filter((s) => s.url || s.name)
      const payload = {
        additionalWebsites: filteredSites.map((s) => ({ name: s.name, url: s.url, username: s.username, password: s.password || undefined })),
      }
      const updated = await updateProject(project._id, payload)
      const pwMap = {}
      filteredSites.forEach((s, i) => { if (s.password) pwMap[i] = s.password })
      onUpdate?.(updated, filteredSites[0]?.password || null, pwMap)
      setEditOpen(false)
      toast.success("Website updated")
    } catch (err) {
      toast.error(err.message || "Failed to update")
    } finally {
      setSaving(false)
    }
  }

  const cardContent = hasWebsite ? (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Websites</h2>
        <Button variant="ghost" size="icon-xs" onClick={handleOpen}>
          <Pencil className="size-3" />
        </Button>
      </div>
      <div className="divide-y divide-border/50">
        {visibleSites.map((site, idx) => (
          <div key={idx}>
            {idx > 0 && <SectionDivider />}
            <div className="py-1">
              <div className="flex items-center gap-1.5 mb-2">
                <Globe className="size-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground truncate">{site.name}</span>
              </div>
              <div className="space-y-1.5 ml-5">
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider w-10 shrink-0">URL</span>
                  {site.url ? (
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                      <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate">{site.url}</a>
                      <CopyButton text={site.url} />
                      <a href={site.url} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "ghost", size: "icon-xs" }))}>
                        <ExternalLink className="size-3" />
                      </a>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </div>
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider w-10 shrink-0">User</span>
                  {site.username ? (
                    <div className="flex items-center gap-1">
                      <span className="text-sm">{site.username}</span>
                      <CopyButton text={site.username} />
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </div>
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider w-10 shrink-0">Pass</span>
                  {idx === 0 && passwordDisplay ? (
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-mono">
                        {showPassword ? passwordDisplay : "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
                      </span>
                      <Button variant="ghost" size="icon-xs" onClick={onTogglePassword}>
                        {showPassword ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                      </Button>
                      {typeof passwordDisplay === "string" && <CopyButton text={passwordDisplay} />}
                    </div>
                  ) : idx > 0 && site.password ? (
                    <AdditionalPasswordItem password={site.password} />
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
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
        <Button variant="default" size="sm" onClick={handleOpen} className="gap-1.5 h-8 text-xs shrink-0 shadow-sm">
          <Plus className="size-3.5" /> Add Website
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {cardContent}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{hasWebsite ? "Edit Websites" : "Add Websites"}</DialogTitle>
            <DialogDescription>Manage all website credentials</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-3">
              {form.sites?.map((site, i) => (
                <div key={i} className="rounded-lg border bg-muted/30 p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-muted-foreground">Site #{i + 1}</span>
                      {i === 0 && <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Primary</span>}
                    </div>
                    <Button variant="ghost" size="icon-xs" onClick={() => setForm({ ...form, sites: form.sites.filter((_, j) => j !== i) })}>
                      <X className="size-3" />
                    </Button>
                  </div>
                  <Input value={site.name} onChange={(e) => { const n = [...form.sites]; n[i] = { ...n[i], name: e.target.value }; setForm({ ...form, sites: n }) }} placeholder="Site name" className="h-8 text-xs" />
                  <Input value={site.url} onChange={(e) => { const n = [...form.sites]; n[i] = { ...n[i], url: e.target.value }; setForm({ ...form, sites: n }) }} placeholder="URL" className="h-8 text-xs" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={site.username} onChange={(e) => { const n = [...form.sites]; n[i] = { ...n[i], username: e.target.value }; setForm({ ...form, sites: n }) }} placeholder="Username" className="h-8 text-xs" />
                    <Input value={site.password} onChange={(e) => { const n = [...form.sites]; n[i] = { ...n[i], password: e.target.value }; setForm({ ...form, sites: n }) }} placeholder="Password" className="h-8 text-xs" />
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setForm({ ...form, sites: [...(form.sites || []), { name: '', url: '', username: '', password: '' }] })} className="w-full gap-1 h-8 text-xs cursor-pointer">
                <Plus className="size-3" /> Add Site
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
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
