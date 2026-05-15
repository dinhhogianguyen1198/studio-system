"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { loginAction } from "../actions/auth.actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ActionResult } from "@/shared/types/api.types"

const initialState: ActionResult<void> = {
  success: false,
  error: "",
}

export function LoginForm() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  )

  useEffect(() => {
    if (state.success) {
      router.push("/")
      router.refresh()
    }
  }, [state.success, router])

  const fieldErrors = !state.success ? state.fieldErrors : undefined

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {/* Lỗi chung */}
      {!state.success && state.error && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      )}

      {/* Email */}
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-describedby={fieldErrors?.email ? "email-error" : undefined}
          aria-invalid={!!fieldErrors?.email}
          className={fieldErrors?.email ? "border-red-400" : ""}
        />
        {fieldErrors?.email && (
          <p id="email-error" className="text-xs text-red-600">
            {fieldErrors.email[0]}
          </p>
        )}
      </div>

      {/* Mật khẩu */}
      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          Mật khẩu
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-describedby={fieldErrors?.password ? "password-error" : undefined}
          aria-invalid={!!fieldErrors?.password}
          className={fieldErrors?.password ? "border-red-400" : ""}
        />
        {fieldErrors?.password && (
          <p id="password-error" className="text-xs text-red-600">
            {fieldErrors.password[0]}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Đang đăng nhập..." : "Đăng nhập"}
      </Button>
    </form>
  )
}
