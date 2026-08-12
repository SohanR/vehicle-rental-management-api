export const RENTAL_STATUSES = ['booked', 'ongoing', 'completed', 'cancelled'] as const;
export type RentalStatus = (typeof RENTAL_STATUSES)[number];

export interface RentalRecord {
  id: number;
  vehicle_id: number;
  customer_name: string;
  customer_phone: string;
  start_date: string;
  end_date: string;
  total_amount: string | number;
  status: RentalStatus;
  created_at: Date;
  updated_at: Date;
}

export interface CreateRentalData {
  vehicle_id: number;
  customer_name: string;
  customer_phone: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  status?: RentalStatus;
}

export type UpdateRentalData = Partial<CreateRentalData>;

export interface RentalFilters {
  page: number;
  limit: number;
  vehicle_id?: number;
  status?: RentalStatus;
  start_date?: string;
  end_date?: string;
}

export interface RentalListResult {
  rentals: RentalRecord[];
  total: number;
}
