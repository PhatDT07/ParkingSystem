'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  readonly label: string;
  readonly value: string | number;
  readonly icon: string;
  readonly iconBg: string;
  readonly iconColor: string;
  readonly suffix?: string;
  readonly progressValue?: number;
  readonly progressColor?: string;
  readonly actionLabel?: string;
  readonly actionHref?: string;
  readonly valueColor?: string;
}

export function KpiCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  suffix,
  progressValue,
  progressColor = 'bg-amber-500',
  actionLabel,
  actionHref = '#',
  valueColor = 'text-on-surface',
}: KpiCardProps) {
  return (
    <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <p className="text-base text-gray-500 font-medium">{label}</p>
        <div className={cn('p-2 rounded-lg', iconBg, iconColor)}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      </div>

      <div className="flex items-end gap-2">
        <h3 className={cn('text-4xl font-bold', valueColor)}>{value}</h3>
        {suffix && (
          <span className="text-sm text-gray-500 mb-1">{suffix}</span>
        )}
        {actionLabel && (
          // Next.js <Link> = client-side navigation. A plain <a href> would do a full
          // page reload, which redirects to /login before the persisted auth token
          // rehydrates into the API layer (see ProtectedLayout hydration guard).
          <Link
            href={actionHref}
            className="text-sm text-blue-600 hover:underline font-medium ml-auto"
          >
            {actionLabel}
          </Link>
        )}
      </div>

      {progressValue !== undefined && (
        <div className="w-full bg-gray-100 h-2 rounded-full mt-3 overflow-hidden">
          <div
            className={cn('h-full rounded-full', progressColor)}
            style={{ width: `${Math.min(progressValue, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
