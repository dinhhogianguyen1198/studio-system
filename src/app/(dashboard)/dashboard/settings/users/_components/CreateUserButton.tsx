"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CreateUserModal } from "@/modules/rbac/components/users/CreateUserModal"
import type { RoleSummary } from "@/modules/rbac/types/rbac-management.types"

interface CreateUserButtonProps {
  allRoles: Pick<RoleSummary, "id" | "name" | "isSystem">[]
}

export default function CreateUserButton({ allRoles }: CreateUserButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Thêm người dùng
      </Button>
      <CreateUserModal
        allRoles={allRoles}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}
