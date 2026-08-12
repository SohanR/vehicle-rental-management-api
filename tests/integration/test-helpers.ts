import request from 'supertest';
import { app } from '../../src/app';

interface LoginResponseBody {
  success: boolean;
  data: {
    token: string;
  };
}

export async function getAuthToken(): Promise<string> {
  const response = await request(app).post('/api/v1/auth/login').send({
    email: 'admin@rental.local',
    password: 'Admin123!',
  });

  if (response.status !== 200) {
    throw new Error(`Test login failed with status ${response.status}`);
  }
  const body = response.body as LoginResponseBody;
  if (!body.data?.token) throw new Error('Test login response did not contain a JWT');
  return body.data.token;
}
