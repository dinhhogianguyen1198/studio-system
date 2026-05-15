"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"
import { CUSTOMER_STATUS_LABELS, CUSTOMER_SOURCE_LABELS } from "../../types/crm.types"

export function CustomerFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete("page")
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  const clearAll = useCallback(() => {
    router.push(pathname)
  }, [router, pathname])

  const hasFilters =
    searchParams.has("search") ||
    searchParams.has("status") ||
    searchParams.has("source")

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative min-w-[220px] flex-1">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Tìm tên, email, SĐT, công ty..."
          defaultValue={searchParams.get("search") ?? ""}
          className="pl-8"
          onChange={(e) => {
            const timeout = setTimeout(() => updateParam("search", e.target.value), 400)
            return () => clearTimeout(timeout)
          }}
        />
      </div>

      {/* Status filter */}
      <Select
        defaultValue={searchParams.get("status") ?? ""}
        onChange={(e) => updateParam("status", e.target.value)}
        className="w-[180px]"
      >
        <option value="">Tất cả trạng thái</option>
        {Object.entries(CUSTOMER_STATUS_LABELS).map(([val, label]) => (
          <option key={val} value={val}>{label}</option>
        ))}
      </Select>

      {/* Source filter */}
      <Select
        defaultValue={searchParams.get("source") ?? ""}
        onChange={(e) => updateParam("source", e.target.value)}
        className="w-[180px]"
      >
        <option value="">Tất cả nguồn</option>
        {Object.entries(CUSTOMER_SOURCE_LABELS).map(([val, label]) => (
          <option key={val} value={val}>{label}</option>
        ))}
      </Select>

      {/* Clear */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll}>
          <X className="size-4" />
          Xóa bộ lọc
        </Button>
      )}
    </div>
  )
}
