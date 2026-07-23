import request from 'supertest';
import { app } from '../src/app';
import { createCategory, loginAdmin, prisma, registerUser, uniqueSuffix } from './helpers';

describe('Properties', () => {
  const propertyTitleTag = `Prop Smoke ${uniqueSuffix()}`;

  let adminToken: string;
  let categoryId: string;
  let landlord: Awaited<ReturnType<typeof registerUser>>;
  let otherLandlord: Awaited<ReturnType<typeof registerUser>>;
  let tenant: Awaited<ReturnType<typeof registerUser>>;
  let propertyId: string;

  beforeAll(async () => {
    const admin = await loginAdmin();
    adminToken = admin.token;
    const category = await createCategory(adminToken, 'Smoke Category');
    categoryId = category.id;
    landlord = await registerUser('LANDLORD', 'properties-landlord');
    otherLandlord = await registerUser('LANDLORD', 'properties-other-landlord');
    tenant = await registerUser('TENANT', 'properties-tenant');
  });

  afterAll(async () => {
    await prisma.property.deleteMany({
      where: { landlordId: { in: [landlord.user.id, otherLandlord.user.id] } },
    });
    await prisma.category.delete({ where: { id: categoryId } }).catch(() => {});
    await prisma.user.deleteMany({
      where: { id: { in: [landlord.user.id, otherLandlord.user.id, tenant.user.id] } },
    });
    await prisma.$disconnect();
  });

  it('lists public categories', async () => {
    const res = await request(app).get('/api/categories');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('creates a property as a landlord', async () => {
    const res = await request(app)
      .post('/api/landlord/properties')
      .set('Authorization', `Bearer ${landlord.token}`)
      .send({
        title: propertyTitleTag,
        description: 'A property created by the automated smoke test suite.',
        location: 'Dhaka',
        price: 20000,
        categoryId,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe(propertyTitleTag);
    propertyId = res.body.data.id;
  });

  it('rejects property creation from a tenant', async () => {
    const res = await request(app)
      .post('/api/landlord/properties')
      .set('Authorization', `Bearer ${tenant.token}`)
      .send({
        title: 'Should not be created',
        description: 'Tenants cannot create properties.',
        location: 'Dhaka',
        price: 1000,
        categoryId,
      });

    expect(res.status).toBe(403);
  });

  it('rejects property creation without auth', async () => {
    const res = await request(app).post('/api/landlord/properties').send({
      title: 'No auth property',
      description: 'Should be rejected for missing auth.',
      location: 'Dhaka',
      price: 1000,
      categoryId,
    });

    expect(res.status).toBe(401);
  });

  it('rejects an invalid property payload', async () => {
    const res = await request(app)
      .post('/api/landlord/properties')
      .set('Authorization', `Bearer ${landlord.token}`)
      .send({ title: 'ab', description: 'short', location: '', price: -5, categoryId });

    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.errorDetails)).toBe(true);
  });

  it('finds the new property in the public listing', async () => {
    const res = await request(app).get('/api/properties').query({ search: propertyTitleTag });

    expect(res.status).toBe(200);
    expect(res.body.data.properties.some((p: { id: string }) => p.id === propertyId)).toBe(true);
  });

  it('returns 404 for a nonexistent property id', async () => {
    const res = await request(app).get('/api/properties/00000000-0000-0000-0000-000000000000');

    expect(res.status).toBe(404);
  });

  it('lets the owning landlord update the property', async () => {
    const res = await request(app)
      .put(`/api/landlord/properties/${propertyId}`)
      .set('Authorization', `Bearer ${landlord.token}`)
      .send({ price: 22000 });

    expect(res.status).toBe(200);
    expect(Number(res.body.data.price)).toBe(22000);
  });

  it('rejects updates from a landlord who does not own the property', async () => {
    const res = await request(app)
      .put(`/api/landlord/properties/${propertyId}`)
      .set('Authorization', `Bearer ${otherLandlord.token}`)
      .send({ price: 1 });

    expect(res.status).toBe(403);
  });

  it('lets the owning landlord delete the property', async () => {
    const res = await request(app)
      .delete(`/api/landlord/properties/${propertyId}`)
      .set('Authorization', `Bearer ${landlord.token}`);

    expect(res.status).toBe(200);

    const check = await request(app).get(`/api/properties/${propertyId}`);
    expect(check.status).toBe(404);
  });
});
