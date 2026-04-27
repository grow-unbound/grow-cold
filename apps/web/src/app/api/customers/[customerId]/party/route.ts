import { PartyDetailQuerySchema, PartyDetailResponseSchema, fetchPartyDetail } from '@growcold/shared';
import { NextResponse } from 'next/server';
import { z } from 'zod';
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
  const idParse = uuid.safeParse(customerId);
  if (!idParse.success) {
    return NextResponse.json({ error: 'Invalid id', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const url = new URL(request.url);
  const qRaw = Object.fromEntries(url.searchParams.entries());
  const q = PartyDetailQuerySchema.safeParse(qRaw);
  if (!q.success) {
    const msg = q.error.issues[0]?.message ?? 'Invalid query';
    return NextResponse.json({ error: msg, code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const { warehouseId, receiptsLimit, receiptsOffset } = q.data;

  const role = await getRoleForWarehouse(supabase, user.id, warehouseId);
  if (!role) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  try {
    const data = await fetchPartyDetail(supabase, warehouseId, idParse.data, {
      receiptsLimit,
      receiptsOffset,
    });
    if (!data) {
      return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
    }
    return NextResponse.json(PartyDetailResponseSchema.parse({ data }));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Query failed', code: 'DB_ERROR' }, { status: 500 });
  }
}
