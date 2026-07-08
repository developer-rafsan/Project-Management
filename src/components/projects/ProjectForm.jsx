"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useForm, Controller, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Loader2,
  Globe,
  Lock,
  User,
  Tag,
  DollarSign,
  FileText,
  Calendar,
  Layout,
  ListChecks,
  ArrowUpDown,
  Hash,
  Check,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Plus,
  Trash2,
  Link,
  Palette,
} from "lucide-react"
import { createProject, updateProject, getProjectPassword } from "@/actions/projectActions"

const schema = z.object({
  orderId: z.string().optional(),
  projectName: z.string().min(2, "Project name must be at least 2 characters"),
  websiteUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  websiteUsername: z.string().optional(),
  websitePassword: z.string().optional(),
  cms: z.string().min(1, "CMS is required"),
  customCms: z.string().optional(),
  priority: z.string().min(1, "Priority is required"),
  status: z.string().min(1, "Status is required"),
  startDate: z.date().optional(),
  description: z.string().optional(),
  tags: z.string().optional(),
  price: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  additionalWebsites: z.array(z.object({
    url: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
  })).optional(),
  figmaLinks: z.array(z.object({
    url: z.string().optional(),
  })).optional(),
  referenceLinks: z.array(z.object({
    url: z.string().optional(),
  })).optional(),
})

const STATUSES = ["Pending", "In Progress", "Delivered", "Revision", "On Hold", "Cancelled"]
const PRIORITIES = ["Low", "Medium", "High", "Urgent"]
const CMS_OPTIONS = ["WordPress", "WooCommerce", "Shopify", "Wix", "Webflow", "Next.js", "React", "Laravel", "PHP", "Custom", "HTML", "Other"]

const CMS_CATEGORIES = [
  { label: "CMS Platforms", items: ["WordPress", "Wix", "Webflow"] },
  { label: "E-commerce", items: ["WooCommerce", "Shopify"] },
  { label: "Frameworks", items: ["Next.js", "React", "Laravel", "PHP"] },
  { label: "Other", items: ["Custom", "HTML", "Other"] },
]

const PRIORITY_STYLES = {
  Low: { dot: "bg-green-500", bg: "bg-green-100 dark:bg-green-900/20", text: "text-green-700 dark:text-green-300" },
  Medium: { dot: "bg-yellow-500", bg: "bg-yellow-100 dark:bg-yellow-900/20", text: "text-yellow-700 dark:text-yellow-300" },
  High: { dot: "bg-orange-500", bg: "bg-orange-100 dark:bg-orange-900/20", text: "text-orange-700 dark:text-orange-300" },
  Urgent: { dot: "bg-red-500", bg: "bg-red-100 dark:bg-red-900/20", text: "text-red-700 dark:text-red-300" },
}

const STATUS_STYLES = {
  Pending: { dot: "bg-gray-400", bg: "bg-gray-100 dark:bg-gray-900/20", text: "text-gray-700 dark:text-gray-300" },
  "In Progress": { dot: "bg-blue-500", bg: "bg-blue-100 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-300" },
  Delivered: { dot: "bg-green-500", bg: "bg-green-100 dark:bg-green-900/20", text: "text-green-700 dark:text-green-300" },
  "On Hold": { dot: "bg-amber-500", bg: "bg-amber-100 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-300" },
  Cancelled: { dot: "bg-red-500", bg: "bg-red-100 dark:bg-red-900/20", text: "text-red-700 dark:text-red-300" },
  Revision: { dot: "bg-purple-500", bg: "bg-purple-100 dark:bg-purple-900/20", text: "text-purple-700 dark:text-purple-300" },
}

function generateStrongPassword() {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const lowercase = "abcdefghijklmnopqrstuvwxyz"
  const numbers = "0123456789"
  const special = "!@#$%^&*()_+-=[]{}|;:,.<>?"
  const all = uppercase + lowercase + numbers + special

  let password = ""
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]

  for (let i = 0; i < 12; i++) {
    password += all[Math.floor(Math.random() * all.length)]
  }

  return password.split("").sort(() => Math.random() - 0.5).join("")
}

function StepLabel({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <span className="font-medium">{label}</span>
    </div>
  )
}

function ReviewRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 py-1">
      {Icon && <Icon className="size-3 text-muted-foreground/50 shrink-0" />}
      <span className="text-xs text-muted-foreground/60 shrink-0">{label}</span>
      <span className="text-xs font-medium truncate ml-auto">{value}</span>
    </div>
  )
}

function ReviewSection({ title, icon: Icon, children }) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <div className="flex size-6 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="size-3.5 text-primary" />
        </div>
        {title}
      </div>
      <div className="space-y-1.5">
        {children}
      </div>
    </div>
  )
}

const STEPS = [
  { title: "Basic Info", description: "Project name, order ID, website", icon: Globe },
  { title: "Classification", description: "CMS, priority, status", icon: ListChecks },
  { title: "Details", description: "Date, pricing, tags, description", icon: FileText },
  { title: "Review", description: "Review all information", icon: Check },
]

const stepIcons = [Globe, ListChecks, FileText, Check]

export default function ProjectForm({ initialData = null, onSuccess, onCancel }) {
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState(0)
  const { data: session } = useSession()

  const isEditing = !!initialData

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      orderId: initialData?.orderId || "",
      projectName: initialData?.projectName || "",
      websiteUrl: initialData?.websiteUrl || "",
      websiteUsername: initialData?.websiteUsername || "",
      websitePassword: typeof initialData?.websitePassword === "string" ? initialData.websitePassword : "",
      cms: initialData?.cms
        ? CMS_OPTIONS.includes(initialData.cms) ? initialData.cms : "Other"
        : "",
      customCms: initialData?.cms && !CMS_OPTIONS.includes(initialData.cms) ? initialData.cms : "",
      priority: initialData?.priority || "",
      status: initialData?.status || "",
      startDate: initialData?.startDate ? new Date(initialData.startDate) : undefined,
      description: initialData?.description || "",
      tags: initialData?.tags?.join(", ") || "",
      price: initialData?.price ? String(initialData.price) : "",
      progress: initialData?.progress ?? 0,
      additionalWebsites: initialData?.additionalWebsites || [],
      figmaLinks: initialData?.figmaLinks || [],
      referenceLinks: initialData?.referenceLinks || [],
    },
  })

  const { fields: addSiteFields, append: appendSite, remove: removeSite } = useFieldArray({ control, name: "additionalWebsites" })
  const { fields: figmaFields, append: appendFigma, remove: removeFigma } = useFieldArray({ control, name: "figmaLinks" })
  const { fields: refFields, append: appendRef, remove: removeRef } = useFieldArray({ control, name: "referenceLinks" })

  const stepFields = [
    ['orderId', 'projectName', 'websiteUrl', 'websiteUsername', 'websitePassword'],
    ['cms', 'customCms', 'priority', 'status'],
    ['startDate', 'price', 'tags', 'description'],
    [],
  ]

  const handleNext = async (e) => {
    e.preventDefault()
    const fields = stepFields[step]
    const valid = await trigger(fields, { shouldFocus: true })
    if (valid) setStep(s => Math.min(s + 1, STEPS.length - 1))
  }

  const handlePrev = () => setStep(s => Math.max(s - 1, 0))

  useEffect(() => {
    if (isEditing && initialData?._id) {
      getProjectPassword(initialData._id)
        .then((res) => {
          if (res.password) {
            setValue("websitePassword", res.password, { shouldValidate: false })
          }
        })
        .catch((err) => console.error("Failed to fetch password:", err))
    }
  }, [isEditing, initialData?._id, setValue])

  const formValues = watch()
  const websitePassword = watch("websitePassword")

  const copyPassword = useCallback(async () => {
    if (!websitePassword) return
    try {
      await navigator.clipboard.writeText(websitePassword)
      toast.success("Password copied to clipboard")
    } catch {
      toast.error("Failed to copy password")
    }
  }, [websitePassword])

  const generatePassword = useCallback(() => {
    const pwd = generateStrongPassword()
    setValue("websitePassword", pwd, { shouldValidate: true })
  }, [setValue])

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      const payload = {
        ...data,
        cms: data.cms === "Other" && data.customCms ? data.customCms : data.cms,
        startDate: data.startDate || new Date(),
        price: data.price ? Number(data.price) : 0,
        progress: data.progress ?? 0,
        tags: data.tags
          ? data.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
        websiteUrl: data.websiteUrl || undefined,
        websiteUsername: data.websiteUsername || undefined,
        websitePassword: data.websitePassword || undefined,
        assignee: isEditing ? (initialData?.assignee?._id || initialData?.assignee) : session?.user?.id,
        orderId: data.orderId || undefined,
      }

      let result
      if (isEditing) {
        result = await updateProject(initialData._id, payload)
        toast.success("Project updated successfully")
      } else {
        result = await createProject(payload)
        toast.success("Project created successfully")
      }
      onSuccess?.(result)
    } catch (err) {
      toast.error(err.message || "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  const isLastStep = step === STEPS.length - 1

  const handleSubmitForm = () => {
    handleSubmit(onSubmit)()
  }

  const ActiveIcon = stepIcons[step]

  return (
    <form onKeyDown={(e) => e.key === "Enter" && e.target.tagName !== "TEXTAREA" && e.preventDefault()} className="w-full flex flex-col flex-1 min-h-0">
      {/* Step indicator */}
      <div className="shrink-0 px-1 pt-1">
        <div className="flex items-center w-full">
          {STEPS.map((s, i) => {
            const isComplete = i < step
            const isCurrent = i === step
            const leftDone = i <= step
            const rightDone = i < step
            return (
              <div key={i} className="flex items-center flex-1">
                <div className={`flex-1 h-0.5 transition-colors duration-300 ${i === 0 ? "invisible" : leftDone ? "bg-primary/50" : "bg-border/60"}`} />
                <div className="flex flex-col items-center gap-1 shrink-0 px-1">
                  <div
                    className={`relative flex size-7 items-center justify-center rounded-full transition-all duration-300 ${
                      isCurrent
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 ring-2 ring-primary/20 scale-110"
                        : isComplete
                          ? "bg-primary/80 text-primary-foreground"
                          : "bg-muted/60 text-muted-foreground"
                    }`}
                  >
                    {isComplete ? (
                      <Check className="size-3.5" />
                    ) : (
                      <span className="text-[11px] font-bold">{i + 1}</span>
                    )}
                  </div>
                  <span className={`text-[10px] font-medium text-center leading-tight px-0.5 ${
                    isCurrent ? "text-foreground font-semibold" : isComplete ? "text-primary/80" : "text-muted-foreground/60"
                  }`}>
                    <span className="hidden sm:inline">{s.title}</span>
                    <span className="sm:hidden">{i + 1}</span>
                  </span>
                </div>
                <div className={`flex-1 h-0.5 transition-colors duration-300 ${i === STEPS.length - 1 ? "invisible" : rightDone ? "bg-primary/50" : "bg-border/60"}`} />
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex-1 min-h-0 space-y-4 sm:space-y-5 py-3 sm:py-4 overflow-y-auto">
        {/* Step header */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex size-7 sm:size-8 items-center justify-center rounded-lg bg-primary/[0.08]">
            <ActiveIcon className="size-3.5 sm:size-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h2 className="text-sm sm:text-base font-semibold tracking-tight truncate">{STEPS[step].title}</h2>
              <span className="text-[9px] sm:text-[10px] text-muted-foreground/60 font-medium bg-muted/50 px-1.5 sm:px-2 py-0.5 rounded-full border border-border/30 shrink-0">Step {step + 1} of {STEPS.length}</span>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground/70 mt-0.5 truncate">{STEPS[step].description}</p>
          </div>
        </div>

        {/* Step content */}
        <div key={step} className="space-y-4">
        {step === 0 && (
          <div className="space-y-3 sm:space-y-4">
            <div className="rounded-xl bg-muted/30 p-3 sm:p-4 space-y-3 sm:space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Layout className="size-3.5 text-primary" />
                Project Information
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Hash className="size-3" />
                    Order ID <span className="font-normal">(optional)</span>
                  </label>
                  <Input {...register("orderId")} placeholder="Leave empty to auto-generate" className="h-9 text-sm bg-background" />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    Project Name <span className="text-destructive">*</span>
                  </label>
                  <Input {...register("projectName")} placeholder="Enter project name" className="h-9 text-sm bg-background" />
                  {errors.projectName && (
                    <p className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="size-3 shrink-0" /> {errors.projectName.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-muted/30 p-3 sm:p-4 space-y-3 sm:space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Globe className="size-3.5 text-primary" />
                Website Credentials
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Globe className="size-3" />
                    Website URL
                  </label>
                  <Input {...register("websiteUrl")} placeholder="https://example.com" className="h-9 text-sm bg-background" />
                  {errors.websiteUrl && (
                    <p className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="size-3 shrink-0" /> {errors.websiteUrl.message}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <User className="size-3" />
                      Username
                    </label>
                    <Input {...register("websiteUsername")} placeholder="Username" className="h-9 text-sm bg-background" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Lock className="size-3" />
                      Password
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1 min-w-0">
                        <Input
                          type={showPassword ? "text" : "password"}
                          {...register("websitePassword")}
                          placeholder="Password"
                          className="h-9 text-sm bg-background pr-12"
                        />
                        <div className="absolute right-0.5 top-1/2 -translate-y-1/2 flex">
                          <Button type="button" variant="ghost" size="icon-xs" onClick={() => setShowPassword(!showPassword)} tabIndex={-1} className="size-7">
                            {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                          </Button>
                          <Button type="button" variant="ghost" size="icon-xs" onClick={copyPassword} tabIndex={-1} className="size-7">
                            <Copy className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                      <Button type="button" variant="outline" size="icon" onClick={generatePassword} title="Generate strong password" className="shrink-0 size-9">
                        <RefreshCw className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Additional Websites */}
            <div className="rounded-xl bg-muted/30 p-3 sm:p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Globe className="size-3.5 text-primary" />
                  Additional Websites
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => appendSite({ url: "", username: "", password: "" })} className="gap-1 h-7 text-xs cursor-pointer">
                  <Plus className="size-3" /> Add
                </Button>
              </div>
              {addSiteFields.length === 0 && (
                <p className="text-xs text-muted-foreground/60">No additional websites</p>
              )}
              {addSiteFields.map((field, idx) => (
                <div key={field.id} className="rounded-lg border bg-card p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Website #{idx + 1}</span>
                    <Button type="button" variant="ghost" size="icon-xs" onClick={() => removeSite(idx)} className="text-destructive hover:text-destructive cursor-pointer">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Input {...register(`additionalWebsites.${idx}.url`)} placeholder="https://example.com" className="h-8 text-sm bg-background" />
                    <div className="grid grid-cols-2 gap-2">
                      <Input {...register(`additionalWebsites.${idx}.username`)} placeholder="Username" className="h-8 text-sm bg-background" />
                      <Input {...register(`additionalWebsites.${idx}.password`)} placeholder="Password" className="h-8 text-sm bg-background" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3 sm:space-y-4">
            <div className="rounded-xl bg-muted/30 p-3 sm:p-4 space-y-3 sm:space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Layout className="size-3.5 text-primary" />
                Platform
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  CMS <span className="text-destructive">*</span>
                </label>
                <Controller name="cms" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9 text-sm bg-background"><SelectValue placeholder="Select CMS platform" /></SelectTrigger>
                    <SelectContent className="max-h-[320px]">
                      {CMS_CATEGORIES.map((cat) => (
                        <div key={cat.label}>
                          <div className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pointer-events-none">
                            {cat.label}
                          </div>
                          {cat.items.map((item) => (
                            <SelectItem key={item} value={item} className="pl-6 text-sm">{item}</SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
                {errors.cms && (
                  <p className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="size-3 shrink-0" /> {errors.cms.message}
                  </p>
                )}
                {watch("cms") === "Other" && (
                  <div className="mt-2 p-3 rounded-lg bg-amber-50/60 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-800/30">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                      Custom CMS Name
                    </label>
                    <Input {...register("customCms")} placeholder="e.g., Drupal, Joomla" className="h-9 text-sm bg-background" />
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-xl bg-muted/30 p-3 sm:p-4 space-y-3 sm:space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <ArrowUpDown className="size-3.5 text-primary" />
                Classification
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    Priority <span className="text-destructive">*</span>
                  </label>
                  <Controller name="priority" control={control} render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-9 text-sm bg-background">
                        {field.value ? (
                          <div className="flex items-center gap-2">
                            <div className={`size-2 rounded-full ${PRIORITY_STYLES[field.value]?.dot}`} />
                            <SelectValue />
                          </div>
                        ) : (
                          <SelectValue placeholder="Select priority" />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((p) => {
                          const style = PRIORITY_STYLES[p]
                          return (
                            <SelectItem key={p} value={p}>
                              <div className="flex items-center gap-2.5">
                                <div className={`size-2.5 rounded-full ${style.dot}`} />
                                <span className={style.text}>{p}</span>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  )} />
                  {errors.priority && (
                    <p className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="size-3 shrink-0" /> {errors.priority.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    Status <span className="text-destructive">*</span>
                  </label>
                  <Controller name="status" control={control} render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-9 text-sm bg-background">
                        {field.value ? (
                          <div className="flex items-center gap-2">
                            <div className={`size-2 rounded-full ${STATUS_STYLES[field.value]?.dot}`} />
                            <SelectValue />
                          </div>
                        ) : (
                          <SelectValue placeholder="Select status" />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => {
                          const style = STATUS_STYLES[s]
                          return (
                            <SelectItem key={s} value={s}>
                              <div className="flex items-center gap-2.5">
                                <div className={`size-2.5 rounded-full ${style.dot}`} />
                                <span className={style.text}>{s}</span>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  )} />
                  {errors.status && (
                    <p className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="size-3 shrink-0" /> {errors.status.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5 pt-2 border-t border-border/40">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <ListChecks className="size-3" />
                    Progress
                  </label>
                  <Controller name="progress" control={control} render={({ field }) => (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={field.value ?? 0}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          className="flex-1 h-2 rounded-full appearance-none cursor-pointer bg-muted [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"
                        />
                        <span className="text-sm font-semibold tabular-nums min-w-[3ch] text-right">{field.value ?? 0}%</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground/60">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  )} />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3 sm:space-y-4">
            <div className="rounded-xl bg-muted/30 p-3 sm:p-4 space-y-3 sm:space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Calendar className="size-3.5 text-primary" />
                Schedule &amp; Pricing
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    Start Date
                  </label>
                  <Controller name="startDate" control={control} render={({ field }) => (
                    <DatePicker value={field.value} onChange={(date) => field.onChange(date || new Date())} placeholder="Pick a start date" />
                  )} />
                  <p className="text-[10px] text-muted-foreground/60">Defaults to today</p>
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 text-sm font-medium">$</span>
                    <Input {...register("price")} type="number" step="0.01" placeholder="0.00" className="h-9 text-sm bg-background pl-7" />
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-muted/30 p-3 sm:p-4 space-y-3 sm:space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <FileText className="size-3.5 text-primary" />
                Additional Info
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Tag className="size-3" />
                    Tags
                  </label>
                  <Input {...register("tags")} placeholder="e.g., redesign, landing-page, ecommerce" className="h-9 text-sm bg-background" />
                  <p className="text-[10px] text-muted-foreground/60">Comma separated values</p>
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <FileText className="size-3" />
                    Description
                  </label>
                  <Textarea {...register("description")} placeholder="Describe the project scope, requirements, and any notes..." rows={3} className="resize-none text-sm bg-background" />
                </div>
              </div>
            </div>
            {/* Figma Links */}
            <div className="rounded-xl bg-muted/30 p-3 sm:p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Palette className="size-3.5 text-primary" />
                  Figma Links
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => appendFigma({ url: "" })} className="gap-1 h-7 text-xs cursor-pointer">
                  <Plus className="size-3" /> Add
                </Button>
              </div>
              {figmaFields.length === 0 && (
                <p className="text-xs text-muted-foreground/60">No Figma links</p>
              )}
              {figmaFields.map((field, idx) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Input {...register(`figmaLinks.${idx}.url`)} placeholder="https://figma.com/file/..." className="h-8 text-sm bg-background flex-1" />
                  <Button type="button" variant="ghost" size="icon-xs" onClick={() => removeFigma(idx)} className="text-destructive hover:text-destructive shrink-0 cursor-pointer">
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            {/* Reference Links */}
            <div className="rounded-xl bg-muted/30 p-3 sm:p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Link className="size-3.5 text-primary" />
                  Reference Sites
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => appendRef({ url: "" })} className="gap-1 h-7 text-xs cursor-pointer">
                  <Plus className="size-3" /> Add
                </Button>
              </div>
              {refFields.length === 0 && (
                <p className="text-xs text-muted-foreground/60">No reference sites</p>
              )}
              {refFields.map((field, idx) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Input {...register(`referenceLinks.${idx}.url`)} placeholder="https://example.com" className="h-8 text-sm bg-background flex-1" />
                  <Button type="button" variant="ghost" size="icon-xs" onClick={() => removeRef(idx)} className="text-destructive hover:text-destructive shrink-0 cursor-pointer">
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                <div className="flex size-5 items-center justify-center rounded bg-primary/10">
                  <Layout className="size-3 text-primary" />
                </div>
                Basic Information
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${formValues.progress ?? 0}%` }}
                  />
                </div>
                <span className="text-sm font-semibold tabular-nums">{formValues.progress ?? 0}%</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <ReviewRow icon={Hash} label="Order ID" value={formValues.orderId || "Auto-generated"} />
                <ReviewRow icon={Layout} label="Project Name" value={formValues.projectName} />
                <ReviewRow icon={Globe} label="Website URL" value={formValues.websiteUrl || "—"} />
                <ReviewRow icon={User} label="Username" value={formValues.websiteUsername || "—"} />
                <ReviewRow icon={Lock} label="Password" value={formValues.websitePassword ? "••••••••" : "—"} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                <div className="flex size-5 items-center justify-center rounded bg-primary/10">
                  <ListChecks className="size-3 text-primary" />
                </div>
                Classification
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <ReviewRow icon={Layout} label="CMS" value={formValues.cms === "Other" && formValues.customCms ? formValues.customCms : formValues.cms} />
                <ReviewRow icon={ArrowUpDown} label="Priority" value={formValues.priority} />
                <ReviewRow icon={ListChecks} label="Status" value={formValues.status} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                <div className="flex size-5 items-center justify-center rounded bg-primary/10">
                  <Calendar className="size-3 text-primary" />
                </div>
                Schedule &amp; Details
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <ReviewRow icon={Calendar} label="Start Date" value={formValues.startDate ? new Date(formValues.startDate).toLocaleDateString() : "Today"} />
                <ReviewRow icon={DollarSign} label="Price" value={formValues.price ? `$${formValues.price}` : "—"} />
                <ReviewRow icon={Tag} label="Tags" value={formValues.tags || "—"} />
                <ReviewRow icon={FileText} label="Description" value={formValues.description || "—"} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                <div className="flex size-5 items-center justify-center rounded bg-primary/10">
                  <Globe className="size-3 text-primary" />
                </div>
                Websites &amp; Links
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <ReviewRow icon={Globe} label="Primary URL" value={formValues.websiteUrl || "—"} />
                <ReviewRow icon={Palette} label="Figma Links" value={formValues.figmaLinks?.length ? `${formValues.figmaLinks.length} link(s)` : "—"} />
                <ReviewRow icon={Link} label="Reference Sites" value={formValues.referenceLinks?.length ? `${formValues.referenceLinks.length} link(s)` : "—"} />
                <ReviewRow icon={Globe} label="Extra Sites" value={formValues.additionalWebsites?.length ? `${formValues.additionalWebsites.length} site(s)` : "—"} />
              </div>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2 pt-3 sm:pt-4 border-t border-border/50 shrink-0 px-1">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {step > 0 && (
            <Button type="button" variant="ghost" onClick={handlePrev} disabled={submitting} className="w-full sm:w-auto gap-1 text-muted-foreground hover:text-foreground h-8 sm:h-9 text-xs sm:text-sm">
              <ChevronLeft className="size-3.5 sm:size-4" />
              <span>Back</span>
            </Button>
          )}
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting} className="w-full sm:w-auto text-muted-foreground/60 hover:text-muted-foreground h-8 sm:h-9 text-xs sm:text-sm">
              Cancel
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isLastStep && (
            <span className="text-[10px] text-muted-foreground/50 hidden sm:block">
              Step {step + 1} of {STEPS.length}
            </span>
          )}
          {isLastStep ? (
            <Button type="button" onClick={handleSubmitForm} disabled={submitting} className="w-full sm:w-auto min-w-[120px] sm:min-w-[140px] gap-1.5 h-8 sm:h-9 text-xs sm:text-sm">
              {submitting ? (
                <Loader2 className="size-3.5 sm:size-4 animate-spin" />
              ) : (
                <Check className="size-3.5 sm:size-4" />
              )}
              {submitting ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          ) : (
            <Button type="button" onClick={(e) => handleNext(e)} className="w-full sm:w-auto gap-1 h-8 sm:h-9 text-xs sm:text-sm">
              Next
              <ChevronRight className="size-3.5 sm:size-4" />
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
