import type { Database } from '@growcold/shared';
import {
  GetReceiptResponseSchema,
  UpdateReceiptRequestSchema,
  UpdateReceiptResponseSchema,
} from '@growcold/shared';
import { NextResponse } from 'next/server';
import { toTransactionReceiptRow } from '@/lib/api-row-mappers';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getRoleForWarehouse } from '@/lib/warehouse-role';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ receiptId: string }> },
) {
  const { receiptId } = await params;
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { data: row, error } = await supabase.from('customer_receipts').select('*').eq('id', receiptId).maybeSingle();
  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Query failed', code: 'DB_ERROR' }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  const role = await getRoleForWarehouse(supabase, user.id, row.warehouse_id);
  if (!role) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  const { data: cust } = await supabase
    .from('customers')
    .select('customer_name')
    .eq('id', row.customer_id)
    .single();

  const data = toTransactionReceiptRow(row, cust?.customer_name ?? 'Unknown');
  const out = GetReceiptResponseSchema.parse({ data });
  return NextResponse.json(out);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ receiptId: string }> },
) {
  const { receiptId } = await params;
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

  const parsed = UpdateReceiptRequestSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Invalid body';
    return NextResponse.json({ error: msg, code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const { data: existing, error: loadErr } = await supabase
    .from('customer_receipts')
    .select('*')
    .eq('id', receiptId)
    .maybeSingle();

  if (loadErr) {
    console.error(loadErr);
    return NextResponse.json({ error: 'Query failed', code: 'DB_ERROR' }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  const role = await getRoleForWarehouse(supabase, user.id, existing.warehouse_id);
  if (!role) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  if (existing.allocation_confirmed_at != null) {
    return NextResponse.json(
      { error: 'Receipt allocation already confirmed', code: 'IMMUTABLE' },
      { status: 409 },
    );
  }

  const patch = parsed.data;
  type ReceiptUpdate = Database['public']['Tables']['customer_receipts']['Update'];
  const updates: ReceiptUpdate = { updated_at: new Date().toISOString() };
  if (patch.receipt_date !== undefined) updates.receipt_date = patch.receipt_date;
  if (patch.total_amount !== undefined) updates.total_amount = Number(patch.total_amount);
  if (patch.payment_method !== undefined) updates.payment_method = patch.payment_method;
  if (patch.reference_number !== undefined) updates.reference_number = patch.reference_number;
  if (patch.notes !== undefined) updates.notes = patch.notes;

  const { data: updated, error: updErr } = await supabase
    .from('customer_receipts')
    .update(updates)
    .eq('id', receiptId)
    .select('*')
    .single();

  if (updErr || !updated) {
    console.error(updErr);
    return NextResponse.json({ error: 'Could not update receipt', code: 'DB_ERROR' }, { status: 500 });
  }

  const { data: cust } = await supabase
    .from('customers')
    .select('customer_name')
    .eq('id', updated.customer_id)
    .single();

  const data = toTransactionReceiptRow(updated, cust?.customer_name ?? 'Unknown');
  const out = UpdateReceiptResponseSchema.parse({ data });
  return NextResponse.json(out);
}
