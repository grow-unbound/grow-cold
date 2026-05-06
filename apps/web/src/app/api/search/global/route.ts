import { fetchPartiesPage } from '@growcold/shared';
import type { Database } from '@growcold/shared';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getRoleForWarehouse, type AppRole } from '@/lib/warehouse-role';

const GlobalSearchQuerySchema = z.object({
  warehouseId: z.string().uuid(),
  q: z.string().trim().min(2).max(80),
});

function sanitizeIlikeFragment(raw: string): string {
  return raw.replace(/%/g, '').replace(/_/g, '').replace(/\\/g, '');
}

type LotStatus = Database['public']['Enums']['lot_status'];

function lotStatusFilterForRole(role: AppRole): { restrict: boolean; statuses: LotStatus[] } {
  if (role === 'STAFF') {
    return { restrict: true, statuses: ['ACTIVE', 'STALE'] };
  }
  return { restrict: false, statuses: [] };
}

export async function GET(request: Request): Promise<NextResponse> {
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json(
      { data: null, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const parsed = GlobalSearchQuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Invalid query';
    return NextResponse.json(
      { data: null, error: { code: 'VALIDATION_ERROR', message: msg } },
      { status: 400 },
    );
  }

  const { warehouseId, q } = parsed.data;
  const pattern = sanitizeIlikeFragment(q);
  if (pattern.length < 2) {
    return NextResponse.json(
      { data: null, error: { code: 'VALIDATION_ERROR', message: 'Query too short' } },
      { status: 400 },
    );
  }

  const role = await getRoleForWarehouse(supabase, user.id, warehouseId);
  if (!role) {
    return NextResponse.json(
      { data: null, error: { code: 'FORBIDDEN', message: 'Forbidden' } },
      { status: 403 },
    );
  }

  try {
    const partiesPage = await fetchPartiesPage(supabase, warehouseId, 'all', pattern, 12, 0);

    const { restrict, statuses } = lotStatusFilterForRole(role);
    let lotQuery = supabase
      .from('lots')
      .select('id, lot_number, customer_id, product_id')
      .eq('warehouse_id', warehouseId)
      .ilike('lot_number', `%${pattern}%`)
      .order('updated_at', { ascending: false })
      .limit(12);

    if (restrict) {
      lotQuery = lotQuery.in('status', statuses);
    }

    const { data: lotRows, error: lotErr } = await lotQuery;
    if (lotErr) {
      console.error(lotErr);
      return NextResponse.json(
        { data: null, error: { code: 'DB_ERROR', message: 'Query failed' } },
        { status: 500 },
      );
    }

    const lots = lotRows ?? [];
    const customerIds = [...new Set(lots.map((l) => l.customer_id))];
    const productIds = [...new Set(lots.map((l) => l.product_id))];

    const [{ data: customers }, { data: products }] = await Promise.all([
      customerIds.length
        ? supabase.from('customers').select('id, customer_name').in('id', customerIds)
        : Promise.resolve({ data: [] as { id: string; customer_name: string }[] }),
      productIds.length
        ? supabase.from('products').select('id, product_name').in('id', productIds)
        : Promise.resolve({ data: [] as { id: string; product_name: string }[] }),
    ]);

    const cMap = new Map((customers ?? []).map((c) => [c.id, c.customer_name]));
    const pMap = new Map((products ?? []).map((p) => [p.id, p.product_name]));

    return NextResponse.json({
      data: {
        parties: partiesPage.items.map((p) => ({
          customerId: p.customerId,
          customerName: p.customerName,
          customerCode: p.customerCode,
        })),
        lots: lots.map((lot) => ({
          id: lot.id,
          lotNumber: lot.lot_number,
          customerName: cMap.get(lot.customer_id) ?? '—',
          productName: pMap.get(lot.product_id) ?? '—',
        })),
      },
      error: null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { data: null, error: { code: 'DB_ERROR', message: 'Query failed' } },
      { status: 500 },
    );
  }
}
