import { Prisma, RentalRequestStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { CreateReviewBody, GetPropertyReviewsQuery } from './reviews.validation';

const reviewInclude = {
  tenant: { select: { id: true, name: true } },
  property: { select: { id: true, title: true } },
} satisfies Prisma.ReviewInclude;

export const reviewsService = {
  async create(input: CreateReviewBody, tenantId: string) {
    const rental = await prisma.rentalRequest.findUnique({
      where: { id: input.rentalRequestId },
      include: { review: true },
    });

    if (!rental) {
      throw ApiError.notFound('Rental request not found');
    }

    if (rental.tenantId !== tenantId) {
      throw ApiError.forbidden('You can only review your own rental requests');
    }

    if (rental.status !== RentalRequestStatus.COMPLETED) {
      throw ApiError.badRequest('You can only review a rental request once it is completed');
    }

    if (rental.review) {
      throw ApiError.conflict('This rental request has already been reviewed');
    }

    return prisma.review.create({
      data: {
        rating: input.rating,
        comment: input.comment,
        tenantId,
        propertyId: rental.propertyId,
        rentalRequestId: rental.id,
      },
      include: reviewInclude,
    });
  },

  async getByProperty(propertyId: string, query: GetPropertyReviewsQuery) {
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) {
      throw ApiError.notFound('Property not found');
    }

    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const [reviews, total, aggregate] = await prisma.$transaction([
      prisma.review.findMany({
        where: { propertyId },
        include: reviewInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { propertyId } }),
      prisma.review.aggregate({
        where: { propertyId },
        _avg: { rating: true },
      }),
    ]);

    return {
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        averageRating: aggregate._avg.rating ?? null,
      },
      reviews,
    };
  },
};
