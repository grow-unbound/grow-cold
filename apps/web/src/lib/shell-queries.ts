'use client';

import {
  CheckLotNumberResponseSchema,
  ConfirmReceiptAllocationRequestSchema,
  ConfirmReceiptAllocationResponseSchema,
  CreateCustomerRequestSchema,
  CreateCustomerResponseSchema,
  CreateLotRequestSchema,
  CreateLotResponseSchema,
  CreateOperationalPaymentRequestSchema,
  CreateOperationalPaymentResponseSchema,
  CreateReceiptRequestSchema,
  CreateReceiptResponseSchema,
  CreateStockDeliveryRequestSchema,
  CreateStockDeliveryResponseSchema,
  CreateWarehouseCashPaymentRequestSchema,
  CreateWarehouseCashPaymentResponseSchema,
  CustomerOutstandingResponseSchema,
  DashboardSummaryResponseSchema,
  GetLotResponseSchema,
  GetOperationalPaymentResponseSchema,
  GetReceiptResponseSchema,
  ListCustomersResponseSchema,
  ListLocationsResponseSchema,
  ListLotsResponseSchema,
  ListOutstandingAllocatableResponseSchema,
  ListPaymentTypesResponseSchema,
  ListProductsResponseSchema,
  ListReceiptsResponseSchema,
  MoneyTabMovementsResponseSchema,
  MoneyTabSummaryResponseSchema,
  PartiesListResponseSchema,
  PartiesReceivablesSummarySchema,
  PartyDetailResponseSchema,
  RecordDeliveryRequestSchema,
  RecordDeliveryResponseSchema,
  StockTabMovementsResponseSchema,
  StockTabSummaryResponseSchema,
  StockTabListLocationsResponseSchema,
  SuggestLotNumberResponseSchema,
  UpdateLotRequestSchema,
  UpdateLotResponseSchema,
  UpdateOperationalPaymentRequestSchema,
  UpdateOperationalPaymentResponseSchema,
  UpdateReceiptRequestSchema,
  UpdateReceiptResponseSchema,
  checkLotNumberHttpPath,
  customerOutstandingHttpPath,
  customerSchema,
  dashboardSummaryHttpPath,
  fetchTransactionDetailPayload,
  getOperationalPaymentHttpPath,
  getReceiptHttpPath,
  listCustomersHttpPath,
  listLocationsHttpPath,
  listLocationsPath,
  listLotsHttpPath,
  listOperationalPaymentsHttpPath,
  listPaymentTypesHttpPath,
  listProductsHttpPath,
  listReceiptsHttpPath,
  moneyMovementsPath,
  moneyPaymentsPath,
  moneySummaryPath,
  outstandingAllocatableHttpPath,
  partiesListPath,
  partiesReceivablesPath,
  receiptConfirmAllocationHttpPath,
  stockDeliveriesPath,
  stockMovementsPath,
  stockSummaryPath,
  suggestLotNumberHttpPath,
} from '@growcold/shared';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import {
  ChargesBootstrapResponseSchema,
  ChargesBootstrapRowSchema,
  LotDeliveriesResponseSchema,
  SaveChargesRequestSchema,
  SaveChargesResponseSchema,
} from '@/lib/charges-api-schemas';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';

type SaveChargesInput = z.infer<typeof SaveChargesRequestSchema>;

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

export function useDashboardSummary(warehouseId: string | null) {
  return useQuery({
    queryKey: ['dashboard', 'summary', warehouseId],
    enabled: Boolean(warehouseId),
    queryFn: async () => {
      const u = new URL(dashboardSummaryHttpPath, window.location.origin);
      u.searchParams.set('warehouseId', warehouseId!);
      return parseRes(await fetch(u.toString()), DashboardSummaryResponseSchema);
    },
  });
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
        StockTabListLocationsResponseSchema,
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
      parseRes(await fetch(`${window.location.origin}/api/lots/${lotId}`), GetLotResponseSchema),
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

export function useLocationsList(warehouseId: string | null) {
  return useQuery({
    queryKey: ['locations', warehouseId],
    enabled: Boolean(warehouseId),
    queryFn: async () => {
      const u = new URL(listLocationsHttpPath, window.location.origin);
      u.searchParams.set('warehouseId', warehouseId!);
      return parseRes(await fetch(u.toString()), ListLocationsResponseSchema);
    },
  });
}

export function useLodgementChargePreview(
  warehouseId: string | null,
  productId: string | null,
  originalBags: number,
  queryEnabled: boolean,
) {
  const previewSchema = z.object({
    data: z.object({
      charge_rows: z.array(ChargesBootstrapRowSchema),
    }),
  });
  return useQuery({
    queryKey: ['lodgement-charge-preview', warehouseId, productId, originalBags],
    enabled: Boolean(warehouseId && productId) && queryEnabled && originalBags > 0,
    queryFn: async () => {
      const u = new URL(
        `${window.location.origin}/api/products/${productId}/lodgement-charge-preview`,
      );
      u.searchParams.set('warehouseId', warehouseId!);
      u.searchParams.set('originalBags', String(originalBags));
      return parseRes(await fetch(u.toString()), previewSchema);
    },
  });
}

export function useSuggestLotNumber(warehouseId: string | null, bagCount: number, queryEnabled: boolean) {
  return useQuery({
    queryKey: ['lots', 'suggest', warehouseId, bagCount],
    enabled: Boolean(warehouseId) && bagCount > 0 && queryEnabled,
    queryFn: async () => {
      const u = new URL(suggestLotNumberHttpPath, window.location.origin);
      u.searchParams.set('warehouseId', warehouseId!);
      u.searchParams.set('bagCount', String(bagCount));
      return parseRes(await fetch(u.toString()), SuggestLotNumberResponseSchema);
    },
  });
}

export async function checkLotNumberAvailable(
  warehouseId: string,
  lotNumber: string,
  excludeLotId?: string,
): Promise<boolean> {
  const u = new URL(checkLotNumberHttpPath, window.location.origin);
  u.searchParams.set('warehouseId', warehouseId);
  u.searchParams.set('lotNumber', lotNumber);
  if (excludeLotId) u.searchParams.set('excludeLotId', excludeLotId);
  const r = await parseRes(await fetch(u.toString()), CheckLotNumberResponseSchema);
  return r.available;
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

export function useUpdateLot(warehouseId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { lotId: string; body: z.infer<typeof UpdateLotRequestSchema> }) => {
      const parsed = UpdateLotRequestSchema.parse(args.body);
      const res = await fetch(`${window.location.origin}/api/lots/${args.lotId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      return parseRes(res, UpdateLotResponseSchema);
    },
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: ['lots', warehouseId] });
      void qc.invalidateQueries({ queryKey: ['lots', 'detail', v.lotId] });
      void qc.invalidateQueries({ queryKey: ['dashboard', 'summary', warehouseId] });
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

function outstandingAllocatableUrl(warehouseId: string, customerId: string): string {
  const u = new URL(outstandingAllocatableHttpPath, window.location.origin);
  u.searchParams.set('warehouseId', warehouseId);
  u.searchParams.set('customerId', customerId);
  return u.toString();
}

export function useOutstandingAllocatable(warehouseId: string | null, customerId: string | null) {
  return useQuery({
    queryKey: ['outstanding-allocatable', warehouseId, customerId],
    enabled: Boolean(warehouseId && customerId),
    staleTime: 60_000,
    queryFn: async () =>
      parseRes(
        await fetch(outstandingAllocatableUrl(warehouseId!, customerId!)),
        ListOutstandingAllocatableResponseSchema,
      ),
  });
}

export function useReceiptDetail(receiptId: string | null) {
  return useQuery({
    queryKey: ['receipts', 'detail', receiptId],
    enabled: Boolean(receiptId),
    queryFn: async () =>
      parseRes(
        await fetch(`${window.location.origin}${getReceiptHttpPath(receiptId!)}`),
        GetReceiptResponseSchema,
      ),
  });
}

export function useUpdateReceipt(warehouseId: string | null, receiptId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: z.infer<typeof UpdateReceiptRequestSchema>) => {
      const parsed = UpdateReceiptRequestSchema.parse(body);
      const res = await fetch(`${window.location.origin}${getReceiptHttpPath(receiptId!)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      return parseRes(res, UpdateReceiptResponseSchema);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['receipts', warehouseId] });
      void qc.invalidateQueries({ queryKey: ['receipts', 'detail', receiptId] });
      void qc.invalidateQueries({ queryKey: ['dashboard', 'summary', warehouseId] });
    },
  });
}

export function useConfirmReceiptAllocation(warehouseId: string | null, receiptId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: z.infer<typeof ConfirmReceiptAllocationRequestSchema>) => {
      const parsed = ConfirmReceiptAllocationRequestSchema.parse(body);
      const res = await fetch(`${window.location.origin}${receiptConfirmAllocationHttpPath(receiptId!)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      return parseRes(res, ConfirmReceiptAllocationResponseSchema);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['receipts', warehouseId] });
      void qc.invalidateQueries({ queryKey: ['receipts', 'detail', receiptId] });
      void qc.invalidateQueries({ queryKey: ['outstanding-allocatable', warehouseId] });
      void qc.invalidateQueries({ queryKey: ['dashboard', 'summary', warehouseId] });
    },
  });
}

export function useLotDeliveries(lotId: string | null, queryEnabled = true) {
  return useQuery({
    queryKey: ['lots', lotId, 'deliveries'],
    enabled: Boolean(lotId) && queryEnabled,
    queryFn: async () =>
      parseRes(
        await fetch(`${window.location.origin}/api/lots/${lotId}/deliveries`),
        LotDeliveriesResponseSchema,
      ),
  });
}

export function chargesBootstrapUrl(
  lotId: string,
  movement: 'lodgement' | 'delivery',
  deliveryId: string | null,
  forNewDelivery = false,
): string {
  const u = new URL(`${window.location.origin}/api/lots/${lotId}/charges/bootstrap`);
  u.searchParams.set('movement', forNewDelivery ? 'lodgement' : movement);
  if (forNewDelivery) {
    u.searchParams.set('forNewDelivery', '1');
    return u.toString();
  }
  if (movement === 'delivery' && deliveryId) u.searchParams.set('deliveryId', deliveryId);
  return u.toString();
}

export function useChargesBootstrap(
  lotId: string | null,
  movement: 'lodgement' | 'delivery',
  deliveryId: string | null,
  opts?: { enabled?: boolean; forNewDelivery?: boolean },
) {
  const forNewDelivery = opts?.forNewDelivery ?? false;
  const enabledExtra = opts?.enabled ?? true;
  const enabled =
    Boolean(lotId) &&
    enabledExtra &&
    (forNewDelivery || movement !== 'delivery' || Boolean(deliveryId));

  const movKey = forNewDelivery ? 'record' : movement;
  const delKey = forNewDelivery ? 'none' : deliveryId ?? 'none';

  return useQuery({
    queryKey: ['charges-bootstrap', lotId, movKey, delKey, forNewDelivery ? 'new-del' : ''],
    enabled,
    staleTime: 30_000,
    queryFn: async () =>
      parseRes(
        await fetch(chargesBootstrapUrl(lotId!, movement, deliveryId, forNewDelivery)),
        ChargesBootstrapResponseSchema,
      ),
  });
}

export function useSaveCharges(warehouseId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ lotId, body }: { lotId: string; body: SaveChargesInput }) => {
      const parsed = SaveChargesRequestSchema.parse(body);
      const res = await fetch(`${window.location.origin}/api/lots/${lotId}/charges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      return parseRes(res, SaveChargesResponseSchema);
    },
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: ['lots', warehouseId] });
      void qc.invalidateQueries({ queryKey: ['lots', 'detail', variables.lotId] });
      void qc.invalidateQueries({
        queryKey: ['charges-bootstrap', variables.lotId],
      });
      void qc.invalidateQueries({ queryKey: ['dashboard', 'summary', warehouseId] });
    },
  });
}

export function usePaymentTypes(warehouseId: string | null) {
  return useQuery({
    queryKey: ['payment-types', warehouseId],
    enabled: Boolean(warehouseId),
    queryFn: async () =>
      parseRes(await fetch(`${window.location.origin}${listPaymentTypesHttpPath}`), ListPaymentTypesResponseSchema),
  });
}

export function useOperationalPaymentDetail(id: string | null) {
  return useQuery({
    queryKey: ['operational-payments', 'detail', id],
    enabled: Boolean(id),
    queryFn: async () =>
      parseRes(
        await fetch(`${window.location.origin}${getOperationalPaymentHttpPath(id!)}`),
        GetOperationalPaymentResponseSchema,
      ),
  });
}

export function useCreateOperationalPayment(warehouseId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: z.infer<typeof CreateOperationalPaymentRequestSchema>) => {
      const parsed = CreateOperationalPaymentRequestSchema.parse(body);
      const res = await fetch(`${window.location.origin}${listOperationalPaymentsHttpPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      return parseRes(res, CreateOperationalPaymentResponseSchema);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['operational-payments', warehouseId] });
      void qc.invalidateQueries({ queryKey: ['dashboard', 'summary', warehouseId] });
    },
  });
}

export function useUpdateOperationalPayment(warehouseId: string | null, paymentId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: z.infer<typeof UpdateOperationalPaymentRequestSchema>) => {
      const parsed = UpdateOperationalPaymentRequestSchema.parse(body);
      const res = await fetch(`${window.location.origin}${getOperationalPaymentHttpPath(paymentId!)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      return parseRes(res, UpdateOperationalPaymentResponseSchema);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['operational-payments', warehouseId] });
      void qc.invalidateQueries({ queryKey: ['operational-payments', 'detail', paymentId] });
      void qc.invalidateQueries({ queryKey: ['dashboard', 'summary', warehouseId] });
    },
  });
}

export function useCustomerOutstanding(customerId: string | null, warehouseId: string | null) {
  return useQuery({
    queryKey: ['customers', customerId, 'outstanding', warehouseId],
    enabled: Boolean(customerId && warehouseId),
    staleTime: 30_000,
    queryFn: async () => {
      const u = new URL(`${window.location.origin}${customerOutstandingHttpPath(customerId!)}`);
      u.searchParams.set('warehouseId', warehouseId!);
      return parseRes(await fetch(u.toString()), CustomerOutstandingResponseSchema);
    },
  });
}

type RecordDeliveryInput = z.infer<typeof RecordDeliveryRequestSchema>;

export function useRecordDelivery(warehouseId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { lotId: string; body: RecordDeliveryInput }) => {
      const parsed = RecordDeliveryRequestSchema.parse(args.body);
      const res = await fetch(`${window.location.origin}/api/lots/${args.lotId}/deliveries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      return parseRes(res, RecordDeliveryResponseSchema);
    },
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: ['lots', warehouseId] });
      void qc.invalidateQueries({ queryKey: ['lots', 'detail', variables.lotId] });
      void qc.invalidateQueries({ queryKey: ['lots', variables.lotId, 'deliveries'] });
      void qc.invalidateQueries({ queryKey: ['charges-bootstrap', variables.lotId] });
      void qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === 'customers' && q.queryKey[2] === 'outstanding',
      });
      void qc.invalidateQueries({ queryKey: ['dashboard', 'summary', warehouseId] });
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
