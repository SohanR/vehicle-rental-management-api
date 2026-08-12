import type { Knex } from 'knex';
import type {
  CreateVehicleData,
  UpdateVehicleData,
  VehicleListOptions,
  VehicleListResult,
  VehicleRecord,
} from '../types/vehicle';

export class VehicleRepository {
  constructor(private readonly database: Knex) {}

  async findAll(options: VehicleListOptions): Promise<VehicleListResult> {
    const offset = (options.page - 1) * options.limit;
    const dataQuery = this.database<VehicleRecord, VehicleRecord[]>('vehicles')
      .select('*')
      .whereNull('deleted_at')
      .modify((query) => {
        if (options.category) query.whereRaw('LOWER(category) = LOWER(?)', [options.category]);
        if (options.search) query.whereILike('name', `%${options.search}%`);
      })
      .orderBy('created_at', 'desc')
      .limit(options.limit)
      .offset(offset);
    const countQuery = this.database<VehicleRecord>('vehicles')
      .whereNull('deleted_at')
      .modify((query) => {
        if (options.category) query.whereRaw('LOWER(category) = LOWER(?)', [options.category]);
        if (options.search) query.whereILike('name', `%${options.search}%`);
      })
      .count({ count: 'id' })
      .first();
    const vehicleRows: unknown = await dataQuery;
    if (!Array.isArray(vehicleRows)) throw new Error('Database returned an invalid vehicle list');
    const vehicles = vehicleRows as VehicleRecord[];
    const countResult: unknown = await countQuery;
    let total = 0;
    if (typeof countResult === 'object' && countResult !== null && 'count' in countResult) {
      if (typeof countResult.count === 'number') total = countResult.count;
      if (typeof countResult.count === 'string') total = Number.parseInt(countResult.count, 10);
    }

    return { vehicles, total };
  }

  async findById(id: number): Promise<VehicleRecord | undefined> {
    return this.database<VehicleRecord>('vehicles').where({ id }).whereNull('deleted_at').first();
  }

  async findByIdForUpdate(trx: Knex.Transaction, id: number): Promise<VehicleRecord | undefined> {
    return trx<VehicleRecord>('vehicles').where({ id }).whereNull('deleted_at').forUpdate().first();
  }

  async create(data: CreateVehicleData): Promise<VehicleRecord> {
    const [vehicle] = await this.database<VehicleRecord>('vehicles').insert(data).returning('*');
    if (!vehicle) throw new Error('Database did not return the created vehicle');
    return vehicle;
  }

  async update(id: number, data: UpdateVehicleData): Promise<VehicleRecord | undefined> {
    const [vehicle] = await this.database<VehicleRecord>('vehicles')
      .where({ id })
      .whereNull('deleted_at')
      .update({ ...data, updated_at: this.database.fn.now() })
      .returning('*');
    return vehicle;
  }

  async softDelete(id: number): Promise<boolean> {
    const affectedRows = await this.database<VehicleRecord>('vehicles')
      .where({ id })
      .whereNull('deleted_at')
      .update({ deleted_at: this.database.fn.now(), updated_at: this.database.fn.now() });
    return affectedRows > 0;
  }
}
