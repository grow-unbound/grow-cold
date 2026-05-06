import { z } from 'zod';
import { paymentMethodSchema, uuidSchema } from '../../schemas/common';
import { customerReceiptSchema } from '../../schemas/domain';

export const listReceiptsHttpPath = '/api/receipts' as const;

export function getReceiptHttpPath(receiptId: string): string {
  return `${listReceiptsHttpPath}/${receiptId}`;
}

export function receiptConfirmAllocationHttpPath(receiptId: string): string {
  return `${listReceiptsHttpPath}/${receiptId}/confirm-allocation`;
}

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

export const GetReceiptResponseSchema = z.object({
  data: transactionReceiptRowSchema,
});

export type GetReceiptResponse = z.infer<typeof GetReceiptResponseSchema>;

export const UpdateReceiptRequestSchema = z.object({
  receipt_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  total_amount: z.union([z.string(), z.number()]).transform((v) => String(v)).optional(),
  payment_method: paymentMethodSchema.optional(),
  reference_number: z.string().max(200).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export type UpdateReceiptRequest = z.infer<typeof UpdateReceiptRequestSchema>;

export const UpdateReceiptResponseSchema = GetReceiptResponseSchema;

export type UpdateReceiptResponse = z.infer<typeof UpdateReceiptResponseSchema>;

export const confirmReceiptAllocationLineSchema = z
  .object({
    rent_accrual_id: uuidSchema.optional(),
    charge_id: uuidSchema.optional(),
    amount: z.union([z.number(), z.string()]).transform((v) => String(v)),
  })
  .superRefine((val, ctx) => {
    const hasR = val.rent_accrual_id !== undefined;
    const hasC = val.charge_id !== undefined;
    if (hasR === hasC) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Exactly one of rent_accrual_id or charge_id is required',
      });
    }
  });

export type ConfirmReceiptAllocationLine = z.infer<typeof confirmReceiptAllocationLineSchema>;

export const ConfirmReceiptAllocationRequestSchema = z.object({
  lines: z.array(confirmReceiptAllocationLineSchema),
});

export type ConfirmReceiptAllocationRequest = z.infer<typeof ConfirmReceiptAllocationRequestSchema>;

export const ConfirmReceiptAllocationResponseSchema = z.object({
  receipt_id: uuidSchema,
  applied_total: z.union([z.number(), z.string()]).transform((v) => String(v)),
  credit_remaining: z.union([z.number(), z.string()]).transform((v) => String(v)),
});

export type ConfirmReceiptAllocationResponse = z.infer<typeof ConfirmReceiptAllocationResponseSchema>;
