import { Badge } from "@/components/ui/badge"

interface Props {
  isActive: boolean
}

export function WorkerStatusBadge({ isActive }: Props) {
  return (
    <Badge variant={isActive ? "success" : "muted"}>
      {isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
    </Badge>
  )
}
