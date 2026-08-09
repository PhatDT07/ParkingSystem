'use client'

import { useState, useCallback } from 'react'
import { FailureRateSlider } from './FailureRateSlider'
import { EntryGatePanel } from './EntryGatePanel'
import { ExitGatePanel } from './ExitGatePanel'
import { FloorCameraPanel } from './FloorCameraPanel'
import { EventLog } from './EventLog'
import { MOCK_INITIAL_LOG } from './mockData'
import type { EventLogEntry } from './types'

export function GateCameraSimulator() {
  const [failureRate, setFailureRate] = useState(15)
  const [events, setEvents] = useState<EventLogEntry[]>(MOCK_INITIAL_LOG)

  const addEvent = useCallback((e: EventLogEntry) => {
    setEvents((prev) => [e, ...prev].slice(0, 200))
  }, [])

  return (
    <div className="flex flex-col gap-4">
      {/* Page header + slider */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Mô phỏng Cổng &amp; Camera</h2>
          <p className="text-sm text-gray-500 mt-0.5">Giả lập vận hành cổng, camera và rào chắn.</p>
        </div>
        <FailureRateSlider value={failureRate} onChange={setFailureRate} />
      </div>

      {/* 3-panel bento grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <EntryGatePanel failureRate={failureRate} onEvent={addEvent} />
        <ExitGatePanel failureRate={failureRate} onEvent={addEvent} />
        <FloorCameraPanel onEvent={addEvent} />
      </div>

      {/* Terminal event log */}
      <EventLog entries={events} />
    </div>
  )
}
