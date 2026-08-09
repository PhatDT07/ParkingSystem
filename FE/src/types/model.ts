// Capacity-Reservation domain model — canonical types going forward.
// New code imports from '@/types/model'. The legacy '@/types' (slot-owns-booking)
// is kept until the /dashboard and /sessions screens migrate off it (then deleted).
// Single building, multiple floors — NO multi-lot (parkingLotId removed v3.1).

// ── Status labels (text as returned by API; service maps INT↔label) ─────────────
export type SlotStatus = 'Available' | 'Occupied' | 'Maintenance'; // NO Reserved
// 'Abandoned' là nhãn vận hành phía FE (thẻ "Bỏ dở" ở SessionStatsBar); BE hiện chưa phát ra
// trạng thái này (mới chỉ có truy vấn nghi vấn bỏ xe) nên số đếm thực tế sẽ là 0 cho tới khi BE hỗ trợ.
// 'Preparing' là nhãn vận hành phía FE cho đặt chỗ CHƯA check-in (Pending/Confirmed) — không
// phải trạng thái ParkingSession thật từ BE (chưa có session nào được tạo), chỉ để gộp chung
// vào bảng "Phiên hoạt động" cho Staff thấy trước xe nào sẽ đến (xem ActiveSessions.tsx).
export type SessionStatus = 'Preparing' | 'Admitted' | 'Parked' | 'Moved' | 'Completed' | 'Exception' | 'Abandoned';
export type ReservationStatus =
  | 'Pending' | 'Confirmed' | 'CheckedIn' | 'Fulfilled' | 'Cancelled' | 'Expired';

const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  Pending: 'Chờ thanh toán',
  Confirmed: 'Đã xác nhận',
  CheckedIn: 'Đã vào bãi',
  Fulfilled: 'Hoàn thành',
  Cancelled: 'Đã hủy',
  Expired: 'Hết hạn',
}
export type PaymentStatus = 'Pending' | 'Success' | 'Failed' | 'Refunded';
export type PaymentType = 'Deposit' | 'Parking' | 'Penalty';
export type PaymentMethod = 'Cash' | 'QR';
export type IncidentStatus = 'Open' | 'InProgress' | 'Resolved';
export type IncidentType =
  // BE IssueType enum (giá trị thật từ server)
  | 'LostCard' | 'Loiterer' | 'ExitTailgating' | 'PlateMismatch'
  | 'CapacityCrash' | 'Overstay' | 'CameraMiss' | 'Other'
  // Giá trị mock cũ — giữ để dữ liệu MSW còn type-check (dev only)
  | 'UNMAPPED_OCCUPANCY' | 'ABANDONED_SESSION' | 'EXIT_UNCLOSED'
  | 'OVERSTAY' | 'MANUAL_OVERRIDE' | 'OTHER';
export type GateType = 'Entry' | 'Exit';
export type UserRole = 'Admin' | 'Manager' | 'Staff' | 'Driver';

// ── Core entities ───────────────────────────────────────────────────────────────
export interface VehicleType {
  id: string;
  name: string; // chỉ ô tô, ví dụ "Ô tô"
}

export interface Slot {
  id: string;
  slotCode: string; // F{floor}-{zone}{number}, zone optional → F2-B07 / F2-07
  floor: number;
  zone?: string;
  vehicleTypeId: string;
  status: SlotStatus;
}

export interface Reservation {
  reservationId: string;
  userId?: string; // driver who owns this reservation
  vehicleTypeId: string;
  vehicleTypeName?: string;
  licensePlate: string;
  expectedEntryTime: string; // ISO-8601
  expectedExitTime: string;
  depositAmount: number; // VND
  status: ReservationStatus;
  createdAt: string;
}

export interface ParkingSession {
  sessionId: string;
  reservationId?: string | null; // null for walk-ins
  vehicleTypeId: string;
  vehicleTypeName?: string;
  licensePlate: string;
  assignedSlotCode?: string; // advisory slot at the gate
  actualSlotCode?: string; // slot the camera confirmed
  entryTime: string; // Admitted — billing basis
  parkedTime?: string;
  movedTime?: string;
  exitTime?: string;
  /** Phí tạm tính GỘP (chưa trừ cọc) — dùng để hiển thị thông tin, KHÔNG dùng để thu tiền. */
  totalFee?: number;
  /** Tiền cọc đã thanh toán trước (0 nếu không có đặt chỗ / cọc chưa Paid). */
  depositAlreadyPaid?: number;
  /** Số tiền THỰC còn phải thu = totalFee - depositAlreadyPaid - đã thanh toán online khác.
   * Đây là con số phải dùng khi thu tiền / tạo QR ở cổng ra, không phải totalFee. */
  amountDue?: number;
  isPaid: boolean;
  status: SessionStatus;
  isForceCheckIn?: boolean; // staff overrode a plate mismatch at check-in
  isOverstay?: boolean;     // computed at checkout — reservation: past expectedExitTime; walk-in: past 24h grace
  isOverstayFlagged?: boolean; // background job flag on a still-open reservation-backed session (expectedExitTime + 30min passed)
}

export interface Payment {
  paymentId: string;
  // BE @JsonIgnore session/reservation trên entity Payment — GET /manager/payments không trả plate
  // hay reservationId, chỉ có transactionReference (mã PayOS) để đối chiếu thủ công.
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  paidAt?: string;
  transactionReference?: string;
  paymentPurpose?: 'Deposit' | 'Fee' | 'Extension' | 'Refund';
  /** null = chưa từng yêu cầu hoàn tiền. */
  refundStatus?: 'Requested' | 'AutoRefunded' | 'ManualRequired' | 'Failed' | null;
  refundedAt?: string;
}

export interface Incident {
  incidentId: string;
  issueType: IncidentType;
  slotCode?: string;
  sessionId?: string;
  description: string;
  createdAt: string;
  status: IncidentStatus;
  handledByStaffId?: string;
  resolutionNotes?: string;
  resolveAt?: string;
  takenOverAt?: string; // Manager claimed it (atomic take-over)
  escalatedAt?: string; // auto-reopened after being stuck InProgress too long
}

/** Checkout tạm giữ chờ Manager duyệt vì tiền mặt thu lệch quá cashToleranceVnd. */
export interface CheckoutApproval {
  approvalId: string;
  sessionId: string;
  licensePlate: string;
  requestedAmount: number; // Staff đã báo thu thực tế tại cổng
  computedAmount: number; // hệ thống tính là phải thu
  reason?: string; // discountReason của Staff
  requestedBy?: string;
  status: 'Open' | 'Approved' | 'Rejected';
  decidedBy?: string;
  decidedAt?: string;
  createdAt?: string;
  overstay?: boolean;
  totalFee?: number;
  plateMismatch?: boolean;
}

// ── Capacity / availability — the source of truth for "occupancy" ───────────────
export interface ZoneAvailability {
  zone: string;
  available: number;
}

export interface VehicleTypeAvailability {
  vehicleTypeName: string;
  capacity: number; // C — usable slots (minus Maintenance)
  inside: number; // cameras count actual cars
  outstanding: number; // confirmed bookings not yet entered
  walkInHeadroom: number; // C − inside − outstanding (can be negative on capacity crash)
  byZone: ZoneAvailability[];
}

/** Tình trạng chỗ trống toàn tòa (1 building) theo loại xe. */
export interface LotAvailability {
  byVehicleType: VehicleTypeAvailability[];
}

// ── Admin / quota ───────────────────────────────────────────────────────────────
export interface BookingQuota {
  quotaId: string;
  vehicleTypeId: string;
  windowStart: string; // "08:00"
  windowEnd: string; // "10:00"
  quotaPercent: number; // % of C, 0–100
  isActive: boolean;
}

export interface OccupancyWindow {
  windowStart: string;
  windowEnd: string;
  entries: number;
  exits: number;
  inside: number;
}

/** Khoảng ngày cho báo cáo (revenue/traffic). */
export interface DateRange {
  from: string;
  to: string;
}

// ── Quản lý tài chính (Manager) ─────────────────────────────────────────────────
/** Bảng giá theo giờ — mỗi loại xe một mức (v3.1: giá phẳng, không ngày/đêm). */
export interface PricingPolicy {
  policyId: string;
  vehicleTypeId: string;
  vehicleTypeName: string;
  basePrice: number; // giá cơ bản cho baseHours đầu tiên (VND)
  baseHours: number; // số giờ đã gồm trong basePrice
  extraHourPrice: number; // VND mỗi giờ vượt baseHours
  nightSurcharge: number; // phụ thu đêm (0 nếu không áp dụng)
  lostTicketFee: number; // phí mất vé (0 nếu không áp dụng)
  status: 'Active' | 'Expired';
  effectiveDate: string; // ISO
}

/** Các chính sách phí cấu hình bởi Manager. */
export interface FeeConfig {
  depositPercent: number; // % cọc booking (mặc định 50 — tính trên phí ước tính cả khung giờ, không phải basePrice)
  overstayRatePerHour: number; // phí quá giờ / giờ
  /** @deprecated Legacy — no-show giờ tính hoàn toàn theo checkinDeadline của từng booking, đổi giá trị này không còn tác dụng. */
  noShowGraceMinutes: number;
  blacklistThreshold: number; // số lần no-show liên tiếp → blacklist (mặc định 3)
  depositPaymentWindowMinutes?: number; // thời gian tối đa để thanh toán cọc trước khi booking tự hết hạn (mặc định 3 phút)
  cashToleranceVnd?: number; // sai số VND cho phép giữa tiền mặt thu thực tế và số hệ thống tính, trước khi cần Manager duyệt
}

export interface User {
  id: string;
  email: string;
  phone?: string;
  fullName: string;
  role: UserRole;
  status?: 'Active' | 'Inactive';
}
