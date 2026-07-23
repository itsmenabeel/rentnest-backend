import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

export { prisma };

export function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function registerUser(role: 'TENANT' | 'LANDLORD', prefix: string) {
  const email = `${prefix}-${uniqueSuffix()}@rentnest.test`;
  const password = 'Test@1234';
  const res = await request(app).post('/api/auth/register').send({
    name: `${prefix} Test User`,
    email,
    password,
    role,
  });
  if (res.status !== 201) {
    throw new Error(`Failed to register test ${role}: ${JSON.stringify(res.body)}`);
  }
  return { email, password, user: res.body.data.user, token: res.body.data.token };
}

// Relies on the seeded demo admin account (see prisma/seed.ts / README demo credentials).
export async function loginAdmin() {
  const res = await request(app).post('/api/auth/login').send({
    email: 'admin@rentnest.com',
    password: 'Admin@123',
  });
  if (res.status !== 200) {
    throw new Error(`Admin login failed in tests — is the seed script run? ${JSON.stringify(res.body)}`);
  }
  return { token: res.body.data.token as string, user: res.body.data.user };
}

export async function createCategory(adminToken: string, namePrefix: string) {
  const res = await request(app)
    .post('/api/admin/categories')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: `${namePrefix} ${uniqueSuffix()}` });
  if (res.status !== 201) {
    throw new Error(`Failed to create test category: ${JSON.stringify(res.body)}`);
  }
  return res.body.data as { id: string; name: string };
}

export async function createProperty(
  landlordToken: string,
  categoryId: string,
  overrides: Partial<{ title: string; price: number }> = {}
) {
  const res = await request(app)
    .post('/api/landlord/properties')
    .set('Authorization', `Bearer ${landlordToken}`)
    .send({
      title: overrides.title ?? `Test Property ${uniqueSuffix()}`,
      description: 'A property created by the automated smoke test suite.',
      location: 'Dhaka',
      price: overrides.price ?? 15000,
      categoryId,
    });
  if (res.status !== 201) {
    throw new Error(`Failed to create test property: ${JSON.stringify(res.body)}`);
  }
  return res.body.data as { id: string };
}
