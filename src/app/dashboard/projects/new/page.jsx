"use client"

import { useRouter } from "next/navigation"
import { useDispatch } from "react-redux"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import ProjectForm from "@/components/projects/ProjectForm"
import { addProject } from "@/lib/features/projectSlice"

export default function NewProjectPage() {
  const router = useRouter()
  const dispatch = useDispatch()

  const handleSuccess = (project) => {
    dispatch(addProject(project))
    router.push("/dashboard/projects")
  }

  return (
    <div className="space-y-4">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
        <ChevronRight className="size-4" />
        <Link href="/dashboard/projects" className="hover:text-foreground">Projects</Link>
        <ChevronRight className="size-4" />
        <span className="text-foreground">New</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create New Project</h1>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <ProjectForm onSuccess={handleSuccess} />
      </div>
    </div>
  )
}
