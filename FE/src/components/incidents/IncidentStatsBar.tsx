'use client'

import { cn } from '@/lib/utils'
import type { Incident } from '@/types/model'

interface IncidentStatsBarProps {
  readonly incidents: Incident[]
}

export function IncidentStatsBar({ incidents }: IncidentStatsBarProps) {
  const cards = [
    { label: 'Tổng số', value: incidents.length, accent: '' },
    {
      label: 'Chưa xử lý',
      value: incidents.filter((i) => i.status === 'Open').length,
      accent: 'border-l-4 border-l-red-500',
    },
    {
      label: 'Đang xử lý',
      value: incidents.filter((i) => i.status === 'InProgress').length,
      accent: 'border-l-4 border-l-amber-500',
    },
    {
      label: 'Đã xử lý',
      value: incidents.filter((i) => i.status === 'Resolved').length,
      accent: 'border-l-4 border-l-emerald-500',
    },
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
