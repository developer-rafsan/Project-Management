"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"

export default function SharedEditForm({ project, apiPath, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    projectName: project.projectName || "",
    websiteUrl: project.websiteUrl || "",
    websiteUsername: project.websiteUsername || "",
    orderId: project.orderId || "",
    cms: project.cms || "",
    priority: project.priority || "Medium",
    description: project.description || "",
    price: project.price || "",
    startDate: project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : "",
    tags: project.tags || [],
    websitePassword: "",
  })
  const [tagInput, setTagInput] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body = { ...formData }
      if (body.price) body.price = Number(body.price)
      if (!body.websitePassword) delete body.websitePassword
      const res = await fetch(apiPath, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update")
      onSuccess(data)
    } catch (err) {
      toast.error(err.message || "Failed to update project")
    } finally {
      setSaving(false)
    }
  }

  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }))
      setTagInput("")
    }
  }

  const removeTag = (tag) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }))
  }

  const inputClass = "flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Project Name</label>
          <input value={formData.projectName} onChange={(e) => setFormData((p) => ({ ...p, projectName: e.target.value }))} className={inputClass} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Order ID</label>
          <input value={formData.orderId} onChange={(e) => setFormData((p) => ({ ...p, orderId: e.target.value }))} className={inputClass} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">CMS</label>
          <input value={formData.cms} onChange={(e) => setFormData((p) => ({ ...p, cms: e.target.value }))} className={inputClass} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Website URL</label>
          <input value={formData.websiteUrl} onChange={(e) => setFormData((p) => ({ ...p, websiteUrl: e.target.value }))} className={inputClass} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Website Username</label>
          <input value={formData.websiteUsername} onChange={(e) => setFormData((p) => ({ ...p, websiteUsername: e.target.value }))} className={inputClass} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Website Password</label>
          <input type="password" value={formData.websitePassword} onChange={(e) => setFormData((p) => ({ ...p, websitePassword: e.target.value }))} placeholder="Leave blank to keep current" className={inputClass} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Priority</label>
          <select value={formData.priority} onChange={(e) => setFormData((p) => ({ ...p, priority: e.target.value }))} className={inputClass}>
            <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Price</label>
          <input type="number" value={formData.price} onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))} className={inputClass} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Start Date</label>
          <input type="date" value={formData.startDate} onChange={(e) => setFormData((p) => ({ ...p, startDate: e.target.value }))} className={inputClass} />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Tags</label>
        <div className="flex gap-2">
          <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag() } }} placeholder="Add a tag..." className="flex h-9 flex-1 rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm" />
          <Button type="button" variant="outline" size="sm" onClick={addTag}>Add</Button>
        </div>
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {formData.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="text-muted-foreground hover:text-foreground cursor-pointer">&times;</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <textarea value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} rows={3} className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm" />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
      </DialogFooter>
    </form>
  )
}
