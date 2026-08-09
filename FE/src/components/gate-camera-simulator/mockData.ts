import type { SimSlot, EventLogEntry } from './types'

export const MOCK_SLOTS: SimSlot[] = [
  { slotCode: 'B1-A01', status: 'Occupied' },
  { slotCode: 'B1-A02', status: 'Available' },
  { slotCode: 'B1-A03', status: 'Available' },
  { slotCode: 'B1-A04', status: 'Occupied' },
  { slotCode: 'B1-A05', status: 'Available' },
  { slotCode: 'B1-A06', status: 'Maintenance' },
  { slotCode: 'B1-B01', status: 'Occupied' },
  { slotCode: 'B1-B02', status: 'Available' },
  { slotCode: 'B1-B03', status: 'Occupied' },
  { slotCode: 'B1-B04', status: 'Available' },
  { slotCode: 'B1-B05', status: 'Available' },
  { slotCode: 'B1-B06', status: 'Occupied' },
]

export const MOCK_INITIAL_LOG: EventLogEntry[] = [
  {
    id: 'init-1',
    ts: new Date(Date.now() - 120_000).toISOString(),
    kind: 'SYS',
    message: 'Hệ thống khởi động. Terminal #04-Alpha sẵn sàng.',
  },
  {
    id: 'init-2',
    ts: new Date(Date.now() - 90_000).toISOString(),
    kind: 'ENTRY',
    message: 'Cổng IN-01: Xe vào thành công.',
    plate: '30G-123.45',
    slotCode: 'B1-A02',
  },
  {
    id: 'init-3',
    ts: new Date(Date.now() - 60_000).toISOString(),
    kind: 'SLOT',
    message: 'Camera B1-A02: Xe đã đỗ (OCCUPIED).',
    slotCode: 'B1-A02',
  },
]

// Canned entry scan responses keyed by scenario
const CANNED_ENTRY_SUCCESS = {
  admitted: true,
  sessionId: 'sess-mock-001',
  reservationMatched: true,
  suggestedSlotCode: 'B1-A02',
  message: 'Xe vào thành công. Chỗ đỗ gợi ý: B1-A02',
}

const CANNED_ENTRY_SCAN_FAILED = {
  admitted: false,
  reason: 'SCAN_FAILED' as const,
  message: 'Không nhận diện được biển số. Vui lòng nhập tay.',
}

const CANNED_ENTRY_MISMATCH = {
  admitted: false,
  reason: 'PLATE_MISMATCH' as const,
  message: 'Biển số không khớp đặt chỗ. Có thể dùng Force Check-in.',
}

const CANNED_ENTRY_FULL = {
  admitted: false,
  reason: 'FULL' as const,
  message: 'Bãi xe đã đầy.',
}

const CANNED_EXIT_SUCCESS = {
  sessionId: 'sess-mock-001',
  licensePlate: '30G-123.45',
  entryTime: new Date(Date.now() - 2.5 * 3600_000).toISOString(),
  durationHours: 2.5,
  totalFee: 50_000,
  isPaid: false,
  paymentMethods: ['Cash', 'QR'],
}

const CANNED_FORCE_CHECKIN = {
  admitted: true,
  sessionId: 'sess-mock-002',
  message: 'Force check-in thành công qua QR.',
}
