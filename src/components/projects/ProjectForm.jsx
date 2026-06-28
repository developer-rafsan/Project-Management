"use client"

import { useState, useEffect, useCallback } from "react"
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
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Loader2,
} from "lucide-react"
import { createProject, updateProject, getUsers } from "@/actions/projectActions"

const schema = z.object({
  orderId: z.string().optional(),
  projectName: z.string().min(2, "Project name must be at least 2 characters"),
  businessName: z.string().optional(),
  websiteUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  websiteUsername: z.string().optional(),
  websitePassword: z.string().optional(),
  cms: z.string().min(1, "CMS is required"),
  priority: z.string().min(1, "Priority is required"),
  status: z.string().min(1, "Status is required"),
  assignee: z.string().optional(),
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

export default function ProjectForm({ initialData = null, onSuccess, onCancel }) {
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)

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
      businessName: initialData?.businessName || "",
      websiteUrl: initialData?.websiteUrl || "",
      websiteUsername: initialData?.websiteUsername || "",
      websitePassword: initialData?.websitePassword || "",
      cms: initialData?.cms || "",
      priority: initialData?.priority || "",
      status: initialData?.status || "",
      assignee: initialData?.assignee?._id || initialData?.assignee || "",
      description: initialData?.description || "",
      tags: initialData?.tags?.join(", ") || "",
      price: initialData?.price ? String(initialData.price) : "",
    },
  })

  const websitePassword = watch("websitePassword")

  useEffect(() => {
    getUsers()
      .then((res) => setUsers(res.users || []))
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setLoadingUsers(false))
  }, [])

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
        price: data.price ? Number(data.price) : 0,
        tags: data.tags
          ? data.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
        websiteUrl: data.websiteUrl || undefined,
        websiteUsername: data.websiteUsername || undefined,
        websitePassword: data.websitePassword || undefined,
        assignee: data.assignee || undefined,
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Order ID <span className="text-muted-foreground">(optional)</span></label>
          <Input {...register("orderId")} placeholder="Leave empty to auto-generate" />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Project Name *</label>
          <Input {...register("projectName")} placeholder="Enter project name" />
          {errors.projectName && <p className="text-xs text-destructive">{errors.projectName.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Business Name</label>
          <Input {...register("businessName")} placeholder="Business name" />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Website URL</label>
          <Input {...register("websiteUrl")} placeholder="https://example.com" />
          {errors.websiteUrl && <p className="text-xs text-destructive">{errors.websiteUrl.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Website Username</label>
          <Input {...register("websiteUsername")} placeholder="Username" />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Website Password</label>
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

        <div className="space-y-1.5">
          <label className="text-sm font-medium">CMS *</label>
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

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Priority *</label>
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

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Status *</label>
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

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Assignee</label>
          <Controller
            name="assignee"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loadingUsers ? "Loading..." : "Select assignee"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user._id} value={user._id}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Tags</label>
          <Input {...register("tags")} placeholder="tag1, tag2, tag3" />
          <p className="text-xs text-muted-foreground">Comma separated values</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Description</label>
        <Textarea {...register("description")} placeholder="Project description..." rows={3} />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Price ($)</label>
        <Input {...register("price")} type="number" step="0.01" placeholder="0.00" />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {isEditing ? "Update Project" : "Create Project"}
        </Button>
      </div>
    </form>
  )
}
