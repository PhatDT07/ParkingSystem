'use client'

import { Car, LogIn, AlertTriangle, CheckCircle, CalendarClock } from 'lucide-react'
import type { ParkingSession } from '@/types/model'

interface Props {
  readonly sessions: ParkingSession[]
}

export function SessionStatsBar({ sessions }: Props) {
  const preparing = sessions.filter((s) => s.status === 'Preparing').length
  const parked = sessions.filter((s) => s.status === 'Parked').length
  const admitted = sessions.filter((s) => s.status === 'Admitted').length
  const moved = sessions.filter((s) => s.status === 'Moved').length
  const abandoned = sessions.filter((s) => s.status === 'Abandoned').length
  const open = sessions.filter((s) =>
    ['Admitted', 'Parked', 'Moved'].includes(s.status),
  ).length

  const stats = [
    {
      label: 'Chuẩn bị',
      value: preparing,
      icon: CalendarClock,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Đang trong bãi',
      value: open,
      icon: Car,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Chờ vào ô',
      value: admitted,
      icon: LogIn,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Đang rời ô',
      value: moved,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      label: 'Bỏ dở',
      value: abandoned,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: 'Đã đỗ',
      value: parked,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm"
        >
          <div className={`rounded-lg p-2 ${s.bg}`}>
            <s.icon className={`h-5 w-5 ${s.color}`} />
          </div>
          <div>
            <p className="text-2xl font-semibold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
