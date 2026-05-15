"use client"

import Link from "next/link"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Pencil } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { JobTypeBadge } from "./JobTypeBadge"
import { DeleteJobTypeButton } from "./DeleteJobTypeButton"
import type { JobTypeSummary } from "@/modules/workforce/types/workforce.types"

interface Props {
  jobTypes: JobTypeSummary[]
}

export function JobTypeTable({ jobTypes }: Props) {
  const columns: ColumnDef<JobTypeSummary>[] = [
    {
      id: "name",
      header: "Tên",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <JobTypeBadge
            name={row.original.name}
            color={row.original.color}
            size="sm"
          />
        </div>
      ),
    },
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({ row }) => (
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
          {row.original.slug}
        </code>
      ),
    },
    {
      id: "workers",
      header: "Nhân viên",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original._count.workers} nhân viên
        </span>
      ),
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: ({ row }) =>
        row.original.isActive ? (
          <Badge
            variant="default"
            className="bg-green-100 text-green-800 hover:bg-green-100"
          >
            Đang hoạt động
          </Badge>
        ) : (
          <Badge variant="secondary">Ngừng hoạt động</Badge>
        ),
    },
    {
      accessorKey: "sortOrder",
      header: "Thứ tự",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.sortOrder}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link
                href={`/dashboard/workforce/job-types/${row.original.id}/edit`}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Chỉnh sửa
              </Link>
            </DropdownMenuItem>
            <DeleteJobTypeButton
              id={row.original.id}
              name={row.original.name}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const table = useReactTable({
    data: jobTypes,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => (
                <TableHead key={h.id}>
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                Không có loại công việc nào.
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
