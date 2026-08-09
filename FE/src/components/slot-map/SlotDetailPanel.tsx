'use client'

import { X, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, getStatusColor } from '@/lib/utils'
import { SLOT_STATUS_LABELS } from '@/lib/constants'
import type { Slot } from '@/types/model'

interface SlotDetailPanelProps {
  readonly slot: Slot
  readonly vehicleTypeName: string
  readonly isLoading: boolean
  readonly onToggleMaintenance: (slot: Slot) => void
  readonly onClose: () => void
  /** Chỉ Manager/Admin mới có nút bảo trì (Staff chỉ xem chi tiết). */
  readonly canManage?: boolean
}

export function SlotDetailPanel({
  slot,
  vehicleTypeName,
  isLoading,
  onToggleMaintenance,
  onClose,
  canManage = true,
}: SlotDetailPanelProps) {
  const rows = [
    { label: 'Khu vực', value: slot.zone ?? '—' },
    { label: 'Loại xe', value: vehicleTypeName },
    { label: 'Tầng', value: slot.floor === -1 ? 'Hầm B1' : `Tầng ${slot.floor}` },
  ]
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-mono text-lg font-bold text-gray-900">{slot.slotCode}</h3>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-4 rounded-lg bg-gray-50 p-3">
        <span className="mb-1 block text-xs text-gray-500">Trạng thái</span>
        <span
          className={cn(
            'inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium',
            getStatusColor(slot.status),
          )}
        >
          {SLOT_STATUS_LABELS[slot.status]}
        </span>
      </div>

      <dl className="mb-5 space-y-2 text-sm">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between">
            <dt className="text-gray-500">{r.label}</dt>
            <dd className="font-medium text-gray-900">{r.value}</dd>
          </div>
        ))}
      </dl>

      {canManage && (
        <>
          <Button
            variant="outline"
            className="w-full gap-2"
            disabled={isLoading || slot.status === 'Occupied'}
            onClick={() => onToggleMaintenance(slot)}
          >
            <Wrench className="h-4 w-4" />
            {slot.status === 'Maintenance' ? 'Kết thúc bảo trì' : 'Đánh dấu bảo trì'}
          </Button>
          {slot.status === 'Occupied' && (
            <p className="mt-2 text-center text-xs text-gray-500">Không thể bảo trì ô đang có xe</p>
          )}
        </>
      )}
    </div>
  )
}
