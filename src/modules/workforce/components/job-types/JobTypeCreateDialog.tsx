"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createJobTypeAction } from "@/modules/workforce/actions/job-type.actions"
import { JobTypeForm } from "./JobTypeForm"

interface Props {
  children: React.ReactNode
}

export function JobTypeCreateDialog({ children }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Thêm loại công việc</DialogTitle>
        </DialogHeader>
        <JobTypeForm
          action={createJobTypeAction}
          redirectTo="/dashboard/workforce/job-types"
        />
      </DialogContent>
    </Dialog>
  )
}
