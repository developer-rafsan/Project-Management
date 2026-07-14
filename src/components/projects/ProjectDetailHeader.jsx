"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChevronRight,
  Copy as DuplicateIcon,
  Trash2,
  CalendarArrowUp,
  ArrowLeftRight,
  UserRoundCog,
  Link as LinkIcon,
  Circle,
} from "lucide-react"

const statusVariants = {
  Pending: "secondary",
  "In Progress": "default",
  Delivered: "secondary",
  "On Hold": "destructive",
  Cancelled: "destructive",
  Revision: "secondary",
}

const priorityVariants = {
  Low: "secondary",
  Medium: "default",
  High: "outline",
  Urgent: "destructive",
}

export function ProjectBreadcrumbs({ projectName }) {
  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
      <ChevronRight className="size-3.5" />
      <Link href="/dashboard/projects" className="hover:text-foreground transition-colors">Projects</Link>
      <ChevronRight className="size-3.5" />
      <span className="text-foreground font-medium truncate">{projectName}</span>
    </nav>
  )
}

export function ProjectTitle({ project }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        <h1 className="text-2xl font-bold tracking-tight">{project.projectName}</h1>
        <div className="flex items-center gap-1.5">
          <Badge variant={statusVariants[project.status] || "secondary"} className="rounded-full">
            <Circle className="size-2 fill-current mr-1" />
            {project.status}
          </Badge>
          <Badge variant={priorityVariants[project.priority] || "default"} className="rounded-full">
            {project.priority}
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {project.orderId && <span className="font-mono text-xs">#{project.orderId}</span>}
        {project.cms && (
          <>
            <span className="text-muted-foreground/50">&middot;</span>
            <span>{project.cms}</span>
          </>
        )}
        {Number(project.price) > 0 && (
          <>
            <span className="text-muted-foreground/50">&middot;</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              ${Number(project.price).toFixed(2)}
            </span>
          </>
        )}
      </div>
    </div>
  )
}

export function ProjectActions({
  project,
  isOwner,
  actionLoading,
  onStatusClick,
  onDuplicate,
  onTransfer,
  onTransferOwnership,
  onDelete,
  onShare,
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <Button variant="outline" size="sm" onClick={onStatusClick}>
        <ArrowLeftRight className="size-3.5" />
        Status
      </Button>
      {isOwner && (
        <Button variant="outline" size="sm" onClick={onShare}>
          <LinkIcon className="size-3.5" />
          Share
        </Button>
      )}
      {isOwner && (
        <Button variant="outline" size="sm" onClick={onDuplicate} disabled={actionLoading}>
          <DuplicateIcon className="size-3.5" />
          Duplicate
        </Button>
      )}
      <Button variant="outline" size="sm" onClick={onTransfer}>
        <CalendarArrowUp className="size-3.5" />
        Transfer
      </Button>
      {isOwner && (
        <Button variant="outline" size="sm" onClick={onTransferOwnership}>
          <UserRoundCog className="size-3.5" />
          Owner transfer
        </Button>
      )}
      {isOwner && (
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="size-3.5" />
          Delete
        </Button>
      )}
    </div>
  )
}
