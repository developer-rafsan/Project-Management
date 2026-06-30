"use client"

import { useState, useEffect } from "react"
import { getNotes, createNote, updateNote, deleteNote } from "@/actions/noteActions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function NotesPage() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editNote, setEditNote] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ title: "", content: "" })

  const fetchNotes = async () => {
    try {
      const data = await getNotes()
      setNotes(data.notes || [])
    } catch {
      toast.error("Failed to load notes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotes()
  }, [])

  const openCreate = () => {
    setEditNote(null)
    setForm({ title: "", content: "" })
    setOpen(true)
  }

  const openEdit = (note) => {
    setEditNote(note)
    setForm({ title: note.title || "", content: note.content })
    setOpen(true)
  }

  const handleSave = async () => {
    if (!form.content.trim()) {
      toast.error("Content is required")
      return
    }
    setSubmitting(true)
    try {
      if (editNote) {
        await updateNote(editNote._id, form)
        toast.success("Note updated")
      } else {
        await createNote(form)
        toast.success("Note created")
      }
      setOpen(false)
      fetchNotes()
    } catch (err) {
      toast.error(err.message || "Failed to save note")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteNote(deleteId)
      toast.success("Note deleted")
      setDeleteId(null)
      fetchNotes()
    } catch (err) {
      toast.error(err.message || "Failed to delete note")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notes</h1>
          <p className="text-sm text-muted-foreground">
            {notes.length} {notes.length === 1 ? "note" : "notes"}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Add Note
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl border bg-card p-4 animate-pulse">
              <div className="h-5 w-3/4 mb-3 rounded bg-muted" />
              <div className="h-4 w-full mb-2 rounded bg-muted" />
              <div className="h-4 w-2/3 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground mb-4">No notes yet</p>
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Create your first note
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <div
              key={note._id}
              className="group relative rounded-xl border bg-card p-4 hover:shadow-md transition-shadow"
            >
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => openEdit(note)}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setDeleteId(note._id)}
                >
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </div>
              {note.title && (
                <h3 className="font-semibold mb-1 pr-12 truncate">{note.title}</h3>
              )}
              <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">
                {note.content}
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                {new Date(note.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editNote ? "Edit Note" : "New Note"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Title <span className="text-muted-foreground">(optional)</span></label>
              <Input
                placeholder="Note title..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Content</label>
              <Textarea
                placeholder="Write your note..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {editNote ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Note</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this note? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
