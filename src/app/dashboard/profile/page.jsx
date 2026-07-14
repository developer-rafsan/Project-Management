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

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({})

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
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your account information</p>
        </div>
        {!editing ? (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-2">
            <Pencil className="size-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setEditing(false); setForm({ ...profile }) }} className="gap-2">
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
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <Avatar className="size-20 sm:size-24 ring-4 ring-background shadow-xl">
              <AvatarImage src={profile?.image} />
              <AvatarFallback className="text-xl sm:text-2xl font-bold bg-primary/10 text-primary">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left flex-1 min-w-0">
              <h2 className="text-xl font-bold">{profile?.name}</h2>
              <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1">
                <Mail className="size-3.5" />
                {profile?.email}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
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
                  <Badge variant="outline" className="rounded-full text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800">
                    Active
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isOrg ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="size-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Organization Details</CardTitle>
                <CardDescription>Your organization information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Organization Name" value={form.organizationName} editing={editing} onChange={(v) => setForm({ ...form, organizationName: v })} icon={Building2} />
            <Field label="Organization Email" value={form.organizationEmail} editing={editing} onChange={(v) => setForm({ ...form, organizationEmail: v })} icon={Mail} />
            <Field label="Organization Phone" value={form.organizationPhone} editing={editing} onChange={(v) => setForm({ ...form, organizationPhone: v })} icon={Phone} />
            <Field label="Organization Address" value={form.organizationAddress} editing={editing} onChange={(v) => setForm({ ...form, organizationAddress: v })} icon={MapPin} />
            <Field label="Website" value={form.organizationWebsite} editing={editing} onChange={(v) => setForm({ ...form, organizationWebsite: v })} icon={Globe} />
            <ProfessionField label="Your Role" value={form.organizationRole} editing={editing} options={PROFESSION_OPTIONS} onChange={(v) => setForm({ ...form, organizationRole: v })} icon={Briefcase} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="size-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Personal Details</CardTitle>
                <CardDescription>Your contact information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Name" value={form.name} editing={editing} onChange={(v) => setForm({ ...form, name: v })} icon={User} />
            <Field label="Email" value={profile?.email || ""} editing={false} icon={Mail} />
            <Field label="Phone" value={form.phone} editing={editing} onChange={(v) => setForm({ ...form, phone: v })} icon={Phone} />
            <ProfessionField label="Profession" value={form.profession} editing={editing} options={PROFESSION_OPTIONS} onChange={(v) => setForm({ ...form, profession: v })} icon={Briefcase} />
            <Field label="Address" value={form.address} editing={editing} onChange={(v) => setForm({ ...form, address: v })} icon={MapPin} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Field({ label, value, editing, onChange, icon: Icon }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="flex items-center gap-2 min-w-[130px] shrink-0">
        {Icon && <Icon className="size-3.5 text-muted-foreground" />}
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex-1 min-w-0">
        {editing ? (
          <Input value={value || ""} onChange={(e) => onChange(e.target.value)} className="h-9 text-sm" />
        ) : (
          <span className="text-sm">{value || "-"}</span>
        )}
      </div>
    </div>
  )
}

function ProfessionField({ label, value, editing, options, onChange, icon: Icon }) {
  return (
    <div className="flex flex-col gap-2 py-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="size-3.5 text-muted-foreground" />}
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      {editing ? (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            {options.map(({ value: optVal, icon: OptIcon }) => {
              const isSelected = value === optVal || (!options.find(o => o.value === value) && optVal === "Other")
              const isOther = optVal === "Other"
              return (
                <button
                  key={optVal}
                  type="button"
                  onClick={() => onChange(isOther ? "" : optVal)}
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
          {!options.find(o => o.value === value) && (
            <Input
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder={`Type your ${label.toLowerCase()}...`}
              className="h-9 text-sm"
            />
          )}
        </div>
      ) : (
        <span className="text-sm">{value || "-"}</span>
      )}
    </div>
  )
}
