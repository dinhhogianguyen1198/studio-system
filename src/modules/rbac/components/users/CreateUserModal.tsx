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
import { createUserAction } from "@/modules/rbac/actions/rbac-user.actions"
import type { RoleSummary } from "@/modules/rbac/types/rbac-management.types"

interface CreateUserModalProps {
  allRoles: Pick<RoleSummary, "id" | "name" | "isSystem">[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

const INITIAL_STATE = { success: false as const, error: "" }

export function CreateUserModal({
  allRoles,
  open,
  onOpenChange,
}: CreateUserModalProps) {
  const [state, formAction, isPending] = useActionState(
    createUserAction,
    INITIAL_STATE
  )

  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [roleId, setRoleId] = useState(allRoles[0]?.id ?? "")

  useEffect(() => {
    if (state.success) {
      toast.success("Đã tạo người dùng thành công")
      setEmail("")
      setName("")
      setPassword("")
      setRoleId(allRoles[0]?.id ?? "")
      onOpenChange(false)
    }
  }, [state.success, onOpenChange, allRoles])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Thêm người dùng mới
          </DialogTitle>
          <DialogDescription>
            Tạo tài khoản và gán vai trò cho người dùng
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4 pt-2">
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="name" value={name} />
          <input type="hidden" name="password" value={password} />
          <input type="hidden" name="roleId" value={roleId} />

          <div className="space-y-1.5">
            <Label htmlFor="new-user-name">Họ tên</Label>
            <Input
              id="new-user-name"
              placeholder="Nguyễn Văn A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-user-email">Email</Label>
            <Input
              id="new-user-email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-user-password">Mật khẩu</Label>
            <Input
              id="new-user-password"
              type="password"
              placeholder="Tối thiểu 8 ký tự, có chữ hoa, chữ thường và số"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-user-role">Vai trò</Label>
            <div className="relative">
              <select
                id="new-user-role"
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
              {isPending ? "Đang tạo..." : "Tạo người dùng"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
