"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
} from "lucide-react"

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

export function ProjectDetailsCard({ project, onProgressClick }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Details</h2>
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
            <Button variant="ghost" size="icon-xs" onClick={onProgressClick} title="Edit progress">
              <Pencil className="size-3" />
            </Button>
          </div>
        </InfoRow>
      </div>
    </div>
  )
}

export function ProjectWebsiteCard({ project, passwordDisplay, showPassword, onTogglePassword, additionalPasswords = {} }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Website</h2>
      <div className="divide-y divide-border/50">
        <InfoRow icon={Globe} label="URL">
          {project.websiteUrl ? (
            <div className="flex items-center gap-1 min-w-0">
              <a
                href={project.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline truncate"
              >
                {project.websiteUrl}
              </a>
              <CopyButton text={project.websiteUrl} />
              <a
                href={project.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "ghost", size: "icon-xs" }))}
              >
                <ExternalLink className="size-3" />
              </a>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          )}
        </InfoRow>
        <SectionDivider />
        <InfoRow icon={User} label="Username">
          {project.websiteUsername ? (
            <div className="flex items-center gap-1">
              <span className="text-sm">{project.websiteUsername}</span>
              <CopyButton text={project.websiteUsername} />
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          )}
        </InfoRow>
        <SectionDivider />
        <InfoRow icon={Lock} label="Password">
          {passwordDisplay ? (
            <div className="flex items-center gap-1">
              <span className="text-sm font-mono">
                {showPassword ? passwordDisplay : "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
              </span>
              <Button variant="ghost" size="icon-xs" onClick={onTogglePassword}>
                {showPassword ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
              </Button>
              {typeof passwordDisplay === "string" && <CopyButton text={passwordDisplay} />}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          )}
        </InfoRow>
        {project.additionalWebsites?.length > 0 && (
          <>
            <SectionDivider />
            <InfoRow icon={Plus} label="Extra Sites">
              <div className="space-y-2 w-full">
                {project.additionalWebsites.map((site, i) => (
                  <div key={i} className="rounded-lg border bg-muted/30 p-2 sm:p-2.5 space-y-1.5">
                    <div className="flex items-center gap-1 min-w-0">
                      <Globe className="size-3 shrink-0 text-muted-foreground" />
                      {site.url ? (
                        <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate flex-1 min-w-0">{site.url}</a>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                      {site.url && <CopyButton text={site.url} />}
                      {site.url && (
                        <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground/50 hover:text-muted-foreground shrink-0">
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                      {site.username && (
                        <div className="flex items-center gap-1 min-w-0">
                          <User className="size-3 shrink-0 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground truncate">{site.username}</span>
                          <CopyButton text={site.username} />
                        </div>
                      )}
                      <AdditionalPasswordItem password={additionalPasswords[i]} />
                    </div>
                  </div>
                ))}
              </div>
            </InfoRow>
          </>
        )}
      </div>
    </div>
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

export function ProjectLinksCard({ project }) {
  const hasFigma = project.figmaLinks?.length > 0
  const hasRef = project.referenceLinks?.length > 0
  if (!hasFigma && !hasRef) return null

  return (
    <div className="rounded-xl border bg-card p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Links</h2>
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
    </div>
  )
}

export function ProjectMetaCard({ project }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Meta</h2>
      <div className="divide-y divide-border/50">
        <InfoRow icon={DollarSign} label="Price">
          <span className="text-sm font-medium">
            {Number(project.price) ? `$${Number(project.price).toFixed(2)}` : "-"}
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
