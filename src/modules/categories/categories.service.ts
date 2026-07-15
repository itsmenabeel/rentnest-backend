import { prisma } from '../../lib/prisma';

export const categoriesService = {
  async getAll() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  },
};
