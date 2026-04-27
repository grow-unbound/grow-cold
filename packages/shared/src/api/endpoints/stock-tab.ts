import { z } from 'zod';
import { uuidSchema } from '../../schemas/common';

export const stockTabBasePath = '/api/stock' as const;
export const stockSummaryPath = `${stockTabBasePath}/summary` as const;
export const stockMovementsPath = `${stockTabBasePath}/movements` as const;
export const stockDeliveriesPath = `${stockTabBasePath}/deliveries` as const;
export const listLocationsPath = `${stockTabBasePath}/locations` as const;

export const StockTabWarehouseQuerySchema = z.object({
  warehouseId: z.string().uuid(),
});

export const StockTabMovementsQuerySchema = z.object({
  warehouseId: z.string().uuid(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  cursor: z.string().optional(),
});

export const StockTabSummaryResponseSchema = z.object({
  totalBags: z.number().int().nonnegative(),
  totalLots: z.number().int().nonnegative(),
  freshBags: z.number().int().nonnegative(),
  agingBags: z.number().int().nonnegative(),
  staleBags: z.number().int().nonnegative(),
  updatedAt: z.string(),
});

export const StockTabMovementRowSchema = z.object({
  kind: z.enum(['lodgement', 'delivery']),
  id: z.string(),
  lotId: uuidSchema,
  transactionDate: z.string(),
  createdAt: z.string(),
  customerCode: z.string(),
  customerName: z.string(),
  productName: z.string(),
  productGroupName: z.string(),
  productGroupEmoji: z.string(),
  lotNumber: z.string(),
  numBags: z.number().int().positive(),
});

export const StockTabMovementsResponseSchema = z.object({
  items: z.array(StockTabMovementRowSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});

export type StockTabSummaryResponse = z.infer<typeof StockTabSummaryResponseSchema>;
export type StockTabMovementRowDto = z.infer<typeof StockTabMovementRowSchema>;
export type StockTabMovementsResponse = z.infer<typeof StockTabMovementsResponseSchema>;

export const CreateStockDeliveryRequestSchema = z.object({
  warehouse_id: uuidSchema,
  lot_id: uuidSchema,
  num_bags_out: z.number().int().positive(),
  delivery_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(2000).optional(),
  driver_name: z.string().max(200).optional(),
  vehicle_number: z.string().max(64).optional(),
  location_ids: z.array(uuidSchema).optional(),
});

export type CreateStockDeliveryRequest = z.infer<typeof CreateStockDeliveryRequestSchema>;

export const CreateStockDeliveryResponseSchema = z.object({
  data: StockTabMovementRowSchema,
});

export type CreateStockDeliveryResponse = z.infer<typeof CreateStockDeliveryResponseSchema>;

export const ListLocationsResponseSchema = z.object({
  data: z.array(
    z.object({
      id: uuidSchema,
      name: z.string(),
    }),
  ),
});

export type ListLocationsResponse = z.infer<typeof ListLocationsResponseSchema>;
