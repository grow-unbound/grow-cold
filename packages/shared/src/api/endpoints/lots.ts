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
  data: listLotRowSchema,
});

export type GetLotResponse = z.infer<typeof GetLotResponseSchema>;

export const CreateLotRequestSchema = z.object({
  warehouse_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  product_id: z.string().uuid(),
  lot_number: z.string().regex(/^[A-Za-z0-9]+\/[A-Za-z0-9]+$/),
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
