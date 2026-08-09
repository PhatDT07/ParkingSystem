import { useMutation } from '@tanstack/react-query'
import { api, type AppError } from '@/lib/api'

/** BE PayosLinkResponse from POST /staff/sessions/{id}/payos-link. */
export interface SessionPayosLink {
  checkoutUrl: string
  qrCode: string // VietQR / EMVCo payload
  orderCode: number
  amount: number
}

/**
 * Tạo QR PayOS (số tiền động theo phí đỗ hiện tại) cho một phiên đang mở — cổng ra.
 * QR chỉ để khách quét trả tiền; check-out thật (ghi Payment, mở barie) vẫn do
 * /staff/sessions/check-out đảm nhiệm. Cần PayOS keys cấu hình trên BE.
 */
export function useSessionPayosLink() {
  return useMutation<SessionPayosLink, AppError, { sessionId: string }>({
    mutationFn: ({ sessionId }) =>
      api.post<SessionPayosLink>(`/staff/sessions/${sessionId}/payos-link`),
  })
}
