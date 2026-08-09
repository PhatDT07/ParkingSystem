import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { SystemKpiStrip } from './SystemKpiStrip';
import { LotHeatmapGrid } from './LotHeatmapGrid';
import { SystemUsageCurve } from './SystemUsageCurve';
import { IncidentList } from './IncidentList';



export function SystemOverview() {
  const { data, isLoading, isError } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-on-surface-variant font-body-md text-body-md">
        Đang tải dữ liệu...
      </div>
    );
  }

  // Never render fabricated data on a monitoring surface — surface the failure instead.
  if (isError || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-error font-body-md text-body-md">
        Không tải được dữ liệu giám sát. Vui lòng thử lại.
      </div>
    );
  }

  return (
    <div className="space-y-xl">
      {/* Page header — monitoring-center framing + live status pill */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-display text-on-background flex items-center gap-sm">
            <span
              className="material-symbols-outlined text-secondary"
              style={{ fontSize: 36, fontVariationSettings: "'FILL' 1" }}
            >
              monitor_heart
            </span>
            Trung tâm Giám sát
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-xs">
            Trạng thái thời gian thực và phát hiện bất thường trên toàn hệ thống.
          </p>
        </div>
        <div className="flex items-center gap-sm bg-white px-md py-sm rounded-full border border-outline-variant shadow-sm">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="font-label-mono text-label-mono text-on-surface uppercase tracking-wider">
            Hệ thống Online
          </span>
        </div>
      </div>

      <SystemKpiStrip totals={data.totals} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
        <div className="lg:col-span-4">
          <IncidentList />
        </div>
        <div className="lg:col-span-8">
          <LotHeatmapGrid floors={data.floors} />
        </div>
      </div>

      <SystemUsageCurve data={data.usageCurve ?? []} />
    </div>
  );
}
