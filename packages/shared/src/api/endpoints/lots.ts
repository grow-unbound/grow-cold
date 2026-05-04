import { z } from 'zod';
import { lotStatusSchema, rentalModeSchema } from '../../schemas/common';
import { lotSchema } from '../../schemas/domain';

/** Canonical path for listing lots (Next route, Edge fn, or PostgREST proxy). */
export const listLotsHttpPath = '/api/lots' as const;

/** List/detail row: lot + display names for tables. */
export const listLotRowSchema = lotSchema.extend({
  customer_name: z.string(),
  product_name: z.string(),
});

/** Single-lot GET: adds party code + movement flag for form/edit UX. */
export const lotLocationChipSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export const lotDetailRowSchema = listLotRowSchema.extend({
  customer_code: z.string(),
  has_deliveries: z.boolean(),
  /** Resolved names for multiselect (Record Delivery); empty if ids missing server-side */
  locations: z.array(lotLocationChipSchema).optional(),
});

export type LotDetailRow = z.infer<typeof lotDetailRowSchema>;

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

export const GetLotResponseSchema = z.object({
  data: lotDetailRowSchema,
});

export type GetLotResponse = z.infer<typeof GetLotResponseSchema>;

export const suggestLotNumberHttpPath = '/api/lots/suggest-number' as const;

export const SuggestLotNumberQuerySchema = z.object({
  warehouseId: z.string().uuid(),
  bagCount: z.coerce.number().int().positive(),
});

export const SuggestLotNumberResponseSchema = z.object({
  suggested_lot_number: z.string(),
});

export type SuggestLotNumberResponse = z.infer<typeof SuggestLotNumberResponseSchema>;

export const checkLotNumberHttpPath = '/api/lots/check-number' as const;

export const CheckLotNumberQuerySchema = z.object({
  warehouseId: z.string().uuid(),
  lotNumber: z.string().min(1).max(200),
  excludeLotId: z.string().uuid().optional(),
});

export const CheckLotNumberResponseSchema = z.object({
  available: z.boolean(),
});

export type CheckLotNumberResponse = z.infer<typeof CheckLotNumberResponseSchema>;

export const updateLotHttpPath = '/api/lots' as const;
export const CreateLotRequestSchema = z.object({
  warehouse_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  product_id: z.string().uuid(),
  lot_number: z.string().min(1).max(200),
  original_bags: z.number().int().positive(),
  balance_bags: z.number().int().nonnegative().optional(),
  /** Omitted on web form — server sets to business-date “today” (e.g. Asia/Kolkata). */
  lodgement_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  /** Omitted on web form — server derives from `warehouse_settings` cutoff + lodgement_date. */
  rental_mode: rentalModeSchema.optional(),
  location_ids: z.array(z.string().uuid()).optional(),
  driver_name: z.string().max(200).optional(),
  vehicle_number: z.string().max(64).optional(),
  notes: z.string().max(2000).optional(),
});

export type CreateLotRequest = z.infer<typeof CreateLotRequestSchema>;

export const CreateLotResponseSchema = z.object({
  data: lotDetailRowSchema,
});

export type CreateLotResponse = z.infer<typeof CreateLotResponseSchema>;

export const UpdateLotRequestSchema = z.object({
  lot_number: z.string().min(1).max(200).optional(),
  location_ids: z.array(z.string().uuid()).optional(),
  original_bags: z.number().int().positive().optional(),
  customer_id: z.string().uuid().optional(),
  product_id: z.string().uuid().optional(),
  driver_name: z.string().max(200).nullish(),
  vehicle_number: z.string().max(64).nullish(),
  notes: z.string().max(2000).nullish(),
});

export type UpdateLotRequest = z.infer<typeof UpdateLotRequestSchema>;

export const UpdateLotResponseSchema = z.object({
  data: lotDetailRowSchema,
});

export type UpdateLotResponse = z.infer<typeof UpdateLotResponseSchema>;
