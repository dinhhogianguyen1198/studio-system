"use client"

import { useActionState, useEffect } from "react"
import { toast } from "sonner"
import { Ban } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cancelInvoiceAction } from "../../actions/invoice.actions"

export function CancelInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const [state, formAction, isPending] = useActionState(cancelInvoiceAction, { success: false as const, error: "" })
  useEffect(() => {
    if (state.success) toast.success("Đã hủy hóa đơn")
    else if (!state.success && state.error) toast.error(state.error)
  }, [state])
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={invoiceId} />
      <Button type="submit" size="sm" variant="outline" disabled={isPending}>
        <Ban className="mr-1.5 h-3.5 w-3.5" />
        {isPending ? "Đang hủy..." : "Hủy hóa đơn"}
      </Button>
    </form>
  )
}
