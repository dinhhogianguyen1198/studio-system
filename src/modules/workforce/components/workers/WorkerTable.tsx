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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreHorizontal, Pencil } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { WorkerStatusBadge } from "./WorkerStatusBadge"
import { DeleteWorkerButton } from "./DeleteWorkerButton"
import type { WorkerSummary } from "@/modules/workforce/types/workforce.types"

interface Props {
  workers: WorkerSummary[]
}

export function WorkerTable({ workers }: Props) {
  const columns: ColumnDef<WorkerSummary>[] = [
    {
      id: "worker",
      header: "Nhân viên",
      cell: ({ row }) => {
        const w = row.original
        const initials = w.name
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={w.avatarUrl ?? undefined} alt={w.name} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <Link
                href={`/dashboard/workforce/workers/${w.id}`}
                className="font-medium hover:underline"
              >
                {w.name}
              </Link>
              {w.email && (
                <p className="text-xs text-muted-foreground">{w.email}</p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "phone",
      header: "Số điện thoại",
      cell: ({ row }) =>
        row.original.phone ?? (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "jobTypes",
      header: "Vai trò",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.jobTypes.map((wjt) => (
            <span
              key={wjt.jobType.id}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: `${wjt.jobType.color}20`,
                color: wjt.jobType.color,
              }}
            >
              {wjt.isPrimary && (
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
              )}
              {wjt.jobType.name}
            </span>
          ))}
        </div>
      ),
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: ({ row }) => (
        <WorkerStatusBadge isActive={row.original.isActive} />
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
                href={`/dashboard/workforce/workers/${row.original.id}/edit`}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Chỉnh sửa
              </Link>
            </DropdownMenuItem>
            <DeleteWorkerButton
              id={row.original.id}
              name={row.original.name}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const table = useReactTable({
    data: workers,
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
                Không có nhân viên nào.
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
