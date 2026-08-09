'use client'

import { cn } from '@/lib/utils'

interface SlotStatsBarProps {
  readonly total: number
  readonly available: number
  readonly occupied: number
  readonly maintenance: number
}

export function SlotStatsBar({ total, available, occupied, maintenance }: SlotStatsBarProps) {
  const cards = [
    { label: 'Tổng ô', value: total, accent: '' },
    { label: 'Trống', value: available, accent: 'border-l-4 border-l-emerald-500' },
    { label: 'Đã có xe', value: occupied, accent: 'border-l-4 border-l-red-500' },
    { label: 'Bảo trì', value: maintenance, accent: 'border-l-4 border-l-slate-400' },
  ]
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className={cn('rounded-lg border border-gray-200 bg-white p-4 shadow-sm', c.accent)}
        >
          <div className="mb-1 text-sm text-gray-600">{c.label}</div>
          <div className="text-2xl font-bold text-gray-900">{c.value}</div>
        </div>
      ))}
    </div>
  )
}
