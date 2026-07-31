"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useSelector, useDispatch } from "react-redux"
import { getProfile, updateProfile } from "@/actions/profileActions"
import { fetchWorkspaces, setCurrentWorkspace, addWorkspace } from "@/lib/redux/slices/workspaceSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Loader2, Pencil, Check, X, Building2, User, Mail, Phone, MapPin,
  Briefcase, Save, Code, Palette, Image, ClipboardList,
  TrendingUp, FileText, Search, Video, MoreHorizontal, Plus, Layers,
  LayoutDashboard, ExternalLink,
} from "lucide-react"
import { toast } from "sonner"

const PROFESSION_OPTIONS = [
  { value: "Developer", icon: Code },
  { value: "UI/UX Designer", icon: Palette },
  { value: "Graphic Designer", icon: Image },
  { value: "Project Manager", icon: ClipboardList },
  { value: "Digital Marketer", icon: TrendingUp },
  { value: "Content Writer", icon: FileText },
  { value: "SEO Specialist", icon: Search },
  { value: "Video Editor", icon: Video },
  { value: "Other", icon: MoreHorizontal },
]

function InfoRow({ icon: Icon, label, value, href }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/40 last:border-0">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline truncate block">
            {value || "-"}
          </a>
        ) : (
          <p className="text-sm font-medium truncate">{value || "-"}</p>
        )}
      </div>
    </div>
  )
}

function EditField({ icon: Icon, label, value, onChange, placeholder, type = "text" }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {Icon && <Icon className="size-3.5" />}
        {label}
      </label>
      <Input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || label}
        className="h-9"
      />
    </div>
  )
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const dispatch = useDispatch()
  const { workspaces, currentWorkspaceId, loading: wsLoading, fetched: wsFetched } = useSelector((s) => s.workspaces)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({})
  const [activeSection, setActiveSection] = useState("personal")
  const [wsCreateOpen, setWsCreateOpen] = useState(false)
  const [wsName, setWsName] = useState("")
  const [wsType, setWsType] = useState("individual")
  const [wsSubmitting, setWsSubmitting] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return }
    if (status !== "authenticated") return
    getProfile()
      .then((user) => {
        setProfile(user)
        setForm({
          name: user.name || "",
          phone: user.phone || "",
          address: user.address || "",
          profession: user.profession || "",
        })
        setLoading(false)
      })
      .catch(() => {
        toast.error("Failed to load profile")
        setLoading(false)
      })
  }, [status, session, router])

  useEffect(() => {
    if (!wsFetched && !wsLoading) {
      dispatch(fetchWorkspaces())
    }
  }, [dispatch, wsFetched, wsLoading])

  const handleCreateWorkspace = async (e) => {
    e.preventDefault()
    if (!wsName.trim()) return
    setWsSubmitting(true)
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: wsName.trim(), type: wsType }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create workspace")
      }
      const workspace = await res.json()
      dispatch(addWorkspace(workspace))
      dispatch(setCurrentWorkspace(workspace._id))
      toast.success("Workspace created")
      setWsCreateOpen(false)
      setWsName("")
    } catch (err) {
      toast.error(err.message)
    } finally {
      setWsSubmitting(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await updateProfile(form)
      setProfile(updated)
      setEditing(false)
      toast.success("Profile updated")
    } catch (err) {
      toast.error(err.message || "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setForm({ ...profile })
    setEditing(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const userInitials = profile?.name
    ? profile.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U"

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your account information</p>
        </div>
        {!editing ? (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-2">
            <Pencil className="size-4" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel} className="gap-2">
              <X className="size-4" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
            <Avatar className="size-20 sm:size-24 ring-4 ring-background shadow-xl">
              <AvatarImage src={profile?.image} />
              <AvatarFallback className="text-xl sm:text-2xl font-bold bg-primary/10 text-primary">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left flex-1 min-w-0 space-y-2">
              <div>
                <h2 className="text-xl font-bold">{profile?.name}</h2>
                <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                  <Mail className="size-3.5 shrink-0" />
                  <span className="truncate">{profile?.email}</span>
                </p>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                {profile?.setupComplete && (
                  <Badge variant="outline" className="rounded-full text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 gap-1">
                    <Check className="size-3" />
                    Active
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Layers className="size-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Workspaces</CardTitle>
                <CardDescription>Your workspaces and their data are fully separated</CardDescription>
              </div>
            </div>
            <Button size="sm" onClick={() => { setWsName(""); setWsCreateOpen(true) }} className="gap-2">
              <Plus className="size-4" />
              New Workspace
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {wsLoading && !wsFetched ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : workspaces.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <LayoutDashboard className="size-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">No workspaces yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Create your first workspace to get started</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {workspaces.map((w) => (
                <div
                  key={w._id}
                  className={`flex items-center justify-between gap-3 rounded-xl border p-4 transition-all ${
                    w._id === currentWorkspaceId ? "border-primary/50 bg-primary/5" : "bg-card"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                      w._id === currentWorkspaceId ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      <LayoutDashboard className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{w.name}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase">
                          {w.type}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {w._id === currentWorkspaceId ? (
                      <Badge variant="outline" className="rounded-full text-primary border-primary/40 gap-1">
                        <Check className="size-3" />
                        Active
                      </Badge>
                    ) : (
                      <Button size="xs" variant="secondary" onClick={() => dispatch(setCurrentWorkspace(w._id))}>
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Switch
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={wsCreateOpen} onOpenChange={setWsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Workspace</DialogTitle>
            <DialogDescription>Create a new workspace to organize your projects, notes, and settings</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateWorkspace}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="ws-name" className="text-sm font-medium">Workspace Name</label>
                <Input
                  id="ws-name"
                  placeholder="My Workspace"
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Workspace Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWsType("individual")}
                    className={`flex items-center gap-2 rounded-lg border-2 p-3 text-left transition-all cursor-pointer ${
                      wsType === "individual"
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:bg-muted/50"
                    }`}
                  >
                    <User className="size-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Individual</p>
                      <p className="text-[11px] text-muted-foreground">Freelancer or solo</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWsType("organization")}
                    className={`flex items-center gap-2 rounded-lg border-2 p-3 text-left transition-all cursor-pointer ${
                      wsType === "organization"
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:bg-muted/50"
                    }`}
                  >
                    <Building2 className="size-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Organization</p>
                      <p className="text-[11px] text-muted-foreground">Company or agency</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setWsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={wsSubmitting || !wsName.trim()}>
                {wsSubmitting && <Loader2 className="size-4 animate-spin mr-2" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {editing ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="size-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">Basic Info</CardTitle>
                  <CardDescription>Name and contact details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EditField icon={User} label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                <EditField icon={Mail} label="Email" value={profile?.email || ""} onChange={() => {}} type="email" />
                <EditField icon={Phone} label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} type="tel" />
                <EditField icon={MapPin} label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Briefcase className="size-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">Profession</CardTitle>
                  <CardDescription>Select or type your profession</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                {PROFESSION_OPTIONS.map(({ value: optVal, icon: OptIcon }) => {
                  const isSelected = form.profession === optVal || (!PROFESSION_OPTIONS.some(o => o.value === form.profession) && optVal === "Other")
                  const isOther = optVal === "Other"
                  return (
                    <button
                      key={optVal}
                      type="button"
                      onClick={() => setForm({ ...form, profession: isOther ? "" : optVal })}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all cursor-pointer active:scale-[0.97] ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border bg-card hover:border-muted-foreground/30 hover:bg-muted/50"
                      }`}
                    >
                      <div className={`flex size-8 items-center justify-center rounded-lg ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        <OptIcon className="size-4" />
                      </div>
                      <span className={`text-[10px] font-medium leading-tight text-center ${
                        isSelected ? "text-primary" : "text-muted-foreground"
                      }`}>
                        {optVal}
                      </span>
                    </button>
                  )
                })}
              </div>
              {!PROFESSION_OPTIONS.some(o => o.value === form.profession) && (
                <Input
                  value={form.profession || ""}
                  onChange={(e) => setForm({ ...form, profession: e.target.value })}
                  placeholder="Type your profession..."
                  className="h-9"
                />
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="size-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">Personal</CardTitle>
                  <CardDescription>Your contact information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-(--card-spacing)">
                <InfoRow icon={User} label="Name" value={profile?.name} />
                <InfoRow icon={Mail} label="Email" value={profile?.email} />
                <InfoRow icon={Phone} label="Phone" value={profile?.phone} />
                <InfoRow icon={Briefcase} label="Profession" value={profile?.profession} />
                <InfoRow icon={MapPin} label="Address" value={profile?.address} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="size-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">Account</CardTitle>
                  <CardDescription>Your account status</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-(--card-spacing)">
                <InfoRow icon={Check} label="Status" value={profile?.setupComplete ? "Active" : "Incomplete"} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
