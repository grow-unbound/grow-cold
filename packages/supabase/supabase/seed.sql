-- Local development seed (runs after migrations on `supabase db reset`).
-- Uses fixed UUIDs so fixtures stay stable across resets.

BEGIN;

INSERT INTO public.tenants (id, name)
VALUES (
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'Demo Cold Storage Co.'
  );

INSERT INTO public.warehouses (
  id,
  tenant_id,
  warehouse_name,
  warehouse_code,
  city,
  state,
  pincode,
  capacity_bags
)
VALUES (
    'a0000000-0000-4000-8000-000000000002'::uuid,
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'Demo Warehouse — Hyderabad',
    'WH-DEMO-HYD',
    'Hyderabad',
    'Telangana',
    '500001',
    10000
  );

INSERT INTO public.warehouse_settings (
  id,
  warehouse_id,
  tenant_id,
  blanket_stale_days,
  follow_up_outstanding_days,
  yearly_rent_cutoff_date,
  grace_period_months
)
VALUES (
    'a0000000-0000-4000-8000-000000000010'::uuid,
    'a0000000-0000-4000-8000-000000000002'::uuid,
    'a0000000-0000-4000-8000-000000000001'::uuid,
    180,
    30,
    '2026-01-01',
    1
  );

INSERT INTO public.customers (
  id,
  warehouse_id,
  tenant_id,
  customer_name,
  phone,
  address,
  gstin,
  credit_limit,
  notes,
  is_active
)
VALUES (
    'a0000000-0000-4000-8000-000000000003'::uuid,
    'a0000000-0000-4000-8000-000000000002'::uuid,
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'Demo Customer',
    '+919876543210',
    'Sample address',
    NULL,
    0,
    'Seed customer for local dev',
    true
  );

INSERT INTO public.products (
  id,
  tenant_id,
  product_name,
  product_group_id,
  stale_days_limit,
  storage_temperature,
  description,
  is_active
)
VALUES (
    'a0000000-0000-4000-8000-000000000004'::uuid,
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'Demo Potatoes (bags)',
    NULL,
    90,
    '2–4°C',
    'Seed catalog row',
    true
  );

INSERT INTO public.lots (
  id,
  lot_number,
  warehouse_id,
  tenant_id,
  customer_id,
  product_id,
  original_bags,
  balance_bags,
  lodgement_date,
  rental_mode,
  rental_amount,
  status,
  charges_frozen,
  notes
)
VALUES (
    'a0000000-0000-4000-8000-000000000005'::uuid,
    'DEMO100/100',
    'a0000000-0000-4000-8000-000000000002'::uuid,
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'a0000000-0000-4000-8000-000000000003'::uuid,
    'a0000000-0000-4000-8000-000000000004'::uuid,
    100,
    100,
    '2026-01-15',
    'MONTHLY',
    2500.00,
    'ACTIVE',
    false,
    'Seed lot for UI dev'
  );

COMMIT;
