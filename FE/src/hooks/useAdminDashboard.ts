import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { AdminDashboard } from '@/components/admin/system-overview/types'
import { REFRESH_INTERVAL } from '@/lib/constants'

export interface UseAdminDashboardReturn {
  data: AdminDashboard | undefined
  isLoading: boolean
  isError: boolean
}

/** Tổng quan hệ thống cho Admin — GET /api/admin/dashboard (floors + totals + usageCurve). */
export function useAdminDashboard(): UseAdminDashboardReturn {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api.get<AdminDashboard>('/admin/dashboard'),
    // Live monitoring surface — keep it fresh, but never mask a failure with mock data.
    refetchInterval: REFRESH_INTERVAL,
  })
  return { data, isLoading, isError }
}
