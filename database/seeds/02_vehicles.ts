import type { Knex } from 'knex';

const vehicles = [
  {
    name: 'Toyota Corolla 2024',
    plate_number: 'DHAKA-METRO-GA-11-1001',
    category: 'Sedan',
    daily_rate: 4500.0,
    photo_path: null,
  },
  {
    name: 'Honda CR-V 2024',
    plate_number: 'DHAKA-METRO-GHA-12-2002',
    category: 'SUV',
    daily_rate: 7500.0,
    photo_path: null,
  },
  {
    name: 'Toyota Hiace 2023',
    plate_number: 'DHAKA-METRO-CHA-13-3003',
    category: 'Van',
    daily_rate: 9000.0,
    photo_path: null,
  },
  {
    name: 'Suzuki Swift 2023',
    plate_number: 'DHAKA-METRO-GA-14-4004',
    category: 'Hatchback',
    daily_rate: 3800.0,
    photo_path: null,
  },
  {
    name: 'Nissan Navara 2022',
    plate_number: 'DHAKA-METRO-THA-15-5005',
    category: 'Pickup',
    daily_rate: 8500.0,
    photo_path: null,
  },
  {
    name: 'Toyota Noah 2024',
    plate_number: 'DHAKA-METRO-CHA-16-6006',
    category: 'Minivan',
    daily_rate: 8000.0,
    photo_path: null,
  },
];

export async function seed(knex: Knex): Promise<void> {
  await knex('vehicles')
    .insert(vehicles)
    .onConflict('plate_number')
    .merge(['name', 'category', 'daily_rate', 'photo_path']);
}
