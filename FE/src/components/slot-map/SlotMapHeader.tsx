'use client'

import { cn } from '@/lib/utils'

interface SlotMapHeaderProps {
  readonly floors: number[]
  readonly activeFloor: number
  readonly floorLabel: (floor: number) => string
  readonly onFloorChange: (floor: number) => void
  readonly maintenanceMode: boolean
  readonly onToggleMaintenance: (on: boolean) => void
  /** Chỉ Manager/Admin mới thấy công tắc bảo trì (Staff chỉ xem). */
  readonly canManage?: boolean
}

const LEGEND = [
  { label: 'Trống', dot: 'bg-emerald-500' },
  { label: 'Đã có xe', dot: 'bg-red-500' },
  { label: 'Bảo trì', dot: 'bg-slate-400' },
]

export function SlotMapHeader({
  floors,
  activeFloor,
  floorLabel,
  onFloorChange,
  maintenanceMode,
  onToggleMaintenance,
  canManage = true,
}: SlotMapHeaderProps) {
  return (
    <div className="space-y-4 border-b border-gray-200 pb-4">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Sơ đồ ô đỗ</h2>
          <p className="text-sm text-gray-600">Giám sát trạng thái ô đỗ theo thời gian thực</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Legend */}
          <div className="hidden items-center gap-3 md:flex">
            {LEGEND.map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className={cn('h-3 w-3 rounded-sm', l.dot)} />
                <span className="text-xs text-gray-600">{l.label}</span>
              </div>
            ))}
          </div>
          {/* Maintenance mode toggle — chỉ Manager/Admin */}
          {canManage && (
            <label className="flex cursor-pointer items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Chế độ bảo trì</span>
              <span className="relative inline-flex">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={maintenanceMode}
                  onChange={(e) => onToggleMaintenance(e.target.checked)}
                />
                <span className="h-6 w-11 rounded-full bg-gray-300 transition-colors peer-checked:bg-blue-600" />
                <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
              </span>
            </label>
          )}
        </div>
      </div>

      {/* Floor tabs */}
      <div className="flex items-center gap-1">
        {floors.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onFloorChange(f)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              activeFloor === f
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900',
            )}
          >
            {floorLabel(f)}
          </button>
        ))}
      </div>
    </div>
  )
}
