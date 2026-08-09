import type { VehicleTypeAvailability } from '@/types/model';

export interface ZoneChipData {
  zone: string;
  available: number;
  status: 'available' | 'low' | 'full';
}

export interface CapacityKpiData {
  totalCapacity: number;
  inside: number;
  occupancyRate: number;
  openIncidents: number;
}

export interface CapacityDashboardProps {
  lotName: string;
  lotOptions: string[];
  selectedLot: string;
  onLotChange: (lot: string) => void;
  lastUpdated: string;
  onRefresh: () => void;
  kpi: CapacityKpiData;
  vehicleTypes: VehicleTypeAvailability[];
  warningMessage?: string | null;
}

export interface KpiCardProps {
  label: string;
  value: string | number;
  icon: string;
  iconBg: string;
  iconColor: string;
  suffix?: string;
  progressValue?: number;
  progressColor?: string;
  actionLabel?: string;
  actionHref?: string;
  valueColor?: string;
}

export interface VehicleTypeCardProps {
  data: VehicleTypeAvailability;
}
