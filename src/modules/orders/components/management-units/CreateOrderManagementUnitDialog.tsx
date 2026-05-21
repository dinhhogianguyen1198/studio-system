"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createOrderManagementUnitAction } from "../../actions/order-management-unit.actions"
import { OrderManagementUnitForm } from "./OrderManagementUnitForm"

export function CreateOrderManagementUnitDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Thêm đơn vị
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Thêm đơn vị quản lý đơn hàng</DialogTitle>
          <DialogDescription>Tạo đơn vị mới để phân loại và quản lý đơn hàng</DialogDescription>
        </DialogHeader>
        <OrderManagementUnitForm
          action={createOrderManagementUnitAction}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
