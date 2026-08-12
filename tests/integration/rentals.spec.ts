import request from 'supertest';
import { app } from '../../src/app';
import { db } from '../../src/config/database';
import type { VehicleRecord } from '../../src/types/vehicle';
import { getAuthToken } from './test-helpers';

describe('Rental booking overlap prevention', () => {
  let token: string;
  let vehicleId: number;

  beforeAll(async () => {
    token = await getAuthToken();
    const [vehicle] = await db<VehicleRecord>('vehicles')
      .insert({
        name: 'Concurrency Test Vehicle',
        plate_number: 'TEST-CONCURRENCY-001',
        category: 'Sedan',
        daily_rate: 100,
      })
      .returning('*');
    if (!vehicle) throw new Error('Failed to create the concurrency test vehicle');
    vehicleId = vehicle.id;
  });

  afterAll(async () => {
    if (vehicleId) {
      await db('rentals').where({ vehicle_id: vehicleId }).delete();
      await db('vehicles').where({ id: vehicleId }).delete();
    }
  });

  const rentalBody = (startDate: string, endDate: string) => ({
    vehicle_id: vehicleId,
    customer_name: 'Integration Test Customer',
    customer_phone: '+8801700000000',
    start_date: startDate,
    end_date: endDate,
  });

  it('creates a booking for an available date range', async () => {
    const response = await request(app)
      .post('/api/v1/rentals')
      .set('Authorization', `Bearer ${token}`)
      .send(rentalBody('2026-08-10', '2026-08-15'));

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        vehicle_id: vehicleId,
        start_date: '2026-08-10',
        end_date: '2026-08-15',
        total_amount: '600.00',
        status: 'booked',
      },
    });
  });

  it('rejects an overlapping booking', async () => {
    const response = await request(app)
      .post('/api/v1/rentals')
      .set('Authorization', `Bearer ${token}`)
      .send(rentalBody('2026-08-14', '2026-08-18'));

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: 'CONFLICT',
        message: 'Vehicle is already booked for the selected date range',
      },
    });
  });

  it('allows only one of two concurrent requests for the same dates', async () => {
    const sendBooking = () =>
      request(app)
        .post('/api/v1/rentals')
        .set('Authorization', `Bearer ${token}`)
        .send(rentalBody('2026-09-10', '2026-09-12'));

    const responses = await Promise.all([sendBooking(), sendBooking()]);
    const statusCodes = responses.map((response) => response.status).sort((a, b) => a - b);

    expect(statusCodes).toEqual([201, 409]);
    const persistedCount = await db('rentals')
      .where({ vehicle_id: vehicleId, start_date: '2026-09-10', end_date: '2026-09-12' })
      .count<{ count: string }[]>({ count: 'id' })
      .first();
    expect(Number(persistedCount?.count)).toBe(1);
  });

  it('rechecks overlap when dates are updated', async () => {
    const created = await request(app)
      .post('/api/v1/rentals')
      .set('Authorization', `Bearer ${token}`)
      .send(rentalBody('2026-10-10', '2026-10-12'));

    const createdBody: unknown = created.body;
    if (
      typeof createdBody !== 'object' ||
      createdBody === null ||
      !('data' in createdBody) ||
      typeof createdBody.data !== 'object' ||
      createdBody.data === null ||
      !('id' in createdBody.data)
    ) {
      throw new Error('Created rental response is invalid');
    }
    const response = await request(app)
      .put(`/api/v1/rentals/${String(createdBody.data.id)}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ start_date: '2026-08-15', end_date: '2026-08-16' });

    expect(response.status).toBe(409);
  });

  it('allows dates held only by a cancelled rental', async () => {
    const existing: unknown = await db('rentals')
      .where({ vehicle_id: vehicleId, start_date: '2026-08-10' })
      .first('id');
    if (typeof existing !== 'object' || existing === null || !('id' in existing)) {
      throw new Error('Existing rental was not found');
    }
    const cancellation = await request(app)
      .delete(`/api/v1/rentals/${String(existing.id)}`)
      .set('Authorization', `Bearer ${token}`);
    expect(cancellation.status).toBe(204);

    const response = await request(app)
      .post('/api/v1/rentals')
      .set('Authorization', `Bearer ${token}`)
      .send(rentalBody('2026-08-10', '2026-08-15'));
    expect(response.status).toBe(201);
  });
});
