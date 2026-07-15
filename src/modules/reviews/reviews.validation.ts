import { z } from 'zod';

export const createReviewSchema = z.object({
  body: z.object({
    rentalRequestId: z.string().uuid('Invalid rental request id'),
    rating: z.coerce
      .number()
      .int('Rating must be a whole number')
      .min(1, 'Rating must be between 1 and 5')
      .max(5, 'Rating must be between 1 and 5'),
    comment: z.string().trim().max(1000, 'Comment cannot exceed 1000 characters').optional(),
  }),
});

export const getPropertyReviewsSchema = z.object({
  params: z.object({
    propertyId: z.string().uuid('Invalid property id'),
  }),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
  }),
});

export const reviewIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid review id'),
  }),
});

export type CreateReviewBody = z.infer<typeof createReviewSchema>['body'];
export type GetPropertyReviewsQuery = z.infer<typeof getPropertyReviewsSchema>['query'];
