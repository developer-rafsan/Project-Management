"use client"

import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { ProjectBreadcrumbs, ProjectTitle } from "@/components/projects/ProjectDetailHeader"
import { ProjectTimeline } from "@/components/projects/ProjectTimeline"
import {
  ProjectDetailsCard,
  ProjectWebsiteCard,
  ProjectMetaCard,
  ProjectTagsCard,
} from "@/components/projects/ProjectInfoSidebar"
import Notes from "@/components/projects/Notes"
import { FileText, Eye } from "lucide-react"

export default function SharedProjectPage({ params }) {
  const [project, setProject] = useState(null)
  const [activities, setActivities] = useState([])
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const token = (await params).token
        const res = await fetch(`/api/shared/${token}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Project not found")
        setProject(data.project)
        setActivities(data.activities || [])
        setNotes(data.notes || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [params])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-8 w-96" />
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Eye className="size-12 text-muted-foreground/30 mx-auto" />
          <h1 className="text-xl font-semibold">Project not available</h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            {error === "Share link has expired"
              ? "This share link has expired. Please ask the project owner for a new link."
              : "This share link is invalid or the project has been deleted."}
          </p>
        </div>
      </div>
    )
  }

  if (!project) return null

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground/60 mb-2">
          <Eye className="size-3.5" />
          <span>Read-only view</span>
        </div>

        <ProjectBreadcrumbs projectName={project.projectName} />

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <ProjectTitle project={project} />
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {project.description && (
              <div className="rounded-xl border bg-card p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="size-4 text-muted-foreground shrink-0" />
                  <h2 className="text-sm font-semibold">Description</h2>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {project.description}
                </p>
              </div>
            )}

            <div className="rounded-xl border bg-card p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="size-2 rounded-full bg-primary shrink-0" />
                <h2 className="text-sm font-semibold">Activity Timeline</h2>
              </div>
              <ProjectTimeline activities={activities} />
            </div>

            <Notes projectId={project._id} readOnly notes={notes} />
          </div>

          <div className="space-y-4 sm:space-y-6">
            <ProjectDetailsCard project={project} />
            <ProjectWebsiteCard
              project={project}
              passwordDisplay={project.decryptedPassword}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword((prev) => !prev)}
            />
            <ProjectMetaCard project={project} />
            <ProjectTagsCard tags={project.tags} />
          </div>
        </div>
      </div>
    </div>
  )
}
