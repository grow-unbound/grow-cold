import { z } from 'zod';
import { uuidSchema } from '../../schemas/common';

export const partiesTabBasePath = '/api/parties' as const;
export const partiesReceivablesPath = '/api/parties/receivables' as const;
export const partiesListPath = '/api/parties' as const;

export const PartiesFilterSchema = z.enum(['all', 'active', 'pending']);

export const PartiesListQuerySchema = z.object({
  warehouseId: z.string().uuid(),
  filter: z
    .string()
    .optional()
    .default('active')
    .transform((s) => {
      const t = s.trim().toLowerCase();
      if (t === 'pending_dues') return 'pending' as const;
      if (t === 'all' || t === 'active' || t === 'pending') return t;
      return 'active' as const;
    }),
  q: z.string().optional().default(''),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export const PartiesReceivablesQuerySchema = z.object({
  warehouseId: z.string().uuid(),
});

export const PartiesReceivablesSummarySchema = z.object({
  totalReceivable: z.number().finite(),
  customersWithDues: z.number().int().nonnegative(),
  rentReceivable: z.number().finite(),
  rentLotCount: z.number().int().nonnegative(),
  chargesReceivable: z.number().finite(),
  chargesLotCount: z.number().int().nonnegative(),
  othersReceivable: z.number().finite(),
  othersCustomerCount: z.number().int().nonnegative(),
  updatedAt: z.string(),
});

export const PartiesListRowSchema = z.object({
  customerId: uuidSchema,
  customerCode: z.string(),
  customerName: z.string(),
  phone: z.string().nullable().optional(),
  mobile: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  outstanding: z.number().finite(),
  lotCount: z.number().int().nonnegative(),
  bagCount: z.number().int().nonnegative(),
  lastActivityDate: z.string().nullable().optional(),
  hasStock: z.boolean(),
});

export const PartiesListResponseSchema = z.object({
  items: z.array(PartiesListRowSchema),
  filterTotal: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});

export type PartiesReceivablesSummary = z.infer<typeof PartiesReceivablesSummarySchema>;
export type PartiesListRowDto = z.infer<typeof PartiesListRowSchema>;
export type PartiesListResponse = z.infer<typeof PartiesListResponseSchema>;
export type PartiesListQuery = z.infer<typeof PartiesListQuerySchema>;
