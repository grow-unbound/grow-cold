import { z } from 'zod';
import { paymentMethodSchema } from '../../schemas/common';
import { customerReceiptSchema } from '../../schemas/domain';

export const listReceiptsHttpPath = '/api/receipts' as const;

/** Feed row: receipt today; reserve `kind` for future payment rows. */
export const transactionReceiptRowSchema = customerReceiptSchema.extend({
  kind: z.literal('receipt'),
  customer_name: z.string(),
});

export type TransactionReceiptRow = z.infer<typeof transactionReceiptRowSchema>;

export const ListReceiptsRequestSchema = z.object({
  warehouseId: z.string().uuid(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

export type ListReceiptsRequest = z.infer<typeof ListReceiptsRequestSchema>;

export const ListReceiptsQuerySchema = z.object({
  warehouseId: z.string().uuid(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export const ListReceiptsResponseSchema = z.object({
  data: z.array(transactionReceiptRowSchema),
  count: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});

export type ListReceiptsResponse = z.infer<typeof ListReceiptsResponseSchema>;

export const CreateReceiptRequestSchema = z.object({
  warehouse_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  receipt_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  total_amount: z.union([z.string(), z.number()]).transform((v) => String(v)),
  payment_method: paymentMethodSchema.optional(),
  reference_number: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

export type CreateReceiptRequest = z.infer<typeof CreateReceiptRequestSchema>;

export const CreateReceiptResponseSchema = z.object({
  data: transactionReceiptRowSchema,
});

export type CreateReceiptResponse = z.infer<typeof CreateReceiptResponseSchema>;
