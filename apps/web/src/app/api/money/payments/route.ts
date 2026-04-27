import {
  CreateWarehouseCashPaymentRequestSchema,
  CreateWarehouseCashPaymentResponseSchema,
  insertWarehouseCashPayment,
} from '@growcold/shared';
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON', code: 'INVALID_BODY' }, { status: 400 });
  }

  const parsed = CreateWarehouseCashPaymentRequestSchema.safeParse(body);
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
    const { id } = await insertWarehouseCashPayment(supabase, p, user.id);
    return NextResponse.json(CreateWarehouseCashPaymentResponseSchema.parse({ ok: true, id }));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Could not create payment', code: 'DB_ERROR' }, { status: 500 });
  }
}
