import type { Knex } from 'knex';

interface VehicleRow {
  id: number;
  plate_number: string;
}

interface RentalRow {
  id: number;
  vehicle_id: number;
  customer_name: string;
  customer_phone: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  status: 'booked' | 'ongoing' | 'completed' | 'cancelled';
  created_at?: Date;
  updated_at?: Date;
}

export async function seed(knex: Knex): Promise<void> {
  const vehicleRows = await knex<VehicleRow>('vehicles')
    .select('id', 'plate_number')
    .whereIn('plate_number', ['DHAKA-METRO-GA-11-1001', 'DHAKA-METRO-GHA-12-2002']);
  const vehicleIds = new Map(vehicleRows.map((vehicle) => [vehicle.plate_number, vehicle.id]));
  const corollaId = vehicleIds.get('DHAKA-METRO-GA-11-1001');
  const crvId = vehicleIds.get('DHAKA-METRO-GHA-12-2002');

  if (corollaId === undefined || crvId === undefined) {
    throw new Error('Required vehicle seed records were not found');
  }

  const rentals: Omit<RentalRow, 'id'>[] = [
    {
      vehicle_id: corollaId,
      customer_name: 'Aminul Islam',
      customer_phone: '+8801711000001',
      start_date: '2026-07-29',
      end_date: '2026-08-03',
      total_amount: 27000.0,
      status: 'completed',
    },
    {
      vehicle_id: crvId,
      customer_name: 'Nusrat Jahan',
      customer_phone: '+8801811000002',
      start_date: '2026-08-15',
      end_date: '2026-08-18',
      total_amount: 30000.0,
      status: 'booked',
    },
  ];

  for (const rental of rentals) {
    const existing = await knex<RentalRow>('rentals')
      .where({
        vehicle_id: rental.vehicle_id,
        customer_phone: rental.customer_phone,
        start_date: rental.start_date,
        end_date: rental.end_date,
      })
      .first('id');

    if (existing) {
      await knex<RentalRow>('rentals').where({ id: existing.id }).update({
        customer_name: rental.customer_name,
        total_amount: rental.total_amount,
        status: rental.status,
        updated_at: knex.fn.now(),
      });
    } else {
      await knex<RentalRow>('rentals').insert(rental);
    }
  }
}
