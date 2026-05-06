import { z } from 'zod';

export const commandCenterBasePath = '/api/dashboard/command-center' as const;

export const commandCenterSnapshotPath = `${commandCenterBasePath}/snapshot` as const;
export const commandCenterActivityPath = `${commandCenterBasePath}/activity` as const;
export const commandCenterAlertsPath = `${commandCenterBasePath}/alerts` as const;
export const commandCenterStockPath = `${commandCenterBasePath}/stock` as const;
export const commandCenterMoneyPath = `${commandCenterBasePath}/money` as const;
export const commandCenterPartiesPath = `${commandCenterBasePath}/parties` as const;

export const HomeTimeFilterSchema = z.enum(['today', 'yesterday', 'week', 'month']);

export const CommandCenterWarehouseQuerySchema = z.object({
  warehouseId: z.string().uuid(),
});

export const CommandCenterPerformanceQuerySchema = z.object({
  warehouseId: z.string().uuid(),
  filter: HomeTimeFilterSchema,
});

const performanceSeriesPointSchema = z.object({
  label: z.string(),
  lodged: z.number(),
  delivered: z.number(),
});

export const CommandCenterSnapshotResponseSchema = z.object({
  cashBalance: z.number(),
  receivedToday: z.number(),
  paidToday: z.number(),
  totalBags: z.number().int(),
  totalLots: z.number().int(),
  staleLots: z.number().int(),
});

export const CommandCenterActivityResponseSchema = z.object({
  lodgementsCount: z.number().int(),
  lodgementsBags: z.number().int(),
  deliveriesCount: z.number().int(),
  deliveriesBags: z.number().int(),
  collectedAmount: z.number(),
  collectedCustomerCount: z.number().int(),
});

const alertNavSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('party'), customerId: z.string().uuid() }),
  z.object({ kind: z.literal('stock_stale') }),
  z.object({ kind: z.literal('money_pending') }),
]);

export const CommandCenterAlertItemSchema = z.object({
  id: z.string(),
  message: z.string(),
  nav: alertNavSchema,
});

export const CommandCenterAlertsResponseSchema = z.array(CommandCenterAlertItemSchema);

export const CommandCenterStockResponseSchema = z.object({
  lodgedBags: z.number(),
  lodgedLots: z.number().int(),
  deliveredBags: z.number(),
  deliveredLots: z.number().int(),
  avgBagsPerDay: z.number(),
  activeLotsCount: z.number().int(),
  prevLodgedBags: z.number(),
  prevDeliveredBags: z.number(),
  prevLodgedLots: z.number().int(),
  prevDeliveredLots: z.number().int(),
  prevAvgBagsPerDay: z.number(),
  prevActiveLots: z.number().int(),
  series: z.array(performanceSeriesPointSchema),
});

export const CommandCenterMoneyResponseSchema = z.object({
  collected: z.number(),
  paidOut: z.number(),
  net: z.number(),
  avgPerDay: z.number(),
  prevCollected: z.number(),
  prevPaidOut: z.number(),
  prevNet: z.number(),
  prevAvgPerDay: z.number(),
  series: z.array(performanceSeriesPointSchema),
});

export const CommandCenterPartiesResponseSchema = z.object({
  collections: z.number(),
  activeCustomers: z.number().int(),
  newCustomers: z.number().int(),
  paidInFull: z.number().int(),
  prevCollections: z.number(),
  prevActiveCustomers: z.number().int(),
  prevNewCustomers: z.number().int(),
  prevPaidInFull: z.number().int(),
  series: z.array(performanceSeriesPointSchema),
});

export type CommandCenterSnapshotResponse = z.infer<typeof CommandCenterSnapshotResponseSchema>;
export type CommandCenterActivityResponse = z.infer<typeof CommandCenterActivityResponseSchema>;
export type CommandCenterAlertItem = z.infer<typeof CommandCenterAlertItemSchema>;
export type CommandCenterStockResponse = z.infer<typeof CommandCenterStockResponseSchema>;
export type CommandCenterMoneyResponse = z.infer<typeof CommandCenterMoneyResponseSchema>;
export type CommandCenterPartiesResponse = z.infer<typeof CommandCenterPartiesResponseSchema>;
