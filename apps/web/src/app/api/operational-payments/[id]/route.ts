import {
  GetOperationalPaymentResponseSchema,
  UpdateOperationalPaymentRequestSchema,
  UpdateOperationalPaymentResponseSchema,
} from '@growcold/shared';
import type { Database } from '@growcold/shared';
import { NextResponse } from 'next/server';
import { mapOperationalPaymentRow } from '@/lib/operational-payment-map';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getRoleForWarehouse } from '@/lib/warehouse-role';

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { data: row, error } = await supabase.from('operational_payments').select('*').eq('id', id).maybeSingle();
  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Query failed', code: 'DB_ERROR' }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  const role = await getRoleForWarehouse(supabase, user.id, row.warehouse_id as string);
  if (!role) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  const out = GetOperationalPaymentResponseSchema.parse({
    data: mapOperationalPaymentRow(row as Record<string, unknown>),
  });
  return NextResponse.json(out);
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
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

  const parsed = UpdateOperationalPaymentRequestSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Invalid body';
    return NextResponse.json({ error: msg, code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const { data: existing, error: exErr } = await supabase.from('operational_payments').select('*').eq('id', id).maybeSingle();
  if (exErr || !existing) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  const wid = existing.warehouse_id as string;
  const role = await getRoleForWarehouse(supabase, user.id, wid);
  if (!role) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  const p = parsed.data;
  const patch: Database['public']['Tables']['operational_payments']['Update'] = {};
  if (p.payment_type_id !== undefined) patch.payment_type_id = p.payment_type_id;
  if (p.amount !== undefined) {
    const n = Number(p.amount);
    if (Number.isNaN(n) || n <= 0) {
      return NextResponse.json({ error: 'Invalid amount', code: 'VALIDATION_ERROR' }, { status: 400 });
    }
    patch.amount = n;
  }
  if (p.payment_method !== undefined) patch.payment_method = p.payment_method;
  if (p.status !== undefined) patch.status = p.status;
  if (p.payment_date !== undefined) patch.payment_date = p.payment_date;
  if (p.due_date !== undefined) patch.due_date = p.due_date;
  if (p.lot_id !== undefined) patch.lot_id = p.lot_id;
  if (p.delivery_id !== undefined) patch.delivery_id = p.delivery_id;
  if (p.party_name !== undefined) patch.party_name = p.party_name;
  if (p.party_phone !== undefined) patch.party_phone = p.party_phone?.trim() ? p.party_phone.trim() : null;
  if (p.notes !== undefined) patch.notes = p.notes;
  if (p.expenditure_head !== undefined) patch.expenditure_head = p.expenditure_head;

  const mergedLotId = (p.lot_id !== undefined ? p.lot_id : existing.lot_id) as string | null;
  if (p.lot_id) {
    const { data: lot, error: lotErr } = await supabase
      .from('lots')
      .select('id')
      .eq('id', p.lot_id)
      .eq('warehouse_id', wid)
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
    if (mergedLotId && del.lot_id !== mergedLotId) {
      return NextResponse.json({ error: 'Delivery does not match lot', code: 'VALIDATION_ERROR' }, { status: 400 });
    }
  }

  const { data: updated, error } = await supabase
    .from('operational_payments')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();

  if (error || !updated) {
    console.error(error);
    return NextResponse.json({ error: 'Could not update', code: 'DB_ERROR' }, { status: 500 });
  }

  const out = UpdateOperationalPaymentResponseSchema.parse({
    data: mapOperationalPaymentRow(updated as Record<string, unknown>),
  });
  return NextResponse.json(out);
}
