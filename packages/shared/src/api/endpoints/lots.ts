import { z } from 'zod';
import { lotStatusSchema, rentalModeSchema, uuidSchema } from '../../schemas/common';
import { lotSchema } from '../../schemas/domain';

/** Canonical path for listing lots (Next route, Edge fn, or PostgREST proxy). */
export const listLotsHttpPath = '/api/lots' as const;

/** List/detail row: lot + display names for tables. */
export const listLotRowSchema = lotSchema.extend({
  customer_name: z.string(),
  product_name: z.string(),
});

export type ListLotRow = z.infer<typeof listLotRowSchema>;

export const ListLotsRequestSchema = z.object({
  warehouseId: z.string().uuid(),
  status: lotStatusSchema.optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
});

export type ListLotsRequest = z.infer<typeof ListLotsRequestSchema>;

/** URL query (coerces limit/offset from strings). */
export const ListLotsQuerySchema = z.object({
  warehouseId: z.string().uuid(),
  status: lotStatusSchema.optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export const ListLotsResponseSchema = z.object({
  data: z.array(listLotRowSchema),
  count: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});

export type ListLotsResponse = z.infer<typeof ListLotsResponseSchema>;

export const getLotHttpPath = '/api/lots' as const;

export const GetLotParamsSchema = z.object({
  lotId: z.string().uuid(),
});

export const lotDetailDeliveryRowSchema = z.object({
  id: uuidSchema,
  delivery_date: z.string(),
  num_bags_out: z.number().int().positive(),
  driver_name: z.string().nullable().optional(),
  vehicle_number: z.string().nullable().optional(),
});

export const lotDetailChargeRowSchema = z.object({
  id: uuidSchema,
  charge_type_label: z.string(),
  charge_amount: z.string(),
  is_paid: z.boolean(),
  charge_date: z.string(),
});

export const lotDetailDataSchema = listLotRowSchema.extend({
  customer_code: z.string(),
  location_label: z.string(),
  delivered_bags_sum: z.number().int().nonnegative(),
  delivery_count: z.number().int().nonnegative(),
  deliveries: z.array(lotDetailDeliveryRowSchema),
  charges: z.array(lotDetailChargeRowSchema),
});

export type LotDetailDeliveryRow = z.infer<typeof lotDetailDeliveryRowSchema>;
export type LotDetailChargeRow = z.infer<typeof lotDetailChargeRowSchema>;
export type LotDetailData = z.infer<typeof lotDetailDataSchema>;

export const GetLotDetailResponseSchema = z.object({
  data: lotDetailDataSchema,
});

export type GetLotDetailResponse = z.infer<typeof GetLotDetailResponseSchema>;

/** Full lot detail payload (deliveries, charges, labels). */
export const GetLotResponseSchema = GetLotDetailResponseSchema;

export type GetLotResponse = GetLotDetailResponse;

export const CreateLotRequestSchema = z.object({
  warehouse_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  product_id: z.string().uuid(),
  lot_number: z.string().min(1).max(200),
  original_bags: z.number().int().positive(),
  balance_bags: z.number().int().nonnegative().optional(),
  lodgement_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rental_mode: rentalModeSchema,
  location_ids: z.array(z.string().uuid()).optional(),
  driver_name: z.string().max(200).optional(),
  vehicle_number: z.string().max(64).optional(),
  notes: z.string().max(2000).optional(),
});

export type CreateLotRequest = z.infer<typeof CreateLotRequestSchema>;

export const CreateLotResponseSchema = z.object({
  data: listLotRowSchema,
});

export type CreateLotResponse = z.infer<typeof CreateLotResponseSchema>;
