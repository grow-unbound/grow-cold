import { useQuery } from '@tanstack/react-query';

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
  today_lodged_lots: number;
  today_delivered_lots: number;
};

export type StockEvent = {
  id: string;
  event_type: string;
  num_bags: number;
  lot_number: string;
  customer_name: string;
  product_name: string;
  event_date: string;
};

export type MoneyEvent = {
  id: string;
  event_type: string;
  amount: number;
  customer_name: string;
  payment_method: string;
  event_date: string;
};

export type HomeSnapshotResponse = {
  snapshot: SnapshotData;
  stockEvents: StockEvent[];
  moneyEvents: MoneyEvent[];
};

export type TrendDay = {
  summary_date: string;
  lodged_bags: number;
  delivered_bags: number;
  active_lots_eod: number;
  total_bags_eod: number;
};

export type Period = 'today' | 'week' | 'month' | 'all';

export function useHomeSnapshot(warehouseId: string | null) {
  return useQuery<HomeSnapshotResponse>({
    queryKey: ['home-snapshot', warehouseId],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/home?warehouse_id=${warehouseId}`);
      if (!res.ok) throw new Error('Failed to load dashboard');
      return res.json() as Promise<HomeSnapshotResponse>;
    },
    enabled: !!warehouseId,
    staleTime: 60_000,
  });
}

export function useHomeTrend(warehouseId: string | null, period: Period) {
  return useQuery<{ series: TrendDay[] }>({
    queryKey: ['home-trend', warehouseId, period],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/trend?warehouse_id=${warehouseId}&period=${period}`);
      if (!res.ok) throw new Error('Failed to load trend');
      return res.json() as Promise<{ series: TrendDay[] }>;
    },
    enabled: !!warehouseId,
    staleTime: 120_000,
  });
}
