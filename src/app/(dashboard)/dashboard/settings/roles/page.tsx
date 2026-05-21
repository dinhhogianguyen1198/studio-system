import { Suspense } from "react"
import { requirePermission } from "@/shared/lib/auth-utils"
import { rbacRoleService } from "@/modules/rbac/service/rbac-role.service"
import { rbacPermissionService } from "@/modules/rbac/service/rbac-permission.service"
import { roleFilterSchema } from "@/modules/rbac/schemas/role.schema"
import { RoleTable } from "@/modules/rbac/components/roles/RoleTable"
import { Pagination } from "@/modules/rbac/components/shared/Pagination"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Shield } from "lucide-react"
import CreateRoleButton from "./_components/CreateRoleButton"

interface PageProps {
  searchParams: Promise<Record<string, string | string[]>>
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-full rounded-md" />
      ))}
    </div>
  )
}

async function RoleManagementContent({
  searchParams,
}: {
  searchParams: Record<string, string | string[]>
}) {
  const raw = {
    search: typeof searchParams.search === "string" ? searchParams.search : undefined,
    includeDeleted:
      typeof searchParams.includeDeleted === "string"
        ? searchParams.includeDeleted
        : "false",
    page: typeof searchParams.page === "string" ? searchParams.page : "1",
    pageSize: "20",
  }

  const [filters, allPermissions] = await Promise.all([
    Promise.resolve(roleFilterSchema.parse(raw)),
    rbacPermissionService.getAllPermissions(),
  ])

  const result = await rbacRoleService.listRoles(filters)

  const serializedRoles = result.data.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    deletedAt: r.deletedAt?.toISOString() ?? null,
  }))

  return (
    <>
      <RoleTable roles={serializedRoles} allPermissions={allPermissions} />
      <Pagination meta={result.meta} />
    </>
  )
}

export default async function RolesPage({ searchParams }: PageProps) {
  await requirePermission("roles", "read")
  const resolvedParams = await searchParams

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="size-5 text-muted-foreground" />
          <div>
            <h2 className="text-base font-semibold">Vai trò</h2>
            <p className="text-xs text-muted-foreground">
              Quản lý vai trò và phân quyền trong hệ thống
            </p>
          </div>
        </div>
        <CreateRoleButton />
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <Suspense fallback={<TableSkeleton />}>
            <RoleManagementContent searchParams={resolvedParams} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
