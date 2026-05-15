"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Pencil, Trash2, ExternalLink, Package } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { NoteTimeline } from "../shared/NoteTimeline"
import type { ActionResult } from "@/shared/types/api.types"
import { CustomerEditDialog } from "./CustomerEditDialog"
import {
  getCustomerDetailAction,
  getCustomerOrdersAction,
  deleteCustomerDialogAction,
  addCustomerNoteAction,
  deleteCustomerNoteAction,
  type CustomerDetailData,
  type CustomerOrderItem,
} from "../../actions/customer.actions"
import { CUSTOMER_STATUS_LABELS } from "../../types/crm.types"
import { ORDER_STATUS_LABELS } from "@/modules/orders/types/orders.types"

// ─── Info tab ─────────────────────────────────────────────────────────────────

function InfoTab({ customer }: { customer: CustomerDetailData }) {
  const fields: Array<{ label: string; value: string | null | undefined }> = [
    { label: "Tên", value: customer.name },
    { label: "Số điện thoại", value: customer.phone },
    { label: "Email", value: customer.email },
    { label: "Địa chỉ", value: customer.address },
    { label: "Tạo bởi", value: customer.createdBy.name ?? customer.createdBy.email },
    {
      label: "Ngày tạo",
      value: new Date(customer.createdAt).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map(({ label, value }) => (
        <div key={label} className="space-y-0.5">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-medium">{value ?? "—"}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Orders tab ───────────────────────────────────────────────────────────────

function OrdersTab({
  orders,
  isLoading,
}: {
  orders: CustomerOrderItem[] | null
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
        <Package className="size-8 opacity-40" />
        <p className="text-sm">Chưa có đơn hàng nào</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {orders.map((order) => {
        const remaining = order.totalAmount - order.paidAmount
        const formatter = new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: order.currency === "VND" ? "VND" : order.currency,
          maximumFractionDigits: 0,
        })

        return (
          <div
            key={order.id}
            className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
          >
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{order.orderNumber}</span>
                <Badge variant="outline" className="text-xs">
                  {ORDER_STATUS_LABELS[order.status] ?? order.status}
                </Badge>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>Tổng: {formatter.format(order.totalAmount)}</span>
                <span>Đã TT: {formatter.format(order.paidAmount)}</span>
                {remaining > 0 && (
                  <span className="text-destructive font-medium">
                    Còn lại: {formatter.format(remaining)}
                  </span>
                )}
                {remaining <= 0 && order.totalAmount > 0 && (
                  <span className="text-success font-medium">Đã thanh toán đủ</span>
                )}
              </div>
            </div>
            <Button asChild variant="ghost" size="sm" className="ml-2 shrink-0">
              <Link href={`/dashboard/orders/${order.id}`} target="_blank">
                <ExternalLink className="size-3.5" />
                <span className="sr-only">Mở đơn hàng</span>
              </Link>
            </Button>
          </div>
        )
      })}
    </div>
  )
}

// ─── Notes tab ────────────────────────────────────────────────────────────────

function NotesTab({
  customer,
  currentUserId,
  onNotesChanged,
}: {
  customer: CustomerDetailData
  currentUserId: string
  onNotesChanged: () => void
}) {
  const boundAddNote = addCustomerNoteAction.bind(null, customer.id)

  async function handleDeleteNote(noteId: string): Promise<ActionResult<void>> {
    const result = await deleteCustomerNoteAction(noteId, customer.id)
    if (result.success) {
      toast.success("Đã xóa ghi chú")
      onNotesChanged()
    } else {
      toast.error(result.error)
    }
    return result
  }

  const notes = customer.notes.map((n) => ({
    ...n,
    createdAt: new Date(n.createdAt),
    updatedAt: new Date(n.updatedAt),
  }))

  return (
    <NoteTimeline
      notes={notes}
      addAction={boundAddNote}
      deleteAction={handleDeleteNote}
      currentUserId={currentUserId}
    />
  )
}

// ─── Main dialog ──────────────────────────────────────────────────────────────

interface Props {
  customerId: string | null
  currentUserId: string
  onClose: () => void
}

export function CustomerDetailDialog({ customerId, currentUserId, onClose }: Props) {
  const [customer, setCustomer] = useState<CustomerDetailData | null>(null)
  const [orders, setOrders] = useState<CustomerOrderItem[] | null>(null)
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false)
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [activeTab, setActiveTab] = useState("info")
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const open = customerId !== null

  async function loadCustomer(id: string): Promise<void> {
    setIsLoadingCustomer(true)
    const result = await getCustomerDetailAction(id)
    setIsLoadingCustomer(false)
    if (result.success) {
      setCustomer(result.data)
    } else {
      toast.error(result.error)
      onClose()
    }
  }

  async function loadOrders(id: string): Promise<void> {
    setIsLoadingOrders(true)
    const result = await getCustomerOrdersAction(id)
    setIsLoadingOrders(false)
    if (result.success) {
      setOrders(result.data)
    }
  }

  useEffect(() => {
    if (customerId) {
      setCustomer(null)
      setOrders(null)
      setActiveTab("info")
      void loadCustomer(customerId)
      void loadOrders(customerId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId])

  async function handleDelete(): Promise<void> {
    if (!customerId) return
    setIsDeleting(true)
    const result = await deleteCustomerDialogAction(customerId)
    setIsDeleting(false)
    if (result.success) {
      toast.success("Đã xóa khách hàng")
      setIsDeleteOpen(false)
      onClose()
    } else {
      toast.error(result.error)
    }
  }

  function handleEditSuccess(): void {
    setIsEditOpen(false)
    if (customerId) {
      void loadCustomer(customerId)
    }
  }

  const statusVariant =
    customer?.status === "ACTIVE"
      ? "success"
      : customer?.status === "INACTIVE"
        ? "muted"
        : "destructive"

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col gap-0 p-0">
          {/* Header */}
          <DialogHeader className="px-6 pt-5 pb-4 border-b">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {isLoadingCustomer ? (
                    <div className="h-6 w-48 animate-pulse rounded bg-muted" />
                  ) : (
                    <DialogTitle className="text-lg font-semibold">
                      {customer?.name ?? ""}
                    </DialogTitle>
                  )}
                  {customer && (
                    <Badge variant={statusVariant}>
                      {CUSTOMER_STATUS_LABELS[customer.status]}
                    </Badge>
                  )}
                </div>
                {customer && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {customer.phone ?? customer.email ?? "—"}
                  </p>
                )}
              </div>
              {customer && (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditOpen(true)}
                  >
                    <Pencil className="size-3.5" />
                    Sửa
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setIsDeleteOpen(true)}
                  >
                    <Trash2 className="size-3.5" />
                    Xóa
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>

          {/* Tabs */}
          {customer && (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="px-6 pt-3">
                <TabsList className="h-8">
                  <TabsTrigger value="info" className="text-xs">
                    Thông tin
                  </TabsTrigger>
                  <TabsTrigger value="orders" className="text-xs">
                    Đơn hàng
                    {orders && orders.length > 0 && (
                      <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium">
                        {orders.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="text-xs">
                    Ghi chú
                    {customer._count.notes > 0 && (
                      <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium">
                        {customer._count.notes}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                <TabsContent value="info">
                  <InfoTab customer={customer} />
                </TabsContent>
                <TabsContent value="orders">
                  <OrdersTab orders={orders} isLoading={isLoadingOrders} />
                </TabsContent>
                <TabsContent value="notes">
                  <NotesTab
                    customer={customer}
                    currentUserId={currentUserId}
                    onNotesChanged={() => customerId && void loadCustomer(customerId)}
                  />
                </TabsContent>
              </div>
            </Tabs>
          )}

          {isLoadingCustomer && (
            <div className="flex-1 space-y-3 px-6 py-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-5 animate-pulse rounded bg-muted" />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      {customer && (
        <CustomerEditDialog
          open={isEditOpen}
          customer={customer}
          onClose={() => setIsEditOpen(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa khách hàng?</AlertDialogTitle>
            <AlertDialogDescription>
              Thao tác này không thể hoàn tác. Khách hàng{" "}
              <span className="font-medium text-foreground">{customer?.name}</span> sẽ bị
              xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
