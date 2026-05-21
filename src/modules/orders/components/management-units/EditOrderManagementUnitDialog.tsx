"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { updateOrderManagementUnitAction } from "../../actions/order-management-unit.actions"
import type { OrderManagementUnitSummary } from "../../types/order-management-unit.types"
import { OrderManagementUnitForm } from "./OrderManagementUnitForm"

interface Props {
  unit: OrderManagementUnitSummary | null
  onClose: () => void
}

export function EditOrderManagementUnitDialog({ unit, onClose }: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(!!unit)
  }, [unit])

  function handleOpenChange(value: boolean): void {
    if (!value) onClose()
    setOpen(value)
  }

  if (!unit) return null

  const boundAction = updateOrderManagementUnitAction.bind(null, unit.id)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa đơn vị quản lý</DialogTitle>
          <DialogDescription>{unit.name}</DialogDescription>
        </DialogHeader>
        <OrderManagementUnitForm
          key={unit.id}
          action={boundAction}
          defaultValues={unit}
          submitLabel="Lưu thay đổi"
          onSuccess={onClose}
        />
      </DialogContent>
    </Dialog>
  )
}
