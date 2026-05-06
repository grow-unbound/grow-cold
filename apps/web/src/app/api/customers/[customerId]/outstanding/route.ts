import {
  CustomerOutstandingQuerySchema,
  CustomerOutstandingResponseSchema,
} from '@growcold/shared';
import { NextResponse } from 'next/server';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getRoleForWarehouse } from '@/lib/warehouse-role';

type RouteContext = { params: Promise<{ customerId: string }> };

function sumAmounts(rows: { rental_amount?: number; charge_amount?: number }[]): number {
  let t = 0;
  for (const r of rows) {
    const n = Number('rental_amount' in r ? (r.rental_amount ?? 0) : (r.charge_amount ?? 0));
    if (Number.isFinite(n)) t += n;
  }
  return Math.round(t * 100) / 100;
}

export async function GET(request: Request, context: RouteContext) {
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { customerId } = await context.params;
  const url = new URL(request.url);
  const q = CustomerOutstandingQuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!q.success) {
    const msg = q.error.issues[0]?.message ?? 'Invalid query';
    return NextResponse.json({ error: msg, code: 'VALIDATION_ERROR' }, { status: 400 });
  }
  const { warehouseId } = q.data;

  const role = await getRoleForWarehouse(supabase, user.id, warehouseId);
  if (!role) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  const { data: party, error: pErr } = await supabase
    .from('customers')
    .select('id, warehouse_id')
    .eq('id', customerId)
    .maybeSingle();
  if (pErr || !party) {
    if (pErr) console.error(pErr);
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  }
  if (party.warehouse_id !== warehouseId) {
    return NextResponse.json({ error: 'warehouseId mismatch', code: 'FORBIDDEN' }, { status: 403 });
  }

  const { data: lots, error: lErr } = await supabase
    .from('lots')
    .select('id')
    .eq('customer_id', customerId)
    .eq('warehouse_id', warehouseId);
  if (lErr) {
    console.error(lErr);
    return NextResponse.json({ error: 'Query failed', code: 'DB_ERROR' }, { status: 500 });
  }

  const lotIds = (lots ?? []).map((l) => l.id);
  if (lotIds.length === 0) {
    const out = CustomerOutstandingResponseSchema.parse({ data: { rent: 0, charges: 0, total: 0 } });
    return NextResponse.json(out);
  }

  const [{ data: accruals, error: aErr }, { data: txnCharges, error: tcErr }] = await Promise.all([
    supabase
      .from('rent_accruals')
      .select('rental_amount')
      .in('lot_id', lotIds)
      .eq('is_paid', false),
    supabase
      .from('transaction_charges')
      .select('charge_amount')
      .in('lot_id', lotIds)
      .eq('is_paid', false),
  ]);

  if (aErr || tcErr) {
    console.error(aErr ?? tcErr);
    return NextResponse.json({ error: 'Query failed', code: 'DB_ERROR' }, { status: 500 });
  }

  const rent = sumAmounts(accruals ?? []);
  const charges = sumAmounts(txnCharges ?? []);
  const total = Math.round((rent + charges) * 100) / 100;

  const out = CustomerOutstandingResponseSchema.parse({
    data: { rent, charges, total },
  });
  return NextResponse.json(out);
}
