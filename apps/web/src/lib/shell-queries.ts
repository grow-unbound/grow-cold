'use client';

import {
  CommandCenterActivityResponseSchema,
  CommandCenterAlertsResponseSchema,
  CommandCenterMoneyResponseSchema,
  CommandCenterPartiesResponseSchema,
  CommandCenterSnapshotResponseSchema,
  CommandCenterStockResponseSchema,
  CreateCustomerRequestSchema,
  CreateCustomerResponseSchema,
  CreateLotRequestSchema,
  CreateLotResponseSchema,
  CreateReceiptRequestSchema,
  CreateReceiptResponseSchema,
  CreateStockDeliveryRequestSchema,
  CreateStockDeliveryResponseSchema,
  GetLotDetailResponseSchema,
  ListCustomersResponseSchema,
  ListLocationsResponseSchema,
  ListLotsResponseSchema,
  ListProductsResponseSchema,
  ListReceiptsResponseSchema,
  MoneyTabMovementsResponseSchema,
  MoneyTabSummaryResponseSchema,
  StockTabMovementsResponseSchema,
  StockTabSummaryResponseSchema,
  CreateWarehouseCashPaymentRequestSchema,
  CreateWarehouseCashPaymentResponseSchema,
  commandCenterActivityPath,
  commandCenterAlertsPath,
  commandCenterMoneyPath,
  commandCenterPartiesPath,
  commandCenterSnapshotPath,
  commandCenterStockPath,
  listCustomersHttpPath,
  listLotsHttpPath,
  listProductsHttpPath,
  listReceiptsHttpPath,
  stockDeliveriesPath,
  stockMovementsPath,
  stockSummaryPath,
  listLocationsPath,
  moneyMovementsPath,
  moneySummaryPath,
  moneyPaymentsPath,
  partiesListPath,
  partiesReceivablesPath,
  PartiesListResponseSchema,
  PartiesReceivablesSummarySchema,
  PartyDetailResponseSchema,
  customerSchema,
  fetchTransactionDetailPayload,
  type HomeTimeFilter,
} from '@growcold/shared';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import { useDebouncedValue } from '@/lib/use-debounced-value';

async function readError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { error?: string };
    return j.error ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

async function parseRes<T>(res: Response, schema: z.ZodType<T>): Promise<T> {
  if (!res.ok) throw new Error(await readError(res));
  return schema.parse(await res.json());
}

function lotsListUrl(warehouseId: string, status?: string): string {
  const u = new URL(listLotsHttpPath, window.location.origin);
  u.searchParams.set('warehouseId', warehouseId);
  if (status) u.searchParams.set('status', status);
  return u.toString();
}

function commandCenterUrl(path: string, params: Record<string, string>): string {
  const u = new URL(path, window.location.origin);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  return u.toString();
}

function stockUrl(path: string, params: Record<string, string | undefined>): string {
  const u = new URL(path, window.location.origin);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') u.searchParams.set(k, v);
  }
  return u.toString();
}

function partiesUrl(path: string, params: Record<string, string | undefined>): string {
  const u = new URL(path, window.location.origin);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) u.searchParams.set(k, v);
  }
  return u.toString();
}

export function useCommandCenterSnapshot(warehouseId: string | null) {
  return useQuery({
    queryKey: ['command-center', 'snapshot', warehouseId],
    enabled: Boolean(warehouseId),
    staleTime: 60_000,
    queryFn: async () =>
      parseRes(
        await fetch(commandCenterUrl(commandCenterSnapshotPath, { warehouseId: warehouseId! })),
        CommandCenterSnapshotResponseSchema,
      ),
  });
}

export function useCommandCenterActivity(warehouseId: string | null) {
  return useQuery({
    queryKey: ['command-center', 'activity', warehouseId],
    enabled: Boolean(warehouseId),
    staleTime: 60_000,
    queryFn: async () =>
      parseRes(
        await fetch(commandCenterUrl(commandCenterActivityPath, { warehouseId: warehouseId! })),
        CommandCenterActivityResponseSchema,
      ),
  });
}

export function useCommandCenterAlerts(warehouseId: string | null) {
  return useQuery({
    queryKey: ['command-center', 'alerts', warehouseId],
    enabled: Boolean(warehouseId),
    staleTime: 120_000,
    queryFn: async () =>
      parseRes(
        await fetch(commandCenterUrl(commandCenterAlertsPath, { warehouseId: warehouseId! })),
        CommandCenterAlertsResponseSchema,
      ),
  });
}

export function useCommandCenterStockPerformance(warehouseId: string | null, filter: HomeTimeFilter) {
  const debounced = useDebouncedValue(filter, 300);
  return useQuery({
    queryKey: ['command-center', 'stock', warehouseId, debounced],
    enabled: Boolean(warehouseId),
    staleTime: 60_000,
    queryFn: async () =>
      parseRes(
        await fetch(
          commandCenterUrl(commandCenterStockPath, {
            warehouseId: warehouseId!,
            filter: debounced,
          }),
        ),
        CommandCenterStockResponseSchema,
      ),
  });
}

export function useCommandCenterMoneyPerformance(warehouseId: string | null, filter: HomeTimeFilter) {
  const debounced = useDebouncedValue(filter, 300);
  return useQuery({
    queryKey: ['command-center', 'money', warehouseId, debounced],
    enabled: Boolean(warehouseId),
    staleTime: 60_000,
    queryFn: async () =>
      parseRes(
        await fetch(
          commandCenterUrl(commandCenterMoneyPath, {
            warehouseId: warehouseId!,
            filter: debounced,
          }),
        ),
        CommandCenterMoneyResponseSchema,
      ),
  });
}

export function useCommandCenterPartiesPerformance(warehouseId: string | null, filter: HomeTimeFilter) {
  const debounced = useDebouncedValue(filter, 300);
  return useQuery({
    queryKey: ['command-center', 'parties', warehouseId, debounced],
    enabled: Boolean(warehouseId),
    staleTime: 60_000,
    queryFn: async () =>
      parseRes(
        await fetch(
          commandCenterUrl(commandCenterPartiesPath, {
            warehouseId: warehouseId!,
            filter: debounced,
          }),
        ),
        CommandCenterPartiesResponseSchema,
      ),
  });
}

export function useStockSummary(warehouseId: string | null) {
  return useQuery({
    queryKey: ['stock', 'summary', warehouseId],
    enabled: Boolean(warehouseId),
    staleTime: 45_000,
    queryFn: async () =>
      parseRes(
        await fetch(stockUrl(stockSummaryPath, { warehouseId: warehouseId! })),
        StockTabSummaryResponseSchema,
      ),
  });
}

export function useStockMovements(warehouseId: string | null, pageSize = 20) {
  return useInfiniteQuery({
    queryKey: ['stock', 'movements', warehouseId, pageSize],
    enabled: Boolean(warehouseId),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) =>
      parseRes(
        await fetch(
          stockUrl(stockMovementsPath, {
            warehouseId: warehouseId!,
            limit: String(pageSize),
            cursor: pageParam ?? undefined,
          }),
        ),
        StockTabMovementsResponseSchema,
      ),
    getNextPageParam: (last) => (last.hasMore && last.nextCursor ? last.nextCursor : undefined),
  });
}

export function usePartiesReceivables(warehouseId: string | null) {
  return useQuery({
    queryKey: ['parties', 'receivables', warehouseId],
    enabled: Boolean(warehouseId),
    staleTime: 45_000,
    queryFn: async () =>
      parseRes(
        await fetch(
          partiesUrl(partiesReceivablesPath, {
            warehouseId: warehouseId!,
          }),
        ),
        PartiesReceivablesSummarySchema,
      ),
  });
}

export function usePartiesList(
  warehouseId: string | null,
  filter: string,
  search: string,
  pageSize = 50,
) {
  return useInfiniteQuery({
    queryKey: ['parties', 'list', warehouseId, filter, search, pageSize],
    enabled: Boolean(warehouseId),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const off = Number(pageParam);
      return parseRes(
        await fetch(
          partiesUrl(partiesListPath, {
            warehouseId: warehouseId!,
            filter,
            q: search,
            limit: String(pageSize),
            offset: String(Number.isNaN(off) ? 0 : off),
          }),
        ),
        PartiesListResponseSchema,
      );
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.reduce((s, p) => s + p.items.length, 0);
    },
  });
}

export function useMoneySummary(warehouseId: string | null) {
  return useQuery({
    queryKey: ['money', 'summary', warehouseId],
    enabled: Boolean(warehouseId),
    staleTime: 45_000,
    queryFn: async () =>
      parseRes(
        await fetch(stockUrl(moneySummaryPath, { warehouseId: warehouseId! })),
        MoneyTabSummaryResponseSchema,
      ),
  });
}

export function useMoneyMovements(warehouseId: string | null, pageSize = 20) {
  return useInfiniteQuery({
    queryKey: ['money', 'movements', warehouseId, pageSize],
    enabled: Boolean(warehouseId),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) =>
      parseRes(
        await fetch(
          stockUrl(moneyMovementsPath, {
            warehouseId: warehouseId!,
            limit: String(pageSize),
            cursor: pageParam ?? undefined,
          }),
        ),
        MoneyTabMovementsResponseSchema,
      ),
    getNextPageParam: (last) => (last.hasMore && last.nextCursor ? last.nextCursor : undefined),
  });
}

export function useCreateMoneyPayment(warehouseId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: z.infer<typeof CreateWarehouseCashPaymentRequestSchema>) => {
      const parsed = CreateWarehouseCashPaymentRequestSchema.parse(body);
      const res = await fetch(
        (() => {
          const u = new URL(moneyPaymentsPath, window.location.origin);
          return u.toString();
        })(),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed),
        },
      );
      return parseRes(res, CreateWarehouseCashPaymentResponseSchema);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['money', warehouseId] });
      void qc.invalidateQueries({ queryKey: ['command-center'] });
    },
  });
}

export function useStockLocations(warehouseId: string | null) {
  return useQuery({
    queryKey: ['stock', 'locations', warehouseId],
    enabled: Boolean(warehouseId),
    queryFn: async () =>
      parseRes(
        await fetch(stockUrl(listLocationsPath, { warehouseId: warehouseId! })),
        ListLocationsResponseSchema,
      ),
  });
}

export function useCreateStockDelivery(warehouseId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: z.infer<typeof CreateStockDeliveryRequestSchema>) => {
      const parsed = CreateStockDeliveryRequestSchema.parse(body);
      const res = await fetch(stockDeliveriesPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      return parseRes(res, CreateStockDeliveryResponseSchema);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['stock', warehouseId] });
      void qc.invalidateQueries({ queryKey: ['lots', warehouseId] });
      void qc.invalidateQueries({ queryKey: ['command-center'] });
    },
  });
}

export function useLotsList(warehouseId: string | null, status?: string) {
  return useQuery({
    queryKey: ['lots', warehouseId, status ?? 'all'],
    enabled: Boolean(warehouseId),
    queryFn: async () =>
      parseRes(await fetch(lotsListUrl(warehouseId!, status)), ListLotsResponseSchema),
  });
}

export function useLotDetail(lotId: string | null) {
  return useQuery({
    queryKey: ['lots', 'detail', lotId],
    enabled: Boolean(lotId),
    queryFn: async () =>
      parseRes(await fetch(`${window.location.origin}/api/lots/${lotId}`), GetLotDetailResponseSchema),
  });
}

export function useCustomersList(warehouseId: string | null) {
  return useQuery({
    queryKey: ['customers', warehouseId],
    enabled: Boolean(warehouseId),
    queryFn: async () => {
      const u = new URL(listCustomersHttpPath, window.location.origin);
      u.searchParams.set('warehouseId', warehouseId!);
      return parseRes(await fetch(u.toString()), ListCustomersResponseSchema);
    },
  });
}

const GetCustomerResponseSchema = z.object({
  data: customerSchema,
});

export function useCustomerDetail(warehouseId: string | null, customerId: string | null) {
  return useQuery({
    queryKey: ['customers', 'detail', warehouseId, customerId],
    enabled: Boolean(warehouseId) && Boolean(customerId),
    queryFn: async () => {
      const u = new URL(`/api/customers/${customerId}`, window.location.origin);
      u.searchParams.set('warehouseId', warehouseId!);
      return parseRes(await fetch(u.toString()), GetCustomerResponseSchema);
    },
  });
}

/** Party (customer) detail with lots + paginated receipts (pages merged in `select`). */
export function usePartyDetail(warehouseId: string | null, customerId: string | null) {
  return useInfiniteQuery({
    queryKey: ['customers', 'party', warehouseId, customerId],
    enabled: Boolean(warehouseId) && Boolean(customerId),
    initialPageParam: 0,
    staleTime: 60_000,
    queryFn: async ({ pageParam }) => {
      const u = new URL(`/api/customers/${customerId}/party`, window.location.origin);
      u.searchParams.set('warehouseId', warehouseId!);
      u.searchParams.set('receiptsOffset', String(pageParam));
      u.searchParams.set('receiptsLimit', '50');
      return parseRes(await fetch(u.toString()), PartyDetailResponseSchema);
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.data.receiptsHasMore) return undefined;
      return allPages.reduce((sum, p) => sum + p.data.receipts.length, 0);
    },
    select: (data) => {
      const base = data.pages[data.pages.length - 1]!.data;
      const mergedReceipts = data.pages.flatMap((p) => p.data.receipts);
      return {
        ...base,
        receipts: mergedReceipts,
        receiptsHasMore: data.pages[data.pages.length - 1]!.data.receiptsHasMore,
      };
    },
  });
}

export function useProductsList() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const u = new URL(listProductsHttpPath, window.location.origin);
      return parseRes(await fetch(u.toString()), ListProductsResponseSchema);
    },
  });
}

export function useReceiptsList(warehouseId: string | null) {
  return useQuery({
    queryKey: ['receipts', warehouseId],
    enabled: Boolean(warehouseId),
    queryFn: async () => {
      const u = new URL(listReceiptsHttpPath, window.location.origin);
      u.searchParams.set('warehouseId', warehouseId!);
      return parseRes(await fetch(u.toString()), ListReceiptsResponseSchema);
    },
  });
}

export function useCreateCustomer(warehouseId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: z.infer<typeof CreateCustomerRequestSchema>) => {
      const parsed = CreateCustomerRequestSchema.parse(body);
      const res = await fetch(listCustomersHttpPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      return parseRes(res, CreateCustomerResponseSchema);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['customers', warehouseId] });
      void qc.invalidateQueries({ queryKey: ['parties', warehouseId] });
    },
  });
}

export function useCreateLot(warehouseId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: z.infer<typeof CreateLotRequestSchema>) => {
      const parsed = CreateLotRequestSchema.parse(body);
      const res = await fetch(listLotsHttpPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      return parseRes(res, CreateLotResponseSchema);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['lots', warehouseId] });
      void qc.invalidateQueries({ queryKey: ['stock', warehouseId] });
      void qc.invalidateQueries({ queryKey: ['command-center'] });
    },
  });
}

export function useCreateReceipt(warehouseId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: z.infer<typeof CreateReceiptRequestSchema>) => {
      const parsed = CreateReceiptRequestSchema.parse(body);
      const res = await fetch(listReceiptsHttpPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      return parseRes(res, CreateReceiptResponseSchema);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['receipts', warehouseId] });
      void qc.invalidateQueries({ queryKey: ['money', warehouseId] });
      void qc.invalidateQueries({ queryKey: ['command-center'] });
    },
  });
}

const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useTransactionDetail(kind: string | null, id: string | null) {
  return useQuery({
    queryKey: ['transaction-detail', kind, id],
    enabled: Boolean(
      kind && id && (kind === 'receipt' || kind === 'payment') && uuidRe.test(id),
    ),
    queryFn: async () => {
      const supabase = createBrowserSupabaseClient();
      return fetchTransactionDetailPayload(supabase, kind as 'receipt' | 'payment', id!);
    },
    staleTime: 60_000,
  });
}
