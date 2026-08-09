import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, type AppError } from '@/lib/api'
import type { BookingQuota } from '@/types/model'
import { mapQuota, type BeQuota } from '@/lib/beApi'

export interface UpsertQuotaInput {
  quotaId?: string
  vehicleTypeId: string
  windowStart: string
  windowEnd: string
  quotaPercent: number
}

/** "08:00" → "08:00:00" (BE dùng LocalTime). */
function toLocalTime(hhmm: string): string {
  return hhmm.length === 5 ? `${hhmm}:00` : hhmm
}

export function useQuotas() {
  return useQuery({
    queryKey: ['quotas'],
    queryFn: async () => {
      const list = await api.get<BeQuota[]>('/manager/booking-quotas')
      return list.map(mapQuota)
    },
  })
}

export function useUpsertQuota() {
  const queryClient = useQueryClient()
  return useMutation<BookingQuota, AppError, UpsertQuotaInput>({
    mutationFn: async (input) => {
      const body = {
        vehicleTypeId: Number(input.vehicleTypeId),
        startTime: toLocalTime(input.windowStart),
        endTime: toLocalTime(input.windowEnd),
        quotaPercent: input.quotaPercent,
      }
      const saved = input.quotaId
        ? await api.put<BeQuota>(`/manager/booking-quotas/${input.quotaId}`, body)
        : await api.post<BeQuota>('/manager/booking-quotas', body)
      return mapQuota(saved)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotas'] })
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
    },
    onError: (error: AppError) => toast.error(error.message),
  })
}

/** Bật/tắt hiệu lực quota — PATCH /manager/booking-quotas/{id}/toggle. */
export function useToggleQuota() {
  const queryClient = useQueryClient()
  return useMutation<BookingQuota, AppError, string>({
    mutationFn: async (quotaId: string) => {
      const saved = await api.patch<BeQuota>(`/manager/booking-quotas/${quotaId}/toggle`)
      return mapQuota(saved)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotas'] })
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
    },
    onError: (error: AppError) => toast.error(error.message),
  })
}
