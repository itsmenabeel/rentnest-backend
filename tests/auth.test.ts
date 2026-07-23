import request from 'supertest';
import { app } from '../src/app';
import { prisma, uniqueSuffix } from './helpers';

describe('Auth', () => {
  const email = `auth-smoke-${uniqueSuffix()}@rentnest.test`;
  const password = 'Test@1234';
  let userId: string | undefined;

  afterAll(async () => {
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  it('registers a new tenant', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Auth Smoke Tenant',
      email,
      password,
      role: 'TENANT',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(email);
    expect(res.body.data.user).not.toHaveProperty('password');
    expect(res.body.data.token).toEqual(expect.any(String));
    userId = res.body.data.user.id;
  });

  it('rejects registration with a duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Auth Smoke Tenant',
      email,
      password,
      role: 'TENANT',
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('rejects registration with a disallowed role', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Sneaky Admin',
      email: `sneaky-${uniqueSuffix()}@rentnest.test`,
      password,
      role: 'ADMIN',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.errorDetails)).toBe(true);
  });

  it('rejects login with the wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email, password: 'WrongPass1' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toEqual(expect.any(String));
  });

  it('rejects /me without a token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns the current user for a valid token', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({ email, password });
    const token = loginRes.body.data.token;

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(email);
  });
});
