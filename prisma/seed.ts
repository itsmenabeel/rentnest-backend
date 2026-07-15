import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@rentnest.com';
  const adminPassword = 'Admin@123';

  const hashed = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'RentNest Admin',
      email: adminEmail,
      password: hashed,
      role: Role.ADMIN,
    },
  });

  console.log('✅ Seeded admin user');
  console.log(`   Email:    ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);

  const categories = ['Apartment', 'House', 'Studio', 'Duplex', 'Sublet'];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log('Seeded property categories');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
