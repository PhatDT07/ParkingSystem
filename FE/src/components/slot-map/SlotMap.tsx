'use client'

import { SlotMapHeader } from './SlotMapHeader'
import { SlotStatsBar } from './SlotStatsBar'
import { ZoneSection } from './ZoneSection'
import { SlotDetailPanel } from './SlotDetailPanel'
import { MaintenancePanel } from './MaintenancePanel'
import { useSlotMap } from '@/hooks/useSlotMap'
import { useAuthStore } from '@/store'
import type { Slot } from '@/types/model'

/**
 * Unified Slot Map (slice 1). Layout from Stitch "Variant 1 (Compact)", maintenance
 * multi-select + action panel from "Variant 3 (Active Selection)", and the capacity-crash
 * confirmation from "Variant 2 (Warning State)" — wired to the real data layer.
 */
export function SlotMap() {
  const map = useSlotMap()
  const role = useAuthStore((s) => s.user?.role)
  const canManage = role === 'Manager' || role === 'Admin'

  const handleSlotClick = (slot: Slot) => {
    if (map.maintenanceMode) {
      if (slot.status === 'Available') map.toggleSelect(slot.slotCode)
    } else {
      map.openDetail(slot.slotCode)
    }
  }

  return (
    <div className="space-y-6">


      <SlotMapHeader
        floors={map.floors}
        activeFloor={map.activeFloor}
        floorLabel={map.floorLabel}
        onFloorChange={map.setActiveFloor}
        maintenanceMode={map.maintenanceMode}
        onToggleMaintenance={map.enterMaintenanceMode}
        canManage={canManage}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left: stats + zone grid */}
        <div className="space-y-6">
          <SlotStatsBar
            total={map.stats.total}
            available={map.stats.available}
            occupied={map.stats.occupied}
            maintenance={map.stats.maintenance}
          />
          {map.isLoading ? (
            <div className="py-16 text-center text-gray-500">Đang tải sơ đồ...</div>
          ) : (
            <div className="space-y-6">
              {map.slotsByZone.map(([zone, slots]) => (
                <ZoneSection
                  key={zone}
                  zone={zone}
                  slots={slots}
                  maintenanceMode={map.maintenanceMode}
                  selected={map.selected}
                  onSlotClick={handleSlotClick}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: contextual panel */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          {map.maintenanceMode ? (
            <MaintenancePanel
              selected={Array.from(map.selected)}
              reason={map.reason}
              notes={map.notes}
              isLocking={map.isLocking}
              onDeselect={map.toggleSelect}
              onReasonChange={map.setReason}
              onNotesChange={map.setNotes}
              onLock={map.confirmLock}
              onClear={map.clearSelection}
            />
          ) : map.detailSlot ? (
            <SlotDetailPanel
              slot={map.detailSlot}
              vehicleTypeName={map.vehicleTypeName(map.detailSlot.vehicleTypeId)}
              isLoading={map.isLocking}
              onToggleMaintenance={map.toggleSlotMaintenance}
              onClose={map.closeDetail}
              canManage={canManage}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
              Chọn một ô để xem chi tiết, hoặc bật <span className="font-medium">Chế độ bảo trì</span>.
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

