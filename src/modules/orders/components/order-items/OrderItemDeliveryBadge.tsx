"use client"

import { Badge } from "@/components/ui/badge"
import {
  ORDER_ITEM_DELIVERY_STATUS_LABELS,
  ORDER_ITEM_DELIVERY_STATUS_VARIANTS,
} from "../../types/orders.types"

interface Props {
  deliveryStatus: string
  deadline?: Date | string | null
}

export function OrderItemDeliveryBadge({ deliveryStatus, deadline }: Props) {
  const isOverdue =
    deliveryStatus === "PENDING" &&
    deadline != null &&
    new Date(deadline) < new Date()

  if (isOverdue) {
    return <Badge variant="destructive">Trễ hạn giao file</Badge>
  }

  return (
    <Badge variant={ORDER_ITEM_DELIVERY_STATUS_VARIANTS[deliveryStatus] ?? "secondary"}>
      {ORDER_ITEM_DELIVERY_STATUS_LABELS[deliveryStatus] ?? deliveryStatus}
    </Badge>
  )
}
