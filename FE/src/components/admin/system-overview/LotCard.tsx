import type { FloorSummary } from './types';

interface Props {
  readonly floor: FloorSummary;
}

function statusIcon(rate: number, incidents: number) {
  if (incidents > 0 || rate >= 90) return { icon: 'cancel', color: 'text-error', ring: 'ring-1 ring-error/30' };
  if (rate >= 75) return { icon: 'warning', color: 'text-tertiary', ring: 'ring-1 ring-tertiary/30' };
  return { icon: 'check_circle', color: 'text-green-600', ring: '' };
}

function barColor(rate: number) {
  if (rate >= 90) return 'bg-error';
  if (rate >= 75) return 'bg-tertiary';
  return 'bg-primary';
}

export function LotCard({ floor }: Props) {
  const { icon, color, ring } = statusIcon(floor.occupancyRate, floor.openIncidents);

  return (
    <div
      className={`bg-white p-md rounded-xl border border-outline-variant shadow-sm flex flex-col gap-sm relative overflow-hidden ${ring}`}
    >
      <div className="flex justify-between items-start">
        <h3 className="font-body-lg text-body-lg font-bold text-on-surface truncate">{floor.floorName}</h3>
        <span className={`material-symbols-outlined ${color}`} style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
      </div>
      <div className="flex flex-col gap-1 mt-auto">
        <div className="flex justify-between font-label-mono text-label-mono text-on-surface-variant">
          <span>Sức chứa: {floor.inside}/{floor.capacity}</span>
          <span className={floor.occupancyRate >= 90 ? 'text-error font-bold' : ''}>{floor.occupancyRate}%</span>
        </div>
        <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
          <div className={`${barColor(floor.occupancyRate)} h-full rounded-full`} style={{ width: `${floor.occupancyRate}%` }} />
        </div>
      </div>
    </div>
  );
}
