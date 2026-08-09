'use client';

import { useEffect } from 'react';
import { MapPin } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGates, distinctFloors } from '@/hooks/useGates';
import { useGateStore } from '@/store';

/**
 * Chọn tầng đang trực một lần đầu ca (persist localStorage) — check-in/check-out tự tra
 * đúng cổng Entry/Exit của tầng này (xem resolveFloorGateId trong useGates.ts), thay vì
 * staff phải chọn đúng cổng thủ công mỗi lần.
 */
export function GateSwitcher() {
  const { data: gates } = useGates();
  const { floorId, setFloor, _hasHydrated } = useGateStore();

  const floors = gates ? distinctFloors(gates) : [];

  // Chưa có lựa chọn nào lưu sẵn (lần đầu dùng) -> mặc định tầng đầu tiên khi có dữ liệu,
  // để store hiếm khi thực sự trống.
  useEffect(() => {
    if (_hasHydrated && floorId == null && floors.length > 0) {
      setFloor(floors[0].floorId, floors[0].floorName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hasHydrated, floorId, floors.length]);

  if (!_hasHydrated || floors.length === 0) return null;

  return (
    <div className="hidden md:flex items-center gap-2">
      <MapPin className="h-4 w-4 text-gray-500" />
      <Select
        value={floorId != null ? String(floorId) : undefined}
        onValueChange={(value) => {
          const floor = floors.find((f) => String(f.floorId) === value);
          if (floor) setFloor(floor.floorId, floor.floorName);
        }}
      >
        <SelectTrigger className="h-9 w-[160px] text-sm">
          <SelectValue placeholder="Chọn tầng trực" />
        </SelectTrigger>
        <SelectContent>
          {floors.map((f) => (
            <SelectItem key={f.floorId} value={String(f.floorId)}>
              {f.floorName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
