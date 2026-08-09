// Dashboard overview stats (capacity model, single building — NO Reserved slot state).
export interface OccupancyStats {
  total_slots: number;
  available: number;
  occupied: number;
  maintenance: number;
  occupancy_rate: number;
  current_revenue: number;
}
