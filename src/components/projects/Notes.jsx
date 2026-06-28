"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Plus, Pencil, Trash2, Check, X, Loader2 } from "lucide-react"
import { getProjectNotes, createNote, updateNote, deleteNote } from "@/actions/projectActions"
import { useSession } from "next-auth/react"

export default function Notes({ projectId }) {
  const { data: session } = useSession()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [newContent, setNewContent] = useState("")
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editContent, setEditContent] = useState("")

  const fetchNotes = async () => {
    try {
      const data = await getProjectNotes(projectId)
      setNotes(data)
    } catch {
      toast.error("Failed to load notes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotes()
  }, [projectId])

  const handleAdd = async () => {
    if (!newContent.trim()) return
    setAdding(true)
    try {
      const note = await createNote(projectId, { content: newContent.trim() })
      setNotes((prev) => [note, ...prev])
      setNewContent("")
      toast.success("Note added")
    } catch (err) {
      toast.error(err.message || "Failed to add note")
    } finally {
      setAdding(false)
    }
  }

  const handleUpdate = async (noteId) => {
    if (!editContent.trim()) return
    try {
      const updated = await updateNote(projectId, noteId, { content: editContent.trim() })
      setNotes((prev) => prev.map((n) => (n._id === noteId ? updated : n)))
      setEditingId(null)
      setEditContent("")
      toast.success("Note updated")
    } catch (err) {
      toast.error(err.message || "Failed to update note")
    }
  }

  const handleDelete = async (noteId) => {
    try {
      await deleteNote(projectId, noteId)
      setNotes((prev) => prev.filter((n) => n._id !== noteId))
      toast.success("Note deleted")
    } catch (err) {
      toast.error(err.message || "Failed to delete note")
    }
  }

  const startEdit = (note) => {
    setEditingId(note._id)
    setEditContent(note.content)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditContent("")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Write a note..."
            rows={2}
          />
          <Button onClick={handleAdd} disabled={adding || !newContent.trim()} size="sm">
            {adding && <Loader2 className="size-3.5 animate-spin" />}
            <Plus className="size-3.5" />
            Add Note
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : notes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No notes yet</p>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note._id} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  {editingId === note._id ? (
                    <div className="flex-1 space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={2}
                      />
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleUpdate(note._id)} disabled={!editContent.trim()}>
                          <Check className="size-3.5" />
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEdit}>
                          <X className="size-3.5" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap flex-1">{note.content}</p>
                  )}
                  {editingId !== note._id && session?.user?.id === note.createdBy?._id && (
                    <div className="flex gap-0.5 shrink-0">
                      <Button variant="ghost" size="icon-xs" onClick={() => startEdit(note)}>
                        <Pencil className="size-3" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => handleDelete(note._id)}>
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Avatar size="sm">
                    <AvatarImage src={note.createdBy?.image} />
                    <AvatarFallback className="text-[10px]">
                      {note.createdBy?.name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{note.createdBy?.name || "Unknown"}</span>
                  <span>·</span>
                  <span>{format(new Date(note.createdAt), "MMM d, yyyy h:mm a")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
