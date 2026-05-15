import { notFound } from "next/navigation"
import Link from "next/link"
import { requireSession } from "@/shared/lib/auth-utils"
import { customerService } from "@/modules/crm/service/customer.service"
import { EditCustomerForm } from "@/modules/crm/components/customers/CustomerForm"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditCustomerPage({ params }: PageProps) {
  const { id } = await params
  await requireSession()

  let customer: Awaited<ReturnType<typeof customerService.getCustomer>>
  try {
    customer = await customerService.getCustomer(id)
  } catch {
    notFound()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/dashboard/customers/${id}`}>
            <ArrowLeft className="size-4" />
            Quay lại
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Chỉnh sửa khách hàng</h1>
          <p className="text-sm text-muted-foreground">{customer.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Thông tin khách hàng</CardTitle>
          <CardDescription>Cập nhật thông tin hồ sơ khách hàng</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <EditCustomerForm customer={customer as never} />
        </CardContent>
      </Card>
    </div>
  )
}
