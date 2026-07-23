import request from 'supertest';
import { app } from '../src/app';
import { createCategory, createProperty, loginAdmin, prisma, registerUser } from './helpers';

describe('Admin', () => {
  let adminToken: string;
  let adminId: string;
  let tenant: Awaited<ReturnType<typeof registerUser>>;
  let landlord: Awaited<ReturnType<typeof registerUser>>;
  let categoryId: string;
  let propertyId: string | undefined;

  beforeAll(async () => {
    const admin = await loginAdmin();
    adminToken = admin.token;
    adminId = admin.user.id;
    tenant = await registerUser('TENANT', 'admin-tenant');
    landlord = await registerUser('LANDLORD', 'admin-landlord');
  });

  afterAll(async () => {
    if (propertyId) {
      await prisma.rentalRequest.deleteMany({ where: { propertyId } });
      await prisma.property.delete({ where: { id: propertyId } }).catch(() => {});
    }
    if (categoryId) {
      await prisma.category.delete({ where: { id: categoryId } }).catch(() => {});
    }
    await prisma.user.deleteMany({ where: { id: { in: [tenant.user.id, landlord.user.id] } } });
    await prisma.$disconnect();
  });

  it('rejects admin routes without auth', async () => {
    const res = await request(app).get('/api/admin/users');

    expect(res.status).toBe(401);
  });

  it('rejects admin routes for a non-admin role', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${tenant.token}`);

    expect(res.status).toBe(403);
  });

  it('lists users including the newly registered tenant', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.users.some((u: { id: string }) => u.id === tenant.user.id)).toBe(true);
  });

  it('bans a tenant, which then blocks their login', async () => {
    const banRes = await request(app)
      .patch(`/api/admin/users/${tenant.user.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'BANNED' });

    expect(banRes.status).toBe(200);
    expect(banRes.body.data.status).toBe('BANNED');

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: tenant.email, password: tenant.password });

    expect(loginRes.status).toBe(403);
  });

  it('unbans the tenant, restoring their login', async () => {
    const unbanRes = await request(app)
      .patch(`/api/admin/users/${tenant.user.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ACTIVE' });

    expect(unbanRes.status).toBe(200);
    expect(unbanRes.body.data.status).toBe('ACTIVE');

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: tenant.email, password: tenant.password });

    expect(loginRes.status).toBe(200);
  });

  it('refuses to ban an admin account', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${adminId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'BANNED' });

    expect(res.status).toBe(403);
  });

  it('creates and updates a category', async () => {
    const category = await createCategory(adminToken, 'Admin Smoke Category');
    categoryId = category.id;

    const res = await request(app)
      .put(`/api/admin/categories/${categoryId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `${category.name} Renamed` });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe(`${category.name} Renamed`);
  });

  it('rejects deleting a category that is still referenced by a property', async () => {
    const property = await createProperty(landlord.token, categoryId);
    propertyId = property.id;

    const res = await request(app)
      .delete(`/api/admin/categories/${categoryId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });

  it('lists properties and rentals for oversight', async () => {
    const propertiesRes = await request(app)
      .get('/api/admin/properties')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(propertiesRes.status).toBe(200);
    expect(
      propertiesRes.body.data.properties.some((p: { id: string }) => p.id === propertyId)
    ).toBe(true);

    const rentalsRes = await request(app)
      .get('/api/admin/rentals')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(rentalsRes.status).toBe(200);
    expect(Array.isArray(rentalsRes.body.data.rentals)).toBe(true);
  });

  it('deletes the category once nothing references it', async () => {
    await prisma.property.delete({ where: { id: propertyId! } });
    propertyId = undefined;

    const res = await request(app)
      .delete(`/api/admin/categories/${categoryId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    categoryId = '';
  });
});
