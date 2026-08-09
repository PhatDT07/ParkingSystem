import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { OccupancyWindow, DateRange } from '@/types/model'
import type { RevenuePoint } from '@/components/reports/types'

/**
 * Báo cáo — chuỗi thời gian thật từ BE:
 *   GET /manager/reports/revenue-daily?fromDate=&toDate=  → RevenuePoint[]
 *   GET /manager/reports/occupancy-hourly?fromDate=&toDate= → OccupancyWindow[]
 */
export function useReports(
  range: DateRange,
): { revenue: RevenuePoint[]; occupancy: OccupancyWindow[]; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['reports', range.from, range.to],
    queryFn: async () => {
      const qs = `?fromDate=${range.from}&toDate=${range.to}`
      const [revenue, occupancy] = await Promise.all([
        api.get<RevenuePoint[]>(`/manager/reports/revenue-daily${qs}`),
        api.get<OccupancyWindow[]>(`/manager/reports/occupancy-hourly${qs}`),
      ])
      return { revenue, occupancy }
    },
  })
  return {
    revenue: data?.revenue ?? [],
    occupancy: data?.occupancy ?? [],
    isLoading,
  }
}
