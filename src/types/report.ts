export interface VehicleRentalMetricsRow {
  id: number;
  name: string;
  total_bookings: number;
  days_rented: number;
  revenue: string | number;
}

export interface VehicleRentalMetrics {
  id: number;
  name: string;
  total_bookings: number;
  days_rented: number;
  revenue: number;
}

export interface TopRevenueVehicle {
  id: number;
  name: string;
  revenue: number;
}

export interface MonthlyRentalReport {
  month: string;
  month_start: string;
  month_end: string;
  vehicle_id: number | null;
  vehicles: VehicleRentalMetrics[];
  metadata: {
    top_revenue_vehicle: TopRevenueVehicle | null;
  };
}
