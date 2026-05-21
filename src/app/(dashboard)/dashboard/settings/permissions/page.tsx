import { requirePermission } from "@/shared/lib/auth-utils"
import { rbacPermissionService } from "@/modules/rbac/service/rbac-permission.service"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Key } from "lucide-react"

const ACTION_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" | "info" }> = {
  manage: { label: "Quản lý", variant: "default" },
  create: { label: "Tạo", variant: "success" },
  read: { label: "Xem", variant: "info" },
  update: { label: "Sửa", variant: "warning" },
  delete: { label: "Xóa", variant: "destructive" },
}

export default async function PermissionsPage() {
  await requirePermission("permissions", "read")

  const groups = await rbacPermissionService.getGroupedPermissions()

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Key className="size-5 text-muted-foreground" />
        <div>
          <h2 className="text-base font-semibold">Quyền hạn</h2>
          <p className="text-xs text-muted-foreground">
            Danh sách toàn bộ quyền trong hệ thống — được quản lý tự động qua
            seed
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {groups.map(({ resource, permissions }) => (
          <Card key={resource}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide">
                  {resource.replace(/_/g, " ")}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {permissions.length} quyền
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {permissions.map((perm) => {
                  const config = ACTION_LABELS[perm.action]
                  return (
                    <div
                      key={perm.id}
                      className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5"
                    >
                      <Badge
                        variant={config?.variant ?? "secondary"}
                        className="text-xs rounded-sm px-1.5 py-0"
                      >
                        {config?.label ?? perm.action}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {perm._count.roles} vai trò
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {groups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm font-medium">Chưa có quyền nào</p>
          <p className="text-xs text-muted-foreground mt-1">
            Chạy{" "}
            <code className="font-mono bg-muted px-1 rounded">
              npm run seed
            </code>{" "}
            để khởi tạo dữ liệu
          </p>
        </div>
      )}
    </div>
  )
}
