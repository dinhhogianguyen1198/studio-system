import { Suspense } from "react"
import Link from "next/link"
import { requireSession } from "@/shared/lib/auth-utils"
import { customerService } from "@/modules/crm/service/customer.service"
import { customerFilterSchema } from "@/modules/crm/schemas/crm.schema"
import { CustomerTable } from "@/modules/crm/components/customers/CustomerTable"
import { CustomerFilters } from "@/modules/crm/components/customers/CustomerFilters"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface PageProps {
  searchParams: Promise<Record<string, string | string[]>>
}

async function CustomerList({
  searchParams,
  currentUserId,
}: {
  searchParams: Record<string, string | string[]>
  currentUserId: string
}) {
  const raw = {
    search: typeof searchParams.search === "string" ? searchParams.search : undefined,
    status: typeof searchParams.status === "string" ? searchParams.status : undefined,
    source: typeof searchParams.source === "string" ? searchParams.source : undefined,
    page: typeof searchParams.page === "string" ? searchParams.page : undefined,
    pageSize: typeof searchParams.pageSize === "string" ? searchParams.pageSize : undefined,
  }

  const filters = customerFilterSchema.parse(raw)
  const result = await customerService.listCustomers(filters)

  return (
    <CustomerTable
      data={result.data as never}
      meta={result.meta}
      currentUserId={currentUserId}
    />
  )
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const session = await requireSession()
  const resolvedParams = await searchParams

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Khách hàng</h1>
          <p className="text-sm text-muted-foreground">Danh sách toàn bộ khách hàng</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/customers/new">
            <Plus className="size-4" />
            Thêm khách hàng
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b pb-4">
          <CustomerFilters />
        </CardHeader>
        <CardContent className="p-0">
          <Suspense
            fallback={<div className="p-6 text-sm text-muted-foreground">Đang tải...</div>}
          >
            <CustomerList
              searchParams={resolvedParams}
              currentUserId={session.user.id}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
