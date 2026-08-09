'use client';

import { useState } from 'react';
import { DashboardHeader } from './DashboardHeader';
import { WarningBanner } from './WarningBanner';
import { KpiCard } from './KpiCard';
import { VehicleTypeCard } from './VehicleTypeCard';
import type { CapacityDashboardProps } from './types';

export function CapacityDashboard({
  lotName,
  lotOptions,
  selectedLot,
  onLotChange,
  lastUpdated,
  onRefresh,
  kpi,
  vehicleTypes,
  warningMessage,
}: CapacityDashboardProps) {
  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto w-full">
      <DashboardHeader
        lotName={lotName}
        lotOptions={lotOptions}
        selectedLot={selectedLot}
        onLotChange={onLotChange}
        lastUpdated={lastUpdated}
        onRefresh={onRefresh}
      />

      {warningMessage && (
        <WarningBanner
          title={warningMessage}
          detail="Khách vãng lai cho loại xe bị ảnh hưởng hiện đang bị chặn vào bãi để đảm bảo chỗ cho khách đã đặt trước và vé tháng."
        />
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          label="Tổng sức chứa"
          value={kpi.totalCapacity.toLocaleString('vi-VN')}
          icon="warehouse"
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <KpiCard
          label="Đang trong bãi"
          value={kpi.inside.toLocaleString('vi-VN')}
          suffix="xe"
          icon="login"
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <KpiCard
          label="Tỉ lệ lấp đầy"
          value={`${kpi.occupancyRate}%`}
          icon="pie_chart"
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          progressValue={kpi.occupancyRate}
          progressColor="bg-amber-500"
        />
        <KpiCard
          label="Sự cố đang mở"
          value={kpi.openIncidents}
          icon="error"
          iconBg="bg-red-100"
          iconColor="text-red-600"
          valueColor="text-red-600"
          actionLabel="Xem chi tiết"
          actionHref="/incidents"
        />
      </div>

      {/* Vehicle type cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {vehicleTypes.map((vt) => (
          <VehicleTypeCard key={vt.vehicleTypeName} data={vt} />
        ))}
      </div>
    </div>
  );
}
