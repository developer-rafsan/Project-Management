"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { getProfile, updateProfile } from "@/actions/profileActions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Loader2, Check, User, Code, Palette,
  Image, ClipboardList, TrendingUp, FileText, Search, Video, MoreHorizontal,
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

export default function SetupPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    phone: "", address: "", profession: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return }
    if (status !== "authenticated") return
    getProfile()
      .then((user) => {
        if (user.setupComplete) {
          router.push("/dashboard")
        } else {
          setForm({
            phone: user.phone || "", address: user.address || "", profession: user.profession || "",
          })
          setLoading(false)
        }
      })
      .catch(() => {
        setLoading(false)
      })
  }, [status, session, router])

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const payload = {
        setupComplete: true,
        phone: form.phone,
        address: form.address,
        profession: form.profession,
      }
      await updateProfile(payload)
      toast.success("Profile setup complete")
      router.push("/dashboard")
    } catch (err) {
      toast.error(err.message || "Failed to save profile")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/50 p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 mb-2">
            <User className="size-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Complete Your Profile</h1>
          <p className="text-sm text-muted-foreground">Set up your account to get started</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 pb-1">
              <User className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">Personal Information</h2>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Name</label>
              <Input value={session?.user?.name || ""} disabled className="bg-muted/50" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <Input value={session?.user?.email || ""} disabled className="bg-muted/50" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Phone</label>
              <Input
                value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Profession</label>
              <div className="grid grid-cols-3 gap-2">
                {PROFESSION_OPTIONS.map(({ value, icon: Icon }) => {
                  const isSelected = form.profession === value || (!PROFESSION_OPTIONS.find(o => o.value === form.profession) && value === "Other")
                  const isOther = value === "Other"
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm({ ...form, profession: isOther ? "" : value })}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all cursor-pointer active:scale-[0.97] ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border bg-card hover:border-muted-foreground/30 hover:bg-muted/50"
                      }`}
                    >
                      <div className={`flex size-9 items-center justify-center rounded-lg ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        <Icon className="size-4.5" />
                      </div>
                      <span className={`text-[11px] font-medium leading-tight text-center ${
                        isSelected ? "text-primary" : "text-muted-foreground"
                      }`}>
                        {value}
                      </span>
                    </button>
                  )
                })}
              </div>
              {!PROFESSION_OPTIONS.find(o => o.value === form.profession) && (
                <Input
                  value={form.profession}
                  onChange={(e) => setForm({ ...form, profession: e.target.value })}
                  placeholder="Type your profession..."
                  className="h-9 text-sm"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Address</label>
              <Input
                value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="City, Country"
              />
            </div>

            <Button onClick={handleSubmit} disabled={saving} className="w-full gap-2">
              {saving && <Loader2 className="size-4 animate-spin" />}
              <Check className="size-4" />
              Complete Setup
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          You can always update your profile information later from settings
        </p>
      </div>
    </div>
  )
}
