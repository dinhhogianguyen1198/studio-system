"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Shield, Trash2, Edit, RotateCcw, ShieldOff } from "lucide-react"
import {
  deleteRoleAction,
  restoreRoleAction,
} from "@/modules/rbac/actions/rbac-role.actions"
import { EditRoleModal } from "./EditRoleModal"
import { AssignPermissionModal } from "./AssignPermissionModal"
import type { RoleSummary, PermissionSummary } from "@/modules/rbac/types/rbac-management.types"

interface RoleTableProps {
  roles: RoleSummary[]
  allPermissions: PermissionSummary[]
}

export function RoleTable({ roles, allPermissions }: RoleTableProps) {
  const [isPending, startTransition] = useTransition()
  const [deleteTarget, setDeleteTarget] = useState<RoleSummary | null>(null)
  const [editTarget, setEditTarget] = useState<RoleSummary | null>(null)
  const [permTarget, setPermTarget] = useState<RoleSummary | null>(null)

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteRoleAction(deleteTarget.id)
      if (result.success) {
        toast.success("Đã xóa vai trò")
      } else {
        toast.error(result.error)
      }
      setDeleteTarget(null)
    })
  }

  function handleRestore(roleId: string) {
    startTransition(async () => {
      const result = await restoreRoleAction(roleId)
      if (result.success) {
        toast.success("Đã khôi phục vai trò")
      } else {
        toast.error(result.error)
      }
    })
  }

  if (roles.length === 0) {
    return (
      <div className="rounded-lg border border-border flex flex-col items-center justify-center py-16 text-center gap-3">
        <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
          <ShieldOff className="size-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">Chưa có vai trò nào</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tạo vai trò đầu tiên để bắt đầu phân quyền
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-medium uppercase tracking-wide">
                Vai trò
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide">
                Loại
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-center">
                Người dùng
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-center">
                Quyền
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide">
                Trạng thái
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow
                key={role.id}
                className={`h-11 hover:bg-muted/40 ${role.deletedAt ? "opacity-50" : ""}`}
              >
                <TableCell className="px-3 first:pl-4">
                  <div>
                    <p className="text-sm font-medium">{role.name}</p>
                    {role.description && (
                      <p className="text-xs text-muted-foreground truncate max-w-xs">
                        {role.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-3">
                  {role.isSystem ? (
                    <Badge variant="default" className="rounded-md text-xs">
                      Hệ thống
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="rounded-md text-xs">
                      Tùy chỉnh
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="px-3 text-center">
                  <span className="text-sm">{role._count.users}</span>
                </TableCell>
                <TableCell className="px-3 text-center">
                  <span className="text-sm">{role._count.permissions}</span>
                </TableCell>
                <TableCell className="px-3">
                  {role.deletedAt ? (
                    <Badge
                      variant="destructive"
                      className="rounded-md text-xs"
                    >
                      Đã xóa
                    </Badge>
                  ) : (
                    <Badge
                      variant="success"
                      className="rounded-md text-xs"
                    >
                      Hoạt động
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="px-3 last:pr-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">Thao tác</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {role.deletedAt ? (
                        <DropdownMenuItem onClick={() => handleRestore(role.id)}>
                          <RotateCcw className="size-4 mr-2" />
                          Khôi phục
                        </DropdownMenuItem>
                      ) : (
                        <>
                          <DropdownMenuItem onClick={() => setEditTarget(role)}>
                            <Edit className="size-4 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setPermTarget(role)}>
                            <Shield className="size-4 mr-2" />
                            Quản lý quyền
                          </DropdownMenuItem>
                          {!role.isSystem && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteTarget(role)}
                              >
                                <Trash2 className="size-4 mr-2" />
                                Xóa
                              </DropdownMenuItem>
                            </>
                          )}
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa vai trò</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa vai trò{" "}
              <strong>{deleteTarget?.name}</strong>? Vai trò sẽ bị vô hiệu
              hóa nhưng không mất dữ liệu (soft delete).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editTarget && (
        <EditRoleModal
          role={editTarget}
          open={!!editTarget}
          onOpenChange={(open) => !open && setEditTarget(null)}
        />
      )}

      {permTarget && (
        <AssignPermissionModal
          role={permTarget}
          allPermissions={allPermissions}
          open={!!permTarget}
          onOpenChange={(open) => !open && setPermTarget(null)}
        />
      )}
    </>
  )
}
