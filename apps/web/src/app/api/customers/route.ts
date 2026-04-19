import {
  CreateCustomerRequestSchema,
  CreateCustomerResponseSchema,
  ListCustomersQuerySchema,
  ListCustomersResponseSchema,
} from '@growcold/shared';
import { NextResponse } from 'next/server';
import { toCustomerApi } from '@/lib/api-row-mappers';
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
  const parsed = ListCustomersQuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
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
    .from('customers')
    .select('*', { count: 'exact' })
    .eq('warehouse_id', warehouseId)
    .order('customer_name')
    .range(offset, offset + limit - 1);

  const { data: rows, error, count } = await q;
  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Query failed', code: 'DB_ERROR' }, { status: 500 });
  }

  const data = (rows ?? []).map(toCustomerApi);
  const total = count ?? 0;
  const body = ListCustomersResponseSchema.parse({
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

  const parsed = CreateCustomerRequestSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Invalid body';
    return NextResponse.json({ error: msg, code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const p = parsed.data;
  const role = await getRoleForWarehouse(supabase, user.id, p.warehouse_id);
  if (!role) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  const creditNum = Number(p.credit_limit);
  if (Number.isNaN(creditNum)) {
    return NextResponse.json({ error: 'Invalid credit_limit', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const { data: inserted, error } = await supabase
    .from('customers')
    .insert({
      warehouse_id: p.warehouse_id,
      customer_code: p.customer_code,
      customer_name: p.customer_name,
      phone: p.phone,
      mobile: p.mobile ?? null,
      category: p.category,
      address: p.address ?? null,
      gstin: p.gstin ?? null,
      credit_limit: creditNum,
      notes: p.notes ?? null,
      is_active: true,
    })
    .select('*')
    .single();

  if (error || !inserted) {
    console.error(error);
    return NextResponse.json({ error: 'Could not create customer', code: 'DB_ERROR' }, { status: 500 });
  }

  const out = CreateCustomerResponseSchema.parse({ data: toCustomerApi(inserted) });
  return NextResponse.json(out);
}
