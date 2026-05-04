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
  RecordDeliveryRequestSchema,
  RecordDeliveryResponseSchema,
  SuggestLotNumberResponseSchema,
  UpdateLotRequestSchema,
  UpdateLotResponseSchema,
  UpdateOperationalPaymentRequestSchema,
  UpdateOperationalPaymentResponseSchema,
  UpdateReceiptRequestSchema,
  UpdateReceiptResponseSchema,
  customerOutstandingHttpPath,
  checkLotNumberHttpPath,
  dashboardSummaryHttpPath,
  getOperationalPaymentHttpPath,
  getReceiptHttpPath,
  listCustomersHttpPath,
  listLocationsHttpPath,
  listLotsHttpPath,
  listOperationalPaymentsHttpPath,
  listPaymentTypesHttpPath,
  listProductsHttpPath,
  listReceiptsHttpPath,
  outstandingAllocatableHttpPath,
  receiptConfirmAllocationHttpPath,
  suggestLotNumberHttpPath,
} from '@growcold/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { z } from 'zod';
import {
  ChargesBootstrapResponseSchema,
  LotDeliveriesResponseSchema,
  SaveChargesRequestSchema,
  SaveChargesResponseSchema,
} from '@/lib/charges-api-schemas';

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
      void qc.invalidateQueries({ queryKey: ['dashboard', 'summary', warehouseId] });
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
      void qc.invalidateQueries({ queryKey: ['dashboard', 'summary', warehouseId] });
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
