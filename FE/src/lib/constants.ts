// Domain label + config constants — capacity-reservation model, single building (v3.1).

export const PRICING = {
  BASE_RATE: 10000, // VND mỗi giờ (giá phẳng)
} as const;

export const REFRESH_INTERVAL = 10000; // 10s — real-time refetch interval

export const USER_ROLE_LABELS: Record<string, string> = {
  Admin: 'Quản trị viên',
  Manager: 'Quản lý',
  Staff: 'Nhân viên',
  Driver: 'Tài xế',
};

export const SLOT_STATUS_LABELS: Record<string, string> = {
  Available: 'Trống',
  Occupied: 'Đã có xe',
  Maintenance: 'Bảo trì',
};

export const RESERVATION_STATUS_LABELS: Record<string, string> = {
  Pending: 'Chờ cọc',
  Confirmed: 'Đã xác nhận',
  CheckedIn: 'Đã vào',
  Fulfilled: 'Đã đỗ',
  Cancelled: 'Đã hủy',
  Expired: 'Hết hạn',
};

export const SESSION_STATUS_LABELS: Record<string, string> = {
  Preparing: 'Chuẩn bị',
  Admitted: 'Đã vào (chờ đỗ)',
  Parked: 'Đã đỗ',
  Moved: 'Đang rời ô',
  Completed: 'Hoàn thành',
  Abandoned: 'Bỏ dở',
};

// Khớp với IssueType enum của BE (IncidentReport.issueType).
export const INCIDENT_TYPE_LABELS: Record<string, string> = {
  LostCard: 'Mất thẻ',
  Loiterer: 'Người lảng vảng',
  ExitTailgating: 'Bám đuôi cổng ra',
  PlateMismatch: 'Sai biển số',
  CapacityCrash: 'Vượt sức chứa',
  Overstay: 'Quá giờ',
  CameraMiss: 'Camera đọc lỗi',
  Other: 'Khác',
};

export const INCIDENT_STATUS_LABELS: Record<string, string> = {
  Open: 'Chưa xử lý',
  InProgress: 'Đang xử lý',
  Resolved: 'Đã xử lý',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  Cash: 'Tiền mặt',
  QR: 'Mã QR',
};
