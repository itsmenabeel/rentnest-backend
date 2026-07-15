import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import {
  CreatePropertyBody,
  GetPropertiesQuery,
  UpdatePropertyBody,
} from './properties.validation';

const propertyInclude = {
  category: true,
  landlord: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} satisfies Prisma.PropertyInclude;

async function ensureCategoryExists(categoryId: string) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    throw ApiError.notFound('Category not found');
  }
}

async function findOwnedProperty(id: string, landlordId: string) {
  const property = await prisma.property.findUnique({ where: { id } });

  if (!property) {
    throw ApiError.notFound('Property not found');
  }

  if (property.landlordId !== landlordId) {
    throw ApiError.forbidden('You can only manage your own properties');
  }

  return property;
}

export const propertiesService = {
  async getAll(query: GetPropertiesQuery) {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const where: Prisma.PropertyWhereInput = {
      isAvailable: query.isAvailable ?? true,
      ...(query.location
        ? { location: { contains: query.location, mode: Prisma.QueryMode.insensitive } }
        : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.minPrice !== undefined || query.maxPrice !== undefined
        ? {
            price: {
              ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
              ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
              { description: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
              { location: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
            ],
          }
        : {}),
    };

    const [properties, total] = await prisma.$transaction([
      prisma.property.findMany({
        where,
        include: propertyInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.property.count({ where }),
    ]);

    return {
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      properties,
    };
  },

  async getById(id: string) {
    const property = await prisma.property.findUnique({
      where: { id },
      include: propertyInclude,
    });

    if (!property) {
      throw ApiError.notFound('Property not found');
    }

    return property;
  },

  async create(input: CreatePropertyBody, landlordId: string, uploadedImages: string[]) {
    await ensureCategoryExists(input.categoryId);

    return prisma.property.create({
      data: {
        title: input.title,
        description: input.description,
        location: input.location,
        price: input.price,
        amenities: input.amenities,
        images: [...input.images, ...uploadedImages],
        isAvailable: input.isAvailable,
        landlordId,
        categoryId: input.categoryId,
      },
      include: propertyInclude,
    });
  },

  async update(
    id: string,
    landlordId: string,
    input: UpdatePropertyBody,
    uploadedImages: string[]
  ) {
    const property = await findOwnedProperty(id, landlordId);

    if (input.categoryId) {
      await ensureCategoryExists(input.categoryId);
    }

    const data: Prisma.PropertyUpdateInput = {};

    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.location !== undefined) data.location = input.location;
    if (input.price !== undefined) data.price = input.price;
    if (input.amenities !== undefined) data.amenities = input.amenities;
    if (input.isAvailable !== undefined) data.isAvailable = input.isAvailable;
    if (input.categoryId !== undefined) data.category = { connect: { id: input.categoryId } };
    if (input.images !== undefined) data.images = [...input.images, ...uploadedImages];
    if (input.images === undefined && uploadedImages.length) {
      data.images = [...property.images, ...uploadedImages];
    }

    return prisma.property.update({
      where: { id },
      data,
      include: propertyInclude,
    });
  },

  async remove(id: string, landlordId: string) {
    await findOwnedProperty(id, landlordId);

    const rentalRequestCount = await prisma.rentalRequest.count({
      where: { propertyId: id },
    });

    if (rentalRequestCount > 0) {
      throw ApiError.badRequest(
        'Property has rental requests and cannot be deleted; mark it unavailable instead'
      );
    }

    await prisma.property.delete({ where: { id } });
  },
};
