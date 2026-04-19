import { GetLotResponseSchema } from '@growcold/shared';
import { NextResponse } from 'next/server';
import { toListLotRow } from '@/lib/api-row-mappers';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getRoleForWarehouse } from '@/lib/warehouse-role';

type RouteContext = { params: Promise<{ lotId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { lotId } = await context.params;

  const { data: lot, error } = await supabase.from('lots').select('*').eq('id', lotId).maybeSingle();
  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Query failed', code: 'DB_ERROR' }, { status: 500 });
  }
  if (!lot) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  const role = await getRoleForWarehouse(supabase, user.id, lot.warehouse_id);
  if (!role) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  if (role === 'STAFF' && !['ACTIVE', 'STALE'].includes(lot.status)) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  const [{ data: cust }, { data: prod }] = await Promise.all([
    supabase.from('customers').select('customer_name').eq('id', lot.customer_id).single(),
    supabase.from('products').select('product_name').eq('id', lot.product_id).single(),
  ]);

  const row = toListLotRow(
    lot,
    cust?.customer_name ?? 'Unknown',
    prod?.product_name ?? 'Unknown',
  );
  const out = GetLotResponseSchema.parse({ data: row });
  return NextResponse.json(out);
}
