import { z } from 'zod';

function parseStringArray(value: unknown): unknown {
  if (value === undefined || value === null || value === '') return [];

  if (Array.isArray(value)) {
    return value.flatMap((item) => parseStringArray(item));
  }

  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : value;
    } catch {
      return value;
    }
  }

  return trimmed
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const stringArraySchema = z.preprocess(
  parseStringArray,
  z.array(z.string().trim().min(1)).default([])
);

const optionalStringArraySchema = z.preprocess(
  (value) => (value === undefined ? undefined : parseStringArray(value)),
  z.array(z.string().trim().min(1)).optional()
);

const priceSchema = z.coerce.number().positive('Price must be greater than 0');

const booleanFromInput = z.preprocess((value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return value;
}, z.boolean());

export const propertyIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid property id'),
  }),
});

export const getPropertiesSchema = z.object({
  query: z
    .object({
      location: z.string().trim().min(1).optional(),
      search: z.string().trim().min(1).optional(),
      categoryId: z.string().uuid('Invalid category id').optional(),
      minPrice: z.coerce.number().nonnegative().optional(),
      maxPrice: z.coerce.number().nonnegative().optional(),
      isAvailable: booleanFromInput.optional(),
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(10),
    })
    .refine(
      (query) =>
        query.minPrice === undefined ||
        query.maxPrice === undefined ||
        query.minPrice <= query.maxPrice,
      {
        message: 'minPrice cannot be greater than maxPrice',
        path: ['minPrice'],
      }
    ),
});

export const createPropertySchema = z.object({
  body: z.object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters'),
    description: z.string().trim().min(10, 'Description must be at least 10 characters'),
    location: z.string().trim().min(2, 'Location is required'),
    price: priceSchema,
    categoryId: z.string().uuid('Invalid category id'),
    amenities: stringArraySchema,
    images: stringArraySchema,
    isAvailable: booleanFromInput.default(true),
  }),
});

export const updatePropertySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid property id'),
  }),
  body: z
    .object({
      title: z.string().trim().min(3, 'Title must be at least 3 characters').optional(),
      description: z
        .string()
        .trim()
        .min(10, 'Description must be at least 10 characters')
        .optional(),
      location: z.string().trim().min(2, 'Location is required').optional(),
      price: priceSchema.optional(),
      categoryId: z.string().uuid('Invalid category id').optional(),
      amenities: optionalStringArraySchema,
      images: optionalStringArraySchema,
      isAvailable: booleanFromInput.optional(),
    }),
});

export type GetPropertiesQuery = z.infer<typeof getPropertiesSchema>['query'];
export type CreatePropertyBody = z.infer<typeof createPropertySchema>['body'];
export type UpdatePropertyBody = z.infer<typeof updatePropertySchema>['body'];
