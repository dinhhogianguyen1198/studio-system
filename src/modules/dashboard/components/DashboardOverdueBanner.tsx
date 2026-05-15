import Link from "next/link"
import { AlertTriangle, ChevronDown } from "lucide-react"

interface DashboardOverdueBannerProps {
  overdueCount: number
  totalPendingCount: number
}

export function DashboardOverdueBanner({
  overdueCount,
  totalPendingCount,
}: DashboardOverdueBannerProps) {
  if (totalPendingCount === 0) return null

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
      <p className="text-sm font-semibold text-red-700 flex-1">
        {totalPendingCount} CÔNG VIỆC ĐƠN HÀNG CẦN XỬ LÝ
      </p>
      {overdueCount > 0 && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-500 text-white">
          QUÁ HẠN {overdueCount}
        </span>
      )}
      <Link
        href="/dashboard/orders"
        className="flex items-center gap-1 text-xs text-red-600 font-medium hover:underline shrink-0"
      >
        Xem chi tiết
        <ChevronDown className="w-3 h-3 rotate-[-90deg]" />
      </Link>
    </div>
  )
}
