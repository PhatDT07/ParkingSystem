'use client'

import { SlotTile } from './SlotTile'
import type { Slot } from '@/types/model'

interface ZoneSectionProps {
  readonly zone: string
  readonly slots: Slot[]
  readonly maintenanceMode: boolean
  readonly selected: Set<string>
  readonly onSlotClick: (slot: Slot) => void
}

export function ZoneSection({ zone, slots, maintenanceMode, selected, onSlotClick }: ZoneSectionProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-gray-900">Khu {zone}</h3>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
        {slots.map((slot) => (
          <SlotTile
            key={slot.slotCode}
            slot={slot}
            maintenanceMode={maintenanceMode}
            selected={selected.has(slot.slotCode)}
            onClick={() => onSlotClick(slot)}
          />
        ))}
      </div>
    </div>
  )
}
