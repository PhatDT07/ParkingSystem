'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Slot } from '@/types/model';

// Validation schema
const manualEntrySchema = z.object({
  license_plate: z
    .string()
    .min(1, 'Biển số xe không được để trống')
    .regex(/^[0-9]{2}[A-Z]{1,2}-[0-9]{4,5}$/, 'Biển số xe không hợp lệ (VD: 29A-12345)'),
  slot_id: z.string().min(1, 'Vui lòng chọn vị trí đỗ xe'),
  vehicle_type: z.literal('car'),
});

type ManualEntryFormData = z.infer<typeof manualEntrySchema>;

interface ManualEntryModalProps {
  open: boolean;
  onClose: () => void;
  availableSlots: Slot[];
  onSubmit: (data: ManualEntryFormData) => Promise<void>;
}

export function ManualEntryModal({
  open,
  onClose,
  availableSlots,
  onSubmit,
}: ManualEntryModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    control,
    reset,
  } = useForm<ManualEntryFormData>({
    resolver: zodResolver(manualEntrySchema),
    defaultValues: {
      vehicle_type: 'car',
    },
  });

  // useWatch (thay vì watch()) — API dạng hook, tương thích React Compiler.
  const selectedSlotId = useWatch({ control, name: 'slot_id' });
  const vehicleType = useWatch({ control, name: 'vehicle_type' });

  const handleFormSubmit = async (data: ManualEntryFormData) => {
    await onSubmit(data);
    toast.success('Tạo phiên đỗ xe thành công');
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nhập thủ công</DialogTitle>
          <DialogDescription>
            Tạo phiên đỗ xe mới cho xe vào bãi
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* License Plate */}
          <div className="space-y-2">
            <Label htmlFor="license_plate">
              Biển số xe <span className="text-red-500">*</span>
            </Label>
            <Input
              id="license_plate"
              placeholder="29A-12345"
              {...register('license_plate')}
              className={errors.license_plate ? 'border-red-500' : ''}
              autoFocus
            />
            {errors.license_plate && (
              <p className="text-sm text-red-500">{errors.license_plate.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Định dạng: 2 số + 1-2 chữ cái + dấu gạch ngang + 4-5 số
            </p>
          </div>

          {/* Slot Selection */}
          <div className="space-y-2">
            <Label htmlFor="slot_id">
              Vị trí đỗ xe <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedSlotId}
              onValueChange={(value) => setValue('slot_id', value, { shouldValidate: true })}
            >
              <SelectTrigger className={errors.slot_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Chọn vị trí đỗ xe" />
              </SelectTrigger>
              <SelectContent>
                {availableSlots.length === 0 ? (
                  <div className="p-2 text-sm text-gray-500">Không có vị trí trống</div>
                ) : (
                  availableSlots.map((slot) => (
                    <SelectItem key={slot.id} value={slot.id}>
                      {slot.slotCode}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.slot_id && (
              <p className="text-sm text-red-500">{errors.slot_id.message}</p>
            )}
          </div>

          {/* Vehicle Type */}
          <div className="space-y-2">
            <Label htmlFor="vehicle_type">
              Loại xe <span className="text-red-500">*</span>
            </Label>
            <Select
              value={vehicleType}
              onValueChange={(value) => setValue('vehicle_type', value as 'car', { shouldValidate: true })}
            >
              <SelectTrigger className={errors.vehicle_type ? 'border-red-500' : ''}>
                <SelectValue placeholder="Chọn loại xe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="car">Ô tô</SelectItem>
              </SelectContent>
            </Select>
            {errors.vehicle_type && (
              <p className="text-sm text-red-500">{errors.vehicle_type.message}</p>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Lưu ý:</strong> Phiên đỗ xe sẽ được tạo với thời gian vào là thời điểm hiện tại.
              Phí đỗ xe sẽ được tính khi xe ra khỏi bãi.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting || availableSlots.length === 0}>
              {isSubmitting ? 'Đang tạo...' : 'Tạo phiên đỗ xe'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
