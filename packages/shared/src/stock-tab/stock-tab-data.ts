import { differenceInCalendarDays, parseISO, startOfDay } from 'date-fns';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../api/types';
import { productGroupToEmoji } from './product-group-emoji';

type SB = SupabaseClient<Database>;

const STOCK_SUMMARY_STATUSES = ['ACTIVE', 'STALE'] as const;

export interface StockTabSummary {
  totalBags: number;
  totalLots: number;
  freshBags: number;
  agingBags: number;
  staleBags: number;
  updatedAt: string;
}

export interface StockTabMovementRow {
  kind: 'lodgement' | 'delivery';
  id: string;
  lotId: string;
  transactionDate: string;
  createdAt: string;
  customerCode: string;
  customerName: string;
  productName: string;
  productGroupName: string;
  productGroupEmoji: string;
  lotNumber: string;
  numBags: number;
}

export interface StockTabMovementsPage {
  items: StockTabMovementRow[];
  nextCursor: string | null;
  hasMore: boolean;
}

export async function fetchStockTabSummary(
  client: SB,
  warehouseId: string,
  today: Date = new Date(),
): Promise<StockTabSummary> {
  const { data, error } = await client
    .from('lots')
    .select('balance_bags, lodgement_date, status')
    .eq('warehouse_id', warehouseId)
    .in('status', [...STOCK_SUMMARY_STATUSES])
    .gt('balance_bags', 0);

  if (error) throw error;

  const rows = data ?? [];
  const anchor = startOfDay(today);
  let totalBags = 0;
  let freshBags = 0;
  let agingBags = 0;
  let staleBags = 0;

  for (const row of rows) {
    const bags = row.balance_bags;
    totalBags += bags;
    const lodged = parseISO(row.lodgement_date);
    const ageDays = differenceInCalendarDays(anchor, startOfDay(lodged));
    if (ageDays <= 180) freshBags += bags;
    else if (ageDays <= 365) agingBags += bags;
    else staleBags += bags;
  }

  return {
    totalBags,
    totalLots: rows.length,
    freshBags,
    agingBags,
    staleBags,
    updatedAt: new Date().toISOString(),
  };
}

function mapRpcRow(r: {
  kind: string;
  event_id: string;
  lot_id: string;
  tx_date: string;
  created_at: string;
  lot_number: string;
  num_bags: number;
  customer_code: string;
  customer_name: string;
  product_name: string;
  product_group_name: string;
}): StockTabMovementRow {
  const kind = r.kind === 'delivery' ? 'delivery' : 'lodgement';
  const pg = r.product_group_name ?? '';
  return {
    kind,
    id: `${kind}:${r.event_id}`,
    lotId: r.lot_id,
    transactionDate: r.tx_date,
    createdAt: r.created_at,
    customerCode: r.customer_code,
    customerName: r.customer_name,
    productName: r.product_name,
    productGroupName: pg,
    productGroupEmoji: productGroupToEmoji(pg),
    lotNumber: r.lot_number,
    numBags: r.num_bags,
  };
}

export interface StockMovementCursor {
  tx_date: string;
  created_at: string;
  kind: 'lodgement' | 'delivery';
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

export function encodeStockMovementCursor(c: StockMovementCursor): string {
  return utf8ToBase64Url(JSON.stringify(c));
}

export function decodeStockMovementCursor(raw: string): StockMovementCursor | null {
  try {
    const json = base64UrlToUtf8(raw);
    const v = JSON.parse(json) as StockMovementCursor;
    if (
      typeof v.tx_date === 'string' &&
      typeof v.created_at === 'string' &&
      (v.kind === 'lodgement' || v.kind === 'delivery') &&
      typeof v.event_id === 'string'
    ) {
      return v;
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchStockTabMovements(
  client: SB,
  warehouseId: string,
  limit: number,
  cursor: string | null,
): Promise<StockTabMovementsPage> {
  const lim = Math.min(Math.max(limit, 1), 100);
  const cur = cursor ? decodeStockMovementCursor(cursor) : null;

  const { data, error } = await client.rpc('list_stock_movements', {
    p_warehouse_id: warehouseId,
    p_limit: lim + 1,
    p_cursor_tx_date: cur?.tx_date ?? undefined,
    p_cursor_created_at: cur?.created_at ?? undefined,
    p_cursor_kind: cur?.kind ?? undefined,
    p_cursor_event_id: cur?.event_id ?? undefined,
  });

  if (error) throw error;

  const rows = data ?? [];
  const hasMore = rows.length > lim;
  const slice = hasMore ? rows.slice(0, lim) : rows;
  const items = slice.map((r) => mapRpcRow(r));

  const last = slice[slice.length - 1];
  let nextCursor: string | null = null;
  if (hasMore && last) {
    nextCursor = encodeStockMovementCursor({
      tx_date: last.tx_date,
      created_at: last.created_at,
      kind: last.kind === 'delivery' ? 'delivery' : 'lodgement',
      event_id: last.event_id,
    });
  }

  return { items, nextCursor, hasMore };
}
