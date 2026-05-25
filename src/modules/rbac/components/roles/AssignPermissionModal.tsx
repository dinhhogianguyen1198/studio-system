"use client"

import { useState, useTransition, useEffect } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  replaceRolePermissionsAction,
  getRolePermissionIdsAction,
} from "@/modules/rbac/actions/rbac-role.actions"
import type { RoleSummary, PermissionSummary } from "@/modules/rbac/types/rbac-management.types"

interface AssignPermissionModalProps {
  role: RoleSummary
  allPermissions: PermissionSummary[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

function groupByResource(permissions: PermissionSummary[]) {
  const map = new Map<string, PermissionSummary[]>()
  for (const p of permissions) {
    const group = map.get(p.resource) ?? []
    group.push(p)
    map.set(p.resource, group)
  }
  return Array.from(map.entries()).map(([resource, perms]) => ({
    resource,
    permissions: perms,
  }))
}

const ACTION_LABELS: Record<string, string> = {
  create: "Tạo",
  read: "Xem",
  update: "Sửa",
  delete: "Xóa",
  manage: "Quản lý",
}

export function AssignPermissionModal({
  role,
  allPermissions,
  open,
  onOpenChange,
}: AssignPermissionModalProps) {
  const [isSaving, startSaveTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(false)
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const groups = groupByResource(allPermissions)

  useEffect(() => {
    if (!open) return

    setIsLoading(true)
    getRolePermissionIdsAction(role.id).then((result) => {
      if (result.success) {
        setCheckedIds(new Set(result.data))
      } else {
        toast.error(result.error)
      }
      setIsLoading(false)
    })
  }, [open, role.id])

  function togglePermission(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleGroup(resource: string) {
    const groupPerms = allPermissions.filter((p) => p.resource === resource)
    const allChecked = groupPerms.every((p) => checkedIds.has(p.id))
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (allChecked) {
        groupPerms.forEach((p) => next.delete(p.id))
      } else {
        groupPerms.forEach((p) => next.add(p.id))
      }
      return next
    })
  }

  function handleSave() {
    startSaveTransition(async () => {
      const result = await replaceRolePermissionsAction(
        role.id,
        Array.from(checkedIds)
      )
      if (result.success) {
        toast.success("Đã cập nhật quyền cho vai trò")
        onOpenChange(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Quản lý quyền</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <span className="font-mono font-medium">{role.name}</span>
            {role.isSystem && (
              <Badge variant="default" className="text-xs rounded-md">
                Hệ thống
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>{checkedIds.size} quyền được chọn</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="hover:text-foreground transition-colors"
                    onClick={() =>
                      setCheckedIds(new Set(allPermissions.map((p) => p.id)))
                    }
                  >
                    Chọn tất cả
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    className="hover:text-foreground transition-colors"
                    onClick={() => setCheckedIds(new Set())}
                  >
                    Bỏ chọn tất cả
                  </button>
                </div>
              </div>

              {groups.map(({ resource, permissions: groupPerms }) => {
                const allChecked = groupPerms.every((p) => checkedIds.has(p.id))
                const someChecked =
                  !allChecked && groupPerms.some((p) => checkedIds.has(p.id))

                return (
                  <div
                    key={resource}
                    className="rounded-lg border border-border overflow-hidden"
                  >
                    <div
                      className="flex items-center gap-3 px-4 py-2.5 bg-muted/50 cursor-pointer"
                      onClick={() => toggleGroup(resource)}
                    >
                      <Checkbox
                        checked={allChecked}
                        data-state={someChecked ? "indeterminate" : undefined}
                        onCheckedChange={() => toggleGroup(resource)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-xs font-semibold uppercase tracking-wide">
                        {resource.replace(/_/g, " ")}
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {groupPerms.filter((p) => checkedIds.has(p.id)).length}/
                        {groupPerms.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-0 divide-y divide-border">
                      {groupPerms.map((perm) => (
                        <label
                          key={perm.id}
                          className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
                        >
                          <Checkbox
                            checked={checkedIds.has(perm.id)}
                            onCheckedChange={() => togglePermission(perm.id)}
                          />
                          <span className="text-sm">
                            {ACTION_LABELS[perm.action] ?? perm.action}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>

        <DialogFooter className="pt-2 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? "Đang lưu..." : "Lưu cấu hình quyền"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
