import { z } from 'zod';
import { transactionReceiptRowSchema } from './receipts';

export const dashboardSummaryHttpPath = '/api/dashboard/summary' as const;

export const DashboardSummaryRequestSchema = z.object({
  warehouseId: z.string().uuid(),
});

export type DashboardSummaryRequest = z.infer<typeof DashboardSummaryRequestSchema>;

export const DashboardSummaryQuerySchema = z.object({
  warehouseId: z.string().uuid(),
});

export const dashboardDeliveryRowSchema = z.object({
  id: z.string().uuid(),
  delivery_date: z.string(),
  num_bags_out: z.number().int().positive(),
  lot_number: z.string(),
  customer_name: z.string(),
  product_name: z.string(),
});

export type DashboardDeliveryRow = z.infer<typeof dashboardDeliveryRowSchema>;

export const lotCountsSchema = z.object({
  ACTIVE: z.number().int().nonnegative(),
  STALE: z.number().int().nonnegative(),
  DELIVERED: z.number().int().nonnegative(),
  CLEARED: z.number().int().nonnegative(),
  WRITTEN_OFF: z.number().int().nonnegative(),
  DISPUTED: z.number().int().nonnegative(),
});

export const DashboardSummaryResponseSchema = z.object({
  lot_counts: lotCountsSchema,
  total_lots: z.number().int().nonnegative(),
  recent_deliveries: z.array(dashboardDeliveryRowSchema),
  recent_receipts: z.array(transactionReceiptRowSchema),
});

export type DashboardSummaryResponse = z.infer<typeof DashboardSummaryResponseSchema>;
