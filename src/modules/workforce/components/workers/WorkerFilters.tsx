"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Search } from "lucide-react"

export function WorkerFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === null || value === "") {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      params.delete("page")
      router.replace(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams],
  )

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm theo tên, email, SĐT..."
          defaultValue={searchParams.get("search") ?? ""}
          onChange={(e) => updateParam("search", e.target.value)}
          className="pl-9"
        />
      </div>
      <Select
        className="w-40"
        defaultValue={searchParams.get("isActive") ?? "all"}
        onChange={(e) => {
          const v = e.target.value
          updateParam("isActive", v === "all" ? null : v)
        }}
      >
        <option value="all">Tất cả</option>
        <option value="true">Đang hoạt động</option>
        <option value="false">Ngừng hoạt động</option>
      </Select>
    </div>
  )
}
