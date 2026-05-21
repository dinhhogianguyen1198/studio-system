"use client"

import { useState, useEffect, useActionState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateUserAction } from "@/modules/rbac/actions/rbac-user.actions"
import type { UserSummary, RoleSummary } from "@/modules/rbac/types/rbac-management.types"

interface EditUserModalProps {
  user: UserSummary
  allRoles: Pick<RoleSummary, "id" | "name" | "isSystem">[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

const INITIAL_STATE = { success: false as const, error: "" }

export function EditUserModal({
  user,
  allRoles,
  open,
  onOpenChange,
}: EditUserModalProps) {
  // bind(null, userId) so the action signature is (prevState, formData) for useActionState
  const boundAction = updateUserAction.bind(null, user.id)
  const [state, formAction, isPending] = useActionState(boundAction, INITIAL_STATE)

  const [name, setName] = useState(user.name ?? "")
  const [roleId, setRoleId] = useState(user.role.id)

  useEffect(() => {
    setName(user.name ?? "")
    setRoleId(user.role.id)
  }, [user])

  useEffect(() => {
    if (state.success) {
      toast.success("Đã cập nhật người dùng")
      onOpenChange(false)
    }
  }, [state.success, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Chỉnh sửa người dùng</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4 pt-2">
          <input type="hidden" name="name" value={name} />
          <input type="hidden" name="roleId" value={roleId} />

          <div className="space-y-1.5">
            <Label htmlFor="edit-user-name">Họ tên</Label>
            <Input
              id="edit-user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-user-role">Vai trò chính</Label>
            <div className="relative">
              <select
                id="edit-user-role"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className="flex h-8 w-full appearance-none rounded-md border border-input bg-transparent px-3 py-1 pr-8 text-sm transition-colors outline-none focus-visible:border-ring/60 focus-visible:ring-2 focus-visible:ring-ring/20"
              >
                {allRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}{role.isSystem ? " (hệ thống)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-muted-foreground">
              Vai trò chính dùng cho session. Gán thêm vai trò phụ qua nút
              &quot;Gán vai trò&quot;.
            </p>
          </div>

          {!state.success && state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
