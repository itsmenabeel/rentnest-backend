import request from 'supertest';
import { app } from '../src/app';
import { createCategory, createProperty, loginAdmin, prisma, registerUser } from './helpers';

describe('Reviews', () => {
  let categoryId: string;
  let landlord: Awaited<ReturnType<typeof registerUser>>;
  let tenant: Awaited<ReturnType<typeof registerUser>>;
  let propertyId: string;
  let rentalId: string;

  beforeAll(async () => {
    const admin = await loginAdmin();
    const category = await createCategory(admin.token, 'Reviews Smoke Category');
    categoryId = category.id;
    landlord = await registerUser('LANDLORD', 'reviews-landlord');
    tenant = await registerUser('TENANT', 'reviews-tenant');
    const property = await createProperty(landlord.token, categoryId);
    propertyId = property.id;

    const rentalRes = await request(app)
      .post('/api/rentals')
      .set('Authorization', `Bearer ${tenant.token}`)
      .send({ propertyId });
    rentalId = rentalRes.body.data.id;
  });

  afterAll(async () => {
    await prisma.review.deleteMany({ where: { propertyId } });
    await prisma.rentalRequest.deleteMany({ where: { propertyId } });
    await prisma.property.delete({ where: { id: propertyId } }).catch(() => {});
    await prisma.category.delete({ where: { id: categoryId } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: [landlord.user.id, tenant.user.id] } } });
    await prisma.$disconnect();
  });

  it('rejects review creation without auth', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .send({ rentalRequestId: rentalId, rating: 5 });

    expect(res.status).toBe(401);
  });

  it('rejects a review for a rental request that is not completed', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${tenant.token}`)
      .send({ rentalRequestId: rentalId, rating: 5 });

    expect(res.status).toBe(400);
  });

  it('rejects an out-of-range rating', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${tenant.token}`)
      .send({ rentalRequestId: rentalId, rating: 6 });

    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.errorDetails)).toBe(true);
  });

  it('lists public reviews for a property with none yet', async () => {
    const res = await request(app).get(`/api/reviews/property/${propertyId}`);

    expect(res.status).toBe(200);
    expect(res.body.data.reviews).toEqual([]);
    expect(res.body.data.meta.averageRating).toBeNull();
  });

  it('returns 404 for reviews of a nonexistent property', async () => {
    const res = await request(app).get(
      '/api/reviews/property/00000000-0000-0000-0000-000000000000'
    );

    expect(res.status).toBe(404);
  });
});
