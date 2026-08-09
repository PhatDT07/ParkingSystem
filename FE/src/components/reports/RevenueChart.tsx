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
import type { RevenueChartProps } from './types'

interface TooltipInternalProps {
  active?: boolean
  payload?: Array<{ payload: { revenue: number; sessions: number } }>
  label?: string
}

function CustomTooltip({ active, payload, label }: TooltipInternalProps) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow text-xs space-y-1">
      <p className="font-semibold text-gray-700">{label}</p>
      <p className="text-blue-600">Doanh thu: {Number(d?.revenue).toLocaleString('vi-VN')} ₫</p>
      <p className="text-green-600">Lượt xe: {Number(d?.sessions).toLocaleString('vi-VN')}</p>
    </div>
  )
}

export function RevenueChart({ revenue }: RevenueChartProps) {
  const data = revenue.map((r) => ({
    ...r,
    label: new Date(r.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
  }))

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Doanh thu theo ngày</h2>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6B7280' }} />
          <YAxis
            tick={{ fontSize: 11, fill: '#6B7280' }}
            width={60}
            tickFormatter={(v) =>
              v >= 1_000_000
                ? (v / 1_000_000).toFixed(1) + 'M'
                : v >= 1_000
                ? (v / 1_000).toFixed(0) + 'K'
                : String(v)
            }
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#revenueGrad)"
            dot={{ r: 3, fill: '#3B82F6' }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
