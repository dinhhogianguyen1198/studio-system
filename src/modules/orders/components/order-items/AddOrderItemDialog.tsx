"use client"

import { useState, useActionState, useEffect } from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { ActionResult } from "@/shared/types/api.types"
import type { SerializedServiceDefinitionSummary } from "@/modules/services/types/services.types"
import { addOrderItemAction } from "../../actions/order-item.actions"

interface Props {
  orderId: string
  services: SerializedServiceDefinitionSummary[]
}

const initialState: ActionResult<void> = { success: false, error: "" }

export function AddOrderItemDialog({ orderId, services }: Props) {
  const [open, setOpen] = useState(false)
  const action = addOrderItemAction.bind(null, orderId)
  const [state, formAction, isPending] = useActionState(action, initialState)
  const [selectedPrice, setSelectedPrice] = useState<number | "">("")

  useEffect(() => {
    if (state.success) {
      toast.success("Đã thêm dịch vụ")
      setOpen(false)
    } else if (!state.success && state.error) {
      toast.error(state.error)
    }
  }, [state])

  function handleServiceChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const svc = services.find((s) => s.id === e.target.value)
    setSelectedPrice(svc ? Number(svc.defaultPrice) : "")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Thêm dịch vụ
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Thêm dịch vụ vào đơn</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="orderId" value={orderId} />

          <div className="space-y-1.5">
            <label htmlFor="serviceDefinitionId" className="block text-sm font-medium">
              Dịch vụ <span className="text-red-500">*</span>
            </label>
            <Select
              id="serviceDefinitionId"
              name="serviceDefinitionId"
              onChange={handleServiceChange}
              defaultValue=""
            >
              <option value="" disabled>
                Chọn dịch vụ
              </option>
              {services.map((svc) => (
                <option key={svc.id} value={svc.id}>
                  {svc.name} — {Number(svc.defaultPrice).toLocaleString("vi-VN")} {svc.currency}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="price" className="block text-sm font-medium">
                Giá (VND) <span className="text-red-500">*</span>
              </label>
              <Input
                id="price"
                name="price"
                type="number"
                min={0}
                step={1000}
                value={selectedPrice}
                onChange={(e) => setSelectedPrice(Number(e.target.value))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="quantity" className="block text-sm font-medium">
                Số lượng
              </label>
              <Input id="quantity" name="quantity" type="number" min={1} defaultValue={1} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="deadline" className="block text-sm font-medium">
              Deadline
            </label>
            <Input id="deadline" name="deadline" type="datetime-local" />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="notes" className="block text-sm font-medium">
              Ghi chú
            </label>
            <Textarea id="notes" name="notes" rows={2} placeholder="Yêu cầu cụ thể..." />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang thêm..." : "Thêm dịch vụ"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
