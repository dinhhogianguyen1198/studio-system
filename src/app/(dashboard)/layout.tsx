import type { ReactNode } from "react"
import { requireSession } from "@/shared/lib/auth-utils"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"
import { Toaster } from "@/components/ui/sonner"

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await requireSession()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar — hidden on mobile, handled by MobileSidebar inside Navbar */}
      <div className="hidden lg:flex">
        <Sidebar role={session.user.role} appName="Lu Production" />
      </div>

      {/* Content column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar user={session.user} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  )
}
