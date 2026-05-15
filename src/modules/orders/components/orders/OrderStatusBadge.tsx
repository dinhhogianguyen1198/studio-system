import { Badge } from "@/components/ui/badge"
import { ORDER_STATUS_LABELS, ORDER_STATUS_VARIANTS } from "../../types/orders.types"

interface Props {
  status: string
}

export function OrderStatusBadge({ status }: Props) {
  return (
    <Badge variant={ORDER_STATUS_VARIANTS[status] ?? "secondary"}>
      {ORDER_STATUS_LABELS[status] ?? status}
    </Badge>
  )
}
