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
import { MoreHorizontal, Shield, Trash2, Edit } from "lucide-react"
import { deleteUserAction } from "@/modules/rbac/actions/rbac-user.actions"
import { AssignRoleModal } from "./AssignRoleModal"
import { EditUserModal } from "./EditUserModal"
import type { UserSummary } from "@/modules/rbac/types/rbac-management.types"
import type { RoleSummary } from "@/modules/rbac/types/rbac-management.types"

interface UserTableProps {
  users: UserSummary[]
  allRoles: Pick<RoleSummary, "id" | "name" | "isSystem">[]
  currentUserId: string
}

export function UserTable({ users, allRoles, currentUserId }: UserTableProps) {
  const [isPending, startTransition] = useTransition()
  const [deleteTarget, setDeleteTarget] = useState<UserSummary | null>(null)
  const [assignRoleTarget, setAssignRoleTarget] = useState<UserSummary | null>(null)
  const [editTarget, setEditTarget] = useState<UserSummary | null>(null)

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteUserAction(deleteTarget.id)
      if (result.success) {
        toast.success("Đã xóa người dùng")
      } else {
        toast.error(result.error)
      }
      setDeleteTarget(null)
    })
  }

  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-border flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm font-medium">Chưa có người dùng nào</p>
        <p className="text-xs text-muted-foreground mt-1">
          Thêm người dùng đầu tiên để bắt đầu
        </p>
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
                Người dùng
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide">
                Vai trò chính
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide">
                Vai trò bổ sung
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide">
                Ngày tạo
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="h-11 hover:bg-muted/40">
                <TableCell className="px-3 first:pl-4">
                  <div>
                    <p className="text-sm font-medium">
                      {user.name ?? "—"}
                      {user.id === currentUserId && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (bạn)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </TableCell>
                <TableCell className="px-3">
                  <Badge
                    variant={user.role.isSystem ? "default" : "secondary"}
                    className="rounded-md text-xs"
                  >
                    {user.role.name}
                  </Badge>
                </TableCell>
                <TableCell className="px-3">
                  <div className="flex flex-wrap gap-1">
                    {user.userRoles.length === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      user.userRoles.map((ur) => (
                        <Badge
                          key={ur.id}
                          variant="outline"
                          className="rounded-md text-xs"
                        >
                          {ur.role.name}
                        </Badge>
                      ))
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-3 text-xs text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                </TableCell>
                <TableCell className="px-3 last:pr-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                      >
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">Thao tác</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setEditTarget(user)}
                      >
                        <Edit className="size-4 mr-2" />
                        Chỉnh sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setAssignRoleTarget(user)}
                      >
                        <Shield className="size-4 mr-2" />
                        Gán vai trò
                      </DropdownMenuItem>
                      {user.id !== currentUserId && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(user)}
                          >
                            <Trash2 className="size-4 mr-2" />
                            Xóa
                          </DropdownMenuItem>
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
            <AlertDialogTitle>Xác nhận xóa người dùng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa <strong>{deleteTarget?.email}</strong>? Hành
              động này không thể hoàn tác.
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

      {/* Assign role modal */}
      {assignRoleTarget && (
        <AssignRoleModal
          user={assignRoleTarget}
          allRoles={allRoles}
          open={!!assignRoleTarget}
          onOpenChange={(open) => !open && setAssignRoleTarget(null)}
        />
      )}

      {/* Edit user modal */}
      {editTarget && (
        <EditUserModal
          user={editTarget}
          allRoles={allRoles}
          open={!!editTarget}
          onOpenChange={(open) => !open && setEditTarget(null)}
        />
      )}
    </>
  )
}
