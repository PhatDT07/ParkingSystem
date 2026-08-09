import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { PaymentMethod } from '@/types/model'
import { api, type AppError } from '@/lib/api'
import { resolveFloorGateId } from '@/hooks/useGates'
import type { BeCheckOutResponse } from '@/lib/beApi'

export interface PayParkingInput {
  licensePlate: string
  paymentMethod: PaymentMethod
  lostTicket?: boolean
  /** Số tiền mặt thực thu tại cổng — chỉ có ý nghĩa với paymentMethod=Cash. */
  collectedAmount?: number
  /** Bắt buộc nếu BE báo CASH_AMOUNT_MISMATCH ở lần gửi trước (lệch quá cashToleranceVnd). */
  discountReason?: string
}

export interface PayParkingResult {
  success: boolean
  paymentId: string
  status: string
  barrierOpen: boolean
  amount: number
  isOverstay: boolean // extra-hour surcharge was applied due to overstay
  /** true = tiền mặt lệch quá tolerance, checkout CHƯA hoàn tất, đang chờ Manager duyệt. */
  pendingApproval: boolean
}

/**
 * Thanh toán cổng ra = check-out thật: POST /staff/sessions/check-out.
 * BE tự tìm phiên đang mở theo biển số, tính tiền theo bảng giá, ghi Payment,
 * giải phóng ô và đóng phiên. Tiền mặt/QR tại barie -> paymentStatus = "Success".
 * Nếu collectedAmount lệch quá cashToleranceVnd, BE trả về pendingApproval=true thay vì
 * hoàn tất — phiên vẫn mở, chờ Manager duyệt qua /manager/checkout-approvals.
 */
export function usePayParking() {
  const queryClient = useQueryClient()

  return useMutation<PayParkingResult, AppError, PayParkingInput>({
    mutationFn: async ({ licensePlate, paymentMethod, lostTicket, collectedAmount, discountReason }) => {
      const exitGateId = await resolveFloorGateId(queryClient, 'Exit')
      const res = await api.post<BeCheckOutResponse>('/staff/sessions/check-out', {
        licensePlate,
        exitGateId,
        paymentMethod,
        lostTicket: !!lostTicket,
        collectedAmount,
        discountReason,
      })
      return {
        success: res.paymentStatus === 'Success',
        paymentId: String(res.sessionId),
        status: res.paymentStatus,
        barrierOpen: res.paymentStatus === 'Success',
        amount: Number(res.amount ?? 0),
        isOverstay: res.isOverstay ?? false,
        pendingApproval: res.pendingApproval ?? false,
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['slots'] })
      queryClient.invalidateQueries({ queryKey: ['availability'] })
    },
  })
}
