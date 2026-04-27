import type { SupabaseClient } from '@supabase/supabase-js';
import { GetLotDetailResponseSchema } from '../api/endpoints/lots';
import type { Database } from '../api/types';
import { formatLotLocationLabel } from './location-label';
import { listLotRowFromTables } from './list-lot-row-from-db';
import { mapToLotDetailData } from './map-lot-detail';

type LotRow = Database['public']['Tables']['lots']['Row'];

type ChargeJoinRow = {
  id: string;
  charge_amount: number;
  is_paid: boolean;
  charge_date: string;
  product_charges: {
    charge_types: { display_name: string; code: string } | null;
  } | null;
};

/**
 * Loads deliveries, charges, customer/product names, and maps to {@link LotDetailData}.
 * Caller must ensure `lot` is already authorized (RLS or API role checks).
 */
export async function fetchLotDetailPayload(
  client: SupabaseClient<Database>,
  lot: LotRow,
  lotId: string,
): Promise<ReturnType<typeof GetLotDetailResponseSchema.parse>['data']> {
  const locationIds = lot.location_ids ?? [];

  const locationsPromise =
    locationIds.length > 0
      ? client.from('locations').select('id, name').in('id', locationIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[], error: null });

  const [custRes, prodRes, delRes, chRes, locRes] = await Promise.all([
    client.from('customers').select('customer_name, customer_code').eq('id', lot.customer_id).single(),
    client.from('products').select('product_name').eq('id', lot.product_id).single(),
    client
      .from('deliveries')
      .select('id, delivery_date, num_bags_out, driver_name, vehicle_number')
      .eq('lot_id', lotId)
      .order('delivery_date', { ascending: false }),
    client
      .from('transaction_charges')
      .select(
        `id, charge_amount, is_paid, charge_date, product_charges ( charge_types ( display_name, code ) )`,
      )
      .eq('lot_id', lotId)
      .order('charge_date', { ascending: false }),
    locationsPromise,
  ]);

  if (custRes.error) throw custRes.error;
  if (prodRes.error) throw prodRes.error;
  if (delRes.error) throw delRes.error;
  if (chRes.error) throw chRes.error;
  if (locRes.error) throw locRes.error;

  const row = listLotRowFromTables(
    lot,
    custRes.data?.customer_name ?? 'Unknown',
    prodRes.data?.product_name ?? 'Unknown',
  );

  const location_label = formatLotLocationLabel(locationIds, locRes.data, lot.legacy_locations);

  const deliveries = (delRes.data ?? []).map((d) => ({
    id: d.id,
    delivery_date: d.delivery_date,
    num_bags_out: d.num_bags_out,
    driver_name: d.driver_name,
    vehicle_number: d.vehicle_number,
  }));

  const chargeRows = (chRes.data ?? []) as ChargeJoinRow[];
  const charges = chargeRows.map((c) => {
    const ct = c.product_charges?.charge_types;
    const charge_type_label = ct?.display_name?.trim() || ct?.code?.trim() || 'Charge';
    return {
      id: c.id,
      charge_type_label,
      charge_amount: c.charge_amount,
      is_paid: c.is_paid,
      charge_date: c.charge_date,
    };
  });

  const data = mapToLotDetailData({
    lotRow: row,
    customer_code: custRes.data?.customer_code ?? '—',
    location_label,
    deliveries,
    charges,
  });

  return GetLotDetailResponseSchema.parse({ data }).data;
}
