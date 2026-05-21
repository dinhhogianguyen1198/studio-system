"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CreateRoleModal } from "@/modules/rbac/components/roles/CreateRoleModal"

export default function CreateRoleButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Tạo vai trò
      </Button>
      <CreateRoleModal open={open} onOpenChange={setOpen} />
    </>
  )
}
