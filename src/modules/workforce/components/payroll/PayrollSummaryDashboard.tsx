import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, ClipboardList, DollarSign } from "lucide-react"
import { AssignmentStatusBadge } from "@/modules/workforce/components/assignments/AssignmentStatusBadge"
import type { OrderItemWorkerDetail, WorkerAssignmentStatus } from "@/modules/workforce/types/workforce.types"

interface Props {
  data: {
    totalWorkers: number
    activeWorkers: number
    totalAssignments: number
    completedAssignments: number
    totalCost: number
    currency: string
    recentAssignments: OrderItemWorkerDetail[]
  }
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currency || "VND",
  }).format(amount)
}

export function PayrollSummaryDashboard({ data }: Props) {
  const completionRate =
    data.totalAssignments > 0
      ? Math.round((data.completedAssignments / data.totalAssignments) * 100)
      : 0

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng nhân viên
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.totalWorkers}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {data.activeWorkers} đang hoạt động
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Nhân viên hoạt động
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.activeWorkers}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {data.totalWorkers > 0
                ? Math.round((data.activeWorkers / data.totalWorkers) * 100)
                : 0}
              % tổng số
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng phân công
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.totalAssignments}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {data.completedAssignments} hoàn thành ({completionRate}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng chi phí
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(data.totalCost, data.currency)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Không tính phân công đã hủy</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent assignments table */}
      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle>Phân công gần đây</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.recentAssignments.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Chưa có phân công nào
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nhân viên</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Mức lương</TableHead>
                  <TableHead>Số lượng</TableHead>
                  <TableHead>Tổng chi phí</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentAssignments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.worker.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.jobTypeNameSnapshot}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(Number(a.rateAmountSnapshot), "VND")}
                    </TableCell>
                    <TableCell>{Number(a.quantity)}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(Number(a.totalCost), "VND")}
                    </TableCell>
                    <TableCell>
                      <AssignmentStatusBadge
                        status={a.status as WorkerAssignmentStatus}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(a.createdAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
