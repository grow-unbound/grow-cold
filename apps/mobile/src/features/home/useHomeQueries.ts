import {
  fetchAlerts,
  fetchBusinessSnapshot,
  fetchMoneyPerformance,
  fetchPartiesPerformance,
  fetchStockPerformance,
  fetchTodaysActivity,
  getPeriodPair,
  type HomeTimeFilter,
} from '@growcold/shared';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useWarehouseStore } from '../../stores/warehouse-store';
import { useAuthReady } from './useAuthReady';
import { useDebouncedValue } from './useDebouncedValue';

function useQueryEnabled(): boolean {
  const warehouseId = useWarehouseStore((s) => s.warehouseId);
  const authReady = useAuthReady();
  return !!supabase && authReady && warehouseId.length > 0;
}

export function useBusinessSnapshotQuery() {
  const enabled = useQueryEnabled();
  const warehouseId = useWarehouseStore((s) => s.warehouseId);
  return useQuery({
    queryKey: ['home', 'snapshot', warehouseId],
    enabled,
    staleTime: 60_000,
    queryFn: () => fetchBusinessSnapshot(supabase!, warehouseId, new Date()),
  });
}

export function useTodaysActivityQuery() {
  const enabled = useQueryEnabled();
  const warehouseId = useWarehouseStore((s) => s.warehouseId);
  return useQuery({
    queryKey: ['home', 'activity', warehouseId],
    enabled,
    staleTime: 60_000,
    queryFn: () => fetchTodaysActivity(supabase!, warehouseId, new Date()),
  });
}

export function useAlertsQuery() {
  const enabled = useQueryEnabled();
  const warehouseId = useWarehouseStore((s) => s.warehouseId);
  return useQuery({
    queryKey: ['home', 'alerts', warehouseId],
    enabled,
    staleTime: 120_000,
    queryFn: () => fetchAlerts(supabase!, warehouseId, new Date()),
  });
}

export function useStockPerformanceQuery(filter: HomeTimeFilter) {
  const enabled = useQueryEnabled();
  const warehouseId = useWarehouseStore((s) => s.warehouseId);
  const debounced = useDebouncedValue(filter, 300);
  const pair = useMemo(() => getPeriodPair(debounced), [debounced]);
  return useQuery({
    queryKey: ['home', 'stockPerf', warehouseId, debounced],
    enabled,
    staleTime: 60_000,
    queryFn: () =>
      fetchStockPerformance(supabase!, warehouseId, pair.current, pair.previous),
  });
}

export function useMoneyPerformanceQuery(filter: HomeTimeFilter) {
  const enabled = useQueryEnabled();
  const warehouseId = useWarehouseStore((s) => s.warehouseId);
  const debounced = useDebouncedValue(filter, 300);
  const pair = useMemo(() => getPeriodPair(debounced), [debounced]);
  return useQuery({
    queryKey: ['home', 'moneyPerf', warehouseId, debounced],
    enabled,
    staleTime: 60_000,
    queryFn: () =>
      fetchMoneyPerformance(supabase!, warehouseId, pair.current, pair.previous),
  });
}

export function usePartiesPerformanceQuery(filter: HomeTimeFilter) {
  const enabled = useQueryEnabled();
  const warehouseId = useWarehouseStore((s) => s.warehouseId);
  const debounced = useDebouncedValue(filter, 300);
  const pair = useMemo(() => getPeriodPair(debounced), [debounced]);
  return useQuery({
    queryKey: ['home', 'partiesPerf', warehouseId, debounced],
    enabled,
    staleTime: 60_000,
    queryFn: () =>
      fetchPartiesPerformance(supabase!, warehouseId, pair.current, pair.previous),
  });
}
