import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, type AppError } from '@/lib/api'
import type { PricingPolicy, FeeConfig } from '@/types/model'
import {
  mapFeeConfig,
  mapPricingPolicy,
  type BeFeeConfig,
  type BePricingPolicy,
} from '@/lib/beApi'

/** Bảng giá theo giờ (mỗi loại xe) — GET /manager/pricing-policies. */
export function usePricingPolicies() {
  return useQuery({
    queryKey: ['pricing-policies'],
    queryFn: async () => {
      const list = await api.get<BePricingPolicy[]>('/manager/pricing-policies')
      // BE giữ cả bảng giá đã Expired (lịch sử) — màn sửa giá chỉ hiện bản Active.
      return list.map(mapPricingPolicy).filter((p) => p.status === 'Active')
    },
  })
}

/** Toàn bộ chính sách giá cần gửi khi cập nhật (BE PUT thay thế nguyên bản ghi). */
export interface UpdatePricingInput {
  policyId: string
  vehicleTypeId: string
  basePrice: number
  baseHours: number
  extraHourPrice: number
  nightSurcharge: number
  lostTicketFee: number
  /** Giữ nguyên effectiveDate hiện tại (giá mới dùng cho các lần check-out kể từ giờ; không hồi tố). */
  effectiveDate: string
}

export function useUpdatePricing() {
  const queryClient = useQueryClient()
  return useMutation<PricingPolicy, AppError, UpdatePricingInput>({
    mutationFn: async (input) => {
      // Gửi ĐẦY ĐỦ PricingPolicyRequest — tránh việc BE PUT (thay thế toàn bộ) xoá mất
      // nightSurcharge / lostTicketFee khi chỉ gửi giá cơ bản.
      const body = {
        vehicleTypeId: Number(input.vehicleTypeId),
        basePrice: input.basePrice,
        baseHours: input.baseHours,
        extraHourPrice: input.extraHourPrice,
        nightSurcharge: input.nightSurcharge,
        lostTicketFee: input.lostTicketFee,
        effectiveDate: input.effectiveDate,
      }
      const saved = await api.put<BePricingPolicy>(`/manager/pricing-policies/${input.policyId}`, body)
      return mapPricingPolicy(saved)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-policies'] })
      toast.success('Đã cập nhật bảng giá')
    },
    onError: (error) => toast.error(errorMessage(error)),
  })
}

/** ACTIVE_SESSIONS_EXIST cần một câu rõ ràng thay vì message chung của server. */
function errorMessage(error: AppError): string {
  if (error.code === 'ACTIVE_SESSIONS_EXIST') {
    return 'Không thể thay đổi khi vẫn còn phiên đỗ xe đang hoạt động (Admitted/Parked/Moved)'
  }
  return error.message
}

/** Chính sách phí (cọc %, overstay, no-show, blacklist) — GET /manager/fee-config. */
export function useFeeConfig() {
  return useQuery({
    queryKey: ['fee-config'],
    queryFn: async () => {
      const cfg = await api.get<BeFeeConfig>('/manager/fee-config')
      return mapFeeConfig(cfg)
    },
  })
}

export function useUpdateFeeConfig() {
  const queryClient = useQueryClient()
  return useMutation<FeeConfig, AppError, Partial<FeeConfig>>({
    mutationFn: async (input) => {
      // BE PUT /fee-config gọi .toString() trên TẤT CẢ field → phải gửi đủ field.
      // Lấy config hiện tại rồi ghi đè phần thay đổi.
      const current = await api.get<BeFeeConfig>('/manager/fee-config')
      const body: BeFeeConfig = {
        depositPercent: input.depositPercent ?? current.depositPercent,
        overstayRatePerHour: input.overstayRatePerHour ?? current.overstayRatePerHour,
        noShowGraceMinutes: input.noShowGraceMinutes ?? current.noShowGraceMinutes,
        blacklistThreshold: input.blacklistThreshold ?? current.blacklistThreshold,
        depositPaymentWindowMinutes: input.depositPaymentWindowMinutes ?? current.depositPaymentWindowMinutes,
        cashToleranceVnd: input.cashToleranceVnd ?? current.cashToleranceVnd,
      }
      const saved = await api.put<BeFeeConfig>('/manager/fee-config', body)
      return mapFeeConfig(saved)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-config'] })
      toast.success('Đã lưu chính sách phí')
    },
    onError: (error) => toast.error(errorMessage(error)),
  })
}
