'use client'

import { Car, Clock } from 'lucide-react'
import { formatCurrency, formatDateTime, formatDuration } from '@/lib/utils'
import type { FeeBreakdownProps } from './types'

export function FeeBreakdown({
  licensePlate,
  entryTime,
  totalFee,
  depositAlreadyPaid,
  amountDue,
  breakdown,
  durationMinutes,
}: FeeBreakdownProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Car className="h-5 w-5 text-gray-500" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Thông tin xe ra
          </h3>
        </div>
        <p className="font-mono text-3xl font-bold tracking-wider text-gray-900">
          {licensePlate}
        </p>
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          <span>Vào lúc {formatDateTime(entryTime)}</span>
          <span className="mx-1 text-gray-300">·</span>
          <span>Thời gian đỗ {formatDuration(durationMinutes)}</span>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Chi tiết cước phí
        </h3>
        <div className="space-y-2">
          {breakdown.map((line) => (
            <div key={line.label} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {line.label}
                {line.ratePerHour > 0 && (
                  <span className="ml-1 text-gray-400">
                    ({formatCurrency(line.ratePerHour)}/h × {line.hours}h)
                  </span>
                )}
              </span>
              <span className="font-medium text-gray-800">{formatCurrency(line.subtotal)}</span>
            </div>
          ))}
          {depositAlreadyPaid > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Đã cọc trước</span>
              <span className="font-medium text-green-600">-{formatCurrency(depositAlreadyPaid)}</span>
            </div>
          )}
        </div>
        <div className="mt-4 border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Còn phải thu</span>
            <span className="text-2xl font-bold text-blue-600">{formatCurrency(amountDue)}</span>
          </div>
          {depositAlreadyPaid > 0 && (
            <p className="mt-1 text-xs text-gray-400">
              Tổng phí đỗ xe {formatCurrency(totalFee)} — đã trừ {formatCurrency(depositAlreadyPaid)} tiền cọc
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
