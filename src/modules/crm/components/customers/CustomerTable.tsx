"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Users } from "lucide-react"
import { CustomerDetailDialog } from "./CustomerDetailDialog"
import type { CustomerSummary } from "../../types/crm.types"
import {
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_SOURCE_LABELS,
} from "../../types/crm.types"
import type { PaginationMeta } from "@/shared/types/api.types"

// ─── Status badge ─────────────────────────────────────────────────────────────

function CustomerStatusBadge({ status }: { status: CustomerSummary["status"] }) {
  const variant =
    status === "ACTIVE"
      ? "success"
      : status === "INACTIVE"
        ? "muted"
        : "destructive"
  return <Badge variant={variant}>{CUSTOMER_STATUS_LABELS[status]}</Badge>
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ meta }: { meta: PaginationMeta }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function goToPage(page: number): void {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(page))
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center justify-between border-t px-2 py-3">
      <p className="text-sm text-muted-foreground">
        {(meta.page - 1) * meta.pageSize + 1}–
        {Math.min(meta.page * meta.pageSize, meta.total)} / {meta.total} khách hàng
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={meta.page <= 1}
          onClick={() => goToPage(meta.page - 1)}
        >
          <ChevronLeft className="size-4" />
          Trước
        </Button>
        <span className="text-sm">
          {meta.page} / {meta.totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={meta.page >= meta.totalPages}
          onClick={() => goToPage(meta.page + 1)}
        >
          Sau
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}

// ─── Table ────────────────────────────────────────────────────────────────────

interface CustomerTableProps {
  data: CustomerSummary[]
  meta: PaginationMeta
  currentUserId: string
}

export function CustomerTable({ data, meta, currentUserId }: CustomerTableProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
        <Users className="size-10 opacity-40" />
        <p className="text-sm">Chưa có khách hàng nào</p>
        <Button asChild size="sm">
          <Link href="/dashboard/customers/new">Tạo khách hàng đầu tiên</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>SĐT</TableHead>
              <TableHead>Công ty</TableHead>
              <TableHead>Nguồn</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Leads</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((customer) => (
              <TableRow
                key={customer.id}
                className="cursor-pointer"
                onClick={() => setSelectedCustomerId(customer.id)}
              >
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {customer.email ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {customer.phone ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {customer.company ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {CUSTOMER_SOURCE_LABELS[customer.source]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <CustomerStatusBadge status={customer.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {customer._count.leads}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination meta={meta} />
      </div>

      <CustomerDetailDialog
        customerId={selectedCustomerId}
        currentUserId={currentUserId}
        onClose={() => setSelectedCustomerId(null)}
      />
    </>
  )
}
