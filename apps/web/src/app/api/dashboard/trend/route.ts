import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler';

function getPeriodStartISO(period: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (period === 'week') {
    // Start of current week (Monday)
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    today.setDate(today.getDate() + diff);
  } else if (period === 'month') {
    today.setDate(1);
  } else if (period === 'all') {
    return '2020-01-01';
  }
  // 'today' falls through: returns today's date

  return today.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const warehouseId = req.nextUrl.searchParams.get('warehouse_id');
  const period = req.nextUrl.searchParams.get('period') ?? 'week';
  if (!warehouseId) return NextResponse.json({ error: 'missing warehouse_id' }, { status: 400 });

  const supabase = await createSupabaseRouteHandlerClient();

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const fromDate = getPeriodStartISO(period);

  const { data, error } = await supabase
    .from('daily_stock_summary')
    .select('summary_date,lodged_bags,delivered_bags,active_lots_eod,total_bags_eod')
    .eq('warehouse_id', warehouseId)
    .gte('summary_date', fromDate)
    .order('summary_date', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ series: data ?? [] });
}
