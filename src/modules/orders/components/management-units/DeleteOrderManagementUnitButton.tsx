"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { deleteOrderManagementUnitAction } from "../../actions/order-management-unit.actions"

interface Props {
  id: string
  name: string
}

export function DeleteOrderManagementUnitButton({ id, name }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  async function handleDelete(): Promise<void> {
    setIsPending(true)
    const result = await deleteOrderManagementUnitAction(id)
    setIsPending(false)
    if (result.success) {
      toast.success(`Đã xóa "${name}"`)
      setOpen(false)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xóa đơn vị quản lý</DialogTitle>
          <DialogDescription>
            Bạn có chắc muốn xóa <strong>{name}</strong>? Đơn hàng đã gán sẽ không bị ảnh hưởng.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? "Đang xóa..." : "Xóa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
