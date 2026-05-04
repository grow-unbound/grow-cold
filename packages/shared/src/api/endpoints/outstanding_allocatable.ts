import { z } from 'zod';
import { uuidSchema } from '../../schemas/common';

export const outstandingAllocatableHttpPath = '/api/outstanding-allocatable' as const;

export const outstandingAllocatableRowSchema = z.object({
  line_kind: z.enum(['rent', 'charge']),
  line_id: uuidSchema,
  lot_id: uuidSchema,
  lot_number: z.string(),
  line_label: z.string(),
  display_period: z.string(),
  charge_type_code: z.string().nullable(),
  rental_mode: z.string().nullable(),
  sort_date: z.string(),
  due_amount: z.union([z.number(), z.string()]).transform((v) => String(v)),
  remaining_amount: z.union([z.number(), z.string()]).transform((v) => String(v)),
});

export type OutstandingAllocatableRow = z.infer<typeof outstandingAllocatableRowSchema>;

export const ListOutstandingAllocatableQuerySchema = z.object({
  warehouseId: z.string().uuid(),
  customerId: z.string().uuid(),
});

export const ListOutstandingAllocatableResponseSchema = z.object({
  data: z.array(outstandingAllocatableRowSchema),
});

export type ListOutstandingAllocatableResponse = z.infer<
  typeof ListOutstandingAllocatableResponseSchema
>;
