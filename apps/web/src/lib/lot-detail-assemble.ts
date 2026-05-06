import type { LotDetailRow } from '@growcold/shared';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@growcold/shared';

import { toLotDetailRow } from '@/lib/api-row-mappers';

type SB = SupabaseClient<Database>;

export async function resolveLocationChips(
  supabase: SB,
  warehouseId: string,
  ids: string[] | null | undefined,
): Promise<{ id: string; name: string }[]> {
  if (!ids?.length) return [];
  const { data, error } = await supabase
    .from('locations')
    .select('id, name')
    .eq('warehouse_id', warehouseId)
    .in('id', [...new Set(ids)]);
  if (error) {
    console.error(error);
    return [];
  }
  return (data ?? []).map((r) => ({ id: r.id, name: r.name }));
}

async function deliveryCount(supabase: SB, lotId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('deliveries')
    .select('id', { count: 'exact', head: true })
    .eq('lot_id', lotId);
  if (error) throw new Error('delivery_count_failed');
  return (count ?? 0) > 0;
}

/**
 * Full lot detail payload for GET lot / PATCH / record-delivery responses.
 */
export async function assembleLotDetailRow(supabase: SB, lot: Database['public']['Tables']['lots']['Row']): Promise<LotDetailRow> {
  const [{ data: cust }, { data: prod }, has_deliveries] = await Promise.all([
    supabase.from('customers').select('customer_name, customer_code').eq('id', lot.customer_id).single(),
    supabase.from('products').select('product_name').eq('id', lot.product_id).single(),
    deliveryCount(supabase, lot.id),
  ]);

  const locations = await resolveLocationChips(supabase, lot.warehouse_id, lot.location_ids ?? []);

  const base = toLotDetailRow(
    lot,
    cust?.customer_name ?? 'Unknown',
    prod?.product_name ?? 'Unknown',
    cust?.customer_code ?? '',
    has_deliveries,
  );
  return { ...base, locations };
}
