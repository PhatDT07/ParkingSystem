'use client';

import { cn } from '@/lib/utils';
import type { VehicleTypeAvailability } from '@/types/model';

interface OccupancyBarProps {
  readonly inside: number;
  readonly outstanding: number;
  readonly capacity: number;
  readonly isOverflow: boolean;
}

function OccupancyBar({ inside, outstanding, capacity, isOverflow }: OccupancyBarProps) {
  const insidePct = Math.min((inside / capacity) * 100, 100);
  const outstandingPct = Math.min((outstanding / capacity) * 100, 100 - insidePct);
  const usagePct = ((inside + outstanding) / capacity) * 100;

  return (
    <div className="mb-6">
      <div className={cn(
        'flex justify-between text-xs font-mono mb-2',
        isOverflow ? 'text-red-600 font-bold' : 'text-gray-500',
      )}>
        <span>Sử dụng thực tế (Trong bãi + Đang giữ)</span>
        <span>{usagePct.toFixed(1)}%</span>
      </div>
      <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex relative">
        <div
          className="bg-blue-500 h-full"
          style={{ width: `${insidePct}%` }}
          title={`Trong bãi: ${inside}`}
        />
        <div
          className="bg-amber-400 h-full"
          style={{ width: `${outstandingPct}%` }}
          title={`Đang giữ: ${outstanding}`}
        />
        {isOverflow && (
          <div className="absolute right-0 top-0 bottom-0 w-2 bg-red-600 animate-pulse" />
        )}
      </div>
      <div className="flex flex-wrap gap-4 mt-2 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />
          Trong bãi
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" />
          {isOverflow ? 'Đang giữ (Vượt sức chứa)' : 'Đang giữ'}
        </div>
        {!isOverflow && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200 inline-block" />
            Trống
          </div>
        )}
      </div>
    </div>
  );
}

interface VehicleTypeCardProps {
  readonly data: VehicleTypeAvailability;
}

// Hệ thống chỉ quản lý bãi đỗ ô tô; giữ map để phòng khi thêm loại ô tô mới.
const VEHICLE_ICON: Record<string, string> = {
  'Ô tô': 'directions_car',
};

export function VehicleTypeCard({ data }: VehicleTypeCardProps) {
  const { vehicleTypeName, capacity, inside, outstanding, walkInHeadroom, byZone } = data;
  const isOverflow = walkInHeadroom < 0;
  const icon = VEHICLE_ICON[vehicleTypeName] ?? 'directions_car';

  return (
    <div className={cn(
      'bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden flex flex-col',
      isOverflow && 'ring-2 ring-amber-500 ring-offset-2',
    )}>
      {/* Card header */}
      <div className={cn(
        'p-6 border-b border-gray-200 flex justify-between items-center',
        isOverflow ? 'bg-amber-50' : 'bg-gray-50',
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center shadow-sm text-white',
            isOverflow ? 'bg-amber-500' : 'bg-blue-600',
          )}>
            <span className="material-symbols-outlined text-[28px]">{icon}</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">{vehicleTypeName}</h2>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">
            Chỗ cho vãng lai
          </p>
          <h3 className={cn(
            'text-5xl font-black',
            isOverflow ? 'text-red-600' : 'text-green-600',
          )}>
            {walkInHeadroom > 0 ? walkInHeadroom : walkInHeadroom}
          </h3>
        </div>
      </div>

      {/* Card body */}
      <div className="p-6 flex-1 flex flex-col">
        {/* Stat grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Sức chứa', value: capacity.toLocaleString('vi-VN') },
            { label: 'Đang trong bãi', value: inside.toLocaleString('vi-VN') },
            { label: 'Đang giữ chỗ', value: outstanding.toLocaleString('vi-VN') },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-500 mb-1">{label}</p>
              <p className="text-xl font-bold text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Occupancy bar */}
        <OccupancyBar
          inside={inside}
          outstanding={outstanding}
          capacity={capacity}
          isOverflow={isOverflow}
        />

        {/* Zone chips */}
        <div className="mt-auto">
          <h4 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">
            Trạng thái phân khu
          </h4>
          <div className="flex flex-wrap gap-2">
            {byZone.map(({ zone, available }) => {
              const chipClass =
                available === 0
                  ? 'bg-red-100 text-red-800 border-red-200'
                  : available <= 15
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : 'bg-green-100 text-green-800 border-green-200';
              const label =
                available === 0 ? `${zone}: Hết chỗ` : `${zone}: ${available} trống`;
              return (
                <span
                  key={zone}
                  className={cn(
                    'px-3 py-1.5 border rounded-lg text-sm font-medium',
                    chipClass,
                  )}
                >
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
