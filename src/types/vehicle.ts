export const VEHICLE_CATEGORIES = [
  'Sedan',
  'SUV',
  'Hatchback',
  'Coupe',
  'Convertible',
  'Wagon',
  'Van',
  'Minivan',
  'Pickup',
  'Microbus',
] as const;
export type VehicleCategory = (typeof VEHICLE_CATEGORIES)[number];

export interface VehicleRecord {
  id: number;
  name: string;
  plate_number: string;
  category: VehicleCategory;
  daily_rate: string | number;
  photo_path: string | null;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface VehicleListOptions {
  page: number;
  limit: number;
  category?: VehicleCategory;
  search?: string;
}

export interface VehicleListResult {
  vehicles: VehicleRecord[];
  total: number;
}

export interface CreateVehicleData {
  name: string;
  plate_number: string;
  category: VehicleCategory;
  daily_rate: number;
  photo_path?: string | null;
}

export type UpdateVehicleData = Partial<CreateVehicleData>;
