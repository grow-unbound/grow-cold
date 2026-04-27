import type { SupabaseClient } from '@supabase/supabase-js';
import type { MoneyTabMovementRowDto } from '../api/endpoints/money-tab';
import type { Database } from '../api/types';
import { toISODate } from '../command-center/date-ranges';

type SB = SupabaseClient<Database>;

/** Keep PostgREST `.in()` URLs under ~16KB (undici / Supabase limits). */
const IN_CHUNK = 100;

function chunkFlat(ids: string[]): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < ids.length; i += IN_CHUNK) out.push(ids.slice(i, i + IN_CHUNK));
  return out;
}

async function lotIdsForWarehouse(client: SB, warehouseId: string): Promise<string[]> {
  const { data, error } = await client.from('lots').select('id').eq('warehouse_id', warehouseId);
  if (error) throw error;
  return (data ?? []).map((r) => r.id);
}

async function sumUnpaidChargesForWarehouse(client: SB, lotIds: string[]): Promise<number> {
  if (lotIds.length === 0) return 0;
  let sum = 0;
  for (const part of chunkFlat(lotIds)) {
    const { data, error } = await client
      .from('transaction_charges')
      .select('charge_amount')
      .in('lot_id', part)
      .eq('is_paid', false);
    if (error) throw error;
    for (const r of data ?? []) {
      sum += Number(r.charge_amount);
    }
  }
  return sum;
}

export interface MoneyTabSummary {
  cashBalance: number;
  receivedToday: number;
  paidToday: number;
  payablePending: number;
  updatedAt: string;
}

export async function fetchMoneyTabSummary(
  client: SB,
  warehouseId: string,
  today: Date = new Date(),
): Promise<MoneyTabSummary> {
  const todayStr = toISODate(today);
  const lotIds = await lotIdsForWarehouse(client, warehouseId);

  const [receiptsAll, paymentsAll, receiptsToday, paymentsToday, payablePending] = await Promise.all([
    client.from('customer_receipts').select('total_amount').eq('warehouse_id', warehouseId),
    client.from('warehouse_cash_payments').select('total_amount').eq('warehouse_id', warehouseId),
    client
      .from('customer_receipts')
      .select('total_amount')
      .eq('warehouse_id', warehouseId)
      .eq('receipt_date', todayStr),
    client
      .from('warehouse_cash_payments')
      .select('total_amount')
      .eq('warehouse_id', warehouseId)
      .eq('payment_date', todayStr),
    sumUnpaidChargesForWarehouse(client, lotIds),
  ]);

  if (receiptsAll.error) throw receiptsAll.error;
  if (paymentsAll.error) throw paymentsAll.error;
  if (receiptsToday.error) throw receiptsToday.error;
  if (paymentsToday.error) throw paymentsToday.error;

  const receiptsSum = (receiptsAll.data ?? []).reduce((s, r) => s + Number(r.total_amount), 0);
  const paymentsSum = (paymentsAll.data ?? []).reduce((s, r) => s + Number(r.total_amount), 0);
  const receivedToday = (receiptsToday.data ?? []).reduce((s, r) => s + Number(r.total_amount), 0);
  const paidToday = (paymentsToday.data ?? []).reduce((s, r) => s + Number(r.total_amount), 0);

  return {
    cashBalance: receiptsSum - paymentsSum,
    receivedToday,
    paidToday,
    payablePending,
    updatedAt: new Date().toISOString(),
  };
}

export interface MoneyTabMovementsPage {
  items: MoneyTabMovementRowDto[];
  nextCursor: string | null;
  hasMore: boolean;
}

type RpcMoneyRow = {
  kind: string;
  event_id: string;
  tx_date: string;
  created_at: string;
  total_amount: number;
  payment_method: string | null;
  counterparty: string;
  notes: string | null;
};

function mapMoneyRpcRow(r: RpcMoneyRow): MoneyTabMovementRowDto {
  const kind = r.kind === 'payment' ? 'payment' : 'receipt';
  const n = r.notes?.trim() ?? '';
  const firstLine = n ? n.split('\n')[0] ?? '' : '';
  const detailLine =
    firstLine.length > 0 ? (firstLine.length > 120 ? `${firstLine.slice(0, 117)}...` : firstLine) : kind === 'receipt' ? 'Receipt' : 'Payment';
  return {
    kind,
    id: r.event_id,
    transactionDate: r.tx_date,
    createdAt: r.created_at,
    counterparty: r.counterparty,
    amount: Number(r.total_amount),
    paymentMethod: r.payment_method,
    notes: r.notes,
    detailLine,
  };
}

export interface MoneyMovementCursor {
  tx_date: string;
  created_at: string;
  kind: 'receipt' | 'payment';
  event_id: string;
}

function utf8ToBase64Url(s: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(s, 'utf8').toString('base64url');
  }
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToUtf8(raw: string): string {
  const pad = raw.length % 4 === 0 ? '' : '='.repeat(4 - (raw.length % 4));
  const b64 = raw.replace(/-/g, '+').replace(/_/g, '/') + pad;
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(b64, 'base64').toString('utf8');
  }
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function encodeMoneyMovementCursor(c: MoneyMovementCursor): string {
  return utf8ToBase64Url(JSON.stringify(c));
}

export function decodeMoneyMovementCursor(raw: string): MoneyMovementCursor | null {
  try {
    const json = base64UrlToUtf8(raw);
    const v = JSON.parse(json) as MoneyMovementCursor;
    if (
      typeof v.tx_date === 'string' &&
      typeof v.created_at === 'string' &&
      (v.kind === 'receipt' || v.kind === 'payment') &&
      typeof v.event_id === 'string'
    ) {
      return v;
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchMoneyTabMovements(
  client: SB,
  warehouseId: string,
  limit: number,
  cursor: string | null,
): Promise<MoneyTabMovementsPage> {
  const lim = Math.min(Math.max(limit, 1), 100);
  const cur = cursor ? decodeMoneyMovementCursor(cursor) : null;

  const { data, error } = await client.rpc('list_money_movements', {
    p_warehouse_id: warehouseId,
    p_limit: lim + 1,
    p_cursor_tx_date: cur?.tx_date ?? undefined,
    p_cursor_created_at: cur?.created_at ?? undefined,
    p_cursor_kind: cur?.kind ?? undefined,
    p_cursor_event_id: cur?.event_id ?? undefined,
  });

  if (error) throw error;

  const rows = (data ?? []) as RpcMoneyRow[];
  const hasMore = rows.length > lim;
  const slice = hasMore ? rows.slice(0, lim) : rows;
  const items = slice.map((r) => mapMoneyRpcRow(r));

  const last = slice[slice.length - 1];
  let nextCursor: string | null = null;
  if (hasMore && last) {
    const lk = last.kind === 'payment' ? 'payment' : 'receipt';
    nextCursor = encodeMoneyMovementCursor({
      tx_date: last.tx_date,
      created_at: last.created_at,
      kind: lk,
      event_id: last.event_id,
    });
  }

  return { items, nextCursor, hasMore };
}
