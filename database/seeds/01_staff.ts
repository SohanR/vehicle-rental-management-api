import bcrypt from 'bcrypt';
import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  const passwordHash = await bcrypt.hash('Admin123!', 12);

  await knex('staff')
    .insert({
      email: 'admin@rental.local',
      password_hash: passwordHash,
      name: 'System Administrator',
    })
    .onConflict('email')
    .merge({
      password_hash: passwordHash,
      name: 'System Administrator',
      updated_at: knex.fn.now(),
    });
}
