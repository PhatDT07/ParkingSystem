'use client';

import { useMemo } from 'react';
import type { VehicleTypeAvailability } from '@/types/model';
import type { CapacityKpiData } from '@/components/capacity-dashboard/types';
import { useAvailability } from '@/hooks/useAvailability'
import { useOpenIncidentCount } from '@/hooks/useIncidents';

/** 1 tòa duy nhất — không còn chọn bãi. */
const BUILDING_NAME = 'Tòa nhà gửi xe';

interface UseCapacityDashboardReturn {
  lotName: string;
  lotOptions: string[];
  selectedLot: string;
  onLotChange: (lotName: string) => void;
  lastUpdated: string;
  onRefresh: () => void;
  kpi: CapacityKpiData;
  vehicleTypes: VehicleTypeAvailability[];
  warningMessage: string | null;
  isLoading: boolean;
}

function computeKpi(types: VehicleTypeAvailability[], openIncidents: number): CapacityKpiData {
  const totalCapacity = types.reduce((sum, t) => sum + t.capacity, 0);
  const inside = types.reduce((sum, t) => sum + t.inside, 0);
  const occupancyRate = totalCapacity ? Math.round((inside / totalCapacity) * 1000) / 10 : 0;
  return { totalCapacity, inside, occupancyRate, openIncidents };
}

function computeWarning(types: VehicleTypeAvailability[]): string | null {
  const crashed = types.filter((t) => t.walkInHeadroom < 0).map((t) => t.vehicleTypeName);
  return crashed.length
    ? `Cảnh báo: Sức chứa ${crashed.join(', ')} tụt dưới số xe đang giữ — vãng lai bị chặn`
    : null;
}

/**
 * Capacity dashboard data, wired to the real availability endpoint via React Query
 * (auto-refetches on the global interval). Single building — no lot selector.
 */
export function useCapacityDashboard(): UseCapacityDashboardReturn {
  const { data: availability, refetch, isFetching, dataUpdatedAt } = useAvailability();
  const { data: openIncidents = 0 } = useOpenIncidentCount();

  const vehicleTypes = useMemo(() => availability?.byVehicleType ?? [], [availability]);
  const kpi = useMemo(() => computeKpi(vehicleTypes, openIncidents), [vehicleTypes, openIncidents]);
  const warningMessage = useMemo(() => computeWarning(vehicleTypes), [vehicleTypes]);

  const lastUpdated = dataUpdatedAt
    ? `Cập nhật lúc ${new Date(dataUpdatedAt).toLocaleTimeString('vi-VN')}`
    : 'Đang tải...';

  return {
    lotName: BUILDING_NAME,
    lotOptions: [BUILDING_NAME],
    selectedLot: BUILDING_NAME,
    onLotChange: () => {},
    lastUpdated,
    onRefresh: () => void refetch(),
    kpi,
    vehicleTypes,
    warningMessage,
    isLoading: isFetching && !availability,
  };
}
