import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useWarehouseStore } from '../../stores/warehouse-store';
import { useAuthReady } from './useAuthReady';

export type Period = 'today' | 'week' | 'month' | 'all';

export type SnapshotData = {
  total_bags: number;
  total_lots: number;
  active_lots: number;
  stale_lots: number;
  cash_balance: number;
  today_receipts: number;
  today_payments: number;
  total_receivable: number;
  today_lodged_bags: number;
  today_delivered_bags: number;
};

export type StockEvent = {
  id: string;
  event_type: 'lodgement';
  num_bags: number;
  lot_number: string;
  customer_name: string;
  product_name: string;
  event_date: string;
};

export type MoneyEvent = {
  id: string;
  event_type: 'receipt';
  amount: number;
  customer_name: string;
  payment_method: string | null;
  event_date: string;
};

export type TrendDay = {
  summary_date: string;
  lodged_bags: number;
  delivered_bags: number;
  active_lots_eod: number;
};

function useQueryEnabled(): { enabled: boolean; warehouseId: string } {
  const warehouseId = useWarehouseStore((s) => s.warehouseId);
  const authReady = useAuthReady();
  return { enabled: !!supabase && authReady && warehouseId.length > 0, warehouseId };
}

function getPeriodStartISO(period: Period): string {
  const now = new Date();
  if (period === 'today') return now.toISOString().slice(0, 10);
  if (period === 'week') {
    const day = now.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    return monday.toISOString().slice(0, 10);
  }
  if (period === 'month') {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  }
  return '2020-01-01';
}

export function useHomeDashboardQuery() {
  const { enabled, warehouseId } = useQueryEnabled();
  return useQuery({
    queryKey: ['home-dashboard', warehouseId],
    enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const [snapshotRes, stockRes, moneyRes] = await Promise.all([
        supabase!
          .from('warehouse_snapshot')
          .select(
            'total_bags,total_lots,active_lots,stale_lots,cash_balance,today_receipts,today_payments,total_receivable,today_lodged_bags,today_delivered_bags',
          )
          .eq('warehouse_id', warehouseId)
          .single(),
        supabase!
          .from('lots')
          .select('id, lot_number, lodgement_date, original_bags, customers(customer_name), products(product_name)')
          .eq('warehouse_id', warehouseId)
          .order('lodgement_date', { ascending: false })
          .limit(10),
        supabase!
          .from('customer_receipts')
          .select('id, receipt_date, total_amount, payment_method, customers(customer_name)')
          .eq('warehouse_id', warehouseId)
          .order('receipt_date', { ascending: false })
          .limit(10),
      ]);

      if (snapshotRes.error) throw new Error(snapshotRes.error.message);

      const stockEvents: StockEvent[] = (stockRes.data ?? []).map((r) => ({
        id: r.id,
        event_type: 'lodgement' as const,
        num_bags: r.original_bags,
        lot_number: r.lot_number,
        customer_name: (r.customers as { customer_name: string } | null)?.customer_name ?? '—',
        product_name: (r.products as { product_name: string } | null)?.product_name ?? '—',
        event_date: r.lodgement_date,
      }));

      const moneyEvents: MoneyEvent[] = (moneyRes.data ?? []).map((r) => ({
        id: r.id,
        event_type: 'receipt' as const,
        amount: Number(r.total_amount),
        customer_name: (r.customers as { customer_name: string } | null)?.customer_name ?? '—',
        payment_method: r.payment_method ?? null,
        event_date: r.receipt_date ?? '',
      }));

      return {
        snapshot: snapshotRes.data as SnapshotData,
        stockEvents,
        moneyEvents,
      };
    },
  });
}

export function useHomeTrendQuery(period: Period) {
  const { enabled, warehouseId } = useQueryEnabled();
  return useQuery({
    queryKey: ['home-trend', warehouseId, period],
    enabled,
    staleTime: 120_000,
    queryFn: async () => {
      const fromDate = getPeriodStartISO(period);
      const { data, error } = await supabase!
        .from('daily_stock_summary')
        .select('summary_date,lodged_bags,delivered_bags,active_lots_eod')
        .eq('warehouse_id', warehouseId)
        .gte('summary_date', fromDate)
        .order('summary_date', { ascending: true });

      if (error) throw new Error(error.message);
      return (data ?? []) as TrendDay[];
    },
  });
}
