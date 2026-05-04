import {
  ListOutstandingAllocatableQuerySchema,
  ListOutstandingAllocatableResponseSchema,
  outstandingAllocatableRowSchema,
} from '@growcold/shared';
import { NextResponse } from 'next/server';
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
  const parsed = ListOutstandingAllocatableQuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Invalid query';
    return NextResponse.json({ error: msg, code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const { warehouseId, customerId } = parsed.data;
  const role = await getRoleForWarehouse(supabase, user.id, warehouseId);
  if (!role) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  const { data: rows, error } = await supabase.rpc('customer_outstanding_allocatable', {
    p_warehouse_id: warehouseId,
    p_customer_id: customerId,
  });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Query failed', code: 'DB_ERROR' }, { status: 500 });
  }

  const raw = rows ?? [];
  const data = raw.map((row) =>
    outstandingAllocatableRowSchema.parse({
      line_kind: row.line_kind,
      line_id: row.line_id,
      lot_id: row.lot_id,
      lot_number: row.lot_number,
      line_label: row.line_label,
      display_period: row.display_period,
      charge_type_code: row.charge_type_code,
      rental_mode: row.rental_mode,
      sort_date: row.sort_date,
      due_amount: row.due_amount,
      remaining_amount: row.remaining_amount,
    }),
  );

  const body = ListOutstandingAllocatableResponseSchema.parse({ data });
  return NextResponse.json(body);
}
