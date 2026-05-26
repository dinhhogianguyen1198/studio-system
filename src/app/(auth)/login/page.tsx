import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { LoginForm } from "@/modules/auth/components/LoginForm"

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập vào hệ thống",
}

export default async function LoginPage() {
  const session = await auth()
  if (session?.user) redirect("/dashboard")

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Lu Production</h1>
          <p className="mt-1 text-sm text-muted-foreground">Hệ thống quản lý studio</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-8 py-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold tracking-tight">Đăng nhập</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Nhập thông tin tài khoản của bạn
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  )
}
