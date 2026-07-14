"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { getProfile, updateProfile } from "@/actions/profileActions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Loader2, Check, Building2, User, ArrowRight, Code, Palette,
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
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [accountType, setAccountType] = useState(null)
  const [form, setForm] = useState({
    phone: "", address: "", profession: "",
    organizationName: "", organizationEmail: "", organizationPhone: "",
    organizationAddress: "", organizationWebsite: "", organizationRole: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return }
    if (status !== "authenticated") return
    getProfile()
      .then((user) => {
        if (user.setupComplete) {
          router.push("/dashboard")
        } else {
          if (user.accountType) {
            setAccountType(user.accountType)
            setStep(2)
            setForm({
              phone: user.phone || "", address: user.address || "", profession: user.profession || "",
              organizationName: user.organizationName || "", organizationEmail: user.organizationEmail || "",
              organizationPhone: user.organizationPhone || "", organizationAddress: user.organizationAddress || "",
              organizationWebsite: user.organizationWebsite || "", organizationRole: user.organizationRole || "",
            })
          } else {
            setStep(1)
          }
          setLoading(false)
        }
      })
      .catch(() => {
        setStep(1)
        setLoading(false)
      })
  }, [status, session, router])

  const handleSelectType = (type) => {
    setAccountType(type)
    setStep(2)
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const payload = {
        accountType,
        setupComplete: true,
      }
      if (accountType === "single") {
        payload.phone = form.phone
        payload.address = form.address
        payload.profession = form.profession
      } else {
        payload.organizationName = form.organizationName
        payload.organizationEmail = form.organizationEmail
        payload.organizationPhone = form.organizationPhone
        payload.organizationAddress = form.organizationAddress
        payload.organizationWebsite = form.organizationWebsite
        payload.organizationRole = form.organizationRole
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
            {step === 1 ? (
              <User className="size-7 text-primary" />
            ) : accountType === "single" ? (
              <User className="size-7 text-primary" />
            ) : (
              <Building2 className="size-7 text-primary" />
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Complete Your Profile</h1>
          <p className="text-sm text-muted-foreground">Set up your account to get started</p>
        </div>

        <div className="flex items-center justify-center gap-2">
          <div className={`size-2.5 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
          <div className="w-12 h-px bg-border" />
          <div className={`size-2.5 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
        </div>

        {step === 1 && (
          <div className="grid gap-3">
            <button
              onClick={() => handleSelectType("single")}
              className="group relative flex items-center gap-4 rounded-xl border-2 border-primary/30 bg-primary/5 p-5 text-left transition-all hover:border-primary hover:bg-primary/10 hover:shadow-lg active:scale-[0.98] cursor-pointer"
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <User className="size-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base text-foreground">Individual</p>
                <p className="text-sm text-muted-foreground">I am a freelancer, professional, or solo creator</p>
              </div>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <ArrowRight className="size-4 text-primary" />
              </div>
            </button>

            <div className="relative flex items-center gap-4 rounded-xl border-2 border-border/50 bg-muted/20 p-5 text-left opacity-50 cursor-not-allowed select-none">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground/50">
                <Building2 className="size-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base text-muted-foreground/50">Organization</p>
                <p className="text-sm text-muted-foreground/40">I represent a company or agency</p>
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/40 bg-muted/50 px-2 py-1 rounded-full border border-border/50">Coming soon</span>
            </div>
          </div>
        )}

        {step === 2 && accountType === "single" && (
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
        )}

        {step === 2 && accountType === "organization" && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 pb-1">
                <Building2 className="size-4 text-primary" />
                <h2 className="text-sm font-semibold">Organization Information</h2>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Your Name</label>
                <Input value={session?.user?.name || ""} disabled className="bg-muted/50" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Organization Name *</label>
                <Input
                  value={form.organizationName} onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                  placeholder="Acme Corp"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Organization Email</label>
                <Input
                  value={form.organizationEmail} onChange={(e) => setForm({ ...form, organizationEmail: e.target.value })}
                  placeholder="contact@acme.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Organization Phone</label>
                <Input
                  value={form.organizationPhone} onChange={(e) => setForm({ ...form, organizationPhone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Organization Address</label>
                <Input
                  value={form.organizationAddress} onChange={(e) => setForm({ ...form, organizationAddress: e.target.value })}
                  placeholder="City, Country"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Website</label>
                <Input
                  value={form.organizationWebsite} onChange={(e) => setForm({ ...form, organizationWebsite: e.target.value })}
                  placeholder="https://acme.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Your Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {PROFESSION_OPTIONS.map(({ value, icon: Icon }) => {
                    const isSelected = form.organizationRole === value || (!PROFESSION_OPTIONS.find(o => o.value === form.organizationRole) && value === "Other")
                    const isOther = value === "Other"
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setForm({ ...form, organizationRole: isOther ? "" : value })}
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
                {!PROFESSION_OPTIONS.find(o => o.value === form.organizationRole) && (
                  <Input
                    value={form.organizationRole}
                    onChange={(e) => setForm({ ...form, organizationRole: e.target.value })}
                    placeholder="Type your role..."
                    className="h-9 text-sm"
                  />
                )}
              </div>

              <Button onClick={handleSubmit} disabled={saving} className="w-full gap-2">
                {saving && <Loader2 className="size-4 animate-spin" />}
                <Check className="size-4" />
                Complete Setup
              </Button>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground">
          You can always update your profile information later from settings
        </p>
      </div>
    </div>
  )
}
