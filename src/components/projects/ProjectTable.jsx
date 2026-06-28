"use client"

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
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

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
  { key: "businessName", label: "Business", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "priority", label: "Priority", sortable: true },
  { key: "cms", label: "CMS", sortable: true },
  { key: "tags", label: "Tags", sortable: false },
  { key: "price", label: "Price", sortable: true },
  { key: "createdAt", label: "Created", sortable: true },
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
              No projects found
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
              <TableCell>{project.businessName || "-"}</TableCell>
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
              <TableCell>
                {project.tags?.length > 0 ? (
                  <div className="flex gap-1">
                    {project.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="ghost" className="text-[10px] px-1.5">
                        {tag}
                      </Badge>
                    ))}
                    {project.tags.length > 2 && (
                      <span className="text-xs text-muted-foreground">+{project.tags.length - 2}</span>
                    )}
                  </div>
                ) : "-"}
              </TableCell>
              <TableCell className="font-medium">
                {Number(project.price) ? `$${Number(project.price).toFixed(2)}` : "-"}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {formatDate(project.createdAt)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
