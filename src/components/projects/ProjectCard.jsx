"use client"

import { useState, memo } from "react"
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
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MoreHorizontal,
  Copy,
  Trash2,
  ExternalLink,
  Check,
} from "lucide-react"

const statusVariants = {
  "Pending": "secondary",
  "In Progress": "default",
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

const ProjectCard = memo(function ProjectCard({ project, onAction }) {
  const [copied, setCopied] = useState(null)
  const [password, setPassword] = useState(null)
  const [loadingPassword, setLoadingPassword] = useState(false)
  const handleAction = (action) => {
    onAction?.(action, project)
  }

  return (
    <Card className="group relative overflow-hidden hover:shadow-md transition-all duration-200">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/40 via-primary to-primary/40 opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="truncate text-sm sm:text-base">
              <Link href={`/dashboard/projects/${project._id}`} className="hover:text-primary transition-colors">
                {project.projectName}
              </Link>
            </CardTitle>
            <CardDescription className="text-xs">
              {project.orderId ? `#${project.orderId}` : "No Order ID"}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="-mr-1.5" />}>
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleAction("duplicate")}>
                <Copy className="size-4" />
                Duplicate
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
      <CardContent className="pt-0">
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          {project.status && (
            <Badge variant={statusVariants[project.status] || "secondary"} className="text-[10px] sm:text-xs px-1.5 sm:px-2">
              {project.status}
            </Badge>
          )}
          {project.priority && (
            <Badge variant={priorityVariants[project.priority] || "default"} className="text-[10px] sm:text-xs px-1.5 sm:px-2">
              {project.priority}
            </Badge>
          )}
          {project.cms && (
            <Badge variant="outline" className="text-[10px] sm:text-xs">{project.cms}</Badge>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div>
            {project.websiteUrl && (
              <Dialog onOpenChange={(open) => {
                if (open && !password && !loadingPassword) {
                  setLoadingPassword(true)
                  fetch(`/api/projects/${project._id}/password`)
                    .then((res) => res.json())
                    .then((data) => setPassword(typeof data.password === "string" ? data.password : ""))
                    .catch(() => setPassword(""))
                    .finally(() => setLoadingPassword(false))
                }
              }}>
                <DialogTrigger render={<Button variant="ghost" size="icon-sm" className="-ml-1.5" />}>
                  <ExternalLink className="size-3.5 text-muted-foreground" />
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Website Details</DialogTitle>
                    <DialogDescription>{project.projectName}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">URL</p>
                      <div className="flex items-center gap-2">
                        <a
                          href={project.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-500 hover:underline truncate flex-1"
                        >
                          {project.websiteUrl}
                        </a>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            navigator.clipboard.writeText(project.websiteUrl)
                            setCopied("url")
                            setTimeout(() => setCopied(null), 1500)
                          }}
                        >
                          {copied === "url" ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
                        </Button>
                      </div>
                    </div>
                    {project.websiteUsername && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Username</p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm truncate flex-1">{project.websiteUsername}</span>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              navigator.clipboard.writeText(project.websiteUsername)
                              setCopied("username")
                              setTimeout(() => setCopied(null), 1500)
                            }}
                          >
                            {copied === "username" ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
                          </Button>
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Password</p>
                      {loadingPassword ? (
                        <div className="h-5 w-24 animate-pulse rounded bg-muted" />
                      ) : password ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono truncate flex-1">{password}</span>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              navigator.clipboard.writeText(password)
                              setCopied("password")
                              setTimeout(() => setCopied(null), 1500)
                            }}
                          >
                            {copied === "password" ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          {project.price ? (
            <p className="text-sm font-bold text-emerald-500">${project.price.toFixed(2)}</p>
          ) : null}
        </div>
        {project.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5 pt-2.5 border-t border-border/50">
            {project.tags.map((tag, idx) => (
              <Badge key={`${tag}-${idx}`} variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
})

export default ProjectCard
