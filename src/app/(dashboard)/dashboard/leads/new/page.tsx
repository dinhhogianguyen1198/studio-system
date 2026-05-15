import Link from "next/link"
import { requireSession } from "@/shared/lib/auth-utils"
import { db } from "@/shared/lib/prisma"
import { CreateLeadForm } from "@/modules/crm/components/leads/LeadForm"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

async function getFormData() {
  const [customers, users] = await Promise.all([
    db.customer.findMany({
      where: { status: "ACTIVE" },
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

export default async function NewLeadPage() {
  await requireSession()
  const { customers, users } = await getFormData()

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/leads">
            <ArrowLeft className="size-4" />
            Quay lại
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Thêm lead</h1>
          <p className="text-sm text-muted-foreground">Tạo cơ hội kinh doanh mới</p>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Thông tin lead</CardTitle>
          <CardDescription>Điền đầy đủ thông tin để tạo lead</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <CreateLeadForm customers={customers} users={users} />
        </CardContent>
      </Card>
    </div>
  )
}
