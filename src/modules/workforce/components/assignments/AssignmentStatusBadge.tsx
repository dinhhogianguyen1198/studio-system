import {
  ASSIGNMENT_STATUS_LABELS,
  ASSIGNMENT_STATUS_COLORS,
} from "@/modules/workforce/types/workforce.types"
import type { WorkerAssignmentStatus } from "@/modules/workforce/types/workforce.types"

interface Props {
  status: WorkerAssignmentStatus
}

export function AssignmentStatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ASSIGNMENT_STATUS_COLORS[status]}`}
    >
      {ASSIGNMENT_STATUS_LABELS[status]}
    </span>
  )
}
