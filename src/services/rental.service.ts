import type { Knex } from 'knex';
import { z } from 'zod';
import { ConflictError, NotFoundError, ValidationError } from '../errors';
import type { RentalRepository } from '../repositories/rental.repository';
import type { VehicleRepository } from '../repositories/vehicle.repository';
import { RENTAL_STATUSES, type RentalListResult, type RentalRecord } from '../types/rental';

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD format')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, 'Date must be a valid calendar date');

const createRentalSchema = z.object({
  vehicle_id: z.coerce.number().int().positive(),
  customer_name: z.string().trim().min(2).max(150),
  customer_phone: z.string().trim().min(5).max(30),
  start_date: dateSchema,
  end_date: dateSchema,
});

const updateRentalSchema = z
  .object({
    vehicle_id: z.coerce.number().int().positive().optional(),
    customer_name: z.string().trim().min(2).max(150).optional(),
    customer_phone: z.string().trim().min(5).max(30).optional(),
    start_date: dateSchema.optional(),
    end_date: dateSchema.optional(),
    status: z.enum(RENTAL_STATUSES).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'At least one rental field must be supplied');

const rentalFiltersSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    vehicle_id: z.coerce.number().int().positive().optional(),
    status: z.enum(RENTAL_STATUSES).optional(),
    start_date: dateSchema.optional(),
    end_date: dateSchema.optional(),
  })
  .refine(
    (data) => !data.start_date || !data.end_date || data.end_date >= data.start_date,
    'The filter end_date must be on or after start_date',
  );

function validationDetails(error: z.ZodError): { field: string; message: string }[] {
  return error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
}

function assertDateRange(startDate: string, endDate: string): void {
  if (endDate < startDate) {
    throw new ValidationError('end_date must be on or after start_date');
  }
}

export function calculateRentalTotal(
  startDate: string,
  endDate: string,
  dailyRate: string | number,
): { durationDays: number; totalAmount: number } {
  const startTime = new Date(`${startDate}T00:00:00.000Z`).getTime();
  const endTime = new Date(`${endDate}T00:00:00.000Z`).getTime();
  const durationDays = Math.max(1, Math.ceil((endTime - startTime) / (1000 * 60 * 60 * 24)) + 1);
  const rate = Number(dailyRate);

  if (!Number.isFinite(rate) || rate < 0) {
    throw new ValidationError('Vehicle daily rate is invalid');
  }

  return { durationDays, totalAmount: Number((durationDays * rate).toFixed(2)) };
}

export class RentalService {
  constructor(
    private readonly rentalRepository: RentalRepository,
    private readonly vehicleRepository: VehicleRepository,
    private readonly database: Knex,
  ) {}

  async createRental(input: unknown): Promise<RentalRecord> {
    const parsed = createRentalSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError('Invalid rental data', validationDetails(parsed.error));
    }
    assertDateRange(parsed.data.start_date, parsed.data.end_date);

    return this.database.transaction(async (trx) => {
      const vehicle = await this.vehicleRepository.findByIdForUpdate(trx, parsed.data.vehicle_id);
      if (!vehicle) throw new NotFoundError('Vehicle not found');

      const overlap = await this.rentalRepository.findOverlappingRental(
        trx,
        parsed.data.vehicle_id,
        parsed.data.start_date,
        parsed.data.end_date,
      );
      if (overlap) {
        throw new ConflictError('Vehicle is already booked for the selected date range');
      }

      const { totalAmount } = calculateRentalTotal(
        parsed.data.start_date,
        parsed.data.end_date,
        vehicle.daily_rate,
      );
      return this.rentalRepository.create(trx, {
        ...parsed.data,
        total_amount: totalAmount,
        status: 'booked',
      });
    });
  }

  async updateRental(id: number, input: unknown): Promise<RentalRecord> {
    this.assertValidId(id);
    const parsed = updateRentalSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError('Invalid rental data', validationDetails(parsed.error));
    }

    return this.database.transaction(async (trx) => {
      const existing = await this.rentalRepository.findByIdForUpdate(trx, id);
      if (!existing) throw new NotFoundError('Rental not found');

      const vehicleId = parsed.data.vehicle_id ?? existing.vehicle_id;
      const startDate = parsed.data.start_date ?? existing.start_date;
      const endDate = parsed.data.end_date ?? existing.end_date;
      const status = parsed.data.status ?? existing.status;
      assertDateRange(startDate, endDate);

      const bookingFieldsChanged =
        parsed.data.vehicle_id !== undefined ||
        parsed.data.start_date !== undefined ||
        parsed.data.end_date !== undefined ||
        (parsed.data.status !== undefined && existing.status === 'cancelled');
      let totalAmount = Number(existing.total_amount);

      if (bookingFieldsChanged) {
        const vehicle = await this.vehicleRepository.findByIdForUpdate(trx, vehicleId);
        if (!vehicle) throw new NotFoundError('Vehicle not found');

        if (status !== 'cancelled') {
          const overlap = await this.rentalRepository.findOverlappingRental(
            trx,
            vehicleId,
            startDate,
            endDate,
            id,
          );
          if (overlap) {
            throw new ConflictError('Vehicle is already booked for the selected date range');
          }
        }
        totalAmount = calculateRentalTotal(startDate, endDate, vehicle.daily_rate).totalAmount;
      }

      const rental = await this.rentalRepository.update(trx, id, {
        ...parsed.data,
        vehicle_id: vehicleId,
        start_date: startDate,
        end_date: endDate,
        total_amount: totalAmount,
      });
      if (!rental) throw new NotFoundError('Rental not found');
      return rental;
    });
  }

  async findById(id: number): Promise<RentalRecord> {
    this.assertValidId(id);
    const rental = await this.rentalRepository.findById(id);
    if (!rental) throw new NotFoundError('Rental not found');
    return rental;
  }

  async findAll(
    input: unknown,
  ): Promise<RentalListResult & { page: number; limit: number; pages: number }> {
    const parsed = rentalFiltersSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError('Invalid rental filters', validationDetails(parsed.error));
    }
    const result = await this.rentalRepository.findAll(parsed.data);
    return {
      ...result,
      page: parsed.data.page,
      limit: parsed.data.limit,
      pages: Math.ceil(result.total / parsed.data.limit),
    };
  }

  async cancelRental(id: number): Promise<void> {
    await this.updateRental(id, { status: 'cancelled' });
  }

  private assertValidId(id: number): void {
    if (!Number.isInteger(id) || id < 1) {
      throw new ValidationError('Rental ID must be a positive integer');
    }
  }
}
