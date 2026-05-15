import { notFound } from "next/navigation"
import Link from "next/link"
import { requireSession } from "@/shared/lib/auth-utils"
import { leadService } from "@/modules/crm/service/lead.service"
import { addLeadNoteAction, deleteLeadNoteAction } from "@/modules/crm/actions/lead.actions"
import { deleteLeadAction } from "@/modules/crm/actions/lead.actions"
import { NoteTimeline } from "@/modules/crm/components/shared/NoteTimeline"
import { LeadStatusBadge, LeadPriorityBadge } from "@/modules/crm/components/leads/LeadStatusBadge"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Building2,
  Calendar,
  Mail,
  Pencil,
  Phone,
  Trash2,
  User,
  DollarSign,
} from "lucide-react"
import { CUSTOMER_SOURCE_LABELS } from "@/modules/crm/types/crm.types"

interface PageProps {
  params: Promise<{ id: string }>
}

function formatValue(value: { toString(): string } | null, currency: string) {
  if (value == null) return "—"
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency }).format(Number(value.toString()))
}

export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await requireSession()

  let lead: Awaited<ReturnType<typeof leadService.getLead>>
  try {
    lead = await leadService.getLead(id)
  } catch {
    notFound()
  }

  const addNote = addLeadNoteAction.bind(null, id)
  const deleteNote = async (noteId: string) => {
    "use server"
    return deleteLeadNoteAction(noteId, id)
  }
  const deleteLead = async (_formData: FormData) => {
    "use server"
    await deleteLeadAction(id)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/leads">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{lead.title}</h1>
              <LeadStatusBadge status={lead.status} />
              <LeadPriorityBadge priority={lead.priority} />
            </div>
            <p className="text-sm text-muted-foreground">
              Liên hệ: {lead.contactName}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/leads/${id}/edit`}>
              <Pencil className="size-4" />
              Chỉnh sửa
            </Link>
          </Button>
          <form action={deleteLead}>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              onClick={(e) => {
                if (!confirm("Xác nhận xóa lead này?")) e.preventDefault()
              }}
            >
              <Trash2 className="size-4" />
              Xóa
            </Button>
          </form>
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
              <div className="flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                <span className="font-medium">{lead.contactName}</span>
              </div>
              {lead.contactEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="size-4 text-muted-foreground" />
                  <a href={`mailto:${lead.contactEmail}`} className="hover:underline">
                    {lead.contactEmail}
                  </a>
                </div>
              )}
              {lead.contactPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="size-4 text-muted-foreground" />
                  <a href={`tel:${lead.contactPhone}`} className="hover:underline">
                    {lead.contactPhone}
                  </a>
                </div>
              )}
              {lead.customer && (
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-muted-foreground" />
                  <Link
                    href={`/dashboard/customers/${lead.customer.id}`}
                    className="hover:underline"
                  >
                    {lead.customer.name}
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-base">Chi tiết lead</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Giá trị</span>
                <span className="flex items-center gap-1 font-semibold">
                  <DollarSign className="size-3.5" />
                  {formatValue(lead.value, lead.currency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Nguồn</span>
                <Badge variant="outline">{CUSTOMER_SOURCE_LABELS[lead.source]}</Badge>
              </div>
              {lead.expectedCloseDate && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Ngày đóng dự kiến</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5 text-muted-foreground" />
                    {new Date(lead.expectedCloseDate).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              )}
              {lead.assignedTo && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Giao cho</span>
                  <span>{lead.assignedTo.name ?? lead.assignedTo.email}</span>
                </div>
              )}
              <Separator />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Tạo bởi</span>
                <span>{lead.createdBy.name ?? lead.createdBy.email}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Ngày tạo</span>
                <span>{new Date(lead.createdAt).toLocaleDateString("vi-VN")}</span>
              </div>
              {lead.closedAt && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Ngày đóng</span>
                  <span>{new Date(lead.closedAt).toLocaleDateString("vi-VN")}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: notes */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-base">Ghi chú ({lead.notes.length})</CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <NoteTimeline
                notes={lead.notes}
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
