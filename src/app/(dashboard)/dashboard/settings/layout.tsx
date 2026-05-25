import { requireSession } from "@/shared/lib/auth-utils"
import { SettingsNav } from "./_components/SettingsNav"

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSession()

  return (
    <div className="space-y-0">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight">Cài đặt hệ thống</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Quản lý người dùng, vai trò và phân quyền
        </p>
      </div>

      <SettingsNav />

      <div className="pt-5">{children}</div>
    </div>
  )
}
