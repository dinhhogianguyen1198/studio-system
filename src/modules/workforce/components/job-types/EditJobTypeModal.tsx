"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { updateJobTypeAction } from "@/modules/workforce/actions/job-type.actions"
import { JobTypeForm } from "./JobTypeForm"
import type { JobTypeSummary } from "@/modules/workforce/types/workforce.types"

interface Props {
  jobType: JobTypeSummary
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditJobTypeModal({ jobType, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa loại công việc</DialogTitle>
        </DialogHeader>
        <JobTypeForm
          action={updateJobTypeAction}
          defaultValues={jobType}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
