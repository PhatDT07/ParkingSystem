import type { FloorSummary } from './types';
import { LotCard } from './LotCard';

interface Props {
  readonly floors: FloorSummary[];
}

export function LotHeatmapGrid({ floors }: Props) {
  return (
    <div className="flex flex-col gap-md flex-1">
      <div className="flex items-center justify-between">
        <h2 className="font-headline-md text-headline-md text-on-background flex items-center gap-xs">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>grid_view</span>
          Tổng quan theo tầng
        </h2>
        <div className="flex gap-xs">
          <button className="p-xs bg-white border border-outline-variant rounded hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 20 }}>refresh</span>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-md">
        {floors.map((floor) => (
          <LotCard key={floor.floorId} floor={floor} />
        ))}
      </div>
    </div>
  );
}
