'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { PeakHoursBarsProps } from './types'

export function PeakHoursBars({ windows }: PeakHoursBarsProps) {
  const maxEntries = Math.max(...windows.map((w) => w.entries), 1)
  const data = windows.map((w) => ({
    label: w.windowStart,
    'Lượt vào': w.entries,
    isPeak: w.entries === maxEntries,
  }))

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Lượt vào theo giờ (giờ cao điểm)</h2>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6B7280' }} />
          <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} width={36} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #E5E7EB' }}
            formatter={(v) => [Number(v).toLocaleString('vi-VN'), 'Lượt vào']}
          />
          <Bar dataKey="Lượt vào" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.isPeak ? '#EF4444' : '#3B82F6'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-400 mt-2">Cột đỏ = giờ cao điểm</p>
    </div>
  )
}
