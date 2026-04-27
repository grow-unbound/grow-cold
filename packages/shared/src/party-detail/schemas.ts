import { z } from 'zod';
import { paymentMethodSchema, uuidSchema } from '../schemas/common';

export const partyDetailStorageStatusSchema = z.enum(['completed', 'fresh', 'aging', 'stale']);

export const partyDetailLotRowSchema = z.object({
  lotId: uuidSchema,
  lot_number: z.string(),
  product_name: z.string(),
  original_bags: z.number().int(),
  delivered_bags: z.number().int(),
  balance_bags: z.number().int(),
  ageDays: z.number().int().nonnegative(),
  storageStatus: partyDetailStorageStatusSchema,
});

export const partyDetailReceiptRowSchema = z.object({
  id: uuidSchema,
  receipt_date: z.string(),
  amount: z.number().finite(),
  purpose: z.string(),
  lotNumbers: z.array(z.string()),
  payment_method: paymentMethodSchema.nullable(),
});

export const partyDetailDataSchema = z.object({
  customerId: uuidSchema,
  customerCode: z.string(),
  customerName: z.string(),
  phone: z.string().nullable(),
  mobile: z.string().nullable().optional(),
  address: z.string().nullable(),
  currentStockBags: z.number().int().nonnegative(),
  activeLotCount: z.number().int().nonnegative(),
  outstanding: z.number().finite(),
  rents: z.number().finite(),
  charges: z.number().finite(),
  others: z.number().finite(),
  lastActivityDate: z.string().nullable(),
  summaryUpdatedAt: z.string(),
  lots: z.array(partyDetailLotRowSchema),
  receipts: z.array(partyDetailReceiptRowSchema),
  receiptsHasMore: z.boolean(),
});

export const PartyDetailQuerySchema = z.object({
  warehouseId: uuidSchema,
  receiptsLimit: z.coerce.number().int().positive().max(100).default(50),
  receiptsOffset: z.coerce.number().int().nonnegative().default(0),
});

export type PartyDetailData = z.infer<typeof partyDetailDataSchema>;
export type PartyDetailLotRow = z.infer<typeof partyDetailLotRowSchema>;
export type PartyDetailReceiptRow = z.infer<typeof partyDetailReceiptRowSchema>;
export type PartyDetailStorageStatus = z.infer<typeof partyDetailStorageStatusSchema>;
