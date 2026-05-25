"use client"

import { useState, useTransition } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { X } from "lucide-react"
import {
  assignRoleToUserAction,
  revokeRoleFromUserAction,
} from "@/modules/rbac/actions/rbac-user.actions"
import type { UserSummary, RoleSummary } from "@/modules/rbac/types/rbac-management.types"

interface AssignRoleModalProps {
  user: UserSummary
  allRoles: Pick<RoleSummary, "id" | "name" | "isSystem">[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AssignRoleModal({
  user,
  allRoles,
  open,
  onOpenChange,
}: AssignRoleModalProps) {
  const [isPending, startTransition] = useTransition()
  const [selectedRoleId, setSelectedRoleId] = useState("")

  const currentRoleIds = new Set([
    user.role.id,
    ...user.userRoles.map((ur) => ur.role.id),
  ])
  const availableRoles = allRoles.filter((r) => !currentRoleIds.has(r.id))

  function handleAssign() {
    if (!selectedRoleId) return

    const formData = new FormData()
    formData.set("roleId", selectedRoleId)

    startTransition(async () => {
      const result = await assignRoleToUserAction(
        user.id,
        { success: false, error: "" },
        formData
      )
      if (result.success) {
        toast.success("Đã gán vai trò")
        setSelectedRoleId("")
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleRevoke(roleId: string) {
    startTransition(async () => {
      const result = await revokeRoleFromUserAction(user.id, roleId)
      if (result.success) {
        toast.success("Đã thu hồi vai trò")
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Quản lý vai trò</DialogTitle>
          <DialogDescription>
            {user.email} — Vai trò chính:{" "}
            <strong>{user.role.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Current additional roles */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Vai trò bổ sung</p>
            {user.userRoles.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Chưa có vai trò bổ sung nào
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {user.userRoles.map((ur) => (
                  <div
                    key={ur.id}
                    className="flex items-center gap-1 rounded-md border border-border px-2 py-1"
                  >
                    <span className="text-xs font-medium">{ur.role.name}</span>
                    {!ur.role.isSystem && (
                      <button
                        type="button"
                        onClick={() => handleRevoke(ur.role.id)}
                        disabled={isPending}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        aria-label={`Thu hồi vai trò ${ur.role.name}`}
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assign new role */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Gán vai trò mới</p>
            {availableRoles.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Không còn vai trò nào để gán
              </p>
            ) : (
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                  >
                    <option value="">Chọn vai trò...</option>
                    {availableRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}{role.isSystem ? " (hệ thống)" : ""}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button
                  type="button"
                  onClick={handleAssign}
                  disabled={!selectedRoleId || isPending}
                >
                  {isPending ? "Đang gán..." : "Gán"}
                </Button>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground border-t border-border pt-3">
            Vai trò bổ sung mở rộng quyền của user nhưng không thay thế vai trò
            chính trong session hiện tại.
          </p>
        </div>

        <DialogFooter className="pt-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
