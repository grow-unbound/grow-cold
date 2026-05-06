import {
  CreateOperationalPaymentRequestSchema,
  CreateOperationalPaymentResponseSchema,
} from '@growcold/shared';
import { NextResponse } from 'next/server';
import { mapOperationalPaymentRow } from '@/lib/operational-payment-map';
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

  const parsed = CreateOperationalPaymentRequestSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Invalid body';
    return NextResponse.json({ error: msg, code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const p = parsed.data;
  const role = await getRoleForWarehouse(supabase, user.id, p.warehouse_id);
  if (!role) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  const amountNum = Number(p.amount);
  if (Number.isNaN(amountNum) || amountNum <= 0) {
    return NextResponse.json({ error: 'Invalid amount', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  if (p.lot_id) {
    const { data: lot, error: lotErr } = await supabase
      .from('lots')
      .select('id, warehouse_id')
      .eq('id', p.lot_id)
      .eq('warehouse_id', p.warehouse_id)
      .maybeSingle();
    if (lotErr || !lot) {
      return NextResponse.json({ error: 'Lot not in warehouse', code: 'VALIDATION_ERROR' }, { status: 400 });
    }
  }

  if (p.delivery_id) {
    const { data: del, error: delErr } = await supabase
      .from('deliveries')
      .select('id, lot_id')
      .eq('id', p.delivery_id)
      .maybeSingle();
    if (delErr || !del) {
      return NextResponse.json({ error: 'Delivery not found', code: 'VALIDATION_ERROR' }, { status: 400 });
    }
    if (p.lot_id && del.lot_id !== p.lot_id) {
      return NextResponse.json({ error: 'Delivery does not match lot', code: 'VALIDATION_ERROR' }, { status: 400 });
    }
  }

  const { data: inserted, error } = await supabase
    .from('operational_payments')
    .insert({
      warehouse_id: p.warehouse_id,
      payment_type_id: p.payment_type_id,
      expenditure_head: p.expenditure_head ?? null,
      status: p.status,
      due_date: p.due_date ?? null,
      payment_date: p.payment_date,
      amount: amountNum,
      payment_method: p.payment_method,
      delivery_id: p.delivery_id ?? null,
      lot_id: p.lot_id ?? null,
      party_name: p.party_name ?? null,
      party_phone: p.party_phone?.trim() ? p.party_phone.trim() : null,
      notes: p.notes ?? null,
      recorded_by: user.id,
    })
    .select('*')
    .single();

  if (error || !inserted) {
    console.error(error);
    return NextResponse.json({ error: 'Could not create operational payment', code: 'DB_ERROR' }, { status: 500 });
  }

  const row = mapOperationalPaymentRow(inserted as Record<string, unknown>);
  const out = CreateOperationalPaymentResponseSchema.parse({ data: row });
  return NextResponse.json(out);
}
