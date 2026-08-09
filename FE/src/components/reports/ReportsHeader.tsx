'use client'

import { Download } from 'lucide-react'
import type { ReportsHeaderProps } from './types'

export function ReportsHeader({ range, onRangeChange, onExport }: ReportsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Báo cáo &amp; Thống kê</h1>
        <p className="text-sm text-gray-500 mt-0.5">Doanh thu, lưu lượng và giờ cao điểm theo khoảng thời gian</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
          <label className="text-xs font-medium text-gray-500 whitespace-nowrap">Từ</label>
          <input
            type="date"
            value={range.from}
            onChange={(e) => onRangeChange({ ...range, from: e.target.value })}
            className="text-sm text-gray-800 border-none outline-none bg-transparent"
          />
          <span className="text-gray-300">—</span>
          <label className="text-xs font-medium text-gray-500 whitespace-nowrap">Đến</label>
          <input
            type="date"
            value={range.to}
            onChange={(e) => onRangeChange({ ...range, to: e.target.value })}
            className="text-sm text-gray-800 border-none outline-none bg-transparent"
          />
        </div>
      </div>
    </div>
  )
}
