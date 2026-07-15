import { app } from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';

async function main() {
  await prisma.$connect();
  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 RentNest API running on port ${env.PORT}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server:', err);
  process.exit(1);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
