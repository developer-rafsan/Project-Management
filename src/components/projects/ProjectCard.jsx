"use client"

import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Star,
  StarOff,
  MoreHorizontal,
  Copy,
  Archive,
  Trash2,
} from "lucide-react"

const statusVariants = {
  "Pending": "secondary",
  "In Progress": "default",
  "Waiting Client": "outline",
  "Delivered": "secondary",
  "On Hold": "destructive",
  "Cancelled": "destructive",
}

const priorityVariants = {
  "Low": "secondary",
  "Medium": "default",
  "High": "outline",
  "Urgent": "destructive",
}

export default function ProjectCard({ project, onAction }) {
  const handleAction = (action) => {
    onAction?.(action, project)
  }

  return (
    <Card className="group relative">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="truncate">
              <Link href={`/dashboard/projects/${project._id}`} className="hover:underline">
                {project.projectName}
              </Link>
            </CardTitle>
            <CardDescription>
              {project.orderId ? `#${project.orderId}` : "No Order ID"}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleAction("favorite")}>
                {project.favorite ? <StarOff className="size-4" /> : <Star className="size-4" />}
                {project.favorite ? "Unfavorite" : "Favorite"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAction("duplicate")}>
                <Copy className="size-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAction("archive")}>
                <Archive className="size-4" />
                {project.archived ? "Unarchive" : "Archive"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => handleAction("delete")}>
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          {project.status && (
            <Badge variant={statusVariants[project.status] || "secondary"}>
              {project.status}
            </Badge>
          )}
          {project.priority && (
            <Badge variant={priorityVariants[project.priority] || "default"}>
              {project.priority}
            </Badge>
          )}
          {project.cms && (
            <Badge variant="outline">{project.cms}</Badge>
          )}
        </div>
        <div className="flex items-center justify-between mb-2">
          {project.businessName && (
            <p className="text-xs text-muted-foreground truncate">{project.businessName}</p>
          )}
          {project.price ? (
            <p className="text-sm font-bold text-emerald-500">${project.price.toFixed(2)}</p>
          ) : null}
        </div>
        {project.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.tags.map((tag) => (
              <Badge key={tag} variant="ghost" className="text-[10px] px-1.5 py-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
