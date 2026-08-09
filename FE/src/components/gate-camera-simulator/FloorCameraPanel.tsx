'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useCameraOccupied, useCameraVacated } from '@/hooks/useGateSim'
import { MOCK_SLOTS } from './mockData'
import type { FloorCameraPanelProps, EventLogEntry, SimSlot } from './types'
import type { SlotStatus } from '@/types/model'

function mkEvent(partial: Omit<EventLogEntry, 'id' | 'ts'>): EventLogEntry {
  return { ...partial, id: crypto.randomUUID(), ts: new Date().toISOString() }
}

const STATUS_STYLE: Record<SlotStatus, string> = {
  Available:   'border-green-400 bg-green-50 hover:border-green-600',
  Occupied:    'border-red-400 bg-red-50 hover:border-red-600',
  Maintenance: 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-60',
}

const STATUS_LABEL: Record<SlotStatus, string> = {
  Available:   'TRỐNG',
  Occupied:    'XE ĐÃ ĐỖ',
  Maintenance: 'BẢO TRÌ',
}

const STATUS_ICON: Record<SlotStatus, string> = {
  Available:   'check_circle',
  Occupied:    'directions_car',
  Maintenance: 'construction',
}

const STATUS_ICON_COLOR: Record<SlotStatus, string> = {
  Available:   'text-green-500',
  Occupied:    'text-red-500',
  Maintenance: 'text-gray-400',
}

export function FloorCameraPanel({ onEvent }: FloorCameraPanelProps) {
  const [slots, setSlots] = useState<SimSlot[]>(MOCK_SLOTS)
  const [selected, setSelected] = useState<string | null>(null)

  const occupied = useCameraOccupied()
  const vacated = useCameraVacated()

  async function handleOccupied(slotCode: string) {
    const res = await occupied.mutateAsync({ slotCode })
    setSlots((prev) => prev.map((s) => s.slotCode === slotCode ? { ...s, status: res.slotStatus } : s))
    onEvent(mkEvent({ kind: 'SLOT', message: `Camera: ${slotCode} → XE ĐÃ ĐỖ`, slotCode }))
  }

  async function handleVacated(slotCode: string) {
    const res = await vacated.mutateAsync({ slotCode })
    setSlots((prev) => prev.map((s) => s.slotCode === slotCode ? { ...s, status: res.slotStatus } : s))
    onEvent(mkEvent({ kind: 'SLOT', message: `Camera: ${slotCode} → TRỐNG`, slotCode }))
  }

  const isLoading = occupied.isPending || vacated.isPending
  const sel = slots.find((s) => s.slotCode === selected)

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <span className="material-symbols-outlined text-purple-600">grid_view</span>
          Camera Tầng B1
        </h3>
        <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-1 rounded-md">
          {slots.filter((s) => s.status === 'Available').length}/{slots.length} trống
        </span>
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        <p className="text-xs text-gray-500">Chọn ô đỗ để giả lập trạng thái cảm biến camera.</p>

        {/* Slot grid */}
        <div className="grid grid-cols-3 gap-2">
          {slots.map((slot) => (
            <button
              key={slot.slotCode}
              onClick={() => slot.status !== 'Maintenance' && setSelected(slot.slotCode)}
              disabled={slot.status === 'Maintenance'}
              className={cn(
                'rounded-lg border-2 p-2 flex flex-col items-start gap-1 transition-all text-left',
                STATUS_STYLE[slot.status],
                selected === slot.slotCode && 'ring-2 ring-blue-500 ring-offset-1',
              )}
              aria-label={`Ô ${slot.slotCode}: ${STATUS_LABEL[slot.status]}`}
              aria-pressed={selected === slot.slotCode}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-mono text-xs font-bold text-gray-700">{slot.slotCode.split('-').slice(1).join('-')}</span>
                <span className={cn('material-symbols-outlined text-sm', STATUS_ICON_COLOR[slot.status])}>
                  {STATUS_ICON[slot.status]}
                </span>
              </div>
              <span className={cn(
                'text-[10px] font-mono font-bold px-1 rounded',
                slot.status === 'Available'   && 'bg-green-100 text-green-700',
                slot.status === 'Occupied'    && 'bg-red-100 text-red-700',
                slot.status === 'Maintenance' && 'bg-gray-200 text-gray-500',
              )}>
                {STATUS_LABEL[slot.status]}
              </span>
            </button>
          ))}
        </div>

        {/* Override controls for selected slot */}
        {sel && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-col gap-2">
            <p className="text-xs font-semibold text-gray-700">
              Giả lập ô: <span className="font-mono">{sel.slotCode}</span>
              {' '}—{' '}
              <span className={cn(
                'font-bold',
                sel.status === 'Available' && 'text-green-600',
                sel.status === 'Occupied'  && 'text-red-600',
              )}>
                {STATUS_LABEL[sel.status]}
              </span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleOccupied(sel.slotCode)}
                disabled={isLoading || sel.status === 'Occupied'}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">directions_car</span>
                Xe đã đỗ
              </button>
              <button
                onClick={() => handleVacated(sel.slotCode)}
                disabled={isLoading || sel.status === 'Available'}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Ô trống
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
