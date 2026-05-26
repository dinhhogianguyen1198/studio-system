"use client"

import { useState } from "react"
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
import { MoreHorizontal, Pencil } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { JobTypeBadge } from "./JobTypeBadge"
import { DeleteJobTypeButton } from "./DeleteJobTypeButton"
import { EditJobTypeModal } from "./EditJobTypeModal"
import type { JobTypeSummary } from "@/modules/workforce/types/workforce.types"

function JobTypeActionsCell({ jobType }: { jobType: JobTypeSummary }) {
  const [editOpen, setEditOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Chỉnh sửa
          </DropdownMenuItem>
          <DeleteJobTypeButton id={jobType.id} name={jobType.name} />
        </DropdownMenuContent>
      </DropdownMenu>

      <EditJobTypeModal
        jobType={jobType}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  )
}

interface Props {
  jobTypes: JobTypeSummary[]
}

export function JobTypeTable({ jobTypes }: Props) {
  const columns: ColumnDef<JobTypeSummary>[] = [
    {
      id: "name",
      header: "Tên",
      cell: ({ row }) => (
        <JobTypeBadge
          name={row.original.name}
          color={row.original.color}
          size="sm"
        />
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
      accessorKey: "sortOrder",
      header: "Thứ tự",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.sortOrder}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => <JobTypeActionsCell jobType={row.original} />,
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
