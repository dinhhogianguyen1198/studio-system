import { Badge } from "@/components/ui/badge"

interface Props {
  isActive: boolean
}

export function WorkerStatusBadge({ isActive }: Props) {
  return (
    <Badge
      variant={isActive ? "default" : "secondary"}
      className={isActive ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
    >
      {isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
    </Badge>
  )
}
