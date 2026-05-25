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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { updateUserAction, changePasswordAction } from "@/modules/rbac/actions/rbac-user.actions"
import type { UserSummary, RoleSummary } from "@/modules/rbac/types/rbac-management.types"

interface EditUserModalProps {
  user: UserSummary
  allRoles: Pick<RoleSummary, "id" | "name" | "isSystem">[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

const INITIAL_STATE = { success: false as const, error: "" }

// ─── Tab 1: Thông tin cơ bản ──────────────────────────────────────────────────

function InfoForm({
  user,
  allRoles,
  onSuccess,
}: {
  user: UserSummary
  allRoles: Pick<RoleSummary, "id" | "name" | "isSystem">[]
  onSuccess: () => void
}) {
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
      toast.success("Đã cập nhật thông tin người dùng")
      onSuccess()
    }
  }, [state.success, onSuccess])

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="roleId" value={roleId} />

      <div className="space-y-1.5">
        <Label>Email</Label>
        <p className="h-8 flex items-center px-3 rounded-md bg-muted text-sm text-muted-foreground font-mono">
          {user.email}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="edit-name">Họ tên</Label>
        <Input
          id="edit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nguyễn Văn A"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="edit-role">Vai trò chính</Label>
        <Select
          id="edit-role"
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
        >
          {allRoles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}{role.isSystem ? " (hệ thống)" : ""}
            </option>
          ))}
        </Select>
        <p className="text-xs text-muted-foreground">
          Vai trò chính xác định quyền mặc định trong session.
        </p>
      </div>

      {!state.success && state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <DialogFooter className="pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ─── Tab 2: Đặt lại mật khẩu ──────────────────────────────────────────────────

function PasswordForm({
  user,
  onSuccess,
}: {
  user: UserSummary
  onSuccess: () => void
}) {
  const boundAction = changePasswordAction.bind(null, user.id)
  const [state, formAction, isPending] = useActionState(boundAction, INITIAL_STATE)

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    if (state.success) {
      toast.success("Đã đặt lại mật khẩu thành công")
      setNewPassword("")
      setConfirmPassword("")
      onSuccess()
    }
  }, [state.success, onSuccess])

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="newPassword" value={newPassword} />
      <input type="hidden" name="confirmPassword" value={confirmPassword} />

      <div className="rounded-lg bg-warning/60 border border-warning-foreground/15 px-3 py-2.5">
        <p className="text-xs text-warning-foreground">
          Mật khẩu mới sẽ được áp dụng ngay. Người dùng sẽ cần đăng nhập lại.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="new-password">Mật khẩu mới</Label>
        <Input
          id="new-password"
          type="password"
          placeholder="Tối thiểu 8 ký tự, có chữ hoa, chữ thường và số"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirm-password">Xác nhận mật khẩu</Label>
        <Input
          id="confirm-password"
          type="password"
          placeholder="Nhập lại mật khẩu mới"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
        />
      </div>

      {!state.success && state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <DialogFooter className="pt-2">
        <Button
          type="submit"
          variant="destructive"
          disabled={isPending || !newPassword || !confirmPassword}
        >
          {isPending ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

export function EditUserModal({
  user,
  allRoles,
  open,
  onOpenChange,
}: EditUserModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Chỉnh sửa người dùng
          </DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="mt-1">
          <TabsList className="w-full">
            <TabsTrigger value="info" className="flex-1">
              Thông tin
            </TabsTrigger>
            <TabsTrigger value="password" className="flex-1">
              Mật khẩu
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="pt-4">
            <InfoForm
              user={user}
              allRoles={allRoles}
              onSuccess={() => onOpenChange(false)}
            />
          </TabsContent>

          <TabsContent value="password" className="pt-4">
            <PasswordForm
              user={user}
              onSuccess={() => onOpenChange(false)}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
