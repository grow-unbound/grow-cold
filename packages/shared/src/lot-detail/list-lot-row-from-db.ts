import type { ListLotRow } from '../api/endpoints/lots';
import type { Database } from '../api/types';

type LotRow = Database['public']['Tables']['lots']['Row'];

export function listLotRowFromTables(
  lot: LotRow,
  customer_name: string,
  product_name: string,
): ListLotRow {
  return {
    id: lot.id,
    lot_number: lot.lot_number,
    warehouse_id: lot.warehouse_id,
    tenant_id: lot.tenant_id,
    customer_id: lot.customer_id,
    product_id: lot.product_id,
    original_bags: lot.original_bags,
    balance_bags: lot.balance_bags,
    lodgement_date: lot.lodgement_date,
    rental_mode: lot.rental_mode,
    location_ids: lot.location_ids ?? [],
    legacy_locations: lot.legacy_locations ?? undefined,
    external_reference_id: lot.external_reference_id ?? undefined,
    driver_name: lot.driver_name ?? undefined,
    vehicle_number: lot.vehicle_number ?? undefined,
    status: lot.status,
    notes: lot.notes ?? undefined,
    created_at: lot.created_at,
    updated_at: lot.updated_at,
    customer_name,
    product_name,
  };
}
