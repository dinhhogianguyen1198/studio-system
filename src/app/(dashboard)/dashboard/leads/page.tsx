import { Suspense } from "react"
import Link from "next/link"
import { requireSession } from "@/shared/lib/auth-utils"
import { leadService } from "@/modules/crm/service/lead.service"
import { leadFilterSchema } from "@/modules/crm/schemas/crm.schema"
import { LeadTable } from "@/modules/crm/components/leads/LeadTable"
import { LeadFilters } from "@/modules/crm/components/leads/LeadFilters"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface PageProps {
  searchParams: Promise<Record<string, string | string[]>>
}

async function LeadList({ searchParams }: { searchParams: Record<string, string | string[]> }) {
  const raw = {
    search: typeof searchParams.search === "string" ? searchParams.search : undefined,
    status: typeof searchParams.status === "string" ? searchParams.status : undefined,
    priority: typeof searchParams.priority === "string" ? searchParams.priority : undefined,
    source: typeof searchParams.source === "string" ? searchParams.source : undefined,
    assignedToId: typeof searchParams.assignedToId === "string" ? searchParams.assignedToId : undefined,
    customerId: typeof searchParams.customerId === "string" ? searchParams.customerId : undefined,
    page: typeof searchParams.page === "string" ? searchParams.page : undefined,
    pageSize: typeof searchParams.pageSize === "string" ? searchParams.pageSize : undefined,
  }

  const filters = leadFilterSchema.parse(raw)
  const result = await leadService.listLeads(filters)

  return <LeadTable data={result.data as never} meta={result.meta} />
}

export default async function LeadsPage({ searchParams }: PageProps) {
  await requireSession()
  const resolvedParams = await searchParams

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-sm text-muted-foreground">Quản lý cơ hội kinh doanh</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/leads/new">
            <Plus className="size-4" />
            Thêm lead
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b pb-4">
          <LeadFilters />
        </CardHeader>
        <CardContent className="p-0">
          <Suspense
            fallback={<div className="p-6 text-sm text-muted-foreground">Đang tải...</div>}
          >
            <LeadList searchParams={resolvedParams} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
