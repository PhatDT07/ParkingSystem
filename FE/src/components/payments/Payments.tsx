'use client'

import { RefreshCw, Landmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { usePayments } from '@/hooks/usePayments'

/**
 * Danh sách cọc cần hoàn thủ công qua ngân hàng — PayOS không có API hoàn tiền tự động cho
 * merchant này (chưa cấu hình Payout), nên các khoản này rơi vào refundStatus=ManualRequired
 * và cần Manager tự chuyển khoản rồi đối chiếu bằng tay. Chỉ xem — BE chưa có endpoint đánh dấu
 * "đã hoàn" nên không có nút thao tác ở đây.
 */
export function Payments() {
  const { data: payments = [], isLoading, refetch } = usePayments('ManualRequired')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Hoàn cọc thủ công</h2>
        <p className="text-sm text-gray-600">
          Các khoản cọc cần chuyển khoản hoàn tiền thủ công (PayOS chưa cấu hình hoàn tiền tự động)
        </p>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Landmark className="h-4 w-4" />
          Đối chiếu bằng mã giao dịch (transactionReference), chuyển khoản xong đánh dấu ở hệ thống ngân hàng.
        </div>
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
                  <TableHead>Mã giao dịch</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Phương thức</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Thời gian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-gray-500">
                      Không có khoản nào cần hoàn cọc thủ công
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((p) => (
                    <TableRow key={p.paymentId} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm">
                        {p.transactionReference ?? `#${p.paymentId}`}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{p.paymentPurpose ?? '—'}</TableCell>
                      <TableCell className="text-sm text-gray-600">{p.paymentMethod}</TableCell>
                      <TableCell className="font-medium text-gray-900">{formatCurrency(p.amount)}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {p.paidAt ? formatDateTime(p.paidAt) : '—'}
                      </TableCell>
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
