"use client"

import { useActionState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { MessageSquare, Trash2, User } from "lucide-react"
import type { ActionResult } from "@/shared/types/api.types"
import type { CustomerNoteRow, LeadNoteRow } from "../../types/crm.types"

// ─── Types ────────────────────────────────────────────────────────────────────

type NoteRow = CustomerNoteRow | LeadNoteRow

interface NoteTimelineProps {
  notes: NoteRow[]
  addAction: (_prevState: ActionResult<void>, formData: FormData) => Promise<ActionResult<void>>
  deleteAction: (noteId: string) => Promise<ActionResult<void>>
  currentUserId: string
}

// ─── Add note form ────────────────────────────────────────────────────────────

const addInitial: ActionResult<void> = { success: false, error: "" }

function AddNoteForm({
  addAction,
}: {
  addAction: (_prev: ActionResult<void>, fd: FormData) => Promise<ActionResult<void>>
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, isPending] = useActionState(addAction, addInitial)

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
    }
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <Textarea
        name="content"
        placeholder="Thêm ghi chú..."
        rows={3}
        required
        className={!state.success && state.fieldErrors?.content ? "border-red-400" : ""}
      />
      {!state.success && state.error && (
        <p className="text-xs text-red-600">{state.error}</p>
      )}
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Đang lưu..." : "Thêm ghi chú"}
      </Button>
    </form>
  )
}

// ─── Single note ──────────────────────────────────────────────────────────────

function NoteItem({
  note,
  canDelete,
  onDelete,
}: {
  note: NoteRow
  canDelete: boolean
  onDelete: () => void
}) {
  const date = new Date(note.createdAt)
  const formatted = date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <User className="size-4 text-muted-foreground" />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">
            {note.author.name ?? note.author.email}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{formatted}</span>
            {canDelete && (
              <button
                onClick={onDelete}
                className="text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Xóa ghi chú"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        </div>
        <p className="text-sm whitespace-pre-wrap text-foreground/80">{note.content}</p>
      </div>
    </div>
  )
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

export function NoteTimeline({
  notes,
  addAction,
  deleteAction,
  currentUserId,
}: NoteTimelineProps) {
  return (
    <div className="space-y-6">
      {/* Add note */}
      <AddNoteForm addAction={addAction} />

      {notes.length > 0 && <Separator />}

      {/* Note list */}
      {notes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
          <MessageSquare className="size-8 opacity-40" />
          <p className="text-sm">Chưa có ghi chú nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              canDelete={note.author.id === currentUserId}
              onDelete={() => deleteAction(note.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
