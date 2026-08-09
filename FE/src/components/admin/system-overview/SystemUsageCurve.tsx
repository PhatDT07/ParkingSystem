import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { UsagePoint } from './types';

interface Props {
  readonly data: UsagePoint[];
}

export function SystemUsageCurve({ data }: Props) {
  return (
    <section>
      <div className="flex items-center justify-between mb-md border-b border-outline-variant pb-sm">
        <h3 className="font-headline-md text-headline-md text-on-background flex items-center gap-xs">
          <span className="material-symbols-outlined text-secondary" style={{ fontSize: 20 }}>timeline</span>
          Xu hướng sử dụng hệ thống (24h)
        </h3>
      </div>
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-md shadow-sm h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="usageFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0058be" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#0058be" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#c6c6cd" strokeOpacity={0.5} vertical={false} />
            <XAxis
              dataKey="hour"
              tick={{ fontFamily: 'JetBrains Mono', fontSize: 11, fill: '#45464d' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
              tick={{ fontFamily: 'JetBrains Mono', fontSize: 11, fill: '#45464d' }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              formatter={(v) => [`${v}%`, 'Lấp đầy']}
              contentStyle={{ fontFamily: 'Inter', fontSize: 12, borderRadius: 8 }}
            />
            <Area
              type="monotone"
              dataKey="occupancyRate"
              stroke="#0058be"
              strokeWidth={2}
              fill="url(#usageFill)"
              dot={false}
              activeDot={{ r: 4, fill: '#0058be' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
