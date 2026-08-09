import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Payment } from '@/types/model'
import { mapPayment, type BePayment } from '@/lib/beApi'

/**
 * Giao dịch cần hoàn cọc thủ công (PayOS không có API hoàn tiền tự động cho merchant này) —
 * GET /manager/payments?refundStatus=. Chỉ để theo dõi, không có endpoint đánh dấu "đã hoàn" ở BE.
 */
export function usePayments(refundStatus: string = 'ManualRequired') {
  return useQuery({
    queryKey: ['payments', refundStatus],
    queryFn: async () => {
      const list = await api.get<BePayment[]>(`/manager/payments?refundStatus=${refundStatus}`)
      return list.map(mapPayment)
    },
  })
}
