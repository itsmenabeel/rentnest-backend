import request from 'supertest';
import { app } from '../src/app';
import { createCategory, createProperty, loginAdmin, prisma, registerUser } from './helpers';

describe('Rental Requests', () => {
  let categoryId: string;
  let landlord: Awaited<ReturnType<typeof registerUser>>;
  let tenant: Awaited<ReturnType<typeof registerUser>>;
  let otherTenant: Awaited<ReturnType<typeof registerUser>>;
  let propertyId: string;
  let rentalId: string;

  beforeAll(async () => {
    const admin = await loginAdmin();
    const category = await createCategory(admin.token, 'Rentals Smoke Category');
    categoryId = category.id;
    landlord = await registerUser('LANDLORD', 'rentals-landlord');
    tenant = await registerUser('TENANT', 'rentals-tenant');
    otherTenant = await registerUser('TENANT', 'rentals-other-tenant');
    const property = await createProperty(landlord.token, categoryId);
    propertyId = property.id;
  });

  afterAll(async () => {
    await prisma.rentalRequest.deleteMany({ where: { propertyId } });
    await prisma.property.delete({ where: { id: propertyId } }).catch(() => {});
    await prisma.category.delete({ where: { id: categoryId } }).catch(() => {});
    await prisma.user.deleteMany({
      where: { id: { in: [landlord.user.id, tenant.user.id, otherTenant.user.id] } },
    });
    await prisma.$disconnect();
  });

  it('rejects a rental request without auth', async () => {
    const res = await request(app).post('/api/rentals').send({ propertyId });

    expect(res.status).toBe(401);
  });

  it('lets a tenant submit a rental request', async () => {
    const res = await request(app)
      .post('/api/rentals')
      .set('Authorization', `Bearer ${tenant.token}`)
      .send({ propertyId, message: 'Interested in moving in soon.' });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('PENDING');
    rentalId = res.body.data.id;
  });

  it('rejects a second open request for the same property from the same tenant', async () => {
    const res = await request(app)
      .post('/api/rentals')
      .set('Authorization', `Bearer ${tenant.token}`)
      .send({ propertyId });

    expect(res.status).toBe(409);
  });

  it('lets the tenant see their own rental requests', async () => {
    const res = await request(app)
      .get('/api/rentals')
      .set('Authorization', `Bearer ${tenant.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.rentals.some((r: { id: string }) => r.id === rentalId)).toBe(true);
  });

  it('lets the landlord see requests for their properties', async () => {
    const res = await request(app)
      .get('/api/landlord/requests')
      .set('Authorization', `Bearer ${landlord.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.rentals.some((r: { id: string }) => r.id === rentalId)).toBe(true);
  });

  it('rejects access to a rental request by an unrelated tenant', async () => {
    const res = await request(app)
      .get(`/api/rentals/${rentalId}`)
      .set('Authorization', `Bearer ${otherTenant.token}`);

    expect(res.status).toBe(403);
  });

  it('rejects an invalid status value on approval', async () => {
    const res = await request(app)
      .patch(`/api/landlord/requests/${rentalId}`)
      .set('Authorization', `Bearer ${landlord.token}`)
      .send({ status: 'ACTIVE' });

    expect(res.status).toBe(400);
  });

  it('lets the landlord approve the rental request', async () => {
    const res = await request(app)
      .patch(`/api/landlord/requests/${rentalId}`)
      .set('Authorization', `Bearer ${landlord.token}`)
      .send({ status: 'APPROVED' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('APPROVED');
  });

  it('rejects re-approving a request that is no longer pending', async () => {
    const res = await request(app)
      .patch(`/api/landlord/requests/${rentalId}`)
      .set('Authorization', `Bearer ${landlord.token}`)
      .send({ status: 'REJECTED' });

    expect(res.status).toBe(400);
  });
});
