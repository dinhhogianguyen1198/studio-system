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
import { deleteServiceDefinitionAction } from "../../actions/service-definition.actions"

interface Props {
  id: string
  name: string
}

export function DeleteServiceDefinitionButton({ id, name }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  async function handleDelete() {
    setIsPending(true)
    const result = await deleteServiceDefinitionAction(id)
    setIsPending(false)
    if (result.success) {
      toast.success(`Đã xóa dịch vụ "${name}"`)
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
          <DialogTitle>Xóa dịch vụ</DialogTitle>
          <DialogDescription>
            Bạn có chắc muốn xóa dịch vụ <strong>{name}</strong>? Hành động này không thể hoàn tác.
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
