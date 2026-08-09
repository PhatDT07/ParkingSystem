'use client'

import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateTime, formatDuration, calculateDuration, formatCurrency } from '@/lib/utils'
import type { ParkingSession } from '@/types/model'

interface CheckoutSessionListProps {
  readonly sessions: ParkingSession[]
  readonly onCheckout: (session: ParkingSession) => void
}

/** Danh sách phiên đang đỗ + nút Check-out từng xe (demo thay cho camera quét biển số). */
export function CheckoutSessionList({ sessions, onCheckout }: CheckoutSessionListProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Biển số</TableHead>
              <TableHead>Ô đỗ</TableHead>
              <TableHead>Giờ vào</TableHead>
              <TableHead>Thời gian đỗ</TableHead>
              <TableHead className="text-right">Phí tạm tính</TableHead>
              <TableHead className="text-center">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-gray-500">
                  Không có xe nào đang đỗ
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((s) => (
                <TableRow key={s.sessionId} className="hover:bg-gray-50">
                  <TableCell className="font-mono font-bold">
                    {s.licensePlate}
                    {s.isOverstayFlagged && (
                      <span className="ml-1.5 rounded bg-red-50 px-1 py-0.5 text-[10px] font-normal text-red-600">
                        Quá giờ
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{s.actualSlotCode ?? '—'}</TableCell>
                  <TableCell className="text-sm text-gray-600">{formatDateTime(s.entryTime)}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatDuration(calculateDuration(s.entryTime))}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {s.totalFee != null ? formatCurrency(s.totalFee) : '—'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button size="sm" className="gap-1.5" onClick={() => onCheckout(s)}>
                      <LogOut className="h-3.5 w-3.5" />
                      Check-out
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
