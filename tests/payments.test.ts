import request from 'supertest';
import { app } from '../src/app';
import { createCategory, createProperty, loginAdmin, prisma, registerUser } from './helpers';

describe('Payments', () => {
  let categoryId: string;
  let landlord: Awaited<ReturnType<typeof registerUser>>;
  let tenant: Awaited<ReturnType<typeof registerUser>>;
  let otherTenant: Awaited<ReturnType<typeof registerUser>>;
  let propertyId: string;
  let rentalId: string;

  beforeAll(async () => {
    const admin = await loginAdmin();
    const category = await createCategory(admin.token, 'Payments Smoke Category');
    categoryId = category.id;
    landlord = await registerUser('LANDLORD', 'payments-landlord');
    tenant = await registerUser('TENANT', 'payments-tenant');
    otherTenant = await registerUser('TENANT', 'payments-other-tenant');
    const property = await createProperty(landlord.token, categoryId);
    propertyId = property.id;

    const rentalRes = await request(app)
      .post('/api/rentals')
      .set('Authorization', `Bearer ${tenant.token}`)
      .send({ propertyId });
    rentalId = rentalRes.body.data.id;
  });

  afterAll(async () => {
    await prisma.payment.deleteMany({ where: { rentalRequestId: rentalId } });
    await prisma.rentalRequest.deleteMany({ where: { propertyId } });
    await prisma.property.delete({ where: { id: propertyId } }).catch(() => {});
    await prisma.category.delete({ where: { id: categoryId } }).catch(() => {});
    await prisma.user.deleteMany({
      where: { id: { in: [landlord.user.id, tenant.user.id, otherTenant.user.id] } },
    });
    await prisma.$disconnect();
  });

  it('rejects payment creation without auth', async () => {
    const res = await request(app)
      .post('/api/payments/create')
      .send({ rentalRequestId: rentalId });

    expect(res.status).toBe(401);
  });

  it('rejects payment creation from a landlord', async () => {
    const res = await request(app)
      .post('/api/payments/create')
      .set('Authorization', `Bearer ${landlord.token}`)
      .send({ rentalRequestId: rentalId });

    expect(res.status).toBe(403);
  });

  it('rejects paying for a rental request that belongs to someone else', async () => {
    const res = await request(app)
      .post('/api/payments/create')
      .set('Authorization', `Bearer ${otherTenant.token}`)
      .send({ rentalRequestId: rentalId });

    expect(res.status).toBe(403);
  });

  it('rejects paying for a nonexistent rental request', async () => {
    const res = await request(app)
      .post('/api/payments/create')
      .set('Authorization', `Bearer ${tenant.token}`)
      .send({ rentalRequestId: '00000000-0000-0000-0000-000000000000' });

    expect(res.status).toBe(404);
  });

  it('rejects payment creation for a rental request that is not yet approved', async () => {
    const res = await request(app)
      .post('/api/payments/create')
      .set('Authorization', `Bearer ${tenant.token}`)
      .send({ rentalRequestId: rentalId });

    expect(res.status).toBe(400);
  });

  it('rejects payment history requests without auth', async () => {
    const res = await request(app).get('/api/payments');

    expect(res.status).toBe(401);
  });

  it('returns an empty payment history for a tenant with no payments', async () => {
    const res = await request(app)
      .get('/api/payments')
      .set('Authorization', `Bearer ${tenant.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('returns 404 for a nonexistent payment id', async () => {
    const res = await request(app)
      .get('/api/payments/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${tenant.token}`);

    expect(res.status).toBe(404);
  });
});
