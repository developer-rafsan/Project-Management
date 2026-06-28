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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
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
} from "lucide-react"
import { createProject, updateProject, getProjectPassword } from "@/actions/projectActions"

const schema = z.object({
  orderId: z.string().optional(),
  projectName: z.string().min(2, "Project name must be at least 2 characters"),
  websiteUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  websiteUsername: z.string().optional(),
  websitePassword: z.string().optional(),
  cms: z.string().min(1, "CMS is required"),
  priority: z.string().min(1, "Priority is required"),
  status: z.string().min(1, "Status is required"),
  startDate: z.date().optional(),
  description: z.string().optional(),
  tags: z.string().optional(),
  price: z.string().optional(),
})

const STATUSES = ["Pending", "In Progress", "Waiting Client", "Delivered", "On Hold", "Cancelled"]
const PRIORITIES = ["Low", "Medium", "High", "Urgent"]
const CMS_OPTIONS = ["WordPress", "WooCommerce", "Shopify", "Webflow", "Next.js", "React", "Laravel", "PHP", "Custom", "HTML", "Other"]

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

function FieldLabel({ icon: Icon, children, required }) {
  return (
    <label className="flex items-center gap-1.5 text-sm font-medium">
      {Icon && <Icon className="size-3.5 text-muted-foreground" />}
      {children}
      {required && <span className="text-destructive">*</span>}
    </label>
  )
}

export default function ProjectForm({ initialData = null, onSuccess, onCancel }) {
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { data: session } = useSession()

  const isEditing = !!initialData

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      orderId: initialData?.orderId || "",
      projectName: initialData?.projectName || "",
      websiteUrl: initialData?.websiteUrl || "",
      websiteUsername: initialData?.websiteUsername || "",
      websitePassword: typeof initialData?.websitePassword === "string" ? initialData.websitePassword : "",
      cms: initialData?.cms || "",
      priority: initialData?.priority || "",
      status: initialData?.status || "",
      startDate: initialData?.startDate ? new Date(initialData.startDate) : undefined,
      description: initialData?.description || "",
      tags: initialData?.tags?.join(", ") || "",
      price: initialData?.price ? String(initialData.price) : "",
    },
  })

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Project name, order ID, and website details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-5">
            <div className="space-y-2">
              <FieldLabel icon={Hash}>Order ID <span className="text-muted-foreground font-normal">(optional)</span></FieldLabel>
              <Input {...register("orderId")} placeholder="Leave empty to auto-generate" />
            </div>
            <div className="space-y-2">
              <FieldLabel icon={Layout} required>Project Name</FieldLabel>
              <Input {...register("projectName")} placeholder="Enter project name" />
              {errors.projectName && <p className="text-xs text-destructive">{errors.projectName.message}</p>}
            </div>
            <div className="space-y-2">
              <FieldLabel icon={Globe}>Website URL</FieldLabel>
              <Input {...register("websiteUrl")} placeholder="https://example.com" />
              {errors.websiteUrl && <p className="text-xs text-destructive">{errors.websiteUrl.message}</p>}
            </div>
            <div className="space-y-2">
              <FieldLabel icon={User}>Website Username</FieldLabel>
              <Input {...register("websiteUsername")} placeholder="Username" />
            </div>
            <div className="space-y-2">
              <FieldLabel icon={Lock}>Website Password</FieldLabel>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showPassword ? "text" : "password"}
                    {...register("websitePassword")}
                    placeholder="Password"
                    className="pr-16"
                  />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={copyPassword}
                      tabIndex={-1}
                    >
                      <Copy className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <Button type="button" variant="outline" size="icon" onClick={generatePassword} title="Generate strong password">
                  <RefreshCw className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Classification</CardTitle>
          <CardDescription>CMS, priority, and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-5">
            <div className="space-y-2">
              <FieldLabel icon={Layout} required>CMS</FieldLabel>
              <Controller
                name="cms"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select CMS" />
                    </SelectTrigger>
                    <SelectContent>
                      {CMS_OPTIONS.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.cms && <p className="text-xs text-destructive">{errors.cms.message}</p>}
            </div>
            <div className="space-y-2">
              <FieldLabel icon={ArrowUpDown} required>Priority</FieldLabel>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.priority && <p className="text-xs text-destructive">{errors.priority.message}</p>}
            </div>
            <div className="space-y-2">
              <FieldLabel icon={ListChecks} required>Status</FieldLabel>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Details</CardTitle>
          <CardDescription>Start date, pricing, and tags</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-5">
            <div className="space-y-2">
              <FieldLabel icon={Calendar}>Start Date</FieldLabel>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={(date) => field.onChange(date || new Date())}
                    placeholder="Pick a start date"
                  />
                )}
              />
              <p className="text-xs text-muted-foreground">Defaults to today if not set</p>
            </div>
            <div className="space-y-2">
              <FieldLabel icon={DollarSign}>Price</FieldLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input {...register("price")} type="number" step="0.01" placeholder="0.00" className="pl-7" />
              </div>
            </div>
            <div className="space-y-2">
              <FieldLabel icon={Tag}>Tags</FieldLabel>
              <Input {...register("tags")} placeholder="tag1, tag2, tag3" />
              <p className="text-xs text-muted-foreground">Comma separated values</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
          <CardDescription>Detailed project description</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Textarea {...register("description")} placeholder="Project description..." rows={3} />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3 border-t pt-6">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting} className="min-w-[100px]">
            Cancel
          </Button>
        ) : <div />}
        <Button type="submit" disabled={submitting} className="min-w-[140px]">
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {isEditing ? "Update Project" : "Create Project"}
        </Button>
      </div>
    </form>
  )
}
