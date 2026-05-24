import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PayrollTable } from "./PayrollTable"
import { WorkerPayrollCard } from "./WorkerPayrollCard"
import type {
  SerializedOrderItemWorkerDetail,
  WorkerPayrollSummary,
} from "@/modules/workforce/types/workforce.types"

interface Props {
  data: {
    workerSummaries: WorkerPayrollSummary[]
    assignments: SerializedOrderItemWorkerDetail[]
  }
}

export function PayrollSummaryDashboard({ data }: Props) {
  return (
    <div className="space-y-6">
      {/* Thanh toán theo nhân viên — chỉ hiển thị khi có nhân viên chưa thanh toán */}
      {data.workerSummaries.length > 0 && (
        <Card>
          <CardHeader className="border-b pb-4">
            <CardTitle>Thanh toán theo nhân viên</CardTitle>
            <p className="text-sm text-muted-foreground">
              {data.workerSummaries.length} nhân viên có phân công chưa thanh toán
            </p>
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            {data.workerSummaries.map((s) => (
              <WorkerPayrollCard key={s.workerId} summary={s} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Danh sách phân công */}
      <Card>
        <CardHeader className="border-b pb-0">
          <CardTitle className="pb-3">Danh sách phân công</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <PayrollTable assignments={data.assignments} />
        </CardContent>
      </Card>
    </div>
  )
}
