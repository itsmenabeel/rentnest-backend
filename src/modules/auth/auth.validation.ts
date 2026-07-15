import { z } from 'zod';

// Note: ADMIN is intentionally excluded from public registration.
// Admin accounts are created only via the seed script — allowing self-service
// admin signup would be a security hole.
export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    phone: z.string().min(6).optional(),
    role: z.enum(['TENANT', 'LANDLORD'], {
      errorMap: () => ({ message: 'Role must be either TENANT or LANDLORD' }),
    }),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export type RegisterBody = z.infer<typeof registerSchema>['body'];
export type LoginBody = z.infer<typeof loginSchema>['body'];
