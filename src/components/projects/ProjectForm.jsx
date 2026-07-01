"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useForm, Controller } from "react-hook-form"
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
})

const STATUSES = ["Pending", "In Progress", "Delivered", "On Hold", "Cancelled"]
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
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-card/50 px-3.5 py-2.5">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          {Icon && <Icon className="size-3" />}
        </div>
        <span className="text-sm text-muted-foreground truncate">{label}</span>
      </div>
      <span className="text-sm font-medium text-right break-all max-w-[55%]">{value}</span>
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
    },
  })

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
    <form onKeyDown={(e) => e.key === "Enter" && e.target.tagName !== "TEXTAREA" && e.preventDefault()} className="space-y-6">
      {/* Step indicator */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const StepIcon = s.icon
            const isComplete = i < step
            const isCurrent = i === step
            return (
              <div key={i} className="flex items-center gap-0 flex-1">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`relative flex size-9 items-center justify-center rounded-xl transition-all duration-300 ${
                      isCurrent
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 ring-2 ring-primary/20"
                        : isComplete
                          ? "bg-primary/90 text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isComplete ? (
                      <Check className="size-[15px]" />
                    ) : (
                      <span className="text-xs font-bold">{i + 1}</span>
                    )}
                  </div>
                  <span className={`text-[11px] font-semibold text-center leading-tight px-1 ${
                    isCurrent ? "text-foreground" : isComplete ? "text-primary" : "text-muted-foreground"
                  }`}>
                    <span className="hidden sm:inline">{s.title}</span>
                    <span className="sm:hidden">{i + 1}</span>
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-2 transition-colors duration-300 ${
                    i < step ? "bg-primary/60" : "bg-border"
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step header */}
      <div className="flex items-center gap-3 pb-3 border-b border-border">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
          <ActiveIcon className="size-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">{STEPS[step].title}</h2>
            <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">Step {step + 1} of {STEPS.length}</span>
          </div>
          <p className="text-sm text-muted-foreground">{STEPS[step].description}</p>
        </div>
      </div>

      {/* Step content */}
      <div key={step} className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-300 ease-out">
        {step === 0 && (
          <div className="space-y-5">
            <div className="rounded-xl border bg-card p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <div className="flex size-6 items-center justify-center rounded-lg bg-primary/10">
                  <Layout className="size-3.5 text-primary" />
                </div>
                Project Information
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  <Hash className="size-3.5 text-muted-foreground" />
                  Order ID <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <Input {...register("orderId")} placeholder="Leave empty to auto-generate" className="h-10" />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  Project Name <span className="text-destructive">*</span>
                </label>
                <Input {...register("projectName")} placeholder="Enter project name" className="h-10" />
                {errors.projectName && (
                  <p className="flex items-center gap-1.5 text-xs text-destructive mt-1.5 ml-0.5">
                    <AlertCircle className="size-3 shrink-0" /> {errors.projectName.message}
                  </p>
                )}
              </div>
            </div>
            <div className="rounded-xl border bg-card p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <div className="flex size-6 items-center justify-center rounded-lg bg-primary/10">
                  <Globe className="size-3.5 text-primary" />
                </div>
                Website Credentials
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  <Globe className="size-3.5 text-muted-foreground" />
                  Website URL
                </label>
                <Input {...register("websiteUrl")} placeholder="https://example.com" className="h-10" />
                {errors.websiteUrl && (
                  <p className="flex items-center gap-1.5 text-xs text-destructive mt-1.5 ml-0.5">
                    <AlertCircle className="size-3 shrink-0" /> {errors.websiteUrl.message}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-sm font-medium">
                    <User className="size-3.5 text-muted-foreground" />
                    Username
                  </label>
                  <Input {...register("websiteUsername")} placeholder="Username" className="h-10" />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-sm font-medium">
                    <Lock className="size-3.5 text-muted-foreground" />
                    Password
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1 min-w-0">
                      <Input
                        type={showPassword ? "text" : "password"}
                        {...register("websitePassword")}
                        placeholder="Password"
                        className="h-10 pr-14"
                      />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5">
                        <Button type="button" variant="ghost" size="icon-xs" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                          {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                        </Button>
                        <Button type="button" variant="ghost" size="icon-xs" onClick={copyPassword} tabIndex={-1}>
                          <Copy className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                    <Button type="button" variant="outline" size="icon" onClick={generatePassword} title="Generate strong password" className="shrink-0 h-10 w-10">
                      <RefreshCw className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div className="rounded-xl border bg-card p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <div className="flex size-6 items-center justify-center rounded-lg bg-primary/10">
                  <Layout className="size-3.5 text-primary" />
                </div>
                Platform
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  CMS <span className="text-destructive">*</span>
                </label>
                <Controller name="cms" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Select CMS platform" /></SelectTrigger>
                    <SelectContent className="max-h-[320px]">
                      {CMS_CATEGORIES.map((cat) => (
                        <div key={cat.label}>
                          <div className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pointer-events-none">
                            {cat.label}
                          </div>
                          {cat.items.map((item) => (
                            <SelectItem key={item} value={item} className="pl-6">{item}</SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
                {errors.cms && (
                  <p className="flex items-center gap-1.5 text-xs text-destructive mt-1.5 ml-0.5">
                    <AlertCircle className="size-3 shrink-0" /> {errors.cms.message}
                  </p>
                )}
                {watch("cms") === "Other" && (
                  <div className="mt-2 p-3 rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-900/10 animate-in fade-in slide-in-from-top-1 duration-200">
                    <label className="flex items-center gap-1.5 text-sm font-medium mb-2">
                      Custom CMS Name
                    </label>
                    <Input {...register("customCms")} placeholder="e.g., Drupal, Joomla" className="h-10" />
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-xl border bg-card p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <div className="flex size-6 items-center justify-center rounded-lg bg-primary/10">
                  <ArrowUpDown className="size-3.5 text-primary" />
                </div>
                Classification
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-sm font-medium">
                    Priority <span className="text-destructive">*</span>
                  </label>
                  <Controller name="priority" control={control} render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-10">
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
                    <p className="flex items-center gap-1.5 text-xs text-destructive mt-1.5 ml-0.5">
                      <AlertCircle className="size-3 shrink-0" /> {errors.priority.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-sm font-medium">
                    Status <span className="text-destructive">*</span>
                  </label>
                  <Controller name="status" control={control} render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-10">
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
                    <p className="flex items-center gap-1.5 text-xs text-destructive mt-1.5 ml-0.5">
                      <AlertCircle className="size-3 shrink-0" /> {errors.status.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="rounded-xl border bg-card p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <div className="flex size-6 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="size-3.5 text-primary" />
                </div>
                Schedule &amp; Pricing
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-sm font-medium">
                    Start Date
                  </label>
                  <Controller name="startDate" control={control} render={({ field }) => (
                    <DatePicker value={field.value} onChange={(date) => field.onChange(date || new Date())} placeholder="Pick a start date" />
                  )} />
                  <p className="text-xs text-muted-foreground">Defaults to today if not set</p>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-sm font-medium">
                    Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">$</span>
                    <Input {...register("price")} type="number" step="0.01" placeholder="0.00" className="h-10 pl-8" />
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-card p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <div className="flex size-6 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="size-3.5 text-primary" />
                </div>
                Additional Info
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  <Tag className="size-3.5 text-muted-foreground" />
                  Tags
                </label>
                <Input {...register("tags")} placeholder="e.g., redesign, landing-page, ecommerce" className="h-10" />
                <p className="text-xs text-muted-foreground">Comma separated values</p>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  <FileText className="size-3.5 text-muted-foreground" />
                  Description
                </label>
                <Textarea {...register("description")} placeholder="Describe the project scope, requirements, and any notes..." rows={4} className="resize-none min-h-[100px]" />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <ReviewSection title="Basic Information" icon={Layout}>
              <ReviewRow icon={Hash} label="Order ID" value={formValues.orderId || "Auto-generated"} />
              <ReviewRow icon={Layout} label="Project Name" value={formValues.projectName} />
              <ReviewRow icon={Globe} label="Website URL" value={formValues.websiteUrl || "—"} />
              <ReviewRow icon={User} label="Username" value={formValues.websiteUsername || "—"} />
              <ReviewRow icon={Lock} label="Password" value={formValues.websitePassword ? "••••••••" : "—"} />
            </ReviewSection>
            <ReviewSection title="Classification" icon={ListChecks}>
              <ReviewRow icon={Layout} label="CMS" value={formValues.cms === "Other" && formValues.customCms ? formValues.customCms : formValues.cms} />
              <ReviewRow icon={ArrowUpDown} label="Priority" value={formValues.priority} />
              <ReviewRow icon={ListChecks} label="Status" value={formValues.status} />
            </ReviewSection>
            <ReviewSection title="Schedule &amp; Details" icon={Calendar}>
              <ReviewRow icon={Calendar} label="Start Date" value={formValues.startDate ? new Date(formValues.startDate).toLocaleDateString() : "Today"} />
              <ReviewRow icon={DollarSign} label="Price" value={formValues.price ? `$${formValues.price}` : "—"} />
              <ReviewRow icon={Tag} label="Tags" value={formValues.tags || "—"} />
              <ReviewRow icon={FileText} label="Description" value={formValues.description || "—"} />
            </ReviewSection>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-5 border-t border-border">
        <div className="flex items-center gap-2.5">
          {step > 0 && (
            <Button type="button" variant="outline" onClick={handlePrev} disabled={submitting} className="w-full sm:w-auto gap-1.5">
              <ChevronLeft className="size-4" />
              <span className="sm:inline">Back</span>
            </Button>
          )}
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting} className="w-full sm:w-auto text-muted-foreground">
              Cancel
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!isLastStep && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              Step {step + 1} of {STEPS.length}
            </span>
          )}
          {isLastStep ? (
            <Button type="button" onClick={handleSubmitForm} disabled={submitting} className="w-full sm:w-auto min-w-[180px] gap-2 shadow-sm">
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              {submitting ? "Saving..." : isEditing ? "Update Project" : "Create Project"}
            </Button>
          ) : (
            <Button type="button" onClick={(e) => handleNext(e)} className="w-full sm:w-auto min-w-[120px] gap-1.5 shadow-sm">
              Next Step
              <ChevronRight className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
