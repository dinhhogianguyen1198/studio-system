"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CreateCustomerForm } from "./CustomerForm"

interface Props {
  onSuccess?: (id: string) => void
}

export function CreateCustomerButton({ onSuccess }: Props) {
  const [open, setOpen] = useState(false)

  function handleSuccess(id: string): void {
    setOpen(false)
    onSuccess?.(id)
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Thêm khách hàng
      </Button>
      <CreateCustomerDialog
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  )
}

interface DialogProps {
  open: boolean
  onClose: () => void
  onSuccess: (id: string) => void
}

export function CreateCustomerDialog({ open, onClose, onSuccess }: DialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Thêm khách hàng</DialogTitle>
          <DialogDescription>Tạo hồ sơ khách hàng mới</DialogDescription>
        </DialogHeader>
        {open && <CreateCustomerForm onSuccess={onSuccess} />}
      </DialogContent>
    </Dialog>
  )
}
