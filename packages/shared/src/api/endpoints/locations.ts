import { z } from 'zod';
import { uuidSchema } from '../../schemas/common';

export const listLocationsHttpPath = '/api/locations' as const;

export const locationListItemSchema = z.object({
  id: uuidSchema,
  warehouse_id: uuidSchema,
  name: z.string().min(1),
});

export type LocationListItem = z.infer<typeof locationListItemSchema>;

export const ListLocationsQuerySchema = z.object({
  warehouseId: z.string().uuid(),
});

export const ListLocationsResponseSchema = z.object({
  data: z.array(locationListItemSchema),
});

export type ListLocationsResponse = z.infer<typeof ListLocationsResponseSchema>;
