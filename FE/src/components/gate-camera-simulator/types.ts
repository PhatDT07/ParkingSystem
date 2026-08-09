import type { SlotStatus } from '@/types/model'

// ── Stub response shapes (Opus will fill real API bodies) ─────────────────────

export interface EntryScanResult {
  admitted: boolean
  sessionId?: string
  reservationMatched?: boolean
  suggestedSlotCode?: string
  reason?: 'FULL' | 'PLATE_MISMATCH' | 'SCAN_FAILED' | string
  message?: string
}

export interface ExitScanResult {
  sessionId: string
  licensePlate: string
  entryTime: string
  durationHours: number
  totalFee: number
  isPaid: boolean
  paymentMethods: string[]
}

export interface ForceCheckinResult {
  admitted: boolean
  sessionId: string
  message: string
}

export interface CameraSlotResult {
  matched?: boolean
  slotStatus: SlotStatus
}

// ── Event log ─────────────────────────────────────────────────────────────────

export type EventKind = 'ENTRY' | 'EXIT' | 'ERROR' | 'SLOT' | 'FORCE' | 'SYS'

export interface EventLogEntry {
  id: string
  ts: string // ISO
  kind: EventKind
  message: string
  plate?: string
  slotCode?: string
}

// ── Floor camera slot state ───────────────────────────────────────────────────

export interface SimSlot {
  slotCode: string
  status: SlotStatus
}

// ── Panel states ──────────────────────────────────────────────────────────────

export type EntryState =
  | 'IDLE'
  | 'SCANNING'
  | 'SCAN_FAILED'       // → reveal manual input
  | 'PLATE_MISMATCH'    // → offer Force Check-in
  | 'FULL'              // → HẾT CHỖ
  | 'DUPLICATE'         // → xe đã có phiên đỗ đang mở (biển số trùng)
  | 'ADMITTED'

export type ExitState =
  | 'IDLE'
  | 'SCANNING'
  | 'READY'             // scan success → show fee
  | 'SCAN_FAILED'

// ── Component props ───────────────────────────────────────────────────────────

export interface FailureRateSliderProps {
  value: number
  onChange: (v: number) => void
}

export interface EntryGatePanelProps {
  failureRate: number
  onEvent: (e: EventLogEntry) => void
}

export interface ExitGatePanelProps {
  failureRate: number
  onEvent: (e: EventLogEntry) => void
}

export interface FloorCameraPanelProps {
  onEvent: (e: EventLogEntry) => void
}

export interface EventLogProps {
  entries: EventLogEntry[]
}
