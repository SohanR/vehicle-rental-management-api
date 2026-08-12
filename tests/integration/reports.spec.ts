import request from 'supertest';
import { app } from '../../src/app';
import { db } from '../../src/config/database';
import type { VehicleRecord } from '../../src/types/vehicle';
import { getAuthToken } from './test-helpers';

interface ReportVehicle {
  id: number;
  name: string;
  total_bookings: number;
  days_rented: number;
  revenue: number;
}

interface ReportResponseBody {
  data: {
    month: string;
    month_start: string;
    month_end: string;
    vehicles: ReportVehicle[];
    metadata: {
      top_revenue_vehicle: { id: number; revenue: number } | null;
    };
  };
}

function isReportResponseBody(value: unknown): value is ReportResponseBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    typeof value.data === 'object' &&
    value.data !== null &&
    'vehicles' in value.data &&
    Array.isArray(value.data.vehicles) &&
    'metadata' in value.data
  );
}

describe('Monthly rental financial report', () => {
  let token: string;
  let vehicleId: number;

  beforeAll(async () => {
    token = await getAuthToken();
    const [vehicle] = await db<VehicleRecord>('vehicles')
      .insert({
        name: 'Cross-Month Report Vehicle',
        plate_number: 'TEST-REPORT-001',
        category: 'Sedan',
        daily_rate: 100,
      })
      .returning('*');
    if (!vehicle) throw new Error('Failed to create the report test vehicle');
    vehicleId = vehicle.id;

    await db('rentals').insert({
      vehicle_id: vehicleId,
      customer_name: 'Cross-Month Customer',
      customer_phone: '+8801800000000',
      start_date: '2026-07-29',
      end_date: '2026-08-03',
      total_amount: 600,
      status: 'completed',
    });

    // Historical revenue must use the booked amount, and soft deletion must not
    // remove a vehicle that had activity during the requested month.
    await db('vehicles')
      .where({ id: vehicleId })
      .update({ daily_rate: 999, deleted_at: db.fn.now() });
  });

  afterAll(async () => {
    if (vehicleId) {
      await db('rentals').where({ vehicle_id: vehicleId }).delete();
      await db('vehicles').where({ id: vehicleId }).delete();
    }
  });

  it('trims a cross-month booking to August boundaries', async () => {
    const response = await request(app)
      .get('/api/v1/reports/rentals')
      .query({ month: '2026-08', vehicle_id: vehicleId })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    const responseBody: unknown = response.body;
    if (!isReportResponseBody(responseBody)) throw new Error('Report response shape is invalid');
    const vehicles = responseBody.data.vehicles;
    const vehicleMetrics = vehicles.find((vehicle) => vehicle.id === vehicleId);

    expect(vehicleMetrics).toBeDefined();
    expect(vehicleMetrics).toMatchObject({
      id: vehicleId,
      total_bookings: 1,
      days_rented: 3,
      revenue: 300,
    });
    expect(responseBody.data).toMatchObject({
      month: '2026-08',
      month_start: '2026-08-01',
      month_end: '2026-08-31',
      metadata: {
        top_revenue_vehicle: { id: vehicleId, revenue: 300 },
      },
    });
  });
});
