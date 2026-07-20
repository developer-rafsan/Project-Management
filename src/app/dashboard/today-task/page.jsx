"use client"

import { useState, useEffect, useCallback } from "react"
import { getTasks, createTask, updateTask, deleteTask } from "@/actions/taskActions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  ListTodo,
  Sparkles,
  Loader2,
  CheckCircle2,
  Circle,
  Trash2,
  Brain,
  MessageSquare,
  User,
  Clock,
  ChevronDown,
  Plus,
  AlertTriangle,
  Zap,
  Flag,
} from "lucide-react"
import { toast } from "sonner"
import { format, isToday, isPast, parseISO } from "date-fns"

const priorityConfig = {
  urgent: { label: "Urgent", color: "text-red-500", bg: "bg-red-500/10", icon: AlertTriangle, order: 0 },
  high: { label: "High", color: "text-orange-500", bg: "bg-orange-500/10", icon: Zap, order: 1 },
  medium: { label: "Medium", color: "text-blue-500", bg: "bg-blue-500/10", icon: Flag, order: 2 },
  low: { label: "Low", color: "text-muted-foreground", bg: "bg-muted/50", icon: ChevronDown, order: 3 },
}

const sourceConfig = {
  microsoft_teams: { label: "Teams", color: "text-purple-500", bg: "bg-purple-500/10", icon: MessageSquare },
  ai_detection: { label: "AI", color: "text-emerald-500", bg: "bg-emerald-500/10", icon: Brain },
  manual: { label: "Manual", color: "text-muted-foreground", bg: "bg-muted/50", icon: User },
}

export default function TodayTaskPage() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskPriority, setNewTaskPriority] = useState("medium")
  const [submitting, setSubmitting] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ title: "", description: "", priority: "medium" })
  const [filter, setFilter] = useState("all")
  const [showAISuggestions, setShowAISuggestions] = useState(true)
  const [aiSuggestion, setAiSuggestion] = useState(null)

  const fetchTasks = useCallback(async () => {
    try {
      const params = {}
      if (filter === "today") params.today = "true"
      if (filter === "pending") params.status = "pending"
      if (filter === "completed") params.status = "completed"
      const data = await getTasks(params)
      setTasks(data.tasks || [])
    } catch {
      toast.error("Failed to load tasks")
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  useEffect(() => {
    const pending = tasks.filter((t) => t.status !== "completed")
    const highPriority = tasks.filter((t) => t.priority === "high" || t.priority === "urgent")
    const overdue = tasks.filter((t) => t.dueDate && isPast(parseISO(t.dueDate)) && t.status !== "completed")

    if (highPriority.length > 0) {
      setAiSuggestion(`You have ${highPriority.length} high-priority task${highPriority.length > 1 ? "s" : ""}. Start with "${highPriority[0].title}".`)
    } else if (overdue.length > 0) {
      setAiSuggestion(`${overdue.length} task${overdue.length > 1 ? "s are" : " is"} overdue. Consider completing ${overdue.length > 1 ? "them" : "it"} first.`)
    } else if (pending.length > 0) {
      setAiSuggestion(`You have ${pending.length} pending task${pending.length > 1 ? "s" : ""}. Focus on one at a time.`)
    } else {
      setAiSuggestion("No pending tasks. You're all caught up!")
    }
  }, [tasks])

  const handleCreate = async () => {
    if (!newTaskTitle.trim()) return
    setSubmitting(true)
    try {
      const task = await createTask({
        title: newTaskTitle.trim(),
        priority: newTaskPriority,
      })
      setTasks((prev) => [task, ...prev])
      setNewTaskTitle("")
      toast.success("Task created")
    } catch (err) {
      toast.error(err.message || "Failed to create task")
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleCreate()
    }
  }

  const handleToggleStatus = async (task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed"
    try {
      const updated = await updateTask(task._id, { status: newStatus })
      setTasks((prev) => prev.map((t) => (t._id === task._id ? { ...t, ...updated } : t)))
      toast.success(newStatus === "completed" ? "Task completed" : "Task reopened")
    } catch (err) {
      toast.error(err.message || "Failed to update task")
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteTask(id)
      setTasks((prev) => prev.filter((t) => t._id !== id))
      toast.success("Task deleted")
    } catch (err) {
      toast.error(err.message || "Failed to delete task")
    }
  }

  const handleEditSave = async () => {
    if (!editForm.title.trim()) return
    setSubmitting(true)
    try {
      const updated = await updateTask(editTask._id, editForm)
      setTasks((prev) => prev.map((t) => (t._id === editTask._id ? { ...t, ...updated } : t)))
      setEditOpen(false)
      setEditTask(null)
      toast.success("Task updated")
    } catch (err) {
      toast.error(err.message || "Failed to update task")
    } finally {
      setSubmitting(false)
    }
  }

  const openEdit = (task) => {
    setEditTask(task)
    setEditForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
    })
    setEditOpen(true)
  }

  const todayCount = tasks.filter(
    (t) => t.dueDate && isToday(parseISO(t.dueDate)) && t.status !== "completed"
  ).length
  const completedToday = tasks.filter(
    (t) => t.status === "completed"
  ).length
  const aiDetectedCount = tasks.filter((t) => t.source === "ai_detection" || t.source === "microsoft_teams").length
  const priorityCount = tasks.filter((t) => (t.priority === "high" || t.priority === "urgent") && t.status !== "completed").length

  const filteredTasks = tasks
    .filter((t) => {
      if (filter === "today") return t.dueDate && isToday(parseISO(t.dueDate))
      if (filter === "pending") return t.status !== "completed"
      if (filter === "completed") return t.status === "completed"
      return true
    })
    .sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
      const aOrder = priorityOrder[a.priority] ?? 3
      const bOrder = priorityOrder[b.priority] ?? 3
      if (aOrder !== bOrder) return aOrder - bOrder
      return new Date(b.createdAt) - new Date(a.createdAt)
    })

  const pendingTasks = filteredTasks.filter((t) => t.status !== "completed")
  const completedTasks = filteredTasks.filter((t) => t.status === "completed")

  return (
    <div className="space-y-4 pb-8 sm:pb-0">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between animate-fade-in-up stagger-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Today&apos;s Task</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            AI-powered task management
          </p>
        </div>
      </div>

      {/* AI Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in-up stagger-1">
        <div className="rounded-xl border bg-card p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="rounded-lg bg-emerald-500/10 p-1.5">
              <ListTodo className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Due Today</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold">{loading ? "-" : todayCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="rounded-lg bg-blue-500/10 p-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Completed</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold">{loading ? "-" : completedToday}</p>
        </div>
        <div className="rounded-xl border bg-card p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="rounded-lg bg-purple-500/10 p-1.5">
              <Brain className="h-3.5 w-3.5 text-purple-500" />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">AI Detected</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold">{loading ? "-" : aiDetectedCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="rounded-lg bg-red-500/10 p-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Priority</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold">{loading ? "-" : priorityCount}</p>
        </div>
      </div>

      {/* AI Suggestion */}
      {showAISuggestions && aiSuggestion && (
        <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 to-transparent p-3 sm:p-4 animate-fade-in-up">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-1.5 mt-0.5 shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">AI Suggestion</p>
              <p className="text-sm text-foreground/80">{aiSuggestion}</p>
            </div>
            <button
              onClick={() => setShowAISuggestions(false)}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <span className="text-xs">Dismiss</span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Add */}
      <div className="flex gap-2 animate-fade-in-up">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Add a task... (e.g., Fix login page)"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
            <SelectTrigger className="w-28 sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleCreate} disabled={submitting || !newTaskTitle.trim()}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-1 rounded-lg border p-0.5 w-fit animate-fade-in-up">
        {[
          { value: "all", label: "All" },
          { value: "today", label: "Today" },
          { value: "pending", label: "Pending" },
          { value: "completed", label: "Completed" },
        ].map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter(f.value)}
            className="rounded-md px-3 text-xs"
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Task List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center animate-fade-in-up">
          <div className="rounded-xl bg-muted/50 p-4 mb-4">
            <ListTodo className="size-8 text-muted-foreground/30" />
          </div>
          <p className="text-muted-foreground font-medium">No tasks found</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {filter === "all"
              ? "Create your first task above"
              : filter === "today"
                ? "No tasks due today"
                : filter === "completed"
                  ? "No completed tasks"
                  : "No pending tasks"}
          </p>
          {filter === "completed" && tasks.length > 0 && (
            <p className="text-xs text-muted-foreground/60 mt-2">
              Complete some tasks to see them here
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3 animate-fade-in-up">
          {/* Pending Tasks */}
          {pendingTasks.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
                Pending ({pendingTasks.length})
              </p>
              <div className="space-y-1.5">
                {pendingTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onToggle={handleToggleStatus}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
                Completed ({completedTasks.length})
              </p>
              <div className="space-y-1.5">
                {completedTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onToggle={handleToggleStatus}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="Task title..."
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Add details..."
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Priority</label>
              <Select
                value={editForm.priority}
                onValueChange={(v) => setEditForm({ ...editForm, priority: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={submitting} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleEditSave} disabled={submitting} className="w-full sm:w-auto">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const isCompleted = task.status === "completed"
  const PriorityIcon = (priorityConfig[task.priority] || priorityConfig.medium).icon
  const SourceIcon = (sourceConfig[task.source] || sourceConfig.manual).icon

  return (
    <div
      className={`group rounded-xl border bg-card p-3 sm:p-4 transition-all hover:shadow-sm ${
        isCompleted ? "opacity-60" : ""
      } ${task.priority === "urgent" && !isCompleted ? "border-l-2 border-l-red-500" : ""} ${
        task.priority === "high" && !isCompleted ? "border-l-2 border-l-orange-500" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(task)}
          className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
        >
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          ) : (
            <Circle className="h-5 w-5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-sm font-medium cursor-pointer hover:text-primary transition-colors ${
                isCompleted ? "line-through text-muted-foreground" : ""
              }`}
              onClick={() => onEdit(task)}
            >
              {task.title}
            </span>
          </div>

          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
          )}

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Priority Badge */}
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${(priorityConfig[task.priority] || priorityConfig.medium).bg} ${(priorityConfig[task.priority] || priorityConfig.medium).color}`}>
              <PriorityIcon className="h-3 w-3" />
              {(priorityConfig[task.priority] || priorityConfig.medium).label}
            </span>

            {/* Source Badge */}
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${(sourceConfig[task.source] || sourceConfig.manual).bg} ${(sourceConfig[task.source] || sourceConfig.manual).color}`}>
              <SourceIcon className="h-3 w-3" />
              {(sourceConfig[task.source] || sourceConfig.manual).label}
            </span>

            {/* AI Confidence */}
            {task.confidenceScore && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
                <Brain className="h-3 w-3" />
                {Math.round(task.confidenceScore * 100)}%
              </span>
            )}

            {/* Assigned By */}
            {task.assignedByName && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <User className="h-3 w-3" />
                {task.assignedByName}
              </span>
            )}

            {/* Due Date */}
            {task.dueDate && (
              <span className={`inline-flex items-center gap-1 text-[10px] ${
                isPast(parseISO(task.dueDate)) && !isCompleted
                  ? "text-red-500 font-medium"
                  : "text-muted-foreground"
              }`}>
                <Clock className="h-3 w-3" />
                {format(parseISO(task.dueDate), "MMM d")}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDelete(task._id)}
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  )
}
