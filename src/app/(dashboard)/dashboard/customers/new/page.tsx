import Link from "next/link"
import { requireSession } from "@/shared/lib/auth-utils"
import { CreateCustomerForm } from "@/modules/crm/components/customers/CustomerForm"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function NewCustomerPage() {
  await requireSession()

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/customers">
            <ArrowLeft className="size-4" />
            Quay lại
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Thêm khách hàng</h1>
          <p className="text-sm text-muted-foreground">Tạo hồ sơ khách hàng mới</p>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Thông tin khách hàng</CardTitle>
          <CardDescription>Điền đầy đủ thông tin để tạo khách hàng</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <CreateCustomerForm />
        </CardContent>
      </Card>
    </div>
  )
}
