import { Prisma, RentalRequestStatus, Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import {
  CreateRentalBody,
  GetRentalsQuery,
  UpdateRentalStatusBody,
} from './rentals.validation';

const userSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  status: true,
} satisfies Prisma.UserSelect;

const rentalInclude = {
  tenant: { select: userSelect },
  property: {
    include: {
      category: true,
      landlord: { select: userSelect },
    },
  },
  payment: true,
  review: true,
} satisfies Prisma.RentalRequestInclude;

function assertRentalAccess(
  rental: Prisma.RentalRequestGetPayload<{ include: typeof rentalInclude }>,
  user: { id: string; role: Role }
) {
  if (user.role === 'TENANT' && rental.tenantId === user.id) return;
  if (user.role === 'LANDLORD' && rental.property.landlordId === user.id) return;
  throw ApiError.forbidden('You do not have access to this rental request');
}

function buildUserScopedWhere(user: { id: string; role: Role }, query: GetRentalsQuery) {
  const where: Prisma.RentalRequestWhereInput = {
    ...(query.status ? { status: query.status } : {}),
  };

  if (user.role === 'TENANT') {
    where.tenantId = user.id;
    return where;
  }

  if (user.role === 'LANDLORD') {
    where.property = { landlordId: user.id };
    return where;
  }

  throw ApiError.forbidden('Only tenants and landlords can access this endpoint');
}

export const rentalsService = {
  async create(input: CreateRentalBody, tenantId: string) {
    const property = await prisma.property.findUnique({
      where: { id: input.propertyId },
      select: {
        id: true,
        isAvailable: true,
        landlordId: true,
      },
    });

    if (!property) {
      throw ApiError.notFound('Property not found');
    }

    if (!property.isAvailable) {
      throw ApiError.badRequest('This property is not available for rental requests');
    }

    const existingOpenRequest = await prisma.rentalRequest.findFirst({
      where: {
        tenantId,
        propertyId: input.propertyId,
        status: {
          in: [
            RentalRequestStatus.PENDING,
            RentalRequestStatus.APPROVED,
            RentalRequestStatus.ACTIVE,
          ],
        },
      },
    });

    if (existingOpenRequest) {
      throw ApiError.conflict('You already have an open rental request for this property');
    }

    return prisma.rentalRequest.create({
      data: {
        tenantId,
        propertyId: input.propertyId,
        moveInDate: input.moveInDate,
        message: input.message,
      },
      include: rentalInclude,
    });
  },

  async getAll(user: { id: string; role: Role }, query: GetRentalsQuery) {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;
    const where = buildUserScopedWhere(user, query);

    const [rentals, total] = await prisma.$transaction([
      prisma.rentalRequest.findMany({
        where,
        include: rentalInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.rentalRequest.count({ where }),
    ]);

    return {
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      rentals,
    };
  },

  async getById(id: string, user: { id: string; role: Role }) {
    const rental = await prisma.rentalRequest.findUnique({
      where: { id },
      include: rentalInclude,
    });

    if (!rental) {
      throw ApiError.notFound('Rental request not found');
    }

    assertRentalAccess(rental, user);
    return rental;
  },

  async getLandlordRequests(landlordId: string, query: GetRentalsQuery) {
    return this.getAll({ id: landlordId, role: 'LANDLORD' }, query);
  },

  async updateStatus(id: string, landlordId: string, input: UpdateRentalStatusBody) {
    const rental = await prisma.rentalRequest.findUnique({
      where: { id },
      include: rentalInclude,
    });

    if (!rental) {
      throw ApiError.notFound('Rental request not found');
    }

    if (rental.property.landlordId !== landlordId) {
      throw ApiError.forbidden('You can only manage requests for your own properties');
    }

    if (rental.status !== RentalRequestStatus.PENDING) {
      throw ApiError.badRequest('Only pending rental requests can be approved or rejected');
    }

    return prisma.rentalRequest.update({
      where: { id },
      data: { status: input.status },
      include: rentalInclude,
    });
  },
};
