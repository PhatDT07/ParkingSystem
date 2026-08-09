import React, { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useQuotas, useUpsertQuota, useToggleQuota } from '@/hooks/useQuotas'
import { useVehicleTypes, useAvailability } from '@/hooks/useAvailability'
import type { BookingQuota } from '@/types/model'
import { buildGroups } from './mockData'
import { QuotaTable } from './QuotaTable'
import { QuotaFormDialog } from './QuotaFormDialog'

export function QuotaManagement() {
  const { data: quotas = [], isLoading } = useQuotas()
  const { data: vehicleTypes = [] } = useVehicleTypes()
  const { data: availability } = useAvailability()
  const upsertQuota = useUpsertQuota()
  const toggleQuota = useToggleQuota()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<BookingQuota | null>(null)

  // Map id→tên và id→sức chứa (availability trả theo TÊN loại xe nên ghép qua tên).
  const nameById = useMemo(
    () => Object.fromEntries(vehicleTypes.map((v) => [v.id, v.name])),
    [vehicleTypes],
  )
  const capacityById = useMemo(() => {
    const capByName = Object.fromEntries(
      (availability?.byVehicleType ?? []).map((a) => [a.vehicleTypeName, a.capacity]),
    )
    return Object.fromEntries(vehicleTypes.map((v) => [v.id, capByName[v.name] ?? 0]))
  }, [vehicleTypes, availability])

  const groups = useMemo(
    () => buildGroups(quotas, nameById, capacityById),
    [quotas, nameById, capacityById],
  )

  function openCreate() {
    setEditTarget(null)
    setDialogOpen(true)
  }

  function openEdit(quota: BookingQuota) {
    setEditTarget(quota)
    setDialogOpen(true)
  }

  function handleClose() {
    setDialogOpen(false)
    setEditTarget(null)
  }

  function handleSubmit(values: Parameters<typeof upsertQuota.mutate>[0]) {
    upsertQuota.mutate(values, {
      onSuccess: () => {
        toast.success(values.quotaId ? 'Đã cập nhật hạn mức' : 'Đã thêm hạn mức')
        handleClose()
      },
      onError: () => toast.error('Không thể lưu hạn mức'),
    })
  }

  function handleToggle(quotaId: string) {
    toggleQuota.mutate(quotaId, {
      onError: () => toast.error('Không thể thay đổi trạng thái'),
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hạn mức đặt chỗ</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Quản lý % sức chứa cho phép đặt chỗ theo khung giờ và loại xe
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm hạn mức
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-gray-400">Đang tải...</div>
      ) : groups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center text-sm text-gray-400">
          Chưa có hạn mức nào. Nhấn &quot;Thêm hạn mức&quot; để bắt đầu.
        </div>
      ) : (
        <QuotaTable
          groups={groups}
          onEdit={openEdit}
          onToggle={handleToggle}
          isToggling={toggleQuota.isPending}
        />
      )}

      {/* Create / Edit dialog */}
      <QuotaFormDialog
        open={dialogOpen}
        initialValues={editTarget}
        vehicleTypes={vehicleTypes}
        capacityById={capacityById}
        onClose={handleClose}
        onSubmit={handleSubmit}
        isSubmitting={upsertQuota.isPending}
      />
    </div>
  )
}
