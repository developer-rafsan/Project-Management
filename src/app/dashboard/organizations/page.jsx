"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSelector, useDispatch } from "react-redux"
import { fetchOrganizations, addOrganization, setCurrentOrganization } from "@/lib/redux/slices/organizationSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Building2, Plus, ExternalLink } from "lucide-react"

export default function OrganizationsPage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const { items: organizations, loading, fetched } = useSelector((s) => s.organizations)
  const [createOpen, setCreateOpen] = useState(false)
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!fetched && !loading) {
      dispatch(fetchOrganizations())
    }
  }, [dispatch, fetched, loading])

  async function handleCreate(e) {
    e.preventDefault()
    if (!formName.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName.trim(), description: formDescription.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create organization")
      }
      const org = await res.json()
      dispatch(addOrganization(org))
      dispatch(setCurrentOrganization(org._id))
      toast.success("Organization created")
      setCreateOpen(false)
      setFormName("")
      setFormDescription("")
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && !fetched) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organizations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage organizations
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Organization
        </Button>
      </div>

      {organizations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-lg font-medium text-muted-foreground">No organizations yet</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Create your first organization to get started</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <div key={org._id} className="rounded-xl border bg-card p-5 transition-all hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{org.name}</h3>
                  {org.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{org.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    <span className="inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase">
                      {org.slug}
                    </span>
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <Button
                  size="xs"
                  onClick={() => router.push(`/dashboard/organizations/${org._id}`)}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Manage
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>Create a new organization to collaborate with your team</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Organization Name</label>
                <Input
                  id="name"
                  placeholder="My Organization"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">Description (optional)</label>
                <Input
                  id="description"
                  placeholder="A short description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !formName.trim()}>
                {submitting ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
