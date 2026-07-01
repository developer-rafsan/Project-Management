"use client"

import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

const statusColors = {
  Pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  "In Progress": "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  Delivered: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  "On Hold": "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  Cancelled: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
}

const priorityColors = {
  Low: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  Medium: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  High: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  Urgent: "bg-red-500/10 text-red-600 dark:text-red-400",
}

export default function RecentProjects({ projects }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Projects</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Project Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Start Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  No projects yet
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow key={project._id}>
                  <TableCell className="font-mono text-xs">
                    {project.orderId || "—"}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/projects/${project._id}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {project.projectName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
                        statusColors[project.status] ||
                          "bg-muted text-muted-foreground"
                      )}
                    >
                      {project.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        priorityColors[project.priority] ||
                          "bg-muted text-muted-foreground"
                      )}
                    >
                      {project.priority}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {project.startDate ? new Date(project.startDate).toLocaleDateString() : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
