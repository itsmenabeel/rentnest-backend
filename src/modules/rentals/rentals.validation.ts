import { RentalRequestStatus } from '@prisma/client';
import { z } from 'zod';

export const rentalIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid rental request id'),
  }),
});

export const createRentalSchema = z.object({
  body: z.object({
    propertyId: z.string().uuid('Invalid property id'),
    moveInDate: z.coerce.date().optional(),
    message: z.string().trim().max(1000, 'Message cannot exceed 1000 characters').optional(),
  }),
});

export const getRentalsSchema = z.object({
  query: z.object({
    status: z.nativeEnum(RentalRequestStatus).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
  }),
});

export const updateRentalStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid rental request id'),
  }),
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED'], {
      errorMap: () => ({ message: 'Status must be either APPROVED or REJECTED' }),
    }),
  }),
});

export type CreateRentalBody = z.infer<typeof createRentalSchema>['body'];
export type GetRentalsQuery = z.infer<typeof getRentalsSchema>['query'];
export type UpdateRentalStatusBody = z.infer<typeof updateRentalStatusSchema>['body'];
