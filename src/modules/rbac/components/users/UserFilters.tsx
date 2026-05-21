"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useCallback, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import type { RoleSummary } from "@/modules/rbac/types/rbac-management.types"

interface UserFiltersProps {
  allRoles: Pick<RoleSummary, "id" | "name">[]
  defaultSearch?: string
  defaultRoleId?: string
}

export function UserFilters({
  allRoles,
  defaultSearch = "",
  defaultRoleId = "",
}: UserFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
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
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm theo tên, email..."
          defaultValue={defaultSearch}
          onChange={(e) => updateParam("search", e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="relative w-full sm:w-48">
        <select
          defaultValue={defaultRoleId || "all"}
          onChange={(e) =>
            updateParam("roleId", e.target.value === "all" ? "" : e.target.value)
          }
          className="flex h-8 w-full appearance-none rounded-md border border-input bg-transparent px-3 py-1 pr-8 text-sm transition-colors outline-none focus-visible:border-ring/60 focus-visible:ring-2 focus-visible:ring-ring/20"
        >
          <option value="all">Tất cả vai trò</option>
          {allRoles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
