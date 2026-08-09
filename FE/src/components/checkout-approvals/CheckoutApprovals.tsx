'use client'

import { useState } from 'react'
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import {
  useCheckoutApprovals,
  useApproveCheckout,
  useRejectCheckout,
} from '@/hooks/useCheckoutApprovals'
import type { CheckoutApproval } from '@/types/model'

const STATUS_OPTIONS: CheckoutApproval['status'][] = ['Open', 'Approved', 'Rejected']
const STATUS_LABELS: Record<CheckoutApproval['status'], string> = {
  Open: 'Chờ duyệt',
  Approved: 'Đã duyệt',
  Rejected: 'Đã từ chối',
}

/**
 * Manager duyệt/từ chối các checkout bị tạm giữ vì tiền mặt Staff báo thu lệch quá
 * cashToleranceVnd so với số hệ thống tính (SessionService.checkOut → CheckoutApprovalRequest).
 */
export function CheckoutApprovals() {
  const [status, setStatus] = useState<CheckoutApproval['status']>('Open')
  const { data: approvals = [], isLoading, refetch } = useCheckoutApprovals({ status })
  const approve = useApproveCheckout()
  const reject = useRejectCheckout()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Duyệt thanh toán</h2>
        <p className="text-sm text-gray-600">
          Checkout bị tạm giữ vì tiền mặt thu tại cổng lệch so với số hệ thống tính
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
        <Select value={status} onValueChange={(v) => setStatus(v as CheckoutApproval['status'])}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => refetch()} title="Làm mới">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-gray-500">Đang tải danh sách...</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Biển số</TableHead>
                  <TableHead>Staff báo thu</TableHead>
                  <TableHead>Hệ thống tính</TableHead>
                  <TableHead>Chênh lệch</TableHead>
                  <TableHead>Lý do</TableHead>
                  <TableHead>Thời gian</TableHead>
                  {status === 'Open' && <TableHead className="text-center">Thao tác</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-gray-500">
                      Không có yêu cầu nào
                    </TableCell>
                  </TableRow>
                ) : (
                  approvals.map((a) => (
                    <TableRow key={a.approvalId} className="hover:bg-gray-50">
                      <TableCell className="font-mono font-medium">{a.licensePlate}</TableCell>
                      <TableCell className="font-medium text-gray-900">
                        {formatCurrency(a.requestedAmount)}
                      </TableCell>
                      <TableCell className="text-gray-600">{formatCurrency(a.computedAmount)}</TableCell>
                      <TableCell className="font-medium text-amber-600">
                        {formatCurrency(Math.abs(a.requestedAmount - a.computedAmount))}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-gray-600">
                        {a.reason ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {a.createdAt ? formatDateTime(a.createdAt) : '—'}
                      </TableCell>
                      {status === 'Open' && (
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              className="gap-1"
                              disabled={approve.isPending || reject.isPending}
                              onClick={() => approve.mutate(a.approvalId)}
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Duyệt
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-red-600 hover:bg-red-50"
                              disabled={approve.isPending || reject.isPending}
                              onClick={() => reject.mutate(a.approvalId)}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Từ chối
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
