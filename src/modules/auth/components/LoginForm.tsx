"use client"

import { useActionState, useState } from "react"
import { loginAction } from "../actions/auth.actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ActionResult } from "@/shared/types/api.types"

const initialState: ActionResult<void> = {
  success: false,
  error: "",
}

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const fieldErrors = !state.success ? state.fieldErrors : undefined

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {/* Lỗi chung */}
      {!state.success && state.error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive"
        >
          {state.error}
        </div>
      )}

      {/* Email */}
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-describedby={fieldErrors?.email ? "email-error" : undefined}
          aria-invalid={!!fieldErrors?.email}
        />
        {fieldErrors?.email && (
          <p id="email-error" className="text-xs text-destructive">
            {fieldErrors.email[0]}
          </p>
        )}
      </div>

      {/* Mật khẩu */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium">
          Mật khẩu
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-describedby={fieldErrors?.password ? "password-error" : undefined}
          aria-invalid={!!fieldErrors?.password}
        />
        {fieldErrors?.password && (
          <p id="password-error" className="text-xs text-destructive">
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
