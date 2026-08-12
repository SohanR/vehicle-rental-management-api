import type { LoginResult } from './staff';
import type { RentalRecord, RentalStatus } from './rental';
import type { MonthlyRentalReport } from './report';
import type { VehicleCategory, VehicleRecord } from './vehicle';

export interface IdParams {
  [key: string]: string;
  id: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface VehicleBody {
  name: string;
  plate_number: string;
  category: VehicleCategory;
  daily_rate: string | number;
}

export type VehicleUpdateBody = Partial<VehicleBody>;

export interface VehicleQuery {
  page?: string;
  limit?: string;
  category?: VehicleCategory;
  search?: string;
}

export interface RentalBody {
  vehicle_id: string | number;
  customer_name: string;
  customer_phone: string;
  start_date: string;
  end_date: string;
}

export type RentalUpdateBody = Partial<RentalBody> & { status?: RentalStatus };

export interface RentalQuery {
  page?: string;
  limit?: string;
  vehicle_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}

export interface ReportQuery {
  month?: string;
  vehicle_id?: string;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export interface PaginatedResponse<T> extends SuccessResponse<T[]> {
  pagination: { page: number; limit: number; total: number; pages: number };
}

export type LoginResponse = SuccessResponse<LoginResult>;
export type VehicleResponse = SuccessResponse<VehicleRecord>;
export type VehicleListResponse = PaginatedResponse<VehicleRecord>;
export type RentalResponse = SuccessResponse<RentalRecord>;
export type RentalListResponse = PaginatedResponse<RentalRecord>;
export type ReportResponse = SuccessResponse<MonthlyRentalReport>;
