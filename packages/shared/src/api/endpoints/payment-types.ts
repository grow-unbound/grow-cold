import { z } from 'zod';
import { uuidSchema } from '../../schemas/common';

export const listPaymentTypesHttpPath = '/api/payment-types' as const;

export const ListPaymentTypesQuerySchema = z.object({
  warehouseId: z.string().uuid().optional(),
});

export const paymentTypeRowSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  category: z.string(),
  is_active: z.boolean(),
});

export const ListPaymentTypesResponseSchema = z.object({
  data: z.array(paymentTypeRowSchema),
});

export type ListPaymentTypesResponse = z.infer<typeof ListPaymentTypesResponseSchema>;
