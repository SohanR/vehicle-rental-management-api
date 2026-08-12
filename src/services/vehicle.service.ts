import { z } from 'zod';
import { ConflictError, NotFoundError, ValidationError } from '../errors';
import type { VehicleRepository } from '../repositories/vehicle.repository';
import { VEHICLE_CATEGORIES, type VehicleListResult, type VehicleRecord } from '../types/vehicle';

const listOptionsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.enum(VEHICLE_CATEGORIES).optional(),
  search: z.string().trim().min(1).max(150).optional(),
});

const vehicleInputSchema = z.object({
  name: z.string().trim().min(2).max(150),
  plate_number: z
    .string()
    .trim()
    .min(2)
    .max(50)
    .transform((value) => value.toUpperCase()),
  category: z.enum(VEHICLE_CATEGORIES),
  daily_rate: z.coerce.number().positive().max(99_999_999.99),
});

const vehicleSchema = vehicleInputSchema.extend({
  photo_path: z.string().max(500).nullable().optional(),
});

const vehicleUpdateSchema = vehicleSchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: 'At least one vehicle field or photo must be supplied',
});

function validationDetails(error: z.ZodError): { field: string; message: string }[] {
  return error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}

export class VehicleService {
  constructor(private readonly vehicleRepository: VehicleRepository) {}

  async findAll(
    input: unknown,
  ): Promise<VehicleListResult & { page: number; limit: number; pages: number }> {
    const parsed = listOptionsSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        'Invalid vehicle query parameters',
        validationDetails(parsed.error),
      );
    }

    const result = await this.vehicleRepository.findAll(parsed.data);
    return {
      ...result,
      page: parsed.data.page,
      limit: parsed.data.limit,
      pages: Math.ceil(result.total / parsed.data.limit),
    };
  }

  async findById(id: number): Promise<VehicleRecord> {
    this.assertValidId(id);
    const vehicle = await this.vehicleRepository.findById(id);
    if (!vehicle) throw new NotFoundError('Vehicle not found');
    return vehicle;
  }

  async create(input: unknown): Promise<VehicleRecord> {
    const parsed = vehicleSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError('Invalid vehicle data', validationDetails(parsed.error));
    }

    try {
      return await this.vehicleRepository.create(parsed.data);
    } catch (error: unknown) {
      if (isUniqueViolation(error)) throw new ConflictError('Plate number is already registered');
      throw error;
    }
  }

  async update(
    id: number,
    input: unknown,
  ): Promise<{ vehicle: VehicleRecord; previousPhotoPath: string | null }> {
    this.assertValidId(id);
    const parsed = vehicleUpdateSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError('Invalid vehicle data', validationDetails(parsed.error));
    }

    const existing = await this.findById(id);
    try {
      const vehicle = await this.vehicleRepository.update(id, parsed.data);
      if (!vehicle) throw new NotFoundError('Vehicle not found');
      return { vehicle, previousPhotoPath: existing.photo_path };
    } catch (error: unknown) {
      if (isUniqueViolation(error)) throw new ConflictError('Plate number is already registered');
      throw error;
    }
  }

  async softDelete(id: number): Promise<void> {
    this.assertValidId(id);
    if (!(await this.vehicleRepository.softDelete(id))) {
      throw new NotFoundError('Vehicle not found');
    }
  }

  private assertValidId(id: number): void {
    if (!Number.isInteger(id) || id < 1) {
      throw new ValidationError('Vehicle ID must be a positive integer');
    }
  }
}
