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
  const requiredPlates = [
    'DHAKA-METRO-GA-11-1001',
    'DHAKA-METRO-GHA-12-2002',
    'DHAKA-METRO-CHA-13-3003',
    'DHAKA-METRO-GA-14-4004',
    'DHAKA-METRO-THA-15-5005',
    'DHAKA-METRO-CHA-16-6006',
  ];
  const vehicleRows = await knex<VehicleRow>('vehicles')
    .select('id', 'plate_number')
    .whereIn('plate_number', requiredPlates);
  const vehicleIds = new Map(vehicleRows.map((vehicle) => [vehicle.plate_number, vehicle.id]));

  if (requiredPlates.some((plateNumber) => !vehicleIds.has(plateNumber))) {
    throw new Error('One or more required vehicle seed records were not found');
  }

  const vehicleId = (plateNumber: string): number => {
    const id = vehicleIds.get(plateNumber);
    if (id === undefined) throw new Error(`Seed vehicle not found: ${plateNumber}`);
    return id;
  };

  const rentals: Omit<RentalRow, 'id'>[] = [
    {
      vehicle_id: vehicleId('DHAKA-METRO-GA-11-1001'),
      customer_name: 'Aminul Islam',
      customer_phone: '+8801711000001',
      start_date: '2026-07-29',
      end_date: '2026-08-03',
      total_amount: 27000.0,
      status: 'completed',
    },
    {
      vehicle_id: vehicleId('DHAKA-METRO-GHA-12-2002'),
      customer_name: 'Nusrat Jahan',
      customer_phone: '+8801811000002',
      start_date: '2026-08-15',
      end_date: '2026-08-18',
      total_amount: 30000.0,
      status: 'booked',
    },
    {
      vehicle_id: vehicleId('DHAKA-METRO-CHA-13-3003'),
      customer_name: 'Farhan Ahmed',
      customer_phone: '+8801911000003',
      start_date: '2026-08-05',
      end_date: '2026-08-09',
      total_amount: 45000.0,
      status: 'completed',
    },
    {
      vehicle_id: vehicleId('DHAKA-METRO-GA-14-4004'),
      customer_name: 'Tasnim Akter',
      customer_phone: '+8801611000004',
      start_date: '2026-08-10',
      end_date: '2026-08-12',
      total_amount: 11400.0,
      status: 'ongoing',
    },
    {
      vehicle_id: vehicleId('DHAKA-METRO-THA-15-5005'),
      customer_name: 'Mahmud Hasan',
      customer_phone: '+8801511000005',
      start_date: '2026-08-20',
      end_date: '2026-08-22',
      total_amount: 25500.0,
      status: 'cancelled',
    },
    {
      vehicle_id: vehicleId('DHAKA-METRO-CHA-16-6006'),
      customer_name: 'Sadia Rahman',
      customer_phone: '+8801311000006',
      start_date: '2026-08-30',
      end_date: '2026-09-02',
      total_amount: 32000.0,
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
