import { z } from 'zod';
import { customerCategorySchema } from '../../schemas/common';
import { customerSchema } from '../../schemas/domain';

export const listCustomersHttpPath = '/api/customers' as const;

export const ListCustomersRequestSchema = z.object({
  warehouseId: z.string().uuid(),
  limit: z.number().int().positive().max(200).default(100),
  offset: z.number().int().nonnegative().default(0),
});

export type ListCustomersRequest = z.infer<typeof ListCustomersRequestSchema>;

export const ListCustomersQuerySchema = z.object({
  warehouseId: z.string().uuid(),
  limit: z.coerce.number().int().positive().max(200).default(100),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export const ListCustomersResponseSchema = z.object({
  data: z.array(customerSchema),
  count: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});

export type ListCustomersResponse = z.infer<typeof ListCustomersResponseSchema>;

export const CreateCustomerRequestSchema = z.object({
  warehouse_id: z.string().uuid(),
  customer_code: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[A-Za-z0-9./\-]+$/, 'Use letters, digits, / . - only'),
  customer_name: z.string().min(1).max(500),
  phone: z.string().min(5).max(32).nullish(),
  mobile: z.string().min(5).max(32).optional(),
  category: customerCategorySchema.optional().default('TRADER'),
  address: z.string().max(2000).optional(),
  gstin: z.string().max(32).optional(),
  credit_limit: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === undefined ? '0' : String(v))),
  notes: z.string().max(2000).optional(),
});

export type CreateCustomerRequest = z.infer<typeof CreateCustomerRequestSchema>;

export const CreateCustomerResponseSchema = z.object({
  data: customerSchema,
});

export type CreateCustomerResponse = z.infer<typeof CreateCustomerResponseSchema>;
