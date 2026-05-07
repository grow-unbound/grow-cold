import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler';

export async function GET(req: NextRequest) {
  const warehouseId = req.nextUrl.searchParams.get('warehouse_id');
  if (!warehouseId) return NextResponse.json({ error: 'missing warehouse_id' }, { status: 400 });

  const supabase = await createSupabaseRouteHandlerClient();

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const [snapshotRes, lotsRes, receiptsRes] = await Promise.all([
    supabase
      .from('warehouse_snapshot')
      .select(
        'total_bags,total_lots,active_lots,stale_lots,cash_balance,today_receipts,today_payments,total_receivable,today_lodged_bags,today_delivered_bags,last_updated_at',
      )
      .eq('warehouse_id', warehouseId)
      .single(),
    supabase
      .from('lots')
      .select('id, lot_number, lodgement_date, original_bags, customers(customer_name), products(product_name)')
      .eq('warehouse_id', warehouseId)
      .order('lodgement_date', { ascending: false })
      .limit(10),
    supabase
      .from('customer_receipts')
      .select('id, receipt_date, total_amount, payment_method, customers(customer_name)')
      .eq('warehouse_id', warehouseId)
      .order('receipt_date', { ascending: false })
      .limit(10),
  ]);

  if (snapshotRes.error) {
    return NextResponse.json({ error: snapshotRes.error.message }, { status: 500 });
  }

  const stockEvents = (lotsRes.data ?? []).map((r) => ({
    id: r.id,
    event_type: 'lodgement',
    num_bags: r.original_bags,
    lot_number: r.lot_number,
    customer_name: (r.customers as { customer_name: string } | null)?.customer_name ?? '—',
    product_name: (r.products as { product_name: string } | null)?.product_name ?? '—',
    event_date: r.lodgement_date,
  }));

  const moneyEvents = (receiptsRes.data ?? []).map((r) => ({
    id: r.id,
    event_type: 'receipt',
    amount: Number(r.total_amount),
    customer_name: (r.customers as { customer_name: string } | null)?.customer_name ?? '—',
    payment_method: r.payment_method ?? null,
    event_date: r.receipt_date ?? '',
  }));

  return NextResponse.json({
    snapshot: snapshotRes.data,
    stockEvents,
    moneyEvents,
  });
}
