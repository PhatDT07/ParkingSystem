'use client'

import { useMemo, useState } from 'react'
import type { Slot } from '@/types/model'
import {
  useLotSlots,
  useSetMaintenance,
  useVehicleTypes,
} from '@/hooks/useAvailability'

function floorLabel(floor: number): string {
  return floor === -1 ? 'Hầm B1' : `Tầng ${floor}`
}

/**
 * Slot-map state + logic: floor tabs, maintenance multi-select, single-slot detail.
 * Wires to the real slots/maintenance endpoints (single building).
 */
export function useSlotMap() {
  const { data: slots = [], isLoading } = useLotSlots()
  const { data: vehicleTypes = [] } = useVehicleTypes()
  const setMaintenance = useSetMaintenance()

  const [activeFloor, setActiveFloor] = useState<number | null>(null)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [detailCode, setDetailCode] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')

  const vtName = useMemo(
    () => Object.fromEntries(vehicleTypes.map((v) => [v.id, v.name])),
    [vehicleTypes],
  )

  // Floors present, sorted with basement last (B1 shown after upper floors).
  const floors = useMemo(() => {
    const set = Array.from(new Set(slots.map((s) => s.floor)))
    return set.sort((a, b) => (a < 0 ? 1 : b < 0 ? -1 : a - b))
  }, [slots])

  const floor = activeFloor ?? floors[0] ?? 1
  const floorSlots = useMemo(() => slots.filter((s) => s.floor === floor), [slots, floor])

  const slotsByZone = useMemo(() => {
    const map = new Map<string, Slot[]>()
    for (const s of floorSlots) {
      const z = s.zone ?? '—'
      if (!map.has(z)) map.set(z, [])
      map.get(z)!.push(s)
    }
    for (const list of map.values()) list.sort((a, b) => a.slotCode.localeCompare(b.slotCode))
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [floorSlots])

  const stats = useMemo(
    () => ({
      total: floorSlots.length,
      available: floorSlots.filter((s) => s.status === 'Available').length,
      occupied: floorSlots.filter((s) => s.status === 'Occupied').length,
      maintenance: floorSlots.filter((s) => s.status === 'Maintenance').length,
    }),
    [floorSlots],
  )

  const detailSlot = useMemo(
    () => slots.find((s) => s.slotCode === detailCode) ?? null,
    [slots, detailCode],
  )

  function enterMaintenanceMode(on: boolean) {
    setMaintenanceMode(on)
    setSelected(new Set())
    if (on) setDetailCode(null)
  }

  function toggleSelect(code: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(code) ? next.delete(code) : next.add(code)
      return next
    })
  }

  /** Fire the API directly, relying on backend to enforce capacity crashes natively. */
  function confirmLock() {
    const codes = Array.from(selected)
    if (!codes.length) return
    setMaintenance.mutate(
      { slotCodes: codes, maintenance: true },
      {
        onSuccess: () => {
          setSelected(new Set())
          setReason('')
          setNotes('')
        },
      },
    )
  }

  /** Single-slot toggle from the detail panel. */
  function toggleSlotMaintenance(slot: Slot) {
    setMaintenance.mutate({
      slotCodes: [slot.slotCode],
      maintenance: slot.status !== 'Maintenance',
    })
  }

  return {
    isLoading,
    floors,
    floorLabel,
    activeFloor: floor,
    setActiveFloor,
    maintenanceMode,
    enterMaintenanceMode,
    slotsByZone,
    stats,
    selected,
    toggleSelect,
    clearSelection: () => setSelected(new Set()),
    detailSlot,
    openDetail: (code: string) => setDetailCode(code),
    closeDetail: () => setDetailCode(null),
    toggleSlotMaintenance,
    vehicleTypeName: (id: string) => vtName[id] ?? id,
    reason,
    setReason,
    notes,
    setNotes,
    confirmLock,
    isLocking: setMaintenance.isPending,
  }
}
