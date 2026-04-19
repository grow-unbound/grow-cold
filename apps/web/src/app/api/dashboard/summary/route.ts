import {
  DashboardSummaryQuerySchema,
  DashboardSummaryResponseSchema,
  type LotStatus,
} from '@growcold/shared';
import { NextResponse } from 'next/server';
import { toTransactionReceiptRow } from '@/lib/api-row-mappers';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getRoleForWarehouse } from '@/lib/warehouse-role';

function emptyLotCounts(): Record<LotStatus, number> {
  return {
    ACTIVE: 0,
    STALE: 0,
    DELIVERED: 0,
    CLEARED: 0,
    WRITTEN_OFF: 0,
    DISPUTED: 0,
  };
}

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
  const parsed = DashboardSummaryQuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Invalid query';
    return NextResponse.json({ error: msg, code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const { warehouseId } = parsed.data;
  const role = await getRoleForWarehouse(supabase, user.id, warehouseId);
  if (!role) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  let lotStatusQuery = supabase.from('lots').select('status').eq('warehouse_id', warehouseId);
  if (role === 'STAFF') {
    lotStatusQuery = lotStatusQuery.in('status', ['ACTIVE', 'STALE']);
  }

  const [{ data: statusRows, error: statusErr }, { data: receiptRows, error: recErr }] = await Promise.all([
    lotStatusQuery,
    supabase
      .from('customer_receipts')
      .select('*')
      .eq('warehouse_id', warehouseId)
      .order('receipt_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  if (statusErr || recErr) {
    console.error(statusErr ?? recErr);
    return NextResponse.json({ error: 'Query failed', code: 'DB_ERROR' }, { status: 500 });
  }

  const { data: delCandidates, error: delErr } = await supabase
    .from('deliveries')
    .select('id, delivery_date, num_bags_out, lot_id')
    .order('delivery_date', { ascending: false })
    .limit(40);

  if (delErr) {
    console.error(delErr);
    return NextResponse.json({ error: 'Query failed', code: 'DB_ERROR' }, { status: 500 });
  }

  const cand = delCandidates ?? [];
  const lotIds = [...new Set(cand.map((d) => d.lot_id))];
  const { data: lotMeta, error: lotMetaErr } = lotIds.length
    ? await supabase
        .from('lots')
        .select('id, lot_number, warehouse_id, customer_id, product_id')
        .in('id', lotIds)
        .eq('warehouse_id', warehouseId)
    : { data: [] as { id: string; lot_number: string; warehouse_id: string; customer_id: string; product_id: string }[], error: null };

  if (lotMetaErr) {
    console.error(lotMetaErr);
    return NextResponse.json({ error: 'Query failed', code: 'DB_ERROR' }, { status: 500 });
  }

  const inWh = new Set((lotMeta ?? []).map((l) => l.id));
  const lotById = new Map((lotMeta ?? []).map((l) => [l.id, l]));
  const deliveryRows = cand.filter((d) => inWh.has(d.lot_id)).slice(0, 10);

  const lot_counts = emptyLotCounts();
  for (const row of statusRows ?? []) {
    const s = row.status as LotStatus;
    if (s in lot_counts) lot_counts[s] += 1;
  }

  const total_lots = (Object.values(lot_counts) as number[]).reduce((a, b) => a + b, 0);

  const customerIds = new Set<string>();
  const productIds = new Set<string>();
  for (const d of deliveryRows) {
    const lot = lotById.get(d.lot_id);
    if (lot) {
      customerIds.add(lot.customer_id);
      productIds.add(lot.product_id);
    }
  }

  const [{ data: customers }, { data: products }] = await Promise.all([
    customerIds.size
      ? supabase.from('customers').select('id, customer_name').in('id', [...customerIds])
      : Promise.resolve({ data: [] as { id: string; customer_name: string }[] }),
    productIds.size
      ? supabase.from('products').select('id, product_name').in('id', [...productIds])
      : Promise.resolve({ data: [] as { id: string; product_name: string }[] }),
  ]);

  const cMap = new Map((customers ?? []).map((c) => [c.id, c.customer_name]));
  const pMap = new Map((products ?? []).map((p) => [p.id, p.product_name]));

  const recent_deliveries = deliveryRows.map((d) => {
    const lot = lotById.get(d.lot_id)!;
    return {
      id: d.id,
      delivery_date: d.delivery_date,
      num_bags_out: d.num_bags_out,
      lot_number: lot.lot_number,
      customer_name: cMap.get(lot.customer_id) ?? 'Unknown',
      product_name: pMap.get(lot.product_id) ?? 'Unknown',
    };
  });

  const receipts = receiptRows ?? [];
  const recCustomerIds = [...new Set(receipts.map((r) => r.customer_id))];
  const { data: recCustomers } = recCustomerIds.length
    ? await supabase.from('customers').select('id, customer_name').in('id', recCustomerIds)
    : { data: [] as { id: string; customer_name: string }[] };
  const rcMap = new Map((recCustomers ?? []).map((c) => [c.id, c.customer_name]));
  const recent_receipts = receipts.map((r) =>
    toTransactionReceiptRow(r, rcMap.get(r.customer_id) ?? 'Unknown'),
  );

  const body = DashboardSummaryResponseSchema.parse({
    lot_counts,
    total_lots,
    recent_deliveries,
    recent_receipts,
  });

  return NextResponse.json(body);
}
