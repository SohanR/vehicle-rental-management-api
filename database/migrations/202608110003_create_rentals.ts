import type { Knex } from 'knex';

const RENTAL_STATUSES = ['booked', 'ongoing', 'completed', 'cancelled'] as const;

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('rentals', (table) => {
    table.increments('id').primary();
    table
      .integer('vehicle_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('vehicles')
      .onUpdate('CASCADE')
      .onDelete('RESTRICT');
    table.string('customer_name', 150).notNullable();
    table.string('customer_phone', 30).notNullable();
    table.date('start_date').notNullable();
    table.date('end_date').notNullable();
    table.decimal('total_amount', 10, 2).notNullable();
    table
      .enu('status', RENTAL_STATUSES, { useNative: true, enumName: 'rental_status' })
      .notNullable()
      .defaultTo('booked');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(
      ['vehicle_id', 'status', 'start_date', 'end_date'],
      'rentals_vehicle_status_dates_idx',
    );
  });

  await knex.raw(
    'ALTER TABLE rentals ADD CONSTRAINT rentals_date_range_check CHECK (end_date >= start_date)',
  );
  await knex.raw(
    'ALTER TABLE rentals ADD CONSTRAINT rentals_total_amount_check CHECK (total_amount >= 0)',
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('rentals');
  await knex.raw('DROP TYPE IF EXISTS rental_status');
}
