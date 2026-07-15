"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { getProfile, updateProfile } from "@/actions/profileActions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Loader2, Pencil, Check, X, Building2, User, Mail, Phone, MapPin,
  Globe, Briefcase, Save, Code, Palette, Image, ClipboardList,
  TrendingUp, FileText, Search, Video, MoreHorizontal,
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
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({})
  const [activeSection, setActiveSection] = useState("personal")

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
          organizationName: user.organizationName || "",
          organizationEmail: user.organizationEmail || "",
          organizationPhone: user.organizationPhone || "",
          organizationAddress: user.organizationAddress || "",
          organizationWebsite: user.organizationWebsite || "",
          organizationRole: user.organizationRole || "",
        })
        setLoading(false)
      })
      .catch(() => {
        toast.error("Failed to load profile")
        setLoading(false)
      })
  }, [status, session, router])

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

  const isOrg = profile?.accountType === "organization"

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
                {isOrg ? (
                  <Badge variant="secondary" className="rounded-full gap-1">
                    <Building2 className="size-3" />
                    Organization
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="rounded-full gap-1">
                    <User className="size-3" />
                    Individual
                  </Badge>
                )}
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

          {isOrg && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="size-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">Organization</CardTitle>
                    <CardDescription>Your organization details</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <EditField icon={Building2} label="Organization Name" value={form.organizationName} onChange={(v) => setForm({ ...form, organizationName: v })} />
                  <EditField icon={Mail} label="Organization Email" value={form.organizationEmail} onChange={(v) => setForm({ ...form, organizationEmail: v })} type="email" />
                  <EditField icon={Phone} label="Organization Phone" value={form.organizationPhone} onChange={(v) => setForm({ ...form, organizationPhone: v })} type="tel" />
                  <EditField icon={MapPin} label="Organization Address" value={form.organizationAddress} onChange={(v) => setForm({ ...form, organizationAddress: v })} />
                  <EditField icon={Globe} label="Website" value={form.organizationWebsite} onChange={(v) => setForm({ ...form, organizationWebsite: v })} />
                  <EditField icon={Briefcase} label="Your Role" value={form.organizationRole} onChange={(v) => setForm({ ...form, organizationRole: v })} />
                </div>
              </CardContent>
            </Card>
          )}
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

          {isOrg ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="size-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">Organization</CardTitle>
                    <CardDescription>Your organization details</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="px-(--card-spacing)">
                  <InfoRow icon={Building2} label="Name" value={profile?.organizationName} />
                  <InfoRow icon={Mail} label="Email" value={profile?.organizationEmail} />
                  <InfoRow icon={Phone} label="Phone" value={profile?.organizationPhone} />
                  <InfoRow icon={MapPin} label="Address" value={profile?.organizationAddress} />
                  <InfoRow icon={Globe} label="Website" value={profile?.organizationWebsite} href={profile?.organizationWebsite} />
                  <InfoRow icon={Briefcase} label="Role" value={profile?.organizationRole} />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="size-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">Account</CardTitle>
                    <CardDescription>Account type and status</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="px-(--card-spacing)">
                  <InfoRow icon={User} label="Account Type" value={profile?.accountType === "organization" ? "Organization" : "Individual"} />
                  <InfoRow icon={Check} label="Status" value={profile?.setupComplete ? "Active" : "Incomplete"} />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
