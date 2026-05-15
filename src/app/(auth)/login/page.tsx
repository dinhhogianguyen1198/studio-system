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
  if (session?.user) redirect("/")

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-gray-200 bg-white px-8 py-10 shadow-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Đăng nhập
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Nhập thông tin tài khoản của bạn
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  )
}
