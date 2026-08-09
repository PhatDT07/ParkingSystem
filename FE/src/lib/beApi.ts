// Hình dạng DTO của Spring Boot backend + hàm map sang model FE (@/types/model).
// Mọi việc "nối API" gom về đây: hook chỉ gọi endpoint rồi map qua các hàm này,
// UI giữ nguyên vì luôn nhận shape FE đã quen.
import type {
  Slot,
  SlotStatus,
  VehicleType,
  ParkingSession,
  SessionStatus,
  Incident,
  IncidentStatus,
  IncidentType,
  Reservation,
  ReservationStatus,
  BookingQuota,
  PricingPolicy,
  FeeConfig,
  LotAvailability,
  CheckoutApproval,
  Payment,
  PaymentType,
  PaymentMethod,
  PaymentStatus,
} from '@/types/model'

// ── BE DTO shapes ───────────────────────────────────────────────────────────────
export interface BeVehicleType {
  vehicleTypeId: number
  typeName: string
  dimensions?: string | null
}

export interface BeGate {
  gateId: number
  gateName: string
  gateType: string // "Entry" | "Exit"
  floorId?: number | null
  floorName?: string | null
}

export interface BeSlot {
  slotId: number
  zone?: string | null
  slotCode: string
  status: string
  floor?: BeFloor | null
  vehicleType?: BeVehicleType | null
}

export interface BeActiveSession {
  sessionId: number
  licensePlateIn: string
  vehicleTypeName?: string | null
  entryTime: string
  entryGateName?: string | null
  status: string
  suggestedSlotCode?: string | null
  actualSlotCode?: string | null
  hasReservation: boolean
  hasCard: boolean
  parkedMinutes: number
  isForceCheckIn?: boolean | null  // staff overrode plate mismatch
  isOverstay?: boolean | null      // session exceeded 24h grace period (walk-in) / expectedExitTime (reservation)
  isOverstayFlagged?: boolean | null // background job: reservation-backed session past expectedExitTime+30min, still open
  estimatedFee?: number | null     // phí tạm tính GỘP theo bảng giá đến hiện tại (chưa trừ cọc)
  depositAlreadyPaid?: number | null // tiền cọc đã thanh toán (0 nếu không có đặt chỗ / cọc chưa Paid)
  amountDue?: number | null        // số tiền THỰC còn phải thu = estimatedFee - depositAlreadyPaid - đã thanh toán online khác
}

export interface BeIncident {
  incidentId: number
  // BE @JsonIgnore các quan hệ và phơi ID phẳng qua getter:
  sessionId?: number | null
  reportedByUserId?: number | null
  handledByStaffId?: number | null
  issueType: string
  description: string
  proofImageUrl?: string | null
  status: string
  resolvedAt?: string | null
  resolutionNotes?: string | null
  createdAt?: string | null
  takenOverAt?: string | null
  escalatedAt?: string | null
}

export interface BeReservation {
  reservationId: string
  // BE @JsonIgnore user & vehicleType, phơi phẳng qua getter:
  userId?: number | null
  vehicleTypeId?: number | null
  vehicleTypeName?: string | null
  licensePlate: string
  expectedEntryTime: string
  expectedExitTime: string
  depositAmount: number
  depositStatus?: string | null
  status: string
  createdAt: string
}

export interface BeQuota {
  quotaId: number
  vehicleType?: BeVehicleType | null
  startTime: string // "HH:mm:ss"
  endTime: string
  quotaPercent: number
  isActive?: boolean | null
}

export interface BePricingPolicy {
  policyId: number
  vehicleType?: BeVehicleType | null
  basePrice: number
  baseHours: number
  extraHourPrice: number
  nightSurcharge?: number | null
  lostTicketFee?: number | null
  effectiveDate: string
  status: string
}

export interface BeFeeConfig {
  depositPercent: number
  overstayRatePerHour: number
  noShowGraceMinutes: number
  blacklistThreshold: number
  depositPaymentWindowMinutes?: number | null
  cashToleranceVnd?: number | null
}

export interface BeParkingInfo {
  parkingName: string
  operatingHours: string
  totalAvailableSlots: number
  availabilityByVehicleType: Array<{
    vehicleTypeName: string
    totalSlots: number
    availableSlots: number
  }>
  pricingPolicies: Array<{
    vehicleTypeName: string
    basePrice: number
    baseHours: number
    extraHourPrice: number
    nightSurcharge?: number | null
  }>
}

/**
 * Shape returned by GET /manager/availability — matches LotAvailability directly.
 * (Different from the public /driver/parking-info which uses BeParkingInfo above.)
 */
export interface BeManagerAvailability {
  byVehicleType: Array<{
    vehicleTypeName: string
    capacity: number
    inside: number
    outstanding: number
    walkInHeadroom: number
    byZone: Array<{ zone: string; available: number }>
  }>
}

/** Floor DTO from /manager/floors */
export interface BeFloor {
  floorId: number
  floorName: string
  dedicatedVehicleTypeId?: number | null
  totalCapacity?: number | null
}

/** CheckOut response now includes isOverstay from the backend */
export interface BeCheckOutResponse {
  sessionId: number
  amount: number
  paymentStatus: string
  paymentMethod: string
  plateMismatch: boolean
  slotFreed?: string | null
  isOverstay?: boolean | null
  // true khi collectedAmount lệch quá CASH_TOLERANCE_VND — checkout CHƯA hoàn tất, chờ Manager duyệt.
  pendingApproval?: boolean | null
  approvalRequestId?: number | null
}

/**
 * GET /manager/payments — BE trả thẳng entity Payment; `session`/`reservation` là @DBRef @JsonIgnore
 * nên không có trong JSON, chỉ dùng transactionReference để đối chiếu thủ công.
 */
export interface BePayment {
  paymentId: number
  amount: number
  paymentMethod: string
  paymentTime?: string | null
  paymentStatus: string
  transactionReference?: string | null
  paymentPurpose?: string | null
  refundStatus?: string | null
  refundedAt?: string | null
}

/** GET /manager/checkout-approvals — BE trả thẳng entity, không qua DTO. */
export interface BeCheckoutApproval {
  approvalId: number
  sessionId: number
  licensePlate: string
  requestedAmount: number
  computedAmount: number
  reason?: string | null
  requestedBy?: string | null
  status: string // Open | Approved | Rejected
  decidedBy?: string | null
  decidedAt?: string | null
  createdAt?: string | null
  overstay?: boolean | null
  totalFee?: number | null
  plateMismatch?: boolean | null
}

export interface BeRevenueReport {
  fromDate: string
  toDate: string
  completedSessions: number
  totalRevenue: number
  avgRevenuePerSession: number
}

export interface BeTrafficReport {
  period: string
  totalEntries: number
  totalExits: number
  currentInside: number
  walkInCount: number
  reservationCount: number
  peakHour: number
  peakHourCount: number
}

// ── helpers ─────────────────────────────────────────────────────────────────────
/** "B1" → -1, "Tầng 2" → 2, "P3" → 3. Tầng hầm (có chữ B) là số âm. */
function parseFloor(floorName?: string | null): number {
  if (!floorName) return 0
  const digits = floorName.match(/\d+/)
  const n = digits ? parseInt(digits[0], 10) : 0
  return /b/i.test(floorName) ? -n : n
}

/** "08:00:00" → "08:00" */
function hhmm(time?: string | null): string {
  return (time ?? '').slice(0, 5)
}

// ── mappers: BE → FE ──────────────────────────────────────────────────────────────
export function mapVehicleType(v: BeVehicleType): VehicleType {
  return { id: String(v.vehicleTypeId), name: v.typeName }
}

export function mapSlot(s: BeSlot): Slot {
  return {
    id: String(s.slotId),
    slotCode: s.slotCode,
    floor: parseFloor(s.floor?.floorName),
    zone: s.zone ?? undefined,
    vehicleTypeId: s.vehicleType ? String(s.vehicleType.vehicleTypeId) : '',
    status: s.status as SlotStatus,
  }
}

export function mapActiveSession(s: BeActiveSession): ParkingSession {
  return {
    sessionId: String(s.sessionId),
    // BE DTO chỉ cho biết có booking hay không (không trả reservationId);
    // dùng cờ để UI hiện nhãn "Đặt chỗ".
    reservationId: s.hasReservation ? 'booked' : null,
    vehicleTypeId: '',
    vehicleTypeName: s.vehicleTypeName ?? undefined,
    licensePlate: s.licensePlateIn,
    assignedSlotCode: s.suggestedSlotCode ?? undefined,
    actualSlotCode: s.actualSlotCode ?? undefined,
    entryTime: s.entryTime,
    isPaid: false,
    totalFee: s.estimatedFee ?? undefined, // phí tạm tính GỘP từ BE (null khi chưa có bảng giá)
    depositAlreadyPaid: s.depositAlreadyPaid ?? undefined,
    amountDue: s.amountDue ?? undefined,
    status: s.status as SessionStatus,
    isForceCheckIn: s.isForceCheckIn ?? undefined,
    isOverstay: s.isOverstay ?? undefined,
    isOverstayFlagged: s.isOverstayFlagged ?? undefined,
  }
}

export function mapIncident(i: BeIncident): Incident {
  return {
    incidentId: String(i.incidentId),
    issueType: i.issueType as IncidentType,
    sessionId: i.sessionId != null ? String(i.sessionId) : undefined,
    description: i.description,
    createdAt: i.createdAt ?? i.resolvedAt ?? new Date().toISOString(),
    status: i.status as IncidentStatus,
    handledByStaffId: i.handledByStaffId != null ? String(i.handledByStaffId) : undefined,
    resolutionNotes: i.resolutionNotes ?? undefined,
    resolveAt: i.resolvedAt ?? undefined,
    takenOverAt: i.takenOverAt ?? undefined,
    escalatedAt: i.escalatedAt ?? undefined,
  }
}

export function mapReservation(r: BeReservation): Reservation {
  return {
    reservationId: String(r.reservationId),
    userId: r.userId != null ? String(r.userId) : undefined,
    vehicleTypeId: r.vehicleTypeId != null ? String(r.vehicleTypeId) : '',
    vehicleTypeName: r.vehicleTypeName ?? undefined,
    licensePlate: r.licensePlate,
    expectedEntryTime: r.expectedEntryTime,
    expectedExitTime: r.expectedExitTime,
    depositAmount: Number(r.depositAmount ?? 0),
    status: r.status as ReservationStatus,
    createdAt: r.createdAt,
  }
}

export function mapQuota(q: BeQuota): BookingQuota {
  return {
    quotaId: String(q.quotaId),
    vehicleTypeId: q.vehicleType ? String(q.vehicleType.vehicleTypeId) : '',
    windowStart: hhmm(q.startTime),
    windowEnd: hhmm(q.endTime),
    quotaPercent: Number(q.quotaPercent ?? 0),
    isActive: q.isActive !== false, // BE mới có cờ IsActive; mặc định coi là bật.
  }
}

export function mapPricingPolicy(p: BePricingPolicy): PricingPolicy {
  return {
    policyId: String(p.policyId),
    vehicleTypeId: p.vehicleType ? String(p.vehicleType.vehicleTypeId) : '',
    vehicleTypeName: p.vehicleType?.typeName ?? '',
    // Giữ ĐẦY ĐỦ chính sách giá để màn sửa giá hiển thị + gửi lại nguyên vẹn
    // (BE PUT thay thế toàn bộ → thiếu field nào sẽ bị xoá).
    basePrice: Number(p.basePrice ?? 0),
    baseHours: Number(p.baseHours ?? 1),
    extraHourPrice: Number(p.extraHourPrice ?? 0),
    nightSurcharge: Number(p.nightSurcharge ?? 0),
    lostTicketFee: Number(p.lostTicketFee ?? 0),
    status: (p.status as 'Active' | 'Expired') ?? 'Active',
    effectiveDate: p.effectiveDate,
  }
}

export function mapFeeConfig(c: BeFeeConfig): FeeConfig {
  return {
    depositPercent: Number(c.depositPercent ?? 0),
    overstayRatePerHour: Number(c.overstayRatePerHour ?? 0),
    noShowGraceMinutes: Number(c.noShowGraceMinutes ?? 0),
    blacklistThreshold: Number(c.blacklistThreshold ?? 0),
    depositPaymentWindowMinutes:
      c.depositPaymentWindowMinutes != null ? Number(c.depositPaymentWindowMinutes) : undefined,
    cashToleranceVnd: c.cashToleranceVnd != null ? Number(c.cashToleranceVnd) : undefined,
  }
}

export function mapPayment(p: BePayment): Payment {
  return {
    paymentId: String(p.paymentId),
    paymentType: (p.paymentPurpose as PaymentType) ?? 'Parking',
    paymentMethod: p.paymentMethod as PaymentMethod,
    amount: Number(p.amount ?? 0),
    status: p.paymentStatus as PaymentStatus,
    paidAt: p.paymentTime ?? undefined,
    transactionReference: p.transactionReference ?? undefined,
    paymentPurpose: (p.paymentPurpose as Payment['paymentPurpose']) ?? undefined,
    refundStatus: (p.refundStatus as Payment['refundStatus']) ?? null,
    refundedAt: p.refundedAt ?? undefined,
  }
}

export function mapCheckoutApproval(a: BeCheckoutApproval): CheckoutApproval {
  return {
    approvalId: String(a.approvalId),
    sessionId: String(a.sessionId),
    licensePlate: a.licensePlate,
    requestedAmount: Number(a.requestedAmount ?? 0),
    computedAmount: Number(a.computedAmount ?? 0),
    reason: a.reason ?? undefined,
    requestedBy: a.requestedBy ?? undefined,
    status: (a.status as CheckoutApproval['status']) ?? 'Open',
    decidedBy: a.decidedBy ?? undefined,
    decidedAt: a.decidedAt ?? undefined,
    createdAt: a.createdAt ?? undefined,
    overstay: a.overstay ?? undefined,
    totalFee: a.totalFee != null ? Number(a.totalFee) : undefined,
    plateMismatch: a.plateMismatch ?? undefined,
  }
}

function mapAvailability(info: BeParkingInfo): LotAvailability {
  return {
    byVehicleType: (info.availabilityByVehicleType ?? []).map((a) => ({
      vehicleTypeName: a.vehicleTypeName,
      capacity: a.totalSlots,
      inside: a.totalSlots - a.availableSlots,
      outstanding: 0, // BE /parking-info không tách "booking chưa vào".
      walkInHeadroom: a.availableSlots,
      byZone: [],
    })),
  }
}

/**
 * Passthrough: GET /manager/availability already returns the canonical
 * LotAvailability shape (capacity, inside, outstanding, walkInHeadroom, byZone).
 * No mapping needed — cast directly.
 */
export function mapManagerAvailability(raw: BeManagerAvailability): LotAvailability {
  return raw as LotAvailability
}
