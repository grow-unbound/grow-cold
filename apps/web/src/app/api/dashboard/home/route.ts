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

  const [snapshotRes, stockEventsRes, moneyEventsRes] = await Promise.all([
    supabase
      .from('warehouse_snapshot')
      .select(
        'total_bags,total_lots,active_lots,stale_lots,cash_balance,today_receipts,today_payments,total_receivable,today_lodged_bags,today_delivered_bags,today_lodged_lots,today_delivered_lots,last_updated_at',
      )
      .eq('warehouse_id', warehouseId)
      .single(),
    supabase
      .from('stock_events')
      .select('id,event_type,bags,lot_number,customer_name,product_name,event_date')
      .eq('warehouse_id', warehouseId)
      .order('event_date', { ascending: false })
      .limit(10),
    supabase
      .from('money_events')
      .select('id,event_type,amount,customer_name,payment_method,event_date')
      .eq('warehouse_id', warehouseId)
      .order('event_date', { ascending: false })
      .limit(10),
  ]);

  if (snapshotRes.error) {
    return NextResponse.json({ error: snapshotRes.error.message }, { status: 500 });
  }

  return NextResponse.json({
    snapshot: snapshotRes.data,
    stockEvents: stockEventsRes.data ?? [],
    moneyEvents: moneyEventsRes.data ?? [],
  });
}
