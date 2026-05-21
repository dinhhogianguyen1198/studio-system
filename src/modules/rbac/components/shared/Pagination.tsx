"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { PaginationMeta } from "@/shared/types/api.types"

interface PaginationProps {
  meta: PaginationMeta
}

export function Pagination({ meta }: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(page))
    router.push(`${pathname}?${params.toString()}`)
  }

  if (meta.totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between text-sm">
      <p className="text-muted-foreground">
        {(meta.page - 1) * meta.pageSize + 1}–
        {Math.min(meta.page * meta.pageSize, meta.total)} trong số{" "}
        {meta.total} mục
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(meta.page - 1)}
          disabled={meta.page <= 1}
        >
          <ChevronLeft className="size-4" />
          Trước
        </Button>
        <span className="text-muted-foreground">
          {meta.page} / {meta.totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(meta.page + 1)}
          disabled={meta.page >= meta.totalPages}
        >
          Sau
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
