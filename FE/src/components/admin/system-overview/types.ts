// Admin overview — single building, summarised per FLOOR (multi-lot removed v3.1).
export interface FloorSummary {
  floorId: string;
  floorName: string;
  capacity: number;
  inside: number;
  outstanding: number;
  walkInHeadroom: number;
  occupancyRate: number;
  openIncidents: number;
  revenueToday: number;
}

export interface AdminDashboard {
  floors: FloorSummary[];
  totals: {
    capacity: number;
    inside: number;
    outstanding: number;
    walkInHeadroom: number;
    occupancyRate: number;
    openIncidents: number;
    revenueToday: number;
  };
  usageCurve?: UsagePoint[];
}

export interface UsagePoint {
  hour: string;
  occupancyRate: number;
}
