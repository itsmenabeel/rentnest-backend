import { z } from 'zod';

export const createPaymentSchema = z.object({
  body: z.object({
    rentalRequestId: z.string().uuid('Invalid rental request id'),
  }),
});

export const confirmPaymentSchema = z.object({
  body: z.object({
    val_id: z.string().trim().min(1, 'val_id is required'),
    tran_id: z.string().trim().min(1, 'tran_id is required').optional(),
  }),
});

export const ipnPaymentSchema = z.object({
  body: z.object({
    val_id: z.string().trim().min(1, 'val_id is required'),
    tran_id: z.string().trim().min(1, 'tran_id is required'),
    status: z.string().trim().optional(),
  }),
});

export const paymentIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid payment id'),
  }),
});

export type CreatePaymentBody = z.infer<typeof createPaymentSchema>['body'];
export type ConfirmPaymentBody = z.infer<typeof confirmPaymentSchema>['body'];
