"use client"

import { useActionState, useEffect } from "react"
import { toast } from "sonner"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { sendInvoiceAction } from "../../actions/invoice.actions"

export function SendInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const [state, formAction, isPending] = useActionState(sendInvoiceAction, { success: false as const, error: "" })
  useEffect(() => {
    if (state.success) toast.success("Đã đánh dấu là đã gửi")
    else if (!state.success && state.error) toast.error(state.error)
  }, [state])
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={invoiceId} />
      <Button type="submit" size="sm" disabled={isPending}>
        <Send className="mr-1.5 h-3.5 w-3.5" />
        {isPending ? "Đang gửi..." : "Đánh dấu đã gửi"}
      </Button>
    </form>
  )
}
