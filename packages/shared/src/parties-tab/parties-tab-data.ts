import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../api/types';
import type {
  PartiesListRowDto,
  PartiesListResponse,
  PartiesReceivablesSummary,
} from '../api/endpoints/parties-tab';

type SB = SupabaseClient<Database>;

/** @todo Map others_* when customers.other_pending (or business rule) exists in schema. */
export async function fetchPartiesReceivablesSummary(
  client: SB,
  warehouseId: string,
): Promise<PartiesReceivablesSummary> {
  const { data, error } = await client.rpc('parties_receivables_summary', {
    p_warehouse_id: warehouseId,
  });
  if (error) throw error;
  const row = data?.[0];
  if (!row) {
    return {
      totalReceivable: 0,
      customersWithDues: 0,
      rentReceivable: 0,
      rentLotCount: 0,
      chargesReceivable: 0,
      chargesLotCount: 0,
      othersReceivable: 0,
      othersCustomerCount: 0,
      updatedAt: new Date().toISOString(),
    };
  }
  return {
    totalReceivable: Number(row.total_receivable),
    customersWithDues: Number(row.customers_with_dues),
    rentReceivable: Number(row.rent_receivable),
    rentLotCount: Number(row.rent_lot_count),
    chargesReceivable: Number(row.charges_receivable),
    chargesLotCount: Number(row.charges_lot_count),
    othersReceivable: Number(row.others_receivable),
    othersCustomerCount: Number(row.others_customer_count),
    updatedAt: row.updated_at,
  };
}

function mapListRow(
  r: {
    customer_id: string;
    customer_code: string;
    customer_name: string;
    phone: string | null;
    mobile: string | null;
    address: string | null;
    outstanding: number;
    lot_count: number;
    bag_count: number;
    last_activity_date: string | null;
    has_stock: boolean;
    filter_total: number;
  },
): PartiesListRowDto {
  return {
    customerId: r.customer_id,
    customerCode: r.customer_code,
    customerName: r.customer_name,
    phone: r.phone,
    mobile: r.mobile,
    address: r.address,
    outstanding: Number(r.outstanding),
    lotCount: Number(r.lot_count),
    bagCount: Number(r.bag_count),
    lastActivityDate: r.last_activity_date,
    hasStock: r.has_stock,
  };
}

const VALID_FILTERS = new Set(['all', 'active', 'pending']);
function normalizeFilter(f: string): 'all' | 'active' | 'pending' {
  const s = f.trim().toLowerCase();
  if (s === 'pending_dues') return 'pending';
  if (VALID_FILTERS.has(s)) return s as 'all' | 'active' | 'pending';
  return 'active';
}

export async function fetchPartiesPage(
  client: SB,
  warehouseId: string,
  filter: string,
  search: string,
  limit: number,
  offset: number,
): Promise<PartiesListResponse> {
  const f = normalizeFilter(filter);
  const lim = Math.min(Math.max(Math.floor(limit), 1), 100);
  const off = Math.max(Math.floor(offset), 0);
  const { data, error } = await client.rpc('list_parties_tab', {
    p_warehouse_id: warehouseId,
    p_filter: f,
    p_search: search.trim(),
    p_limit: lim,
    p_offset: off,
  });
  if (error) throw error;
  const rows = data ?? [];
  const filterTotal = rows.length > 0 ? Number(rows[0].filter_total) : 0;
  const items: PartiesListRowDto[] = rows.map((row) => mapListRow(row));
  const hasMore = off + items.length < filterTotal;
  return {
    items,
    filterTotal,
    hasMore,
  };
}
