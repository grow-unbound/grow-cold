import { z } from 'zod';
import { paymentMethodSchema, uuidSchema } from '../../schemas/common';

export const moneyTabBasePath = '/api/money' as const;
export const moneySummaryPath = `${moneyTabBasePath}/summary` as const;
export const moneyMovementsPath = `${moneyTabBasePath}/movements` as const;
export const moneyPaymentsPath = `${moneyTabBasePath}/payments` as const;

export const MoneyTabWarehouseQuerySchema = z.object({
  warehouseId: z.string().uuid(),
});

export const MoneyTabMovementsQuerySchema = z.object({
  warehouseId: z.string().uuid(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  cursor: z.string().optional(),
});

export const MoneyTabSummaryResponseSchema = z.object({
  cashBalance: z.number().finite(),
  receivedToday: z.number().finite(),
  paidToday: z.number().finite(),
  payablePending: z.number().finite(),
  updatedAt: z.string(),
});

export const MoneyTabMovementRowSchema = z.object({
  kind: z.enum(['receipt', 'payment']),
  id: z.string().uuid(),
  transactionDate: z.string(),
  createdAt: z.string(),
  counterparty: z.string(),
  amount: z.number().finite(),
  paymentMethod: z.string().nullable(),
  notes: z.string().nullable(),
  detailLine: z.string(),
});

export const MoneyTabMovementsResponseSchema = z.object({
  items: z.array(MoneyTabMovementRowSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});

export type MoneyTabSummaryResponse = z.infer<typeof MoneyTabSummaryResponseSchema>;
export type MoneyTabMovementRowDto = z.infer<typeof MoneyTabMovementRowSchema>;
export type MoneyTabMovementsResponse = z.infer<typeof MoneyTabMovementsResponseSchema>;

export const CreateWarehouseCashPaymentRequestSchema = z.object({
  warehouse_id: uuidSchema,
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  total_amount: z.union([z.string(), z.number()]).transform((v) => String(v)),
  payment_method: paymentMethodSchema.optional(),
  recipient_name: z.string().min(1).max(500),
  notes: z.string().max(2000).optional(),
});

export type CreateWarehouseCashPaymentRequest = z.infer<typeof CreateWarehouseCashPaymentRequestSchema>;

export const CreateWarehouseCashPaymentResponseSchema = z.object({
  ok: z.literal(true),
  id: z.string().uuid(),
});
