import { notFound } from "next/navigation"
import Link from "next/link"
import { requireSession } from "@/shared/lib/auth-utils"
import { leadService } from "@/modules/crm/service/lead.service"
import { db } from "@/shared/lib/prisma"
import { EditLeadForm } from "@/modules/crm/components/leads/LeadForm"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface PageProps {
  params: Promise<{ id: string }>
}

async function getFormData() {
  const [customers, users] = await Promise.all([
    db.customer.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ])
  return { customers, users }
}

export default async function EditLeadPage({ params }: PageProps) {
  const { id } = await params
  await requireSession()

  let lead: Awaited<ReturnType<typeof leadService.getLead>>
  try {
    lead = await leadService.getLead(id)
  } catch {
    notFound()
  }

  const { customers, users } = await getFormData()

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/dashboard/leads/${id}`}>
            <ArrowLeft className="size-4" />
            Quay lại
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Chỉnh sửa lead</h1>
          <p className="text-sm text-muted-foreground">{lead.title}</p>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Thông tin lead</CardTitle>
          <CardDescription>Cập nhật thông tin cơ hội kinh doanh</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <EditLeadForm lead={lead as never} customers={customers} users={users} />
        </CardContent>
      </Card>
    </div>
  )
}
