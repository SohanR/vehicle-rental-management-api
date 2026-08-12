import request from 'supertest';
import { app } from '../../src/app';
import { db } from '../../src/config/database';
import { getAuthToken } from './test-helpers';
import { deleteVehiclePhoto } from '../../src/utils/upload-file';

interface VehicleResponseData {
  id: number;
  name: string;
  photo_path: string;
}

function readVehicle(value: unknown): VehicleResponseData {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('data' in value) ||
    typeof value.data !== 'object' ||
    value.data === null ||
    !('id' in value.data) ||
    !('name' in value.data) ||
    !('photo_path' in value.data)
  ) {
    throw new Error('Vehicle response is invalid');
  }
  return value.data as VehicleResponseData;
}

function readVehicleList(value: unknown): unknown[] {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('data' in value) ||
    !Array.isArray(value.data)
  ) {
    throw new Error('Vehicle list response is invalid');
  }
  return value.data;
}

describe('Authentication and vehicle management', () => {
  let token: string;
  let vehicleId: number | undefined;
  let photoPath: string | undefined;

  beforeAll(async () => {
    token = await getAuthToken();
  });

  afterAll(async () => {
    if (vehicleId) await db('vehicles').where({ id: vehicleId }).delete();
    if (photoPath) await deleteVehiclePhoto(photoPath);
  });

  it('protects vehicle routes and rejects invalid credentials', async () => {
    expect((await request(app).get('/api/v1/vehicles')).status).toBe(401);
    expect(
      (
        await request(app)
          .post('/api/v1/auth/login')
          .send({ email: 'admin@rental.local', password: 'wrong-password' })
      ).status,
    ).toBe(401);
  });

  it('creates a multipart vehicle, serves its photo, and supports search', async () => {
    const created = await request(app)
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Integration Photo Car')
      .field('plate_number', 'TEST-PHOTO-001')
      .field('category', 'Sedan')
      .field('daily_rate', '125.50')
      .attach('photo', Buffer.from('test-image'), {
        filename: 'vehicle.png',
        contentType: 'image/png',
      });

    expect(created.status).toBe(201);
    const createdVehicle = readVehicle(created.body as unknown);
    vehicleId = createdVehicle.id;
    photoPath = createdVehicle.photo_path;

    const photo = await request(app).get(`/${photoPath.replaceAll('\\', '/')}`);
    expect(photo.status).toBe(200);

    const list = await request(app)
      .get('/api/v1/vehicles')
      .query({ category: 'Sedan', search: 'photo' })
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(readVehicleList(list.body as unknown)).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: vehicleId })]),
    );
  });

  it('updates and soft-deletes a vehicle', async () => {
    const updated = await request(app)
      .put(`/api/v1/vehicles/${String(vehicleId)}`)
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Updated Integration Car');
    expect(updated.status).toBe(200);
    expect(readVehicle(updated.body as unknown).name).toBe('Updated Integration Car');

    const deleted = await request(app)
      .delete(`/api/v1/vehicles/${String(vehicleId)}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleted.status).toBe(204);

    const missing = await request(app)
      .get(`/api/v1/vehicles/${String(vehicleId)}`)
      .set('Authorization', `Bearer ${token}`);
    expect(missing.status).toBe(404);
  });
});
