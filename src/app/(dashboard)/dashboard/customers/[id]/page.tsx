import { notFound } from "next/navigation"
import Link from "next/link"
import { requireSession } from "@/shared/lib/auth-utils"
import { customerService } from "@/modules/crm/service/customer.service"
import { addCustomerNoteAction, deleteCustomerNoteAction } from "@/modules/crm/actions/customer.actions"
import { NoteTimeline } from "@/modules/crm/components/shared/NoteTimeline"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Building2, Mail, MapPin, Pencil, Phone, Tag } from "lucide-react"
import { deleteCustomerAction } from "@/modules/crm/actions/customer.actions"
import { DeleteCustomerButton } from "@/modules/crm/components/customers/DeleteCustomerButton"
import { LeadStatusBadge } from "@/modules/crm/components/leads/LeadStatusBadge"
import {
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_SOURCE_LABELS,
} from "@/modules/crm/types/crm.types"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await requireSession()

  let customer: Awaited<ReturnType<typeof customerService.getCustomer>>
  try {
    customer = await customerService.getCustomer(id)
  } catch {
    notFound()
  }

  // Bind note actions to this customer
  const addNote = addCustomerNoteAction.bind(null, id)
  const deleteNote = async (noteId: string) => {
    "use server"
    return deleteCustomerNoteAction(noteId, id)
  }
  const deleteCustomer = async (formData: FormData) => {
    "use server"
    await deleteCustomerAction(id)
  }

  const statusVariant =
    customer.status === "ACTIVE"
      ? "success"
      : customer.status === "INACTIVE"
        ? "muted"
        : "destructive"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/customers">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{customer.name}</h1>
              <Badge variant={statusVariant}>{CUSTOMER_STATUS_LABELS[customer.status]}</Badge>
            </div>
            {customer.company && (
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <Building2 className="size-3.5" />
                {customer.company}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/customers/${id}/edit`}>
              <Pencil className="size-4" />
              Chỉnh sửa
            </Link>
          </Button>
          <DeleteCustomerButton deleteAction={deleteCustomer} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: details */}
        <div className="space-y-5 lg:col-span-1">
          <Card>
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-base">Thông tin liên hệ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-sm">
              {customer.email && (
                <div className="flex items-center gap-2">
                  <Mail className="size-4 text-muted-foreground" />
                  <a href={`mailto:${customer.email}`} className="hover:underline">
                    {customer.email}
                  </a>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="size-4 text-muted-foreground" />
                  <a href={`tel:${customer.phone}`} className="hover:underline">
                    {customer.phone}
                  </a>
                </div>
              )}
              {customer.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span>{customer.address}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-base">Phân loại</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Nguồn</span>
                <Badge variant="outline">{CUSTOMER_SOURCE_LABELS[customer.source]}</Badge>
              </div>
              {customer.tags.length > 0 && (
                <div className="flex items-start gap-2">
                  <Tag className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="flex flex-wrap gap-1">
                    {customer.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <Separator />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Tạo bởi</span>
                <span>{customer.createdBy.name ?? customer.createdBy.email}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Ngày tạo</span>
                <span>
                  {new Date(customer.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Leads summary */}
          {customer.leads.length > 0 && (
            <Card>
              <CardHeader className="border-b pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Leads ({customer.leads.length})</CardTitle>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/dashboard/leads?customerId=${id}`}>Xem tất cả</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="divide-y p-0">
                {customer.leads.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/dashboard/leads/${lead.id}`}
                    className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted/50"
                  >
                    <span className="truncate font-medium">{lead.title}</span>
                    <LeadStatusBadge status={lead.status as never} />
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: notes */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-base">Ghi chú ({customer.notes.length})</CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <NoteTimeline
                notes={customer.notes}
                addAction={addNote}
                deleteAction={deleteNote}
                currentUserId={session.user.id}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
