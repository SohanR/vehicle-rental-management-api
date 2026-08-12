import type { Knex } from 'knex';
import type {
  CreateRentalData,
  RentalFilters,
  RentalListResult,
  RentalRecord,
  UpdateRentalData,
} from '../types/rental';

export class RentalRepository {
  constructor(private readonly database: Knex) {}

  async findOverlappingRental(
    trx: Knex.Transaction,
    vehicleId: number,
    startDate: string,
    endDate: string,
    excludeRentalId?: number,
  ): Promise<RentalRecord | undefined> {
    const result: unknown = await trx<RentalRecord>('rentals')
      .where({ vehicle_id: vehicleId })
      .whereNot({ status: 'cancelled' })
      .where('start_date', '<=', endDate)
      .where('end_date', '>=', startDate)
      .modify((query) => {
        if (excludeRentalId !== undefined) query.whereNot({ id: excludeRentalId });
      })
      .first();
    if (result === undefined) return undefined;
    if (typeof result !== 'object' || result === null) {
      throw new Error('Database returned an invalid overlapping rental');
    }
    return result as RentalRecord;
  }

  async create(trx: Knex.Transaction, data: CreateRentalData): Promise<RentalRecord> {
    const [rental] = await trx<RentalRecord>('rentals').insert(data).returning('*');
    if (!rental) throw new Error('Database did not return the created rental');
    return rental;
  }

  async update(
    trx: Knex.Transaction,
    id: number,
    data: UpdateRentalData,
  ): Promise<RentalRecord | undefined> {
    const [rental] = await trx<RentalRecord>('rentals')
      .where({ id })
      .update({ ...data, updated_at: trx.fn.now() })
      .returning('*');
    return rental;
  }

  async findById(id: number): Promise<RentalRecord | undefined> {
    return this.database<RentalRecord>('rentals').where({ id }).first();
  }

  async findByIdForUpdate(trx: Knex.Transaction, id: number): Promise<RentalRecord | undefined> {
    return trx<RentalRecord>('rentals').where({ id }).forUpdate().first();
  }

  async findAll(filters: RentalFilters): Promise<RentalListResult> {
    const applyFilters = (query: Knex.QueryBuilder) => {
      if (filters.vehicle_id !== undefined) query.where('vehicle_id', filters.vehicle_id);
      if (filters.status) query.where('status', filters.status);
      if (filters.start_date) query.where('end_date', '>=', filters.start_date);
      if (filters.end_date) query.where('start_date', '<=', filters.end_date);
    };
    const offset = (filters.page - 1) * filters.limit;
    const rentalQuery = this.database<RentalRecord, RentalRecord[]>('rentals')
      .select('*')
      .modify(applyFilters)
      .orderBy('start_date', 'desc')
      .orderBy('id', 'desc')
      .limit(filters.limit)
      .offset(offset);
    const countQuery = this.database<RentalRecord>('rentals')
      .modify(applyFilters)
      .count({ count: 'id' })
      .first();
    const rentalRows: unknown = await rentalQuery;
    if (!Array.isArray(rentalRows)) throw new Error('Database returned an invalid rental list');
    const rentals = rentalRows as RentalRecord[];
    const countResult: unknown = await countQuery;
    let total = 0;
    if (typeof countResult === 'object' && countResult !== null && 'count' in countResult) {
      if (typeof countResult.count === 'number') total = countResult.count;
      if (typeof countResult.count === 'string') total = Number.parseInt(countResult.count, 10);
    }

    return { rentals, total };
  }
}
