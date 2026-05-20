"use client"

import { useState } from "react"
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
import type { WorkflowTemplateSummary } from "@/modules/workflow/types/workflow.types"
import { DeleteServiceDefinitionButton } from "./DeleteServiceDefinitionButton"
import { EditServiceDefinitionDialog } from "./EditServiceDefinitionDialog"

interface Props {
  services: SerializedServiceDefinitionSummary[]
  workflowTemplates: WorkflowTemplateSummary[]
}

export function ServiceDefinitionTable({ services, workflowTemplates }: Props) {
  const [editingService, setEditingService] = useState<SerializedServiceDefinitionSummary | null>(null)

  if (services.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border py-12 text-center text-sm">
        Chưa có dịch vụ nào.
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tên dịch vụ</TableHead>
            <TableHead>Giá mặc định</TableHead>
            <TableHead>Thời hạn trả file</TableHead>
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
                {svc.defaultDurationDays != null ? (
                  <span className="text-sm">{svc.defaultDurationDays} ngày</span>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
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
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingService(svc)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <DeleteServiceDefinitionButton id={svc.id} name={svc.name} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <EditServiceDefinitionDialog
        service={editingService}
        workflowTemplates={workflowTemplates}
        onClose={() => setEditingService(null)}
      />
    </>
  )
}
