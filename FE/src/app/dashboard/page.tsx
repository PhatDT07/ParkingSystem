'use client'

import { useState } from 'react'
import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { ManagerDashboard } from '@/components/dashboard/ManagerDashboard'
import { StaffDashboard } from '@/components/dashboard/StaffDashboard'
import { ManualEntryModal } from '@/components/dashboard/ManualEntryModal'
import { SystemOverview } from '@/components/admin/system-overview'
import { useAuthStore } from '@/store'
import { useCreateSession, type CreateSessionInput } from '@/hooks'
import { useLotSlots } from '@/hooks/useAvailability'
import type { OccupancyStats } from '@/components/dashboard'

export default function Dashboard() {
  const { user } = useAuthStore()
  const { data: slots, refetch, isLoading, isError } = useLotSlots()
  const createSession = useCreateSession()
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (user?.role === 'Admin') {
    return (
      <ProtectedLayout>
        <div className="p-xl max-w-container-max mx-auto">
          <SystemOverview />
        </div>
      </ProtectedLayout>
    )
  }

  // Per-component loading (không chặn cả trang): tính stats phòng thủ từ slots ?? []
  // và truyền loading/error xuống để từng thẻ tự hiển thị skeleton / báo lỗi.
  const list = slots ?? []
  const occupied = list.filter((s) => s.status === 'Occupied').length
  const stats: OccupancyStats = {
    total_slots: list.length,
    available: list.filter((s) => s.status === 'Available').length,
    occupied,
    maintenance: list.filter((s) => s.status === 'Maintenance').length,
    occupancy_rate: list.length ? Math.round((occupied / list.length) * 100) : 0,
    current_revenue: occupied * 10000 * 2,
  }

  const availableSlots = list.filter((slot) => slot.status === 'Available')

  const handleManualEntry = async (data: CreateSessionInput) => {
    await createSession.mutateAsync(data)
  }

  return (
    <ProtectedLayout>
      {user?.role === 'Manager' ? (
        <ManagerDashboard stats={stats} onRefresh={() => refetch()} loading={isLoading} error={isError} />
      ) : (
        <>
          <StaffDashboard
            stats={stats}
            onRefresh={() => refetch()}
            onManualEntry={() => setIsModalOpen(true)}
            loading={isLoading}
            error={isError}
          />
          <ManualEntryModal
            open={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            availableSlots={availableSlots}
            onSubmit={handleManualEntry}
          />
        </>
      )}
    </ProtectedLayout>
  )
}
