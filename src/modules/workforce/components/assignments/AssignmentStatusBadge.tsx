import { Badge, type BadgeProps } from "@/components/ui/badge"
import { ASSIGNMENT_STATUS_LABELS } from "@/modules/workforce/types/workforce.types"
import type { WorkerAssignmentStatus } from "@/modules/workforce/types/workforce.types"

const STATUS_VARIANTS: Record<WorkerAssignmentStatus, BadgeProps["variant"]> = {
  IN_PROGRESS: "warning",
  COMPLETED: "success",
}

interface Props {
  status: WorkerAssignmentStatus
}

export function AssignmentStatusBadge({ status }: Props) {
  return (
    <Badge variant={STATUS_VARIANTS[status]}>
      {ASSIGNMENT_STATUS_LABELS[status]}
    </Badge>
  )
}
