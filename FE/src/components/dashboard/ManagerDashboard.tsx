'use client';

import { useEffect, useState } from 'react';
import { ParkingCircle, CheckCircle, Car, DollarSign, AlertTriangle } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { REFRESH_INTERVAL } from '@/lib/constants';
import type { OccupancyStats } from './types';

interface ManagerDashboardProps {
  stats: OccupancyStats;
  onRefresh?: () => void;
  loading?: boolean;
  error?: boolean;
}

export function ManagerDashboard({ stats, onRefresh, loading, error }: ManagerDashboardProps) {
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    if (!onRefresh) return;

    const interval = setInterval(() => {
      onRefresh();
      setLastUpdate(new Date());
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [onRefresh]);

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Không tải được dữ liệu bãi đỗ. Vui lòng thử lại.
          </span>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              Thử lại
            </Button>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Tổng số chỗ"
          value={stats.total_slots}
          icon={ParkingCircle}
          iconColor="blue"
          loading={loading}
        />

        <StatsCard
          title="Chỗ trống"
          value={stats.available}
          icon={CheckCircle}
          iconColor="green"
          loading={loading}
          trend={{
            value: '+5',
            direction: 'up',
            color: 'green',
          }}
        />

        <StatsCard
          title="Đang sử dụng"
          value={stats.occupied}
          icon={Car}
          iconColor="red"
          badge={`${stats.occupancy_rate}%`}
          loading={loading}
        />

        <StatsCard
          title="Doanh thu hôm nay"
          value={formatCurrency(stats.current_revenue)}
          icon={DollarSign}
          iconColor="blue"
          loading={loading}
          trend={{
            value: '+12%',
            direction: 'up',
            color: 'blue',
          }}
        />
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Phân bổ chỗ đỗ</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Trống</span>
              <span className="text-sm font-bold text-green-600">
                {stats.available} ({Math.round((stats.available / stats.total_slots) * 100)}%)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Đã đỗ</span>
              <span className="text-sm font-bold text-red-600">
                {stats.occupied} ({Math.round((stats.occupied / stats.total_slots) * 100)}%)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Bảo trì</span>
              <span className="text-sm font-bold text-gray-600">
                {stats.maintenance} ({Math.round((stats.maintenance / stats.total_slots) * 100)}%)
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Tỷ lệ lấp đầy</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Hiện tại</span>
                <span className="text-sm font-bold text-gray-900">{stats.occupancy_rate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${stats.occupancy_rate}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              {stats.occupancy_rate >= 80
                ? 'Tỷ lệ lấp đầy cao - Cân nhắc mở thêm khu vực'
                : stats.occupancy_rate >= 50
                ? 'Tỷ lệ lấp đầy trung bình'
                : 'Tỷ lệ lấp đầy thấp'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
