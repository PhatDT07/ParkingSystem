'use client'

import { Wrench, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Slot, SlotStatus } from '@/types/model'

const STATUS_TILE: Record<SlotStatus, string> = {
  Available: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:border-emerald-400',
  Occupied: 'bg-red-50 border-red-200 text-red-700',
  Maintenance: 'bg-slate-100 border-slate-300 text-slate-500',
}

interface SlotTileProps {
  readonly slot: Slot
  readonly maintenanceMode: boolean
  readonly selected: boolean
  readonly onClick: () => void
}

export function SlotTile({ slot, maintenanceMode, selected, onClick }: SlotTileProps) {
  const isMaintenance = slot.status === 'Maintenance'
  // In maintenance mode only Available slots can be picked.
  const selectable = maintenanceMode && slot.status === 'Available'
  const disabled = maintenanceMode && !selectable && !isMaintenance

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex aspect-square flex-col items-center justify-center rounded-lg border text-xs font-mono font-semibold transition-all',
        STATUS_TILE[slot.status],
        selectable && 'cursor-pointer',
        disabled && 'cursor-not-allowed opacity-50',
        selected && 'ring-2 ring-blue-500 ring-offset-1',
      )}
      title={slot.slotCode}
    >
      {selected && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white">
          <Check className="h-3 w-3" />
        </span>
      )}
      {isMaintenance && <Wrench className="mb-0.5 h-3.5 w-3.5" />}
      <span>{slot.slotCode}</span>
    </button>
  )
}
