import { Role, RentalRequestStatus, UserStatus } from '@prisma/client';
import { z } from 'zod';

export const listUsersSchema = z.object({
  query: z.object({
    role: z.nativeEnum(Role).optional(),
    status: z.nativeEnum(UserStatus).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
  }),
});

export const updateUserStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user id'),
  }),
  body: z.object({
    status: z.nativeEnum(UserStatus, {
      errorMap: () => ({ message: 'Status must be either ACTIVE or BANNED' }),
    }),
  }),
});

export const listPropertiesSchema = z.object({
  query: z.object({
    categoryId: z.string().uuid().optional(),
    isAvailable: z.enum(['true', 'false']).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
  }),
});

export const listRentalsSchema = z.object({
  query: z.object({
    status: z.nativeEnum(RentalRequestStatus).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
  }),
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Category name must be at least 2 characters'),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid category id'),
  }),
  body: z.object({
    name: z.string().trim().min(2, 'Category name must be at least 2 characters'),
  }),
});

export const categoryIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid category id'),
  }),
});

export type ListUsersQuery = z.infer<typeof listUsersSchema>['query'];
export type UpdateUserStatusBody = z.infer<typeof updateUserStatusSchema>['body'];
export type ListPropertiesQuery = z.infer<typeof listPropertiesSchema>['query'];
export type ListRentalsQuery = z.infer<typeof listRentalsSchema>['query'];
export type CreateCategoryBody = z.infer<typeof createCategorySchema>['body'];
export type UpdateCategoryBody = z.infer<typeof updateCategorySchema>['body'];
