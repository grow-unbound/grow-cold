import { fetchPartiesPage } from '@growcold/shared';
import type { Database } from '@growcold/shared';
import type { SupabaseClient } from '@supabase/supabase-js';

type SB = SupabaseClient<Database>;

export interface GlobalSearchPartyHit {
  customerId: string;
  customerName: string;
  customerCode: string;
}

export interface GlobalSearchLotHit {
  id: string;
  lotNumber: string;
  customerName: string;
  productName: string;
}

export interface GlobalSearchNativeResult {
  parties: GlobalSearchPartyHit[];
  lots: GlobalSearchLotHit[];
}

function sanitizeIlikeFragment(raw: string): string {
  return raw.replace(/%/g, '').replace(/_/g, '').replace(/\\/g, '');
}

export async function runGlobalSearchNative(
  client: SB,
  warehouseId: string,
  rawQuery: string,
): Promise<GlobalSearchNativeResult> {
  const pattern = sanitizeIlikeFragment(rawQuery.trim());
  if (pattern.length < 2) {
    return { parties: [], lots: [] };
  }

  const partiesPage = await fetchPartiesPage(client, warehouseId, 'all', pattern, 12, 0);

  const { data: lotRows, error: lotErr } = await client
    .from('lots')
    .select('id, lot_number, customer_id, product_id')
    .eq('warehouse_id', warehouseId)
    .ilike('lot_number', `%${pattern}%`)
    .order('updated_at', { ascending: false })
    .limit(12);

  if (lotErr) throw lotErr;

  const lots = lotRows ?? [];
  const customerIds = [...new Set(lots.map((l) => l.customer_id))];
  const productIds = [...new Set(lots.map((l) => l.product_id))];

  const [{ data: customers }, { data: products }] = await Promise.all([
    customerIds.length
      ? client.from('customers').select('id, customer_name').in('id', customerIds)
      : Promise.resolve({ data: [] as { id: string; customer_name: string }[] }),
    productIds.length
      ? client.from('products').select('id, product_name').in('id', productIds)
      : Promise.resolve({ data: [] as { id: string; product_name: string }[] }),
  ]);

  const cMap = new Map((customers ?? []).map((c) => [c.id, c.customer_name]));
  const pMap = new Map((products ?? []).map((p) => [p.id, p.product_name]));

  return {
    parties: partiesPage.items.map((p) => ({
      customerId: p.customerId,
      customerName: p.customerName,
      customerCode: p.customerCode,
    })),
    lots: lots.map((lot) => ({
      id: lot.id,
      lotNumber: lot.lot_number,
      customerName: cMap.get(lot.customer_id) ?? '—',
      productName: pMap.get(lot.product_id) ?? '—',
    })),
  };
}
