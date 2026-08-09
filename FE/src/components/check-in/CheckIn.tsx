'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { FailureRateSlider } from '@/components/gate-camera-simulator/FailureRateSlider'
import { EntryGatePanel } from '@/components/gate-camera-simulator/EntryGatePanel'
import { EventLog } from '@/components/gate-camera-simulator/EventLog'
import { MOCK_INITIAL_LOG } from '@/components/gate-camera-simulator/mockData'
import type { EventLogEntry } from '@/components/gate-camera-simulator/types'

/**
 * Trang Check-in (cổng vào): quét/nhập tay biển số, force check-in có audit, và báo sự cố
 * hệ thống cho quản lý. Tái sử dụng EntryGatePanel (state machine đã tách sang useEntryGate).
 */
export function CheckIn() {
  const [failureRate, setFailureRate] = useState(15)
  const [events, setEvents] = useState<EventLogEntry[]>(MOCK_INITIAL_LOG)

  const addEvent = useCallback((e: EventLogEntry) => {
    setEvents((prev) => [e, ...prev].slice(0, 200))
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Check-in cổng vào</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Quét biển số, nhập tay khi camera lỗi, ghi đè có kiểm toán.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <FailureRateSlider value={failureRate} onChange={setFailureRate} />
          <Link
            href="/incidents"
            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            <AlertTriangle className="h-4 w-4" />
            Báo sự cố cho quản lý
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <EntryGatePanel failureRate={failureRate} onEvent={addEvent} />
        <EventLog entries={events} />
      </div>
    </div>
  )
}
