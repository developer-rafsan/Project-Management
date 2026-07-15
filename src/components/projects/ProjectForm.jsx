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
  Copy,
  RefreshCw,
  Loader2,
  Globe,
  Tag,
  DollarSign,
  FileText,
  Calendar,
  Layout,
  ListChecks,
  ArrowUpDown,
  Hash,
  Check,
  Percent,
  Landmark,
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
  cms: z.string().min(1, "CMS is required"),
  customCms: z.string().optional(),
  priority: z.string().min(1, "Priority is required"),
  status: z.string().min(1, "Status is required"),
  currentProjectDate: z.date().optional(),
  description: z.string().optional(),
  tags: z.string().optional(),
  price: z.string().optional(),
  websites: z.array(z.object({
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
  { title: "Basic Info", description: "Project name, order ID, websites", icon: Globe },
  { title: "Classification", description: "CMS, priority, status", icon: ListChecks },
  { title: "Details", description: "Date, pricing, tags, description", icon: FileText },
  { title: "Review", description: "Review all information", icon: Check },
]

const stepIcons = [Globe, ListChecks, FileText, Check]

export default function ProjectForm({ initialData = null, onSuccess, onCancel }) {
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState(0)
  const [globalFiverrFee, setGlobalFiverrFee] = useState(true)
  const [fiverrFeeEnabled, setFiverrFeeEnabled] = useState(true)
  const [duplicateWarning, setDuplicateWarning] = useState(null)
  const [pendingPayload, setPendingPayload] = useState(null)
  const { data: session } = useSession()

  const isEditing = !!initialData

  useEffect(() => {
    const saved = localStorage.getItem("fiverrFeeEnabled")
    const global = saved !== "false"
    setGlobalFiverrFee(global)
    if (isEditing && initialData?.fiverrFeeEnabled !== undefined) {
      setFiverrFeeEnabled(initialData.fiverrFeeEnabled)
    } else {
      setFiverrFeeEnabled(global)
    }
  }, [isEditing, initialData?.fiverrFeeEnabled])

  const getInitialWebsites = () => {
    if (initialData?.websites?.length > 0) {
      return initialData.websites;
    }
    return [];
  };

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      orderId: initialData?.orderId || "",
      projectName: initialData?.projectName || "",
      cms: initialData?.cms
        ? CMS_OPTIONS.includes(initialData.cms) ? initialData.cms : "Other"
        : "",
      customCms: initialData?.cms && !CMS_OPTIONS.includes(initialData.cms) ? initialData.cms : "",
      priority: initialData?.priority || "",
      status: initialData?.status || "",
      currentProjectDate: initialData?.currentProjectDate ? new Date(initialData.currentProjectDate) : undefined,
      description: initialData?.description || "",
      tags: initialData?.tags?.join(", ") || "",
      price: initialData?.price ? String(initialData.price) : "",

      websites: getInitialWebsites(),
      figmaLinks: initialData?.figmaLinks || [],
      referenceLinks: initialData?.referenceLinks || [],
    },
  })
  const { register, handleSubmit, control, setValue, watch, trigger, formState } = form
  const errors = formState.errors

  const { fields: addSiteFields, append: appendSite, remove: removeSite } = useFieldArray({ control, name: "websites" })
  const { fields: figmaFields, append: appendFigma, remove: removeFigma } = useFieldArray({ control, name: "figmaLinks" })
  const { fields: refFields, append: appendRef, remove: removeRef } = useFieldArray({ control, name: "referenceLinks" })

  const stepFields = [
    ['orderId', 'projectName'],
    ['cms', 'customCms', 'priority', 'status'],
    ['currentProjectDate', 'price', 'tags', 'description'],
    [],
  ]

  const handleNext = async (e) => {
    e.preventDefault()
    const fields = stepFields[step]
    const valid = await trigger(fields, { shouldFocus: true })
    if (valid) setStep(s => Math.min(s + 1, STEPS.length - 1))
  }

  const handlePrev = () => setStep(s => Math.max(s - 1, 0))

  const handleFiverrFeeToggle = () => {
    setFiverrFeeEnabled(prev => !prev)
  }

  useEffect(() => {
    if (isEditing && initialData?._id) {
      getProjectPassword(initialData._id)
        .then((res) => {
          if (res.password) {
            const current = watch("websites");
            if (current?.length > 0) {
              setValue("websites.0.password", res.password, { shouldValidate: false });
            }
          }
        })
        .catch((err) => console.error("Failed to fetch password:", err))
    }
  }, [isEditing, initialData?._id, setValue])

  const formValues = watch()

  const copyPassword = useCallback(async () => {
    const pw = formValues.websites?.[0]?.password
    if (!pw) return
    try {
      await navigator.clipboard.writeText(pw)
      toast.success("Password copied to clipboard")
    } catch {
      toast.error("Failed to copy password")
    }
  }, [formValues.websites])

  const generatePassword = useCallback(() => {
    const pwd = generateStrongPassword()
    if (addSiteFields.length > 0) {
      setValue("websites.0.password", pwd, { shouldValidate: true })
    }
  }, [setValue, addSiteFields.length])

  const onSubmit = async (data, confirmDuplicate = false) => {
    setSubmitting(true)
    try {
      const payload = {
        ...data,
        cms: data.cms === "Other" && data.customCms ? data.customCms : data.cms,
        currentProjectDate: data.currentProjectDate || undefined,
        price: data.price ? Number(data.price) : 0,
        tags: data.tags
          ? data.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
        websites: (data.websites || []).map(site => ({
          ...site,
          password: site.password || undefined,
        })),
        assignee: isEditing ? (initialData?.assignee || []) : [],
        orderId: data.orderId || undefined,
        fiverrFeeEnabled,
      }

      if (confirmDuplicate) {
        payload.confirmDuplicateOrderId = true
      }

      let result
      if (isEditing) {
        result = await updateProject(initialData._id, payload)
        toast.success("Project updated successfully")
        onSuccess?.(result)
      } else {
        result = await createProject(payload)
        if (result.duplicateWarning) {
          setDuplicateWarning(result)
          setPendingPayload(data)
          return
        }
        toast.success("Project created successfully")
        onSuccess?.(result)
      }
    } catch (err) {
      toast.error(err.message || "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmDuplicate = () => {
    setDuplicateWarning(null)
    if (pendingPayload) {
      onSubmit(pendingPayload, true)
      setPendingPayload(null)
    }
  }

  const handleCancelDuplicate = () => {
    setDuplicateWarning(null)
    setPendingPayload(null)
  }

  const isLastStep = step === STEPS.length - 1

  const handleSubmitForm = async () => {
    const valid = await trigger()
    if (!valid) {
      const currentErrors = formState.errors
      const firstErrorStep = stepFields.findIndex((fields) =>
        fields.some((f) => currentErrors[f])
      )
      if (firstErrorStep >= 0 && firstErrorStep !== step) {
        setStep(firstErrorStep)
      }
      toast.error("Please fix the highlighted errors")
      return
    }
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
                  <Input {...register("orderId")} placeholder="Leave empty to auto-generate" className={`h-9 text-sm bg-background ${errors.orderId ? "border-destructive ring-destructive/20" : ""}`} />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    Project Name <span className="text-destructive">*</span>
                  </label>
                  <Input {...register("projectName")} placeholder="Enter project name" className={`h-9 text-sm bg-background ${errors.projectName ? "border-destructive ring-destructive/20" : ""}`} />
                  {errors.projectName && (
                    <p className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="size-3 shrink-0" /> {errors.projectName.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {/* Websites */}
            <div className="rounded-xl bg-muted/30 p-3 sm:p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Globe className="size-3.5 text-primary" />
                  Websites
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => appendSite({ url: "", username: "", password: "" })} className="gap-1 h-7 text-xs cursor-pointer">
                  <Plus className="size-3" /> Add
                </Button>
              </div>
              {addSiteFields.length === 0 && (
                <p className="text-xs text-muted-foreground/60">No websites added</p>
              )}
              {addSiteFields.map((field, idx) => (
                <div key={field.id} className="rounded-lg border bg-card p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">Site #{idx + 1}</span>
                      {idx === 0 && (
                        <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Primary</span>
                      )}
                    </div>
                    <Button type="button" variant="ghost" size="icon-xs" onClick={() => removeSite(idx)} className="text-destructive hover:text-destructive cursor-pointer">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Input {...register(`websites.${idx}.url`)} placeholder="https://example.com" className="h-8 text-sm bg-background" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input {...register(`websites.${idx}.username`)} placeholder="Username" className="h-8 text-sm bg-background" />
                      <div className="flex gap-1.5">
                        <Input {...register(`websites.${idx}.password`)} placeholder="Password" className="h-8 text-sm bg-background flex-1" />
                        {idx === 0 && (
                          <Button type="button" variant="outline" size="icon" onClick={generatePassword} title="Generate strong password" className="shrink-0 size-8">
                            <RefreshCw className="size-3.5" />
                          </Button>
                        )}
                      </div>
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
                    <SelectTrigger className={`h-9 text-sm bg-background w-full ${errors.cms ? "border-destructive ring-destructive/20" : ""}`}><SelectValue placeholder="Select CMS platform" /></SelectTrigger>
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
                      <SelectTrigger className={`h-9 text-sm bg-background w-full ${errors.priority ? "border-destructive ring-destructive/20" : ""}`}>
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
                      <SelectTrigger className={`h-9 text-sm bg-background w-full ${errors.status ? "border-destructive ring-destructive/20" : ""}`}>
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
                    <Calendar className="size-3" />
                    Project Date
                  </label>
                  <Controller name="currentProjectDate" control={control} render={({ field }) => (
                    <DatePicker value={field.value} onChange={(date) => field.onChange(date)} placeholder="Pick a date" />
                  )} />
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
              {globalFiverrFee && (
                <>
                  <div className="flex items-center justify-between rounded-lg border bg-card p-3">
                    <div className="space-y-0.5">
                      <span className="text-xs font-medium">Fiverr Fee (20%)</span>
                      <p className="text-[10px] text-muted-foreground/60">Deduct 20% Fiverr fee from price</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={fiverrFeeEnabled}
                      onClick={handleFiverrFeeToggle}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                        fiverrFeeEnabled ? "bg-primary" : "bg-input"
                      }`}
                    >
                      <span
                        className={`pointer-events-none block size-4 rounded-full bg-background shadow-sm ring-0 transition-transform duration-200 ${
                          fiverrFeeEnabled ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                  {fiverrFeeEnabled && formValues.price && Number(formValues.price) > 0 && (
                    <div className="rounded-lg bg-muted/40 p-3 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Price</span>
                        <span className="font-medium">${Number(formValues.price).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Fiverr Fee (20%)</span>
                        <span className="font-medium text-orange-500">-${(Number(formValues.price) * 0.2).toFixed(2)}</span>
                      </div>
                      <div className="border-t border-border/40 pt-1.5 flex items-center justify-between text-xs">
                        <span className="font-semibold text-muted-foreground">Net Revenue</span>
                        <span className="font-semibold text-green-500">${(Number(formValues.price) * 0.8).toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
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

              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <ReviewRow icon={Hash} label="Order ID" value={formValues.orderId || "Auto-generated"} />
                <ReviewRow icon={Layout} label="Project Name" value={formValues.projectName} />
                <ReviewRow icon={Globe} label="Websites" value={formValues.websites?.length ? `${formValues.websites.length} site(s)` : "—"} />
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
                <ReviewRow icon={Calendar} label="Project Date" value={formValues.currentProjectDate ? new Date(formValues.currentProjectDate).toLocaleDateString() : "Today"} />
                <ReviewRow icon={DollarSign} label="Price" value={formValues.price ? `$${formValues.price}` : "—"} />
                {fiverrFeeEnabled && formValues.price && Number(formValues.price) > 0 && (
                  <>
                    <ReviewRow icon={Percent} label="Fiverr Fee (20%)" value={`-$${(Number(formValues.price) * 0.2).toFixed(2)}`} />
                    <ReviewRow icon={Landmark} label="Net Revenue" value={`$${(Number(formValues.price) * 0.8).toFixed(2)}`} />
                  </>
                )}
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
                <ReviewRow icon={Palette} label="Figma Links" value={formValues.figmaLinks?.length ? `${formValues.figmaLinks.length} link(s)` : "—"} />
                <ReviewRow icon={Link} label="Reference Sites" value={formValues.referenceLinks?.length ? `${formValues.referenceLinks.length} link(s)` : "—"} />
              </div>
            </div>
          </div>
        )}
      </div>
      </div>

      {duplicateWarning && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800/30 bg-amber-50/80 dark:bg-amber-900/10 p-4 sm:p-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <AlertCircle className="size-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="space-y-1 min-w-0">
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">Duplicate Order ID Warning</h3>
              <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
                Order ID <strong className="text-amber-800 dark:text-amber-300">{duplicateWarning.orderId}</strong> already has <strong className="text-amber-800 dark:text-amber-300">{duplicateWarning.count} project(s)</strong>. Do you want to create another project with the same Order ID?
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleCancelDuplicate} disabled={submitting} className="h-8 text-xs">
              Cancel
            </Button>
            <Button type="button" variant="default" size="sm" onClick={handleConfirmDuplicate} disabled={submitting} className="h-8 text-xs gap-1">
              {submitting && <Loader2 className="size-3 animate-spin" />}
              Create Anyway
            </Button>
          </div>
        </div>
      )}

      {/* Buttons */}
      {!duplicateWarning && (
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
      )}
    </form>
  )
}
