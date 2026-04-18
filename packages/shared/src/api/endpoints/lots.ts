import { z } from 'zod';
import { lotStatusSchema } from '../../schemas/common';
import { lotSchema } from '../../schemas/domain';

/** Canonical path for listing lots (Next route, Edge fn, or PostgREST proxy). */
export const listLotsHttpPath = '/api/lots' as const;

export const ListLotsRequestSchema = z.object({
  warehouseId: z.string().uuid(),
  status: lotStatusSchema.optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
});

export type ListLotsRequest = z.infer<typeof ListLotsRequestSchema>;

export const ListLotsResponseSchema = z.object({
  data: z.array(lotSchema),
  count: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});

export type ListLotsResponse = z.infer<typeof ListLotsResponseSchema>;
