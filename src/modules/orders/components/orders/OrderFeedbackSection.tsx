"use client"

import { useActionState, useEffect, useState, useTransition } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { MessageSquarePlus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { ActionResult } from "@/shared/types/api.types"
import { createOrderFeedbackAction, deleteOrderFeedbackAction } from "../../actions/order-item.actions"

interface Feedback {
  id: string
  content: string
  createdAt: string
  createdBy: { id: string; name: string | null }
}

interface Props {
  orderId: string
  feedbacks: Feedback[]
}

const textareaClass =
  "w-full resize-none rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"

const initialState: ActionResult<void> = { success: false, error: "" }

function AddFeedbackDialog({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState("")
  const [state, formAction, isPending] = useActionState(createOrderFeedbackAction, initialState)

  useEffect(() => {
    if (state.success) {
      toast.success("Đã ghi nhận phản hồi")
      setContent("")
      setOpen(false)
    } else if (!state.success && state.error) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <MessageSquarePlus className="h-3.5 w-3.5" />
          Thêm phản hồi
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ghi nhận phản hồi khách hàng</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="orderId" value={orderId} />
          <div className="space-y-1.5">
            <label htmlFor="feedback-content" className="block text-sm font-medium">
              Nội dung phản hồi <span className="text-destructive">*</span>
            </label>
            <textarea
              id="feedback-content"
              name="content"
              rows={5}
              placeholder="Nhập phản hồi của khách hàng..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={textareaClass}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang lưu..." : "Lưu phản hồi"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteFeedbackButton({ feedback, orderId }: { feedback: Feedback; orderId: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteOrderFeedbackAction(feedback.id, orderId)
      if (result.success) {
        toast.success("Đã xóa phản hồi")
        setOpen(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 shrink-0 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Xóa phản hồi</DialogTitle>
          <DialogDescription>Bạn có chắc muốn xóa phản hồi này?</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? "Đang xóa..." : "Xóa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function OrderFeedbackSection({ orderId, feedbacks }: Props) {
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquarePlus className="size-4 text-primary" />
            Phản hồi khách hàng
            {feedbacks.length > 0 && (
              <span className="text-xs font-normal text-muted-foreground">({feedbacks.length})</span>
            )}
          </CardTitle>
          <AddFeedbackDialog orderId={orderId} />
        </div>
      </CardHeader>
      <CardContent className="pt-3 pb-4">
        {feedbacks.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground italic">
            Chưa có phản hồi nào được ghi nhận.
          </p>
        ) : (
          <div className="space-y-3">
            {feedbacks.map((fb) => (
              <div key={fb.id} className="rounded-lg border border-border bg-muted/30 px-3.5 py-3">
                <div className="flex items-start gap-2">
                  <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm text-foreground">
                    {fb.content}
                  </p>
                  <DeleteFeedbackButton feedback={fb} orderId={orderId} />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {fb.createdBy.name ?? "—"} •{" "}
                  {format(new Date(fb.createdAt), "HH:mm dd/MM/yyyy", { locale: vi })}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
