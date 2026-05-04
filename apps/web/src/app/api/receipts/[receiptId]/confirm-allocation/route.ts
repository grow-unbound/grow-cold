import {
  ConfirmReceiptAllocationRequestSchema,
  ConfirmReceiptAllocationResponseSchema,
} from '@growcold/shared';
import { NextResponse } from 'next/server';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getRoleForWarehouse } from '@/lib/warehouse-role';

export async function POST(
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

  const parsed = ConfirmReceiptAllocationRequestSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Invalid body';
    return NextResponse.json({ error: msg, code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const { data: existing, error: loadErr } = await supabase
    .from('customer_receipts')
    .select('warehouse_id')
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

  const p_lines = parsed.data.lines.map((line) => ({
    rent_accrual_id: line.rent_accrual_id ?? null,
    charge_id: line.charge_id ?? null,
    amount: line.amount,
  }));

  const { data: rpcData, error: rpcErr } = await supabase.rpc('confirm_receipt_allocations', {
    p_receipt_id: receiptId,
    p_lines: p_lines,
  });

  if (rpcErr) {
    console.error(rpcErr);
    const msg = rpcErr.message ?? 'Allocation failed';
    const lower = msg.toLowerCase();
    if (lower.includes('allocation_exceeds') || lower.includes('over_allocation')) {
      return NextResponse.json({ error: msg, code: 'ALLOCATION_INVALID' }, { status: 400 });
    }
    if (lower.includes('already_confirmed') || lower.includes('already_exist')) {
      return NextResponse.json({ error: msg, code: 'CONFLICT' }, { status: 409 });
    }
    return NextResponse.json({ error: msg, code: 'DB_ERROR' }, { status: 500 });
  }

  const raw = rpcData as { receipt_id?: string; applied_total?: unknown; credit_remaining?: unknown };
  const out = ConfirmReceiptAllocationResponseSchema.parse({
    receipt_id: raw.receipt_id ?? receiptId,
    applied_total: raw.applied_total ?? '0',
    credit_remaining: raw.credit_remaining ?? '0',
  });
  return NextResponse.json(out);
}
