'use client';

import { useEffect, useState } from 'react';
import { ParkingCircle, CheckCircle, Car, AlertTriangle, Plus } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { Button } from '@/components/ui/button';
import { REFRESH_INTERVAL } from '@/lib/constants';
import type { OccupancyStats } from './types';

interface StaffDashboardProps {
  stats: OccupancyStats;
  onRefresh?: () => void;
  onManualEntry?: () => void;
  loading?: boolean;
  error?: boolean;
}

export function StaffDashboard({ stats, onRefresh, onManualEntry, loading, error }: StaffDashboardProps) {
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
      {/* Header with Manual Entry Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Tổng quan</h2>
          <p className="text-sm text-gray-600">Thông tin tổng quan về bãi đỗ xe</p>
        </div>
        {onManualEntry && (
          <Button onClick={onManualEntry} className="gap-2">
            <Plus className="h-4 w-4" />
            Nhập thủ công
          </Button>
        )}
      </div>

      {/* Không tải được dữ liệu → báo lỗi + cho thử lại (không để trắng cả trang) */}
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
          title="Ngoại lệ chưa xử lý"
          value={0}
          icon={AlertTriangle}
          iconColor="yellow"
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hướng dẫn nhanh</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              1
            </div>
            <div>
              <p className="font-medium text-gray-900">Nhập thủ công khi AI Camera lỗi</p>
              <p className="text-sm text-gray-600 mt-1">
                Sử dụng nút &quot;Nhập thủ công&quot; để tạo phiên gửi xe mới khi hệ thống AI không đọc được biển số
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              2
            </div>
            <div>
              <p className="font-medium text-gray-900">Theo dõi phiên hoạt động</p>
              <p className="text-sm text-gray-600 mt-1">
                Xem danh sách xe đang đỗ và hỗ trợ khách hàng thanh toán khi ra
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex-shrink-0 w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              3
            </div>
            <div>
              <p className="font-medium text-gray-900">Xử lý ngoại lệ</p>
              <p className="text-sm text-gray-600 mt-1">
                Giải quyết các sự cố như đỗ sai vị trí, lỗi thanh toán được giao cho bạn
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tình trạng bãi đỗ</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Trống</span>
            <span className="text-sm font-bold text-green-600">
              {stats.available} / {stats.total_slots} ({Math.round((stats.available / (stats.total_slots || 1)) * 100)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(stats.available / (stats.total_slots || 1)) * 100}%` }}
            />
          </div>

          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-600">Đã đỗ</span>
            <span className="text-sm font-bold text-red-600">
              {stats.occupied} / {stats.total_slots} ({Math.round((stats.occupied / (stats.total_slots || 1)) * 100)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(stats.occupied / (stats.total_slots || 1)) * 100}%` }}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
