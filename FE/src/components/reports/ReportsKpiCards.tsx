'use client'

import { TrendingUp, Car, Percent, Clock } from 'lucide-react'
import type { ReportsKpiCardsProps } from './types'

function fmt(n: number) {
  return n.toLocaleString('vi-VN')
}

function fmtVnd(n: number) {
  return n.toLocaleString('vi-VN') + ' ₫'
}

export function ReportsKpiCards({ revenue }: ReportsKpiCardsProps) {
  const totalRevenue = revenue.reduce((s, r) => s + r.revenue, 0)
  const totalSessions = revenue.reduce((s, r) => s + r.sessions, 0)
  const avgOccupancy =
    revenue.length > 0
      ? Math.round(revenue.reduce((s, r) => s + r.occupancyRate, 0) / revenue.length)
      : 0
  const peakDay = revenue.reduce(
    (best, r) => (r.sessions > best.sessions ? r : best),
    revenue[0] ?? { date: '—', sessions: 0, revenue: 0, occupancyRate: 0 },
  )
  const peakLabel = peakDay
    ? new Date(peakDay.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
    : '—'

  const cards = [
    {
      label: 'Doanh thu',
      value: fmtVnd(totalRevenue),
      icon: TrendingUp,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Số lượt xe',
      value: fmt(totalSessions),
      icon: Car,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Tỉ lệ lấp đầy TB',
      value: avgOccupancy + '%',
      icon: Percent,
      color: 'bg-yellow-50 text-yellow-600',
    },
    {
      label: 'Ngày cao điểm',
      value: peakLabel,
      sub: fmt(peakDay?.sessions ?? 0) + ' lượt',
      icon: Clock,
      color: 'bg-purple-50 text-purple-600',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => {
        const Icon = c.icon
        return (
          <div key={c.label} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex items-center gap-4">
            <div className={`p-2.5 rounded-lg ${c.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium truncate">{c.label}</p>
              <p className="text-lg font-bold text-gray-900 leading-tight">{c.value}</p>
              {c.sub && <p className="text-xs text-gray-400">{c.sub}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
