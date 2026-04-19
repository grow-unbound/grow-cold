import {
  CreateReceiptRequestSchema,
  CreateReceiptResponseSchema,
  ListReceiptsQuerySchema,
  ListReceiptsResponseSchema,
} from '@growcold/shared';
import { NextResponse } from 'next/server';
import { toTransactionReceiptRow } from '@/lib/api-row-mappers';
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
  const parsed = ListReceiptsQuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Invalid query';
    return NextResponse.json({ error: msg, code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const { warehouseId, limit, offset } = parsed.data;
  const role = await getRoleForWarehouse(supabase, user.id, warehouseId);
  if (!role) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  const q = supabase
    .from('customer_receipts')
    .select('*', { count: 'exact' })
    .eq('warehouse_id', warehouseId)
    .order('receipt_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: rows, error, count } = await q;
  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Query failed', code: 'DB_ERROR' }, { status: 500 });
  }

  const receipts = rows ?? [];
  const customerIds = [...new Set(receipts.map((r) => r.customer_id))];
  const { data: customers } = customerIds.length
    ? await supabase.from('customers').select('id, customer_name').in('id', customerIds)
    : { data: [] as { id: string; customer_name: string }[] };

  const cMap = new Map((customers ?? []).map((c) => [c.id, c.customer_name]));
  const data = receipts.map((r) =>
    toTransactionReceiptRow(r, cMap.get(r.customer_id) ?? 'Unknown'),
  );

  const total = count ?? 0;
  const body = ListReceiptsResponseSchema.parse({
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

  const parsed = CreateReceiptRequestSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Invalid body';
    return NextResponse.json({ error: msg, code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const p = parsed.data;
  const role = await getRoleForWarehouse(supabase, user.id, p.warehouse_id);
  if (!role) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  const totalNum = Number(p.total_amount);
  if (Number.isNaN(totalNum) || totalNum <= 0) {
    return NextResponse.json({ error: 'Invalid total_amount', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const { data: inserted, error } = await supabase
    .from('customer_receipts')
    .insert({
      warehouse_id: p.warehouse_id,
      customer_id: p.customer_id,
      receipt_date: p.receipt_date,
      total_amount: totalNum,
      payment_method: p.payment_method ?? null,
      reference_number: p.reference_number ?? null,
      notes: p.notes ?? null,
      recorded_by: user.id,
    })
    .select('*')
    .single();

  if (error || !inserted) {
    console.error(error);
    return NextResponse.json({ error: 'Could not create receipt', code: 'DB_ERROR' }, { status: 500 });
  }

  const { data: cust } = await supabase
    .from('customers')
    .select('customer_name')
    .eq('id', inserted.customer_id)
    .single();

  const row = toTransactionReceiptRow(inserted, cust?.customer_name ?? 'Unknown');
  const out = CreateReceiptResponseSchema.parse({ data: row });
  return NextResponse.json(out);
}
