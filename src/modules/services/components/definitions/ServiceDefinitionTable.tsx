"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Pencil } from "lucide-react"
import type { SerializedServiceDefinitionSummary } from "../../types/services.types"
import { DeleteServiceDefinitionButton } from "./DeleteServiceDefinitionButton"

interface Props {
  services: SerializedServiceDefinitionSummary[]
}

export function ServiceDefinitionTable({ services }: Props) {
  if (services.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border py-12 text-center text-sm">
        Chưa có dịch vụ nào.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tên dịch vụ</TableHead>
          <TableHead>Giá mặc định</TableHead>
          <TableHead>SLA</TableHead>
          <TableHead>Workflow</TableHead>
          <TableHead className="text-center">Trạng thái</TableHead>
          <TableHead className="text-right">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {services.map((svc) => (
          <TableRow key={svc.id}>
            <TableCell>
              <div>
                <p className="font-medium">{svc.name}</p>
                <p className="text-muted-foreground font-mono text-xs">{svc.slug}</p>
              </div>
            </TableCell>
            <TableCell>
              {svc.defaultPrice.toLocaleString("vi-VN")} {svc.currency}
            </TableCell>
            <TableCell>
              <span className="text-sm">{svc.defaultSlaHours}h</span>
              <span className="text-muted-foreground ml-1 text-xs">
                ({svc.defaultDurationDays} ngày)
              </span>
            </TableCell>
            <TableCell>
              {svc.workflowTemplate ? (
                <Badge variant="outline">{svc.workflowTemplate.name}</Badge>
              ) : (
                <span className="text-muted-foreground text-xs">Chưa gán</span>
              )}
            </TableCell>
            <TableCell className="text-center">
              <Badge variant={svc.isActive ? "default" : "secondary"}>
                {svc.isActive ? "Hoạt động" : "Tạm dừng"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/dashboard/services/${svc.id}/edit`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
                <DeleteServiceDefinitionButton id={svc.id} name={svc.name} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
