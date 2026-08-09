import type { BookingQuota, VehicleType } from '@/types/model'

export interface QuotaRow extends BookingQuota {
  /** derived: ceil(quotaPercent / 100 * C) */
  quotaAbs: number
  vehicleTypeName: string
}

export interface VehicleTypeGroup {
  vehicleTypeId: string
  vehicleTypeName: string
  capacity: number
  rows: QuotaRow[]
}

export interface QuotaTableProps {
  readonly groups: VehicleTypeGroup[]
  readonly onEdit: (quota: BookingQuota) => void
  readonly onToggle: (quotaId: string) => void
  readonly isToggling: boolean
}

export interface QuotaFormDialogProps {
  readonly open: boolean
  readonly initialValues?: BookingQuota | null
  readonly vehicleTypes: VehicleType[]
  readonly capacityById: Record<string, number>
  readonly onClose: () => void
  readonly onSubmit: (values: {
    quotaId?: string
    vehicleTypeId: string
    windowStart: string
    windowEnd: string
    quotaPercent: number
  }) => void
  readonly isSubmitting: boolean
}
