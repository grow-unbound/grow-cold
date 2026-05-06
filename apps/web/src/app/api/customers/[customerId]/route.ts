import { customerSchema } from '@growcold/shared';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { toCustomerApi } from '@/lib/api-row-mappers';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getRoleForWarehouse } from '@/lib/warehouse-role';

const uuid = z.string().uuid();

type Ctx = { params: Promise<{ customerId: string }> };

export async function GET(request: Request, context: Ctx) {
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { customerId } = await context.params;
  const p = uuid.safeParse(customerId);
  if (!p.success) {
    return NextResponse.json({ error: 'Invalid id', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const url = new URL(request.url);
  const wid = url.searchParams.get('warehouseId');
  const wParse = uuid.safeParse(wid);
  if (!wParse.success) {
    return NextResponse.json({ error: 'warehouseId required', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const { data: row, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', p.data)
    .maybeSingle();
  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Query failed', code: 'DB_ERROR' }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  }
  if (row.warehouse_id !== wParse.data) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  const role = await getRoleForWarehouse(supabase, user.id, wParse.data);
  if (!role) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  return NextResponse.json({ data: customerSchema.parse(toCustomerApi(row)) });
}
