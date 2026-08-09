'use client'

import type { ReportsTableProps } from './types'

export function ReportsTable({ revenue }: ReportsTableProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700">Tổng hợp theo ngày</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-3 text-left">Ngày</th>
              <th className="px-4 py-3 text-right">Doanh thu</th>
              <th className="px-4 py-3 text-right">Lượt xe</th>
              <th className="px-4 py-3 text-right">Lấp đầy %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {revenue.map((r, i) => (
              <tr key={r.date} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                <td className="px-4 py-2.5 text-gray-700 font-medium">
                  {new Date(r.date).toLocaleDateString('vi-VN', {
                    weekday: 'short',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-4 py-2.5 text-right text-gray-800 font-medium">
                  {r.revenue.toLocaleString('vi-VN')} ₫
                </td>
                <td className="px-4 py-2.5 text-right text-gray-700">
                  {r.sessions.toLocaleString('vi-VN')}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.occupancyRate >= 80
                        ? 'bg-red-100 text-red-700'
                        : r.occupancyRate >= 60
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {r.occupancyRate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 border-t border-gray-200 font-semibold text-gray-700">
              <td className="px-4 py-2.5">Tổng</td>
              <td className="px-4 py-2.5 text-right">
                {revenue.reduce((s, r) => s + r.revenue, 0).toLocaleString('vi-VN')} ₫
              </td>
              <td className="px-4 py-2.5 text-right">
                {revenue.reduce((s, r) => s + r.sessions, 0).toLocaleString('vi-VN')}
              </td>
              <td className="px-4 py-2.5 text-right text-gray-400 text-xs font-normal">
                TB{' '}
                {revenue.length > 0
                  ? Math.round(
                      revenue.reduce((s, r) => s + r.occupancyRate, 0) / revenue.length,
                    )
                  : 0}
                %
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
