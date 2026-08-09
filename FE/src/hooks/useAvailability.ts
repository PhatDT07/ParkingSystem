import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, type AppError } from '@/lib/api'
import { REFRESH_INTERVAL } from '@/lib/constants'
import type { LotAvailability, Slot } from '@/types/model'
import { mapSlot, mapVehicleType, mapManagerAvailability, type BeSlot, type BeVehicleType, type BeManagerAvailability } from '@/lib/beApi'

export interface MaintenanceResult {
  success: boolean
  availability: LotAvailability
  warning: {
    errorCode: string
    message: string
    affectedTypes: string[]
  } | null
}

export function useVehicleTypes() {
  return useQuery({
    queryKey: ['vehicle-types'],
    queryFn: async () => {
      const list = await api.get<BeVehicleType[]>('/manager/vehicle-types')
      return list.map(mapVehicleType)
    },
  })
}

/** Realtime headroom view for the building — GET /manager/availability returns LotAvailability shape. */
export function useAvailability() {
  return useQuery({
    queryKey: ['availability'],
    queryFn: async () => {
      const raw = await api.get<BeManagerAvailability>('/manager/availability')
      return mapManagerAvailability(raw)
    },
    refetchInterval: REFRESH_INTERVAL, // real-time headroom
  })
}

/** Per-slot list for the visual map. (Named to avoid clashing with the legacy useSlots.) */
export function useLotSlots() {
  return useQuery({
    queryKey: ['slots'],
    queryFn: async () => {
      const list = await api.get<BeSlot[]>('/manager/slots')
      return list.map(mapSlot)
    },
    refetchInterval: REFRESH_INTERVAL, // live slot map
  })
}

/**
 * Mark slots Maintenance/Available. BE chỉ có PATCH theo từng slotId
 * (`/manager/slots/{id}/maintenance?maintenance=`), nên ta:
 * 1. tra slotCode → slotId từ cache ['slots'],
 * 2. gọi PATCH lần lượt cho từng ô đã chọn.
 */
export function useSetMaintenance() {
  const queryClient = useQueryClient()
  return useMutation<MaintenanceResult, AppError, { slotCodes: string[]; maintenance: boolean }>({
    mutationFn: async ({ slotCodes, maintenance }) => {
      const cached = queryClient.getQueryData<Slot[]>(['slots']) ?? []
      const byCode = new Map(cached.map((s) => [s.slotCode, s.id]))
      const ids = slotCodes.map((code) => byCode.get(code)).filter((id): id is string => !!id)

      await Promise.all(
        ids.map((id) =>
          api.patch<unknown>(`/manager/slots/${id}/maintenance?maintenance=${maintenance}`),
        ),
      )
      return { success: true, availability: { byVehicleType: [] }, warning: null }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['slots'] })
      queryClient.invalidateQueries({ queryKey: ['availability'] })
      if (result.warning) {
        toast.warning(result.warning.message)
      } else {
        toast.success('Cập nhật bảo trì thành công')
      }
    },
    onError: (error: AppError) => toast.error(error.message),
  })
}
