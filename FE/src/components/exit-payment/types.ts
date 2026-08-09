import type { PaymentMethod } from '@/types/model'

export type { PaymentMethod }

export interface FeeBreakdownLine {
  label: string
  hours: number
  ratePerHour: number
  subtotal: number
}

export interface ExitPaymentProps {
  readonly sessionId: string
  readonly licensePlate: string
  readonly entryTime: string
  /** Phí đỗ xe GỘP (chưa trừ cọc) — chỉ để hiển thị breakdown, KHÔNG dùng để thu tiền. */
  readonly totalFee: number
  /** Tiền cọc đã thanh toán trước — hiển thị trừ vào breakdown. */
  readonly depositAlreadyPaid?: number
  /** Số tiền THỰC còn phải thu (đã trừ cọc + thanh toán online khác) — dùng để thu tiền/tạo QR. */
  readonly amountDue: number
}

export interface FeeBreakdownProps {
  readonly licensePlate: string
  readonly entryTime: string
  readonly totalFee: number
  readonly depositAlreadyPaid: number
  readonly amountDue: number
  readonly breakdown: FeeBreakdownLine[]
  readonly durationMinutes: number
}

export interface PaymentQrPanelProps {
  readonly sessionId: string
  readonly amountDue: number
  readonly selectedMethod: PaymentMethod
  readonly onMethodChange: (method: PaymentMethod) => void
  readonly onConfirm: () => void
  readonly isPending: boolean
  readonly collectedAmount: number
  readonly onCollectedAmountChange: (amount: number) => void
  readonly discountReason: string
  readonly onDiscountReasonChange: (reason: string) => void
  /** BE vừa báo CASH_AMOUNT_MISMATCH ở lần gửi trước — bắt buộc nhập lý do chênh lệch để gửi lại. */
  readonly requireDiscountReason: boolean
}
