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
import { createServiceDefinitionAction } from "@/modules/services/actions/service-definition.actions"
import type { WorkflowTemplateSummary } from "@/modules/workflow/types/workflow.types"
import { ServiceDefinitionForm } from "./ServiceDefinitionForm"

interface Props {
  workflowTemplates: WorkflowTemplateSummary[]
}

export function CreateServiceDefinitionDialog({ workflowTemplates }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Thêm dịch vụ
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Thêm dịch vụ</DialogTitle>
          <DialogDescription>Tạo dịch vụ mới cho studio</DialogDescription>
        </DialogHeader>
        <ServiceDefinitionForm
          action={createServiceDefinitionAction}
          workflowTemplates={workflowTemplates}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
