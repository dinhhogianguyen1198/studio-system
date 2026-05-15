"use client"

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
import { ChevronLeft, ChevronRight, Eye, Pencil, TrendingUp } from "lucide-react"
import { LeadStatusBadge, LeadPriorityBadge } from "./LeadStatusBadge"
import type { LeadSummary } from "../../types/crm.types"
import { CUSTOMER_SOURCE_LABELS } from "../../types/crm.types"
import type { PaginationMeta } from "@/shared/types/api.types"

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ meta }: { meta: PaginationMeta }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(page))
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center justify-between border-t px-2 py-3">
      <p className="text-sm text-muted-foreground">
        {(meta.page - 1) * meta.pageSize + 1}–
        {Math.min(meta.page * meta.pageSize, meta.total)} / {meta.total} leads
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

interface LeadTableProps {
  data: LeadSummary[]
  meta: PaginationMeta
}

function formatValue(value: string | null, currency: string) {
  if (!value) return "—"
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency }).format(
    Number(value)
  )
}

export function LeadTable({ data, meta }: LeadTableProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
        <TrendingUp className="size-10 opacity-40" />
        <p className="text-sm">Chưa có lead nào</p>
        <Button asChild size="sm">
          <Link href="/dashboard/leads/new">Tạo lead đầu tiên</Link>
        </Button>
      </div>
    )
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tiêu đề</TableHead>
            <TableHead>Liên hệ</TableHead>
            <TableHead>Khách hàng</TableHead>
            <TableHead>Giá trị</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Ưu tiên</TableHead>
            <TableHead>Nguồn</TableHead>
            <TableHead>Giao cho</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="font-medium">
                <Link
                  href={`/dashboard/leads/${lead.id}`}
                  className="hover:underline"
                >
                  {lead.title}
                </Link>
              </TableCell>
              <TableCell>
                <div>
                  <p className="text-sm font-medium">{lead.contactName}</p>
                  {lead.contactEmail && (
                    <p className="text-xs text-muted-foreground">{lead.contactEmail}</p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {lead.customer ? (
                  <Link
                    href={`/dashboard/customers/${lead.customer.id}`}
                    className="text-sm hover:underline"
                  >
                    {lead.customer.name}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="font-medium">
                {formatValue(lead.value, lead.currency)}
              </TableCell>
              <TableCell>
                <LeadStatusBadge status={lead.status} />
              </TableCell>
              <TableCell>
                <LeadPriorityBadge priority={lead.priority} />
              </TableCell>
              <TableCell>
                <Badge variant="outline">{CUSTOMER_SOURCE_LABELS[lead.source]}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {lead.assignedTo?.name ?? lead.assignedTo?.email ?? "—"}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/dashboard/leads/${lead.id}`}>
                      <Eye className="size-4" />
                      <span className="sr-only">Xem</span>
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/dashboard/leads/${lead.id}/edit`}>
                      <Pencil className="size-4" />
                      <span className="sr-only">Sửa</span>
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination meta={meta} />
    </div>
  )
}
