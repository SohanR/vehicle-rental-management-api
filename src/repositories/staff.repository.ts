import type { Knex } from 'knex';
import type { StaffRecord } from '../types/staff';

export class StaffRepository {
  constructor(private readonly database: Knex) {}

  async findByEmail(email: string): Promise<StaffRecord | undefined> {
    return this.database<StaffRecord>('staff').whereRaw('LOWER(email) = LOWER(?)', [email]).first();
  }
}
