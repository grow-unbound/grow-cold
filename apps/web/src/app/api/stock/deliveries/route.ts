import { CreateStockDeliveryRequestSchema, CreateStockDeliveryResponseSchema, completeStockDelivery } from '@growcold/shared';
import { NextResponse } from 'next/server';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getRoleForWarehouse } from '@/lib/warehouse-role';

export async function POST(request: Request) {
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON', code: 'INVALID_BODY' }, { status: 400 });
  }

  const parsed = CreateStockDeliveryRequestSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Invalid body';
    return NextResponse.json({ error: msg, code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const p = parsed.data;
  const role = await getRoleForWarehouse(supabase, user.id, p.warehouse_id);
  if (!role) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  try {
    const row = await completeStockDelivery(supabase, p);
    return NextResponse.json(CreateStockDeliveryResponseSchema.parse({ data: row }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    if (msg === 'Lot not found') {
      return NextResponse.json({ error: msg, code: 'NOT_FOUND' }, { status: 404 });
    }
    if (msg.includes('warehouse') || msg.includes('balance')) {
      return NextResponse.json({ error: msg, code: 'VALIDATION_ERROR' }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: 'Could not create delivery', code: 'DB_ERROR' }, { status: 500 });
  }
}
