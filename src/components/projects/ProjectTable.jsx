"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, Copy, Check } from "lucide-react"

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

const columns = [
  { key: "orderId", label: "Order ID", sortable: true },
  { key: "projectName", label: "Project Name", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "priority", label: "Priority", sortable: true },
  { key: "cms", label: "CMS", sortable: true },
  { key: "price", label: "Price", sortable: true },
  { key: "startDate", label: "Start Date", sortable: true },
  { key: "website", label: "", sortable: false },
]

function SortIcon({ columnKey, sortBy, sortOrder }) {
  if (sortBy !== columnKey) {
    return <ArrowUpDown className="size-3 ml-1 opacity-30" />
  }
  return sortOrder === "asc" ? (
    <ArrowUp className="size-3 ml-1" />
  ) : (
    <ArrowDown className="size-3 ml-1" />
  )
}

export default function ProjectTable({ projects = [], onSort, sortBy, sortOrder }) {
  const router = useRouter()
  const [copied, setCopied] = useState(null)
  const [passwords, setPasswords] = useState({})
  const [loadingPasswords, setLoadingPasswords] = useState({})

  const handleSort = (key) => {
    if (!onSort) return
    if (sortBy === key) {
      onSort(key, sortOrder === "asc" ? "desc" : "asc")
    } else {
      onSort(key, "asc")
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead
              key={col.key}
              className={col.sortable ? "cursor-pointer select-none" : ""}
              onClick={() => col.sortable && handleSort(col.key)}
            >
              <span className="inline-flex items-center">
                {col.label}
                {col.sortable && <SortIcon columnKey={col.key} sortBy={sortBy} sortOrder={sortOrder} />}
              </span>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-8">
              Project not available
            </TableCell>
          </TableRow>
        ) : (
          projects.map((project) => (
            <TableRow
              key={project._id}
              className="cursor-pointer"
              onClick={() => router.push(`/dashboard/projects/${project._id}`)}
            >
              <TableCell className="font-mono text-xs">
                {project.orderId || "-"}
              </TableCell>
              <TableCell className="font-medium">{project.projectName}</TableCell>
              <TableCell>
                {project.status && (
                  <Badge variant={statusVariants[project.status] || "secondary"}>
                    {project.status}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {project.priority && (
                  <Badge variant={priorityVariants[project.priority] || "default"}>
                    {project.priority}
                  </Badge>
                )}
              </TableCell>
              <TableCell>{project.cms || "-"}</TableCell>
              <TableCell className="font-medium">
                {Number(project.price) ? `$${Number(project.price).toFixed(2)}` : "-"}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {formatDate(project.startDate)}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                {project.websiteUrl ? (
                  <Dialog onOpenChange={(open) => {
                    if (open && !passwords[project._id] && !loadingPasswords[project._id]) {
                      setLoadingPasswords((prev) => ({ ...prev, [project._id]: true }))
                      fetch(`/api/projects/${project._id}/password`)
                        .then((res) => res.json())
                        .then((data) => setPasswords((prev) => ({ ...prev, [project._id]: typeof data.password === "string" ? data.password : "" })))
                        .catch(() => setPasswords((prev) => ({ ...prev, [project._id]: "" })))
                        .finally(() => setLoadingPasswords((prev) => ({ ...prev, [project._id]: false })))
                    }
                  }}>
                    <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
                      <ExternalLink className="size-4" />
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
                          {loadingPasswords[project._id] ? (
                            <div className="h-5 w-24 animate-pulse rounded bg-muted" />
                          ) : passwords[project._id] ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono truncate flex-1">{passwords[project._id]}</span>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(passwords[project._id])
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
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
