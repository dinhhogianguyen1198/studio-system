import { Suspense } from "react"
import { requireSession } from "@/shared/lib/auth-utils"
import { DashboardContent } from "@/modules/dashboard/components/DashboardContent"
import { DashboardSkeleton } from "@/modules/dashboard/components/DashboardSkeleton"

export default async function DashboardPage(): Promise<React.ReactElement> {
  const session = await requireSession()

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent user={session.user} />
    </Suspense>
  )
}
