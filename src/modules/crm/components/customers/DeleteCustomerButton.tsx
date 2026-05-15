"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface DeleteCustomerButtonProps {
  deleteAction: (formData: FormData) => void | Promise<void>
}

export function DeleteCustomerButton({ deleteAction }: DeleteCustomerButtonProps) {
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <form ref={formRef} action={deleteAction}>
      <Button
        type="submit"
        variant="destructive"
        size="sm"
        onClick={(e) => {
          if (!confirm("Xác nhận xóa khách hàng này?")) e.preventDefault()
        }}
      >
        <Trash2 className="size-4" />
        Xóa
      </Button>
    </form>
  )
}
