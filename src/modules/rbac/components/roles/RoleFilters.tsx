"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useCallback, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface RoleFiltersProps {
  defaultSearch?: string
  defaultIncludeDeleted?: boolean
}

export function RoleFilters({
  defaultSearch = "",
  defaultIncludeDeleted = false,
}: RoleFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== "false") {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete("page")
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [pathname, router, searchParams]
  )

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm tên, mô tả vai trò..."
          defaultValue={defaultSearch}
          onChange={(e) => updateParam("search", e.target.value)}
          className="pl-8"
        />
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer select-none shrink-0">
        <input
          type="checkbox"
          defaultChecked={defaultIncludeDeleted}
          onChange={(e) =>
            updateParam("includeDeleted", e.target.checked ? "true" : "false")
          }
          className="size-4 rounded border-border accent-foreground"
        />
        <span className="text-muted-foreground">Hiển thị vai trò đã xóa</span>
      </label>
    </div>
  )
}
