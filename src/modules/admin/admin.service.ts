import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import {
  CreateCategoryBody,
  ListPropertiesQuery,
  ListRentalsQuery,
  ListUsersQuery,
  UpdateCategoryBody,
  UpdateUserStatusBody,
} from './admin.validation';

const userSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export const adminService = {
  async listUsers(query: ListUsersQuery) {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      ...(query.role ? { role: query.role } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: userSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      users,
    };
  },

  async updateUserStatus(id: string, status: UpdateUserStatusBody['status']) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (user.role === 'ADMIN') {
      throw ApiError.forbidden('Admin accounts cannot be banned or unbanned');
    }

    return prisma.user.update({
      where: { id },
      data: { status },
      select: userSelect,
    });
  },

  async listProperties(query: ListPropertiesQuery) {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const where: Prisma.PropertyWhereInput = {
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.isAvailable !== undefined ? { isAvailable: query.isAvailable === 'true' } : {}),
    };

    const [properties, total] = await prisma.$transaction([
      prisma.property.findMany({
        where,
        include: {
          category: true,
          landlord: { select: userSelect },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.property.count({ where }),
    ]);

    return {
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      properties,
    };
  },

  async listRentals(query: ListRentalsQuery) {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const where: Prisma.RentalRequestWhereInput = {
      ...(query.status ? { status: query.status } : {}),
    };

    const [rentals, total] = await prisma.$transaction([
      prisma.rentalRequest.findMany({
        where,
        include: {
          tenant: { select: userSelect },
          property: {
            include: {
              category: true,
              landlord: { select: userSelect },
            },
          },
          payment: true,
          review: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.rentalRequest.count({ where }),
    ]);

    return {
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      rentals,
    };
  },

  async createCategory(data: CreateCategoryBody) {
    const existing = await prisma.category.findUnique({ where: { name: data.name } });
    if (existing) {
      throw ApiError.conflict('A category with this name already exists');
    }
    return prisma.category.create({ data });
  },

  async updateCategory(id: string, data: UpdateCategoryBody) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw ApiError.notFound('Category not found');
    }
    return prisma.category.update({ where: { id }, data });
  },

  async deleteCategory(id: string) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw ApiError.notFound('Category not found');
    }

    const propertyCount = await prisma.property.count({ where: { categoryId: id } });
    if (propertyCount > 0) {
      throw ApiError.badRequest(
        'This category is still assigned to existing properties and cannot be deleted'
      );
    }

    await prisma.category.delete({ where: { id } });
  },
};
