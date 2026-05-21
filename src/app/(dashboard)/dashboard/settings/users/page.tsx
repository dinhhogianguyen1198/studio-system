import { Suspense } from "react"
import { requirePermission } from "@/shared/lib/auth-utils"
import { rbacUserService } from "@/modules/rbac/service/rbac-user.service"
import { rbacRoleService } from "@/modules/rbac/service/rbac-role.service"
import { userFilterSchema } from "@/modules/rbac/schemas/user-management.schema"
import { UserTable } from "@/modules/rbac/components/users/UserTable"
import { UserFilters } from "@/modules/rbac/components/users/UserFilters"
import { CreateUserModal } from "@/modules/rbac/components/users/CreateUserModal"
import { Pagination } from "@/modules/rbac/components/shared/Pagination"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Users } from "lucide-react"
import CreateUserButton from "./_components/CreateUserButton"

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

async function UserManagementContent({
  searchParams,
  currentUserId,
}: {
  searchParams: Record<string, string | string[]>
  currentUserId: string
}) {
  const raw = {
    search: typeof searchParams.search === "string" ? searchParams.search : undefined,
    roleId: typeof searchParams.roleId === "string" ? searchParams.roleId : undefined,
    page: typeof searchParams.page === "string" ? searchParams.page : "1",
    pageSize: "20",
  }

  const [filters, allRoles] = await Promise.all([
    Promise.resolve(userFilterSchema.parse(raw)),
    rbacRoleService.getAllRoles(),
  ])

  const result = await rbacUserService.listUsers(filters)

  const serializedUsers = result.data.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    userRoles: u.userRoles.map((ur) => ({
      ...ur,
      assignedAt: ur.assignedAt.toISOString(),
    })),
  }))

  return (
    <>
      <UserFilters
        allRoles={allRoles}
        defaultSearch={typeof searchParams.search === "string" ? searchParams.search : ""}
        defaultRoleId={typeof searchParams.roleId === "string" ? searchParams.roleId : ""}
      />

      <UserTable
        users={serializedUsers}
        allRoles={allRoles}
        currentUserId={currentUserId}
      />

      <Pagination meta={result.meta} />
    </>
  )
}

export default async function UsersPage({ searchParams }: PageProps) {
  const session = await requirePermission("users", "read")
  const resolvedParams = await searchParams
  const allRoles = await rbacRoleService.getAllRoles()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-muted-foreground" />
          <div>
            <h2 className="text-base font-semibold">Người dùng</h2>
            <p className="text-xs text-muted-foreground">
              Quản lý tài khoản và phân quyền người dùng
            </p>
          </div>
        </div>
        <CreateUserButton allRoles={allRoles} />
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <Suspense fallback={<TableSkeleton />}>
            <UserManagementContent
              searchParams={resolvedParams}
              currentUserId={session.user.id}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
