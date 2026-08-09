import type { AdminDashboard } from './types';

interface Props {
  readonly totals: AdminDashboard['totals'];
}

function fmtRevenue(n: number) {
  return (n / 1_000_000).toFixed(1) + 'M';
}

interface KpiCardProps {
  icon: string;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  badge?: string;
  badgeColor?: string;
  highlight?: boolean;
}

function KpiCard({ icon, iconBg, iconColor, label, value, badge, badgeColor, highlight }: KpiCardProps) {
  return (
    <div className={`rounded-xl border p-md flex flex-col gap-sm shadow-sm ${highlight ? 'bg-primary border-primary/30' : 'bg-white border-outline-variant'}`}>
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}>
          <span className={`material-symbols-outlined ${iconColor}`} style={{ fontSize: 20 }}>{icon}</span>
        </div>
        {badge && (
          <span className={`font-label-mono text-label-mono px-xs py-0.5 rounded-full flex items-center gap-0.5 ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>
      <div>
        <p className={`font-label-mono text-label-mono uppercase tracking-wide mb-xs ${highlight ? 'text-on-primary/70' : 'text-on-surface-variant'}`}>
          {label}
        </p>
        <p className={`font-display text-display leading-none ${highlight ? 'text-on-primary' : 'text-on-background'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

export function SystemKpiStrip({ totals }: Props) {
  return (
    <section className="grid grid-cols-2 md:grid-cols-5 gap-md">
      <KpiCard
        icon="garage"
        iconBg="bg-blue-50"
        iconColor="text-primary"
        label="Tổng sức chứa"
        value={totals.capacity.toLocaleString('vi-VN')}
      />
      <KpiCard
        icon="directions_car"
        iconBg="bg-green-50"
        iconColor="text-green-600"
        label="Đang trong bãi"
        value={totals.inside.toLocaleString('vi-VN')}
        badge="▲+5"
        badgeColor="text-green-600 bg-green-50"
      />
      <KpiCard
        icon="data_usage"
        iconBg="bg-red-50"
        iconColor="text-error"
        label="Tỉ lệ lấp đầy"
        value={`${totals.occupancyRate.toFixed(0)}%`}
        badge={`${totals.occupancyRate.toFixed(0)}%`}
        badgeColor="text-on-surface-variant bg-surface-container"
      />
      <KpiCard
        icon="warning"
        iconBg="bg-red-50"
        iconColor="text-error"
        label="Sự cố đang mở"
        value={String(totals.openIncidents)}
      />
      <KpiCard
        icon="payments"
        iconBg="bg-blue-100"
        iconColor="text-on-primary"
        label="Doanh thu hôm nay"
        value={`${fmtRevenue(totals.revenueToday)} VND`}
        badge="▲+12%"
        badgeColor="text-green-300 bg-white/10"
        highlight
      />
    </section>
  );
}
