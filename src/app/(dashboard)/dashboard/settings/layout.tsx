import { requirePermission } from "@/shared/lib/auth-utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requirePermission("users", "read")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cài đặt hệ thống</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Quản lý người dùng, vai trò và phân quyền
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-muted/50 h-9">
          <TabsTrigger value="users" asChild>
            <Link href="/dashboard/settings/users">Người dùng</Link>
          </TabsTrigger>
          <TabsTrigger value="roles" asChild>
            <Link href="/dashboard/settings/roles">Vai trò</Link>
          </TabsTrigger>
          <TabsTrigger value="permissions" asChild>
            <Link href="/dashboard/settings/permissions">Quyền hạn</Link>
          </TabsTrigger>
        </TabsList>

        {children}
      </Tabs>
    </div>
  )
}
