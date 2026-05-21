"use client"

import { useState, useEffect, useActionState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createRoleAction } from "@/modules/rbac/actions/rbac-role.actions"

interface CreateRoleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const INITIAL_STATE = { success: false as const, error: "" }

export function CreateRoleModal({ open, onOpenChange }: CreateRoleModalProps) {
  const [state, formAction, isPending] = useActionState(
    createRoleAction,
    INITIAL_STATE
  )

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    if (state.success) {
      toast.success("Đã tạo vai trò thành công")
      setName("")
      setDescription("")
      onOpenChange(false)
    }
  }, [state.success, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Tạo vai trò mới
          </DialogTitle>
          <DialogDescription>
            Vai trò tùy chỉnh có thể gán thêm quyền sau khi tạo
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4 pt-2">
          <input type="hidden" name="name" value={name} />
          <input type="hidden" name="description" value={description} />

          <div className="space-y-1.5">
            <Label htmlFor="role-name">
              Tên vai trò{" "}
              <span className="text-xs text-muted-foreground font-normal">
                (chỉ chữ thường, số, dấu gạch dưới)
              </span>
            </Label>
            <Input
              id="role-name"
              placeholder="vd: content_creator"
              value={name}
              onChange={(e) => setName(e.target.value.toLowerCase())}
              autoComplete="off"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="role-description">Mô tả</Label>
            <Textarea
              id="role-description"
              placeholder="Mô tả ngắn về vai trò này..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {!state.success && state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang tạo..." : "Tạo vai trò"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
