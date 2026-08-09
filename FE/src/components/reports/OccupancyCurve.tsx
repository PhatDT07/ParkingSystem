'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { OccupancyCurveProps } from './types'

export function OccupancyCurve({ windows }: OccupancyCurveProps) {
  const data = windows.map((w) => ({
    label: w.windowStart,
    'Xe trong bãi': w.inside,
  }))

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Số xe trong bãi theo giờ</h2>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="reportsInsideGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6B7280' }} />
          <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} width={36} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #E5E7EB' }}
            formatter={(v) => [Number(v).toLocaleString('vi-VN'), 'Xe trong bãi']}
          />
          <Area
            type="monotone"
            dataKey="Xe trong bãi"
            stroke="#10B981"
            strokeWidth={2}
            fill="url(#reportsInsideGrad)"
            dot={{ r: 3, fill: '#10B981' }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
