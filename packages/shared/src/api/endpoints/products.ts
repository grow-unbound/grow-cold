import { z } from 'zod';
import { productSchema } from '../../schemas/domain';

export const listProductsHttpPath = '/api/products' as const;

export const ListProductsRequestSchema = z.object({
  limit: z.number().int().positive().max(200).default(100),
  offset: z.number().int().nonnegative().default(0),
});

export type ListProductsRequest = z.infer<typeof ListProductsRequestSchema>;

export const ListProductsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).default(100),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export const ListProductsResponseSchema = z.object({
  data: z.array(productSchema),
  count: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});

export type ListProductsResponse = z.infer<typeof ListProductsResponseSchema>;
