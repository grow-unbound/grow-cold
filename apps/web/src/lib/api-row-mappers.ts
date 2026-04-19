import type { ListLotRow, TransactionReceiptRow } from '@growcold/shared';
import type { Database } from '@growcold/shared';

type LotRow = Database['public']['Tables']['lots']['Row'];
type CustomerRow = Database['public']['Tables']['customers']['Row'];
type ProductRow = Database['public']['Tables']['products']['Row'];
type ReceiptRow = Database['public']['Tables']['customer_receipts']['Row'];

export function decStr(n: number | string | null | undefined): string {
  if (n == null) return '0';
  if (typeof n === 'string') return n;
  return String(n);
}

export function toListLotRow(lot: LotRow, customer_name: string, product_name: string): ListLotRow {
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

export function toCustomerApi(row: CustomerRow) {
  return {
    id: row.id,
    warehouse_id: row.warehouse_id,
    tenant_id: row.tenant_id,
    customer_code: row.customer_code,
    customer_name: row.customer_name,
    phone: row.phone,
    mobile: row.mobile ?? undefined,
    category: row.category,
    address: row.address ?? undefined,
    gstin: row.gstin ?? undefined,
    credit_limit: decStr(row.credit_limit),
    notes: row.notes ?? undefined,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function toProductApi(row: ProductRow) {
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    product_name: row.product_name,
    product_group_id: row.product_group_id,
    bag_size: row.bag_size ?? undefined,
    monthly_rent_per_kg: row.monthly_rent_per_kg ?? undefined,
    monthly_rent_per_bag: row.monthly_rent_per_bag ?? undefined,
    yearly_rent_per_kg: row.yearly_rent_per_kg ?? undefined,
    yearly_rent_per_bag: row.yearly_rent_per_bag ?? undefined,
    stale_days_limit: row.stale_days_limit,
    storage_temperature: row.storage_temperature ?? undefined,
    description: row.description ?? undefined,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function toTransactionReceiptRow(
  r: ReceiptRow,
  customer_name: string,
): TransactionReceiptRow {
  return {
    id: r.id,
    customer_id: r.customer_id,
    warehouse_id: r.warehouse_id,
    tenant_id: r.tenant_id,
    receipt_date: r.receipt_date,
    total_amount: decStr(r.total_amount),
    payment_method: r.payment_method ?? undefined,
    reference_number: r.reference_number ?? undefined,
    notes: r.notes ?? undefined,
    recorded_by: r.recorded_by ?? undefined,
    created_at: r.created_at,
    updated_at: r.updated_at,
    kind: 'receipt',
    customer_name,
  };
}
