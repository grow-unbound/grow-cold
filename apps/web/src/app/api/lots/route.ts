import {
  CreateLotRequestSchema,
  CreateLotResponseSchema,
  ListLotsQuerySchema,
  ListLotsResponseSchema,
} from '@growcold/shared';
import { NextResponse } from 'next/server';
import { toListLotRow } from '@/lib/api-row-mappers';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getRoleForWarehouse } from '@/lib/warehouse-role';

export async function GET(request: Request) {
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = ListLotsQuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Invalid query';
    return NextResponse.json({ error: msg, code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const { warehouseId, status, limit, offset } = parsed.data;
  const role = await getRoleForWarehouse(supabase, user.id, warehouseId);
  if (!role) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  let q = supabase
    .from('lots')
    .select('*', { count: 'exact' })
    .eq('warehouse_id', warehouseId)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    q = q.eq('status', status);
  } else if (role === 'STAFF') {
    q = q.in('status', ['ACTIVE', 'STALE']);
  }

  const { data: rows, error, count } = await q;
  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Query failed', code: 'DB_ERROR' }, { status: 500 });
  }

  const lots = rows ?? [];
  const customerIds = [...new Set(lots.map((l) => l.customer_id))];
  const productIds = [...new Set(lots.map((l) => l.product_id))];

  const [{ data: customers }, { data: products }] = await Promise.all([
    customerIds.length
      ? supabase.from('customers').select('id, customer_name').in('id', customerIds)
      : Promise.resolve({ data: [] as { id: string; customer_name: string }[] }),
    productIds.length
      ? supabase.from('products').select('id, product_name').in('id', productIds)
      : Promise.resolve({ data: [] as { id: string; product_name: string }[] }),
  ]);

  const cMap = new Map((customers ?? []).map((c) => [c.id, c.customer_name]));
  const pMap = new Map((products ?? []).map((p) => [p.id, p.product_name]));

  const data = lots.map((lot) =>
    toListLotRow(lot, cMap.get(lot.customer_id) ?? 'Unknown', pMap.get(lot.product_id) ?? 'Unknown'),
  );

  const total = count ?? 0;
  const body = ListLotsResponseSchema.parse({
    data,
    count: total,
    hasMore: offset + data.length < total,
  });

  return NextResponse.json(body);
}

export async function POST(request: Request) {
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON', code: 'INVALID_BODY' }, { status: 400 });
  }

  const parsed = CreateLotRequestSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Invalid body';
    return NextResponse.json({ error: msg, code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const p = parsed.data;
  const role = await getRoleForWarehouse(supabase, user.id, p.warehouse_id);
  if (!role || role === 'STAFF') {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  const balance = p.balance_bags ?? p.original_bags;
  if (balance > p.original_bags) {
    return NextResponse.json(
      { error: 'balance_bags cannot exceed original_bags', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  const { data: inserted, error } = await supabase
    .from('lots')
    .insert({
      warehouse_id: p.warehouse_id,
      customer_id: p.customer_id,
      product_id: p.product_id,
      lot_number: p.lot_number,
      original_bags: p.original_bags,
      balance_bags: balance,
      lodgement_date: p.lodgement_date,
      rental_mode: p.rental_mode,
      location_ids: p.location_ids ?? [],
      driver_name: p.driver_name ?? null,
      vehicle_number: p.vehicle_number ?? null,
      notes: p.notes ?? null,
      status: 'ACTIVE',
    })
    .select('*')
    .single();

  if (error || !inserted) {
    console.error(error);
    return NextResponse.json({ error: 'Could not create lot', code: 'DB_ERROR' }, { status: 500 });
  }

  const [{ data: cust }, { data: prod }] = await Promise.all([
    supabase.from('customers').select('customer_name').eq('id', inserted.customer_id).single(),
    supabase.from('products').select('product_name').eq('id', inserted.product_id).single(),
  ]);

  const row = toListLotRow(
    inserted,
    cust?.customer_name ?? 'Unknown',
    prod?.product_name ?? 'Unknown',
  );
  const out = CreateLotResponseSchema.parse({ data: row });
  return NextResponse.json(out);
}
