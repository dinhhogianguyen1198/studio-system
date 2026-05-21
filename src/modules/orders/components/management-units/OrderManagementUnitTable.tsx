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
import type { OrderManagementUnitSummary } from "../../types/order-management-unit.types"
import { DeleteOrderManagementUnitButton } from "./DeleteOrderManagementUnitButton"
import { EditOrderManagementUnitDialog } from "./EditOrderManagementUnitDialog"

interface Props {
  units: OrderManagementUnitSummary[]
}

export function OrderManagementUnitTable({ units }: Props) {
  const [editingUnit, setEditingUnit] = useState<OrderManagementUnitSummary | null>(null)

  if (units.length === 0) {
    return (
      <div className="rounded-lg border border-border py-12 text-center text-sm text-muted-foreground">
        Chưa có đơn vị quản lý nào.
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tên đơn vị</TableHead>
            <TableHead>Mô tả</TableHead>
            <TableHead className="text-center">Thứ tự</TableHead>
            <TableHead className="text-center">Trạng thái</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {units.map((unit) => (
            <TableRow key={unit.id}>
              <TableCell>
                <p className="font-medium">{unit.name}</p>
              </TableCell>
              <TableCell>
                {unit.description ? (
                  <p className="max-w-xs truncate text-sm text-muted-foreground">
                    {unit.description}
                  </p>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-center text-sm">{unit.sortOrder}</TableCell>
              <TableCell className="text-center">
                <Badge variant={unit.isActive ? "default" : "secondary"}>
                  {unit.isActive ? "Hoạt động" : "Tạm dừng"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditingUnit(unit)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <DeleteOrderManagementUnitButton id={unit.id} name={unit.name} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <EditOrderManagementUnitDialog
        unit={editingUnit}
        onClose={() => setEditingUnit(null)}
      />
    </>
  )
}
