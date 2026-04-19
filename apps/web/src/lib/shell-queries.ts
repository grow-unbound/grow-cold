'use client';

import {
  CreateCustomerRequestSchema,
  CreateCustomerResponseSchema,
  CreateLotRequestSchema,
  CreateLotResponseSchema,
  CreateReceiptRequestSchema,
  CreateReceiptResponseSchema,
  DashboardSummaryResponseSchema,
  GetLotResponseSchema,
  ListCustomersResponseSchema,
  ListLotsResponseSchema,
  ListProductsResponseSchema,
  ListReceiptsResponseSchema,
  dashboardSummaryHttpPath,
  listCustomersHttpPath,
  listLotsHttpPath,
  listProductsHttpPath,
  listReceiptsHttpPath,
} from '@growcold/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { z } from 'zod';

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
