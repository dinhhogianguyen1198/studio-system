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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { updateRoleAction } from "@/modules/rbac/actions/rbac-role.actions"
import type { RoleSummary } from "@/modules/rbac/types/rbac-management.types"

interface EditRoleModalProps {
  role: RoleSummary
  open: boolean
  onOpenChange: (open: boolean) => void
}

const INITIAL_STATE = { success: false as const, error: "" }

export function EditRoleModal({ role, open, onOpenChange }: EditRoleModalProps) {
  const boundAction = updateRoleAction.bind(null, role.id)
  const [state, formAction, isPending] = useActionState(boundAction, INITIAL_STATE)

  const [description, setDescription] = useState(role.description ?? "")

  useEffect(() => {
    setDescription(role.description ?? "")
  }, [role])

  useEffect(() => {
    if (state.success) {
      toast.success("Đã cập nhật vai trò")
      onOpenChange(false)
    }
  }, [state.success, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Chỉnh sửa vai trò
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <span className="font-mono font-medium">{role.name}</span>
            {role.isSystem && (
              <Badge variant="default" className="text-xs rounded-sm">
                Hệ thống
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4 pt-2">
          <input type="hidden" name="description" value={description} />

          <div className="space-y-1.5">
            <Label htmlFor="edit-role-name">Tên vai trò</Label>
            <p className="text-sm font-mono bg-muted rounded-md px-3 py-2 text-muted-foreground">
              {role.name}
            </p>
            {role.isSystem && (
              <p className="text-xs text-muted-foreground">
                Tên vai trò hệ thống không thể thay đổi.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-role-description">Mô tả</Label>
            <Textarea
              id="edit-role-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none"
            />
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
