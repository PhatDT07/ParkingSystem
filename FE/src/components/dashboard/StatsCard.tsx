'use client';

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: 'blue' | 'green' | 'red' | 'yellow' | 'gray';
  trend?: {
    value: string;
    direction: 'up' | 'down';
    color: 'green' | 'red' | 'blue';
  };
  badge?: string;
  /** Show a skeleton in place of the value while the source query is loading. */
  loading?: boolean;
}

const iconColorClasses = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  red: 'bg-red-100 text-red-600',
  yellow: 'bg-yellow-100 text-yellow-600',
  gray: 'bg-gray-100 text-gray-600',
};

const trendColorClasses = {
  green: 'text-green-600',
  red: 'text-red-600',
  blue: 'text-blue-600',
};

export function StatsCard({ title, value, icon: Icon, iconColor, trend, badge, loading }: StatsCardProps) {
  return (
    <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
      <div className="flex justify-between items-start">
        <div className={cn('p-2 rounded-lg', iconColorClasses[iconColor])}>
          <Icon className="h-5 w-5" />
        </div>

        {trend && (
          <div className={cn('flex items-center text-xs font-mono', trendColorClasses[trend.color])}>
            {trend.direction === 'up' ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span>{trend.value}</span>
          </div>
        )}

        {badge && (
          <div className="bg-gray-100 px-2 py-1 rounded text-xs font-bold text-gray-900">
            {badge}
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="text-sm text-gray-600 font-medium">{title}</p>
        {loading ? (
          <div className="mt-2 h-8 w-16 animate-pulse rounded bg-gray-200" />
        ) : (
          <h3 className="text-3xl font-bold text-gray-900 mt-1">{value}</h3>
        )}
      </div>
    </div>
  );
}
