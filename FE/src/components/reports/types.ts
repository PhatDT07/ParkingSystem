import type { OccupancyWindow, DateRange } from '@/types/model'

export interface RevenuePoint {
  date: string
  revenue: number
  sessions: number
  occupancyRate: number // 0–100
}

export interface ReportsHeaderProps {
  readonly range: DateRange
  readonly onRangeChange: (r: DateRange) => void
  readonly onExport: () => void
}

export interface ReportsKpiCardsProps {
  readonly revenue: RevenuePoint[]
}

export interface RevenueChartProps {
  readonly revenue: RevenuePoint[]
}

export interface OccupancyCurveProps {
  readonly windows: OccupancyWindow[]
}

export interface PeakHoursBarsProps {
  readonly windows: OccupancyWindow[]
}

export interface ReportsTableProps {
  readonly revenue: RevenuePoint[]
}
