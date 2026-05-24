"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { updateServiceDefinitionAction } from "@/modules/services/actions/service-definition.actions"
import type { SerializedServiceDefinitionSummary } from "../../types/services.types"
import { ServiceDefinitionForm } from "./ServiceDefinitionForm"

interface Props {
  service: SerializedServiceDefinitionSummary | null
  onClose: () => void
}

export function EditServiceDefinitionDialog({ service, onClose }: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(!!service)
  }, [service])

  function handleOpenChange(value: boolean): void {
    if (!value) onClose()
    setOpen(value)
  }

  if (!service) return null

  const boundAction = updateServiceDefinitionAction.bind(null, service.id)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa dịch vụ</DialogTitle>
          <DialogDescription>{service.name}</DialogDescription>
        </DialogHeader>
        <ServiceDefinitionForm
          key={service.id}
          action={boundAction}
          defaultValues={service}
          submitLabel="Lưu thay đổi"
          onSuccess={onClose}
        />
      </DialogContent>
    </Dialog>
  )
}
