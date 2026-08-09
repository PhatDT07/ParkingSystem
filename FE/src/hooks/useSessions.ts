import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type AppError } from '@/lib/api'
import { REFRESH_INTERVAL } from '@/lib/constants'
import type { ParkingSession, VehicleType } from '@/types/model'
import { mapActiveSession, type BeActiveSession } from '@/lib/beApi'
import { resolveFloorGateId } from '@/hooks/useGates'

export interface CreateSessionInput {
  license_plate: string
  slot_id: string
  vehicle_type: 'car'
}

/** Staff manual entry — tạo phiên thủ công khi camera đọc lỗi → POST /staff/sessions/check-in. */
export function useCreateSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateSessionInput) => {
      // Tra loại "ô tô" từ cache vehicle-types (form nhập tay chỉ hỗ trợ car); mặc định id=1.
      const vts = queryClient.getQueryData<VehicleType[]>(['vehicle-types']) ?? []
      const car = vts.find((v) => /car|ô\s*tô|oto/i.test(v.name)) ?? vts[0]
      const vehicleTypeId = car ? Number(car.id) : 1
      const entryGateId = await resolveFloorGateId(queryClient, 'Entry')
      // BE check-in dùng vehicleTypeId + entryGateId; slot_id của form được bỏ qua
      // (camera/Manager mới gán ô thực tế).
      return api.post('/staff/sessions/check-in', {
        licensePlate: data.license_plate,
        vehicleTypeId,
        entryGateId,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['slots'] })
      queryClient.invalidateQueries({ queryKey: ['availability'] })
    },
    onError: () => {
      // Error toast will be shown by the modal
    },
  })
}

/** Phiên đang mở toàn tòa (giám sát) — GET /staff/sessions/active. */
export function useOpenSessions(): { data: ParkingSession[]; isLoading: boolean } {
  const query = useQuery<ParkingSession[]>({
    queryKey: ['sessions', 'open'],
    queryFn: async () => {
      const list = await api.get<BeActiveSession[]>('/staff/sessions/active')
      return list.map(mapActiveSession)
    },
    refetchInterval: REFRESH_INTERVAL,
  })
  return { data: query.data ?? [], isLoading: query.isLoading }
}

export interface UpcomingReservation {
  reservationId: string
  licensePlate: string
  vehicleTypeName: string | null
  expectedEntryTime: string
  expectedExitTime: string
  status: 'Pending' | 'Confirmed'
  depositStatus: string | null
  estimatedFeeAtBooking: number | null
}

/** Đặt chỗ chưa check-in (Pending/Confirmed), gần nhất trước — GET /staff/sessions/upcoming.
 * Bổ sung cho useOpenSessions (chỉ phiên ĐÃ check-in thực sự) để Staff thấy trước xe nào sẽ đến. */
export function useUpcomingReservations(): { data: UpcomingReservation[]; isLoading: boolean } {
  const query = useQuery<UpcomingReservation[]>({
    queryKey: ['sessions', 'upcoming'],
    queryFn: () => api.get<UpcomingReservation[]>('/staff/sessions/upcoming'),
    refetchInterval: REFRESH_INTERVAL,
  })
  return { data: query.data ?? [], isLoading: query.isLoading }
}

/** Tìm phiên đang mở theo biển số (hỗ trợ checkout) — GET /staff/sessions/search?licensePlate=. */
export function useFindCar(plate: string): {
  data: ParkingSession | null
  isError: boolean
  error: AppError | null
} {
  const query = useQuery<ParkingSession | null, AppError>({
    queryKey: ['sessions', 'find', plate],
    queryFn: async () => {
      try {
        const dto = await api.get<BeActiveSession>(
          `/staff/sessions/search?licensePlate=${encodeURIComponent(plate)}`,
        )
        return mapActiveSession(dto)
      } catch (err) {
        // 404 = không có phiên đang mở cho biển số này → coi là "không tìm thấy" (data = null).
        // Các lỗi khác (mạng / 500) phải nổi lên, không được nuốt thành "không tìm thấy".
        if ((err as AppError)?.status === 404) return null
        throw err
      }
    },
    enabled: plate.length >= 4,
    retry: false,
  })
  return { data: query.data ?? null, isError: query.isError, error: query.error ?? null }
}

/**
 * Poll amountDue (so tien THUC con phai thu, da tru coc/thanh toan online) theo bien so — dung
 * de man Check-out tu dong nhan ra khach da quet QR PayOS tra tien xong (webhook cap nhat Payment
 * "Success" -> amountDue tut ve 0) MA KHONG can Staff bam nut xac nhan thu cong. Xem
 * ExitPayment.tsx: khi amountDue <= 0 thi tu dong goi check-out that su.
 */
export function useLiveAmountDue(licensePlate: string, enabled: boolean): number | null {
  const query = useQuery<number | null, AppError>({
    queryKey: ['sessions', 'amountDue', licensePlate],
    queryFn: async () => {
      try {
        const dto = await api.get<BeActiveSession>(
          `/staff/sessions/search?licensePlate=${encodeURIComponent(licensePlate)}`,
        )
        return dto.amountDue ?? null
      } catch (err) {
        if ((err as AppError)?.status === 404) return null
        throw err
      }
    },
    enabled: enabled && licensePlate.length >= 4,
    refetchInterval: enabled ? 4000 : false,
    retry: false,
  })
  return query.data ?? null
}

export interface StaffForceCheckInInput {
  sessionId: string | number
  actualPlate: string
  reason?: string
}

/**
 * Audited staff force check-in — POST /staff/sessions/{id}/force-check-in.
 * Overwrites the plate on the session (and reservation if any), sets isForceCheckIn=true,
 * writes an AuditLog entry (STAFF_FORCE_CHECK_IN). This is distinct from the
 * hardware simulator's /gate/force-checkin which has no audit trail.
 */
export function useStaffForceCheckIn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, actualPlate, reason }: StaffForceCheckInInput) =>
      api.post(`/staff/sessions/${sessionId}/force-check-in`, { actualPlate, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
    },
  })
}
