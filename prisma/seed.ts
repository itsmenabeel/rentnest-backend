import { PrismaClient, Role, RentalRequestStatus, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Demo@123';

async function hash(password: string) {
  return bcrypt.hash(password, 10);
}

async function upsertUser(params: {
  name: string;
  email: string;
  role: Role;
  phone?: string;
}) {
  return prisma.user.upsert({
    where: { email: params.email },
    update: {},
    create: {
      name: params.name,
      email: params.email,
      password: await hash(DEMO_PASSWORD),
      role: params.role,
      phone: params.phone,
    },
  });
}

async function upsertCategory(name: string) {
  return prisma.category.upsert({
    where: { name },
    update: {},
    create: { name },
  });
}

async function upsertPropertyIfMissing(params: {
  title: string;
  description: string;
  location: string;
  price: number;
  amenities: string[];
  isAvailable: boolean;
  landlordId: string;
  categoryId: string;
}) {
  const existing = await prisma.property.findFirst({
    where: { title: params.title, landlordId: params.landlordId },
  });
  if (existing) return existing;

  return prisma.property.create({
    data: {
      title: params.title,
      description: params.description,
      location: params.location,
      price: params.price,
      amenities: params.amenities,
      images: [],
      isAvailable: params.isAvailable,
      landlordId: params.landlordId,
      categoryId: params.categoryId,
    },
  });
}

/**
 * Creates a rental request scenario (with an optional payment and review) if
 * one matching this exact tenant/property/message doesn't already exist.
 * The message doubles as a stable idempotency key across repeated seed runs.
 */
async function seedRentalScenario(params: {
  tenantId: string;
  propertyId: string;
  status: RentalRequestStatus;
  message: string;
  moveInDate?: Date;
  payment?: { transactionId: string; amount: number; paidAt: Date };
  review?: { rating: number; comment: string };
}) {
  const existing = await prisma.rentalRequest.findFirst({
    where: { tenantId: params.tenantId, propertyId: params.propertyId, message: params.message },
  });
  if (existing) return existing;

  const rental = await prisma.rentalRequest.create({
    data: {
      tenantId: params.tenantId,
      propertyId: params.propertyId,
      status: params.status,
      message: params.message,
      moveInDate: params.moveInDate,
    },
  });

  if (params.payment) {
    await prisma.payment.upsert({
      where: { transactionId: params.payment.transactionId },
      update: {},
      create: {
        transactionId: params.payment.transactionId,
        amount: params.payment.amount,
        status: PaymentStatus.COMPLETED,
        paidAt: params.payment.paidAt,
        rentalRequestId: rental.id,
      },
    });
  }

  if (params.review) {
    await prisma.review.create({
      data: {
        rating: params.review.rating,
        comment: params.review.comment,
        tenantId: params.tenantId,
        propertyId: params.propertyId,
        rentalRequestId: rental.id,
      },
    });
  }

  return rental;
}

async function main() {
  // ---- Admin ----
  const adminEmail = 'admin@rentnest.com';
  const adminPassword = 'Admin@123';

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'RentNest Admin',
      email: adminEmail,
      password: await hash(adminPassword),
      role: Role.ADMIN,
    },
  });

  console.log('✅ Seeded admin user');
  console.log(`   Email:    ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);

  // ---- Categories ----
  const categoryNames = ['Apartment', 'House', 'Studio', 'Duplex', 'Sublet'];
  const categories: Record<string, string> = {};
  for (const name of categoryNames) {
    const category = await upsertCategory(name);
    categories[name] = category.id;
  }
  console.log('✅ Seeded property categories:', categoryNames.join(', '));

  // ---- Demo landlords & tenants ----
  const landlordOne = await upsertUser({
    name: 'Rahim Uddin',
    email: 'landlord1@rentnest.com',
    role: Role.LANDLORD,
    phone: '+8801711000001',
  });
  const landlordTwo = await upsertUser({
    name: 'Karim Hossain',
    email: 'landlord2@rentnest.com',
    role: Role.LANDLORD,
    phone: '+8801711000002',
  });
  const tenantOne = await upsertUser({
    name: 'Ayesha Khan',
    email: 'tenant1@rentnest.com',
    role: Role.TENANT,
    phone: '+8801911000001',
  });
  const tenantTwo = await upsertUser({
    name: 'Farhan Islam',
    email: 'tenant2@rentnest.com',
    role: Role.TENANT,
    phone: '+8801911000002',
  });

  console.log('✅ Seeded demo landlords and tenants (all passwords: ' + DEMO_PASSWORD + ')');
  console.log(`   Landlords: ${landlordOne.email}, ${landlordTwo.email}`);
  console.log(`   Tenants:   ${tenantOne.email}, ${tenantTwo.email}`);

  // ---- Properties ----
  const apartmentGulshan = await upsertPropertyIfMissing({
    title: 'Sunny 2BHK Apartment in Gulshan',
    description:
      'A bright, well-ventilated 2-bedroom apartment in the heart of Gulshan, close to embassies and shopping.',
    location: 'Gulshan, Dhaka',
    price: 25000,
    amenities: ['WiFi', 'Generator Backup', 'Lift', 'Security'],
    isAvailable: true,
    landlordId: landlordOne.id,
    categoryId: categories.Apartment,
  });

  const studioDhanmondi = await upsertPropertyIfMissing({
    title: 'Cozy Studio near Dhanmondi Lake',
    description: 'A compact studio unit perfect for a single professional, walking distance to Dhanmondi Lake.',
    location: 'Dhanmondi, Dhaka',
    price: 15000,
    amenities: ['WiFi', 'Furnished'],
    isAvailable: true,
    landlordId: landlordOne.id,
    categoryId: categories.Studio,
  });

  const houseUttara = await upsertPropertyIfMissing({
    title: 'Spacious Family House in Uttara',
    description: 'A 4-bedroom family house with a private garden, ideal for a larger household.',
    location: 'Uttara, Dhaka',
    price: 45000,
    amenities: ['Parking', 'Garden', 'Generator Backup'],
    isAvailable: false, // currently occupied by an ACTIVE tenant below
    landlordId: landlordTwo.id,
    categoryId: categories.House,
  });

  const duplexBanani = await upsertPropertyIfMissing({
    title: 'Modern Duplex in Banani',
    description: 'A modern duplex with rooftop access and dedicated parking in Banani.',
    location: 'Banani, Dhaka',
    price: 60000,
    amenities: ['Parking', 'Rooftop Access', 'Lift', 'Security'],
    isAvailable: true,
    landlordId: landlordTwo.id,
    categoryId: categories.Duplex,
  });

  const subletMirpur = await upsertPropertyIfMissing({
    title: 'Budget Sublet Room in Mirpur',
    description: 'An affordable single room sublet, shared common areas, great for students.',
    location: 'Mirpur, Dhaka',
    price: 8000,
    amenities: ['WiFi'],
    isAvailable: true,
    landlordId: landlordOne.id,
    categoryId: categories.Sublet,
  });

  console.log('✅ Seeded demo properties (5)');

  // ---- Rental requests across the full status lifecycle ----
  await seedRentalScenario({
    tenantId: tenantOne.id,
    propertyId: apartmentGulshan.id,
    status: RentalRequestStatus.COMPLETED,
    message: 'Completed a full lease term, great experience overall.',
    moveInDate: new Date('2025-06-01'),
    payment: {
      transactionId: 'SEED-TXN-0001',
      amount: 25000,
      paidAt: new Date('2025-05-28'),
    },
    review: {
      rating: 5,
      comment: 'Fantastic apartment, very responsive landlord!',
    },
  });

  await seedRentalScenario({
    tenantId: tenantOne.id,
    propertyId: houseUttara.id,
    status: RentalRequestStatus.ACTIVE,
    message: 'Currently residing, lease in progress.',
    moveInDate: new Date('2026-06-01'),
    payment: {
      transactionId: 'SEED-TXN-0002',
      amount: 45000,
      paidAt: new Date('2026-05-30'),
    },
  });

  await seedRentalScenario({
    tenantId: tenantTwo.id,
    propertyId: studioDhanmondi.id,
    status: RentalRequestStatus.APPROVED,
    message: 'Approved, awaiting payment to move in.',
    moveInDate: new Date('2026-08-01'),
  });

  await seedRentalScenario({
    tenantId: tenantTwo.id,
    propertyId: duplexBanani.id,
    status: RentalRequestStatus.PENDING,
    message: 'Just submitted, waiting on landlord review.',
  });

  await seedRentalScenario({
    tenantId: tenantOne.id,
    propertyId: subletMirpur.id,
    status: RentalRequestStatus.REJECTED,
    message: 'Landlord had already accepted another tenant.',
  });

  await seedRentalScenario({
    tenantId: tenantTwo.id,
    propertyId: apartmentGulshan.id,
    status: RentalRequestStatus.CANCELLED,
    message: 'Tenant changed their mind before approval.',
  });

  console.log('✅ Seeded rental requests covering PENDING, APPROVED, REJECTED, ACTIVE, COMPLETED, CANCELLED');
  console.log('✅ Seeded matching payments (2) and one review');
  console.log('\nSeed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
