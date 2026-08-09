'use client'

import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SESSION_STATUS_LABELS } from '@/lib/constants'
import { formatDateTime, formatDuration, formatCurrency } from '@/lib/utils'
import { useNow } from '@/hooks/useNow'
import type { ParkingSession } from '@/types/model'

const STATUS_COLORS: Record<string, string> = {
  Preparing: 'bg-purple-100 text-purple-800 border-purple-200',
  Admitted: 'bg-amber-100 text-amber-800 border-amber-200',
  Parked: 'bg-green-100 text-green-800 border-green-200',
  Moved: 'bg-orange-100 text-orange-800 border-orange-200',
  Completed: 'bg-gray-100 text-gray-600 border-gray-200',
  Abandoned: 'bg-red-100 text-red-800 border-red-200',
}

interface Props {
  readonly sessions: ParkingSession[]
}

export function SessionTable({ sessions }: Props) {
  const now = useNow()

  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white py-16 text-center text-sm text-gray-500 shadow-sm">
        Không có phiên nào phù hợp
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-mono text-xs uppercase tracking-wide text-gray-500">
              Biển số
            </TableHead>
            <TableHead className="font-mono text-xs uppercase tracking-wide text-gray-500">
              Loại xe
            </TableHead>
            <TableHead className="font-mono text-xs uppercase tracking-wide text-gray-500">
              Trạng thái
            </TableHead>
            <TableHead className="font-mono text-xs uppercase tracking-wide text-gray-500">
              Giờ vào
            </TableHead>
            <TableHead className="font-mono text-xs uppercase tracking-wide text-gray-500">
              Ô gợi ý
            </TableHead>
            <TableHead className="font-mono text-xs uppercase tracking-wide text-gray-500">
              Ô thực tế
            </TableHead>
            <TableHead className="font-mono text-xs uppercase tracking-wide text-gray-500">
              Thời gian đỗ
            </TableHead>
            <TableHead className="font-mono text-xs uppercase tracking-wide text-gray-500">
              Phí tạm tính
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((s, i) => (
            <TableRow
              key={s.sessionId}
              className={i % 2 === 1 ? 'bg-gray-50/50' : ''}
            >
              <TableCell className="font-mono font-medium text-gray-900">
                {s.licensePlate}
                {s.reservationId && (
                  <span className="ml-1.5 rounded bg-blue-50 px-1 py-0.5 text-[10px] font-normal text-blue-600">
                    Đặt chỗ
                  </span>
                )}
                {s.isOverstayFlagged && (
                  <span className="ml-1.5 rounded bg-red-50 px-1 py-0.5 text-[10px] font-normal text-red-600">
                    Quá giờ
                  </span>
                )}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {s.vehicleTypeName ?? '—'}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`text-xs font-normal ${STATUS_COLORS[s.status] ?? ''}`}
                >
                  {SESSION_STATUS_LABELS[s.status] ?? s.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {formatDateTime(s.entryTime)}
              </TableCell>
              <TableCell className="font-mono text-sm text-gray-600">
                {s.assignedSlotCode ?? '—'}
              </TableCell>
              <TableCell className="font-mono text-sm text-gray-600">
                {s.actualSlotCode ?? '—'}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {now === null
                  ? '—'
                  : s.parkedTime
                    ? formatDuration(Math.floor((new Date(s.exitTime ?? now).getTime() - new Date(s.parkedTime).getTime()) / 60000))
                    : s.status === 'Admitted'
                      ? formatDuration(Math.floor((now - new Date(s.entryTime).getTime()) / 60000))
                      : '—'}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {s.totalFee != null
                  ? formatCurrency(s.totalFee)
                  : s.status === 'Completed' || s.status === 'Preparing'
                    ? '—'
                    : <span className="text-gray-400">đang tính...</span>}
                {!!s.depositAlreadyPaid && s.depositAlreadyPaid > 0 && (
                  <span className="ml-1.5 rounded bg-green-50 px-1 py-0.5 text-[10px] font-normal text-green-600">
                    đã cọc {formatCurrency(s.depositAlreadyPaid)}
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-400">
        Hiển thị {sessions.length} phiên
      </div>
    </div>
  )
}
