import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import type { QuotaFormDialogProps } from './types'

type DialogBodyProps = Omit<QuotaFormDialogProps, 'open'>

/** Nội dung dialog — key theo quotaId ở component cha để form reset mỗi lần mở. */
function DialogBody({
  initialValues,
  vehicleTypes,
  capacityById,
  onClose,
  onSubmit,
  isSubmitting,
}: DialogBodyProps) {
  const [vehicleTypeId, setVehicleTypeId] = useState(
    initialValues?.vehicleTypeId ?? vehicleTypes[0]?.id ?? '',
  )
  const [windowStart, setWindowStart] = useState(initialValues?.windowStart ?? '08:00')
  const [windowEnd, setWindowEnd] = useState(initialValues?.windowEnd ?? '10:00')
  const [quotaPercent, setQuotaPercent] = useState(initialValues?.quotaPercent ?? 30)

  const capacity = capacityById[vehicleTypeId] ?? 0
  const quotaAbs = Math.ceil((quotaPercent / 100) * capacity)
  const vehicleTypeName =
    vehicleTypes.find((v) => v.id === vehicleTypeId)?.name ?? vehicleTypeId

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      quotaId: initialValues?.quotaId,
      vehicleTypeId,
      windowStart,
      windowEnd,
      quotaPercent,
    })
  }

  const isEdit = !!initialValues?.quotaId

  return (
    <DialogContent className="sm:max-w-[480px]">
      <DialogHeader>
        <DialogTitle className="text-base font-semibold">
          {isEdit ? 'Sửa hạn mức đặt chỗ' : 'Thêm hạn mức đặt chỗ'}
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Vehicle type */}
        <div className="space-y-1">
          <Label className="text-sm">Loại xe</Label>
          <Select value={vehicleTypeId} onValueChange={setVehicleTypeId}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {vehicleTypes.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Time window */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-sm">Giờ bắt đầu</Label>
            <Input
              type="time"
              className="h-9 text-sm"
              value={windowStart}
              onChange={(e) => setWindowStart(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Giờ kết thúc</Label>
            <Input
              type="time"
              className="h-9 text-sm"
              value={windowEnd}
              onChange={(e) => setWindowEnd(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Percent slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">% sức chứa</Label>
            <span className="text-sm font-semibold text-blue-600">{quotaPercent}%</span>
          </div>
          <Slider
            min={0}
            max={100}
            step={1}
            value={[quotaPercent]}
            onValueChange={([v]) => setQuotaPercent(v)}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          Tương đương{' '}
          <span className="font-semibold">{quotaAbs} suất</span>
          {' '}trên tổng{' '}
          <span className="font-semibold">{capacity} suất</span>{' '}
          ({vehicleTypeName})
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Thêm mới'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

export function QuotaFormDialog({ open, onClose, ...rest }: QuotaFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      {open && (
        <DialogBody
          key={rest.initialValues?.quotaId ?? 'new'}
          onClose={onClose}
          {...rest}
        />
      )}
    </Dialog>
  )
}
